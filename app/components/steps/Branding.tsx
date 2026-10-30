"use client";

import { useState } from "react";
import ImageUploader from "../ImageUploader";
import Preview, { DEFAULT_COLOURS } from "../Preview";
import { TextField } from "../Field";
import { callWizard } from "../../lib/api";
import type { StepContext } from "../../lib/onboarding";

const COLOUR_FIELDS = [
  { key: "color_main", label: "Main", hint: "Header and overall feel" },
  { key: "color_secondary", label: "Accent", hint: "Highlights" },
  { key: "color_cta", label: "Button", hint: "The Book now button" },
] as const;

// Proven outdoor palettes: main, accent, button.
const PALETTES = [
  ["#125e40", "#d9822f", "#125e40"],
  ["#0c4a6e", "#f59e0b", "#0369a1"],
  ["#1f2937", "#ef4444", "#dc2626"],
  ["#4c1d95", "#f472b6", "#6d28d9"],
  ["#78350f", "#65a30d", "#b45309"],
] as const;

const HEX = /^#[0-9a-f]{6}$/i;

export function Look({ token, values, set }: StepContext) {
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
      }>("prefill-website", token, { url: /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}` });

      const patch: Record<string, string> = {};
      if (data.theme_color && HEX.test(data.theme_color)) patch.color_main = data.theme_color;
      if (data.og_image && !values.logo_url) patch.logo_url = data.og_image;
      if (data.title && !values.hero_title) patch.hero_title = data.title;
      if (data.description && !values.hero_subtitle) patch.hero_subtitle = data.description;

      if (Object.keys(patch).length === 0) {
        setMessage("We couldn't pick anything up from that site. Choose below instead.");
      } else {
        set(patch);
        setMessage("Done. We copied what we could, change anything that doesn't look right.");
      }
    } catch {
      setMessage("We couldn't read that website. Choose below instead.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-dashed border-line-strong bg-bg/60 p-4">
        <label className="field" htmlFor="scrape-url">
          Shortcut: copy from your current website
        </label>
        <div className="flex gap-2">
          <input
            id="scrape-url"
            type="url"
            inputMode="url"
            className="input flex-1"
            placeholder="yourwebsite.co.za"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void scrape();
              }
            }}
          />
          <button type="button" className="btn-ghost shrink-0" onClick={() => void scrape()} disabled={busy || !url.trim()}>
            {busy ? "Reading" : "Copy"}
          </button>
        </div>
        {message && <p className="hint mt-2">{message}</p>}
      </div>

      <ImageUploader label="Logo" value={values.logo_url || ""} onChange={(logo) => set({ logo_url: logo })} />

      <fieldset>
        <legend className="field">Colours</legend>
        <div className="mb-4 flex flex-wrap gap-2">
          {PALETTES.map(([main, secondary, cta]) => {
            const on = values.color_main === main && values.color_secondary === secondary;
            return (
              <button
                key={main}
                type="button"
                aria-pressed={on}
                aria-label={`Use palette ${main}`}
                onClick={() => set({ color_main: main, color_secondary: secondary, color_cta: cta })}
                className={`flex overflow-hidden rounded-lg border-2 transition ${on ? "border-ink" : "border-transparent hover:border-line-strong"}`}
              >
                <span className="h-8 w-6" style={{ background: main }} />
                <span className="h-8 w-6" style={{ background: secondary }} />
              </button>
            );
          })}
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {COLOUR_FIELDS.map(({ key, label, hint }) => {
            const value = values[key] || DEFAULT_COLOURS[key];
            return (
              <div key={key} className="flex items-center gap-3 rounded-xl border border-line p-2.5">
                <input
                  id={key}
                  type="color"
                  className="h-10 w-10 shrink-0 cursor-pointer rounded-lg border border-line bg-white p-0.5"
                  value={HEX.test(value) ? value : DEFAULT_COLOURS[key]}
                  onChange={(e) => set({ [key]: e.target.value })}
                />
                <label htmlFor={key} className="min-w-0">
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block truncate font-mono text-xs text-muted">{value}</span>
                  <span className="sr-only">{hint}</span>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>
    </div>
  );
}

export function Headline({ values, set, businessName, tours, bookingSiteUrl }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="hero_title"
        label="Headline"
        hint="Short, and say what a guest gets."
        value={values.hero_title || ""}
        placeholder={`Paddle with penguins in False Bay`}
        onChange={(e) => set({ hero_title: e.target.value })}
        autoFocus
      />
      <TextField
        id="hero_subtitle"
        label="One line underneath"
        value={values.hero_subtitle || ""}
        placeholder="Small groups, expert guides, unforgettable mornings."
        onChange={(e) => set({ hero_subtitle: e.target.value })}
      />
      <TextField
        id="hero_eyebrow"
        label="Small line above the headline"
        hint="Optional. For example: Simon's Town · Since 1998"
        value={values.hero_eyebrow || ""}
        onChange={(e) => set({ hero_eyebrow: e.target.value })}
      />
      <div className="pt-2 xl:hidden">
        <Preview values={values} tours={tours} bookingSiteUrl={bookingSiteUrl} businessName={businessName} />
      </div>
    </div>
  );
}
