"use client";

import { useState } from "react";
import { TextField } from "../Field";
import { callWizard } from "../../lib/api";
import {
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  type StepContext,
} from "../../lib/onboarding";

export function IdentityName({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="business_name"
        label="Business name"
        value={values.business_name || ""}
        onChange={(e) => set({ business_name: e.target.value })}
        autoComplete="organization"
        required
      />
      <TextField
        id="business_tagline"
        label="A short line about what you do"
        hint="Optional. For example, sea kayaking with the penguins of Simon's Town."
        value={values.business_tagline || ""}
        onChange={(e) => set({ business_tagline: e.target.value })}
      />
      <TextField
        id="name"
        label="Your name"
        hint="So we know who to greet when we email you."
        value={values.name || ""}
        onChange={(e) => set({ name: e.target.value })}
        autoComplete="name"
      />
    </div>
  );
}

type Candidate = {
  place_id: string;
  name: string;
  address: string;
  phone?: string;
  website?: string;
  maps_uri?: string;
  hours?: string[];
};

export function IdentityPlace({ token, values, set }: StepContext) {
  const [query, setQuery] = useState(values.business_name || "");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMessage("");
    try {
      const data = await callWizard<{ candidates: Candidate[] }>("prefill-places", token, {
        query: query.trim(),
      });
      setCandidates(data.candidates || []);
      if (!data.candidates?.length) setMessage("We could not find that. Please type your address in below.");
    } catch (error) {
      setCandidates([]);
      setMessage(
        `${(error as Error).message} You can type your address in below instead.`,
      );
    } finally {
      setSearching(false);
    }
  }

  function choose(candidate: Candidate) {
    set({
      business_address: candidate.address,
      google_place_id: candidate.place_id,
      social_google_reviews: candidate.maps_uri || "",
    });
    setCandidates([]);
    setMessage(`Using ${candidate.name}. Your Google reviews will show on your booking site.`);
  }

  return (
    <div className="space-y-5">
      <div>
        <label className="field" htmlFor="places-query">
          Search for your business on Google
        </label>
        <div className="flex flex-wrap gap-2">
          <input
            id="places-query"
            className="input flex-1 min-w-[14rem]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void search();
              }
            }}
            placeholder="Business name and town"
          />
          <button type="button" className="btn-ghost" onClick={() => void search()} disabled={searching}>
            {searching ? "Searching" : "Search"}
          </button>
        </div>
      </div>

      {candidates.length > 0 && (
        <ul className="space-y-2">
          {candidates.map((candidate) => (
            <li key={candidate.place_id}>
              <button
                type="button"
                onClick={() => choose(candidate)}
                className="w-full rounded-xl border border-line bg-white/80 p-4 text-left transition hover:border-accent hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <span className="block font-semibold">{candidate.name}</span>
                <span className="hint">{candidate.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {message && <p className="hint">{message}</p>}

      <TextField
        id="business_address"
        label="Your address"
        hint="Guests see this on their confirmation."
        value={values.business_address || ""}
        onChange={(e) => set({ business_address: e.target.value })}
        autoComplete="street-address"
      />
    </div>
  );
}

export function IdentityLocale({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <div>
        <label className="field" htmlFor="timezone">
          Time zone
        </label>
        <select
          id="timezone"
          className="input"
          value={values.timezone || ""}
          onChange={(e) => set({ timezone: e.target.value })}
        >
          <option value="">Choose your time zone</option>
          {TIMEZONE_OPTIONS.map((zone) => (
            <option key={zone} value={zone}>
              {zone.replace(/_/g, " ")}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="field" htmlFor="currency">
          Currency
        </label>
        <select
          id="currency"
          className="input"
          value={values.currency || "ZAR"}
          onChange={(e) => set({ currency: e.target.value })}
        >
          {CURRENCY_OPTIONS.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export function IdentityContact({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="operator_email"
        label="Your main email address"
        type="email"
        autoComplete="email"
        value={values.operator_email || ""}
        onChange={(e) => set({ operator_email: e.target.value })}
        required
      />
      <TextField
        id="notification_email"
        label="Send booking alerts to"
        hint="Leave this blank to use your main email address."
        type="email"
        value={values.notification_email || ""}
        onChange={(e) => set({ notification_email: e.target.value })}
      />
    </div>
  );
}
