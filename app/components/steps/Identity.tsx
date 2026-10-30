"use client";

import { useState } from "react";
import { TextField } from "../Field";
import { callWizard } from "../../lib/api";
import {
  CURRENCY_OPTIONS,
  TIMEZONE_OPTIONS,
  type StepContext,
} from "../../lib/onboarding";

export function Business({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="business_name"
        label="Business name"
        value={values.business_name || ""}
        onChange={(e) => set({ business_name: e.target.value })}
        autoComplete="organization"
        required
        autoFocus
      />
      <TextField
        id="business_tagline"
        label="One line about what you do"
        hint="Optional. For example: Sea kayaking with the penguins of Simon's Town."
        value={values.business_tagline || ""}
        onChange={(e) => set({ business_tagline: e.target.value })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="name"
          label="Your name"
          value={values.name || ""}
          onChange={(e) => set({ name: e.target.value })}
          autoComplete="name"
        />
        <TextField
          id="operator_email"
          label="Bookings email"
          hint="Every new booking lands here."
          type="email"
          autoComplete="email"
          value={values.operator_email || ""}
          onChange={(e) => set({ operator_email: e.target.value })}
          required
        />
      </div>
      <TextField
        id="notification_email"
        label="Also send booking alerts to"
        hint="Optional. Leave blank to use your bookings email."
        type="email"
        value={values.notification_email || ""}
        onChange={(e) => set({ notification_email: e.target.value })}
      />
    </div>
  );
}

type Candidate = {
  place_id: string;
  name: string;
  address: string;
  maps_uri?: string;
};

export function Location({ token, values, set }: StepContext) {
  const [query, setQuery] = useState(values.business_name || "");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState("");
  const linked = Boolean(values.google_place_id);

  async function search() {
    if (!query.trim()) return;
    setSearching(true);
    setMessage("");
    try {
      const data = await callWizard<{ candidates: Candidate[] }>("prefill-places", token, {
        query: query.trim(),
      });
      setCandidates(data.candidates || []);
      if (!data.candidates?.length) setMessage("No match on Google. Type your address below instead.");
    } catch {
      setCandidates([]);
      setMessage("Google search isn't available right now. Type your address below instead.");
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
    setMessage("");
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="field" htmlFor="places-query">
          Find your business on Google
        </label>
        <div className="flex gap-2">
          <input
            id="places-query"
            className="input flex-1"
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
          <button type="button" className="btn-ghost shrink-0" onClick={() => void search()} disabled={searching}>
            {searching ? "Searching" : "Search"}
          </button>
        </div>
        {message && <p className="hint mt-2">{message}</p>}
      </div>

      {candidates.length > 0 && (
        <ul className="space-y-2" aria-label="Matches on Google">
          {candidates.map((candidate) => (
            <li key={candidate.place_id}>
              <button
                type="button"
                onClick={() => choose(candidate)}
                className="w-full rounded-xl border border-line bg-white p-3.5 text-left transition hover:border-accent hover:bg-mint/30 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20"
              >
                <span className="block text-sm font-semibold">{candidate.name}</span>
                <span className="hint text-[13px]">{candidate.address}</span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {linked && (
        <p className="flex items-center gap-2 rounded-lg bg-mint/60 px-3.5 py-2.5 text-sm text-accent-dark">
          <span aria-hidden="true">★</span> Linked to Google. Your reviews will show on your booking site.
        </p>
      )}

      <TextField
        id="business_address"
        label="Your address"
        hint="Guests see this on their confirmation."
        value={values.business_address || ""}
        onChange={(e) => set({ business_address: e.target.value })}
        autoComplete="street-address"
      />

      <details className="group rounded-xl border border-line" open={!values.timezone}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span>
            <span className="font-medium">Time zone and currency</span>
            <span className="hint ml-2">
              {(values.timezone || "Not set").replace(/_/g, " ")} · {values.currency || "ZAR"}
            </span>
          </span>
          <span className="text-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="grid gap-4 border-t border-line p-4 sm:grid-cols-2">
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
      </details>
    </div>
  );
}
