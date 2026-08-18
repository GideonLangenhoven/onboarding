"use client";

import { useState } from "react";
import ImageUploader from "../ImageUploader";
import { TextField } from "../Field";
import { callWizard } from "../../lib/api";
import type { StepContext } from "../../lib/onboarding";

export function BrandingLogo({ values, set }: StepContext) {
  return (
    <ImageUploader
      label="Your logo"
      value={values.logo_url || ""}
      onChange={(url) => set({ logo_url: url })}
    />
  );
}

const COLOUR_FIELDS = [
  { key: "color_main", label: "Main colour", hint: "Headers and the overall feel of your site." },
  { key: "color_secondary", label: "Second colour", hint: "Accents and highlights." },
  { key: "color_cta", label: "Button colour", hint: "The Book now button." },
] as const;

const DEFAULTS: Record<string, string> = {
  color_main: "#185f75",
  color_secondary: "#ca6c2f",
  color_cta: "#185f75",
};

export function BrandingColors({ token, values, set }: StepContext) {
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function scrape() {
    if (!url.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const data = await callWizard<{
        title?: string;
        description?: string;
        og_image?: string;
        theme_color?: string;
      }>("prefill-website", token, { url: url.trim() });

      const patch: Record<string, string> = {};
      if (data.theme_color) patch.color_main = data.theme_color;
      if (data.og_image && !values.logo_url) patch.logo_url = data.og_image;
      if (data.title && !values.hero_title) patch.hero_title = data.title;
      if (data.description && !values.hero_subtitle) patch.hero_subtitle = data.description;

      if (Object.keys(patch).length === 0) {
        setMessage("We could not pick anything up from that site. Choose your colours below.");
      } else {
        set(patch);
        setMessage("We picked up what we could. Change anything that does not look right.");
      }
    } catch (error) {
      setMessage(`${(error as Error).message} Choose your colours below instead.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="field" htmlFor="scrape-url">
          Already have a website?
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="scrape-url"
            type="url"
            className="input flex-1 min-w-[14rem]"
            placeholder="https://yourwebsite.co.za"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void scrape();
              }
            }}
          />
          <button type="button" className="btn-ghost" onClick={() => void scrape()} disabled={busy}>
            {busy ? "Looking" : "Have a look"}
          </button>
        </div>
        {message && <p className="hint mt-2">{message}</p>}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {COLOUR_FIELDS.map(({ key, label, hint }) => {
          const value = values[key] || DEFAULTS[key];
          return (
            <div key={key}>
              <label className="field" htmlFor={key}>
                {label}
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={key}
                  type="color"
                  className="h-11 w-14 cursor-pointer rounded-lg border border-line bg-white p-1"
                  value={value}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
                <input
                  className="input font-mono text-sm"
                  aria-label={`${label} hex code`}
                  value={value}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
              </div>
              <p className="hint mt-1.5">{hint}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BrandingHero({ values, set, businessName }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="hero_eyebrow"
        label="Small line above the headline"
        hint="Optional. For example, Cape Town, since 1998."
        value={values.hero_eyebrow || ""}
        onChange={(e) => set({ hero_eyebrow: e.target.value })}
      />
      <TextField
        id="hero_title"
        label="Headline"
        hint="Keep it short and say what a guest gets."
        value={values.hero_title || ""}
        placeholder={businessName}
        onChange={(e) => set({ hero_title: e.target.value })}
      />
      <TextField
        id="hero_subtitle"
        label="One line underneath"
        value={values.hero_subtitle || ""}
        onChange={(e) => set({ hero_subtitle: e.target.value })}
      />

      <div
        className="rounded-xl border border-line p-6 text-center"
        style={{ background: `${values.color_main || DEFAULTS.color_main}12` }}
      >
        <p className="hint mb-2">This is roughly how it will look.</p>
        {values.hero_eyebrow && (
          <p className="text-xs uppercase tracking-widest text-muted">{values.hero_eyebrow}</p>
        )}
        <p className="font-serif text-2xl" style={{ color: values.color_main || DEFAULTS.color_main }}>
          {values.hero_title || businessName}
        </p>
        {values.hero_subtitle && <p className="hint mt-1">{values.hero_subtitle}</p>}
      </div>
    </div>
  );
}
