"use client";

import { TextArea, TextField } from "../Field";
import type { StepContext } from "../../lib/onboarding";

export function Meeting({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField
          id="meeting_point"
          label="Meeting point"
          hint="The name of the spot."
          placeholder="The slipway at Long Beach"
          value={values.meeting_point || ""}
          onChange={(e) => set({ meeting_point: e.target.value })}
          autoFocus
        />
        <TextField
          id="meeting_point_address"
          label="Its address"
          value={values.meeting_point_address || ""}
          placeholder={values.business_address || ""}
          onChange={(e) => set({ meeting_point_address: e.target.value })}
        />
      </div>
      <TextArea
        id="directions"
        label="How to find it"
        hint="Parking, landmarks, anything that stops a guest phoning you lost."
        rows={3}
        value={values.directions || ""}
        onChange={(e) => set({ directions: e.target.value })}
      />
      <TextArea
        id="arrival_instructions"
        label="What to do on arrival"
        rows={2}
        placeholder="Come to the blue container 15 minutes before your start time."
        value={values.arrival_instructions || ""}
        onChange={(e) => set({ arrival_instructions: e.target.value })}
      />
    </div>
  );
}

const NOUNS = [
  ["tour", "toured"],
  ["paddle", "paddled"],
  ["dive", "dived"],
  ["ride", "rode"],
  ["hike", "hiked"],
  ["trip", "joined"],
] as const;

export function Guests({ values, set }: StepContext) {
  return (
    <div className="space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <TextArea
          id="what_to_bring"
          label="What to bring"
          hint="One per line works well."
          rows={4}
          placeholder={"Sunscreen\nWater bottle\nA towel"}
          value={values.what_to_bring || ""}
          onChange={(e) => set({ what_to_bring: e.target.value })}
        />
        <TextArea
          id="what_to_wear"
          label="What to wear"
          rows={4}
          placeholder="Clothes that can get wet, and closed shoes."
          value={values.what_to_wear || ""}
          onChange={(e) => set({ what_to_wear: e.target.value })}
        />
      </div>

      <fieldset>
        <legend className="field">What do you call one of your outings?</legend>
        <p className="hint mb-3">We use this word in guest messages.</p>
        <div className="flex flex-wrap gap-2">
          {NOUNS.map(([noun, past]) => (
            <button
              key={noun}
              type="button"
              className="chip"
              aria-pressed={values.activity_noun === noun}
              onClick={() => set({ activity_noun: noun, activity_verb_past: past })}
            >
              {noun}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            id="activity_noun"
            label="Or type your own"
            value={values.activity_noun || ""}
            onChange={(e) => set({ activity_noun: e.target.value })}
          />
          <TextField
            id="activity_verb_past"
            label="Past tense"
            hint="For example: paddled, dived, rode."
            value={values.activity_verb_past || ""}
            onChange={(e) => set({ activity_verb_past: e.target.value })}
          />
        </div>
        {values.activity_noun && (
          <p className="mt-4 rounded-lg bg-bg px-3.5 py-2.5 text-sm text-muted">
            Guests will read: &ldquo;Thanks for joining us! We hope you loved your{" "}
            <strong className="text-ink">{values.activity_noun}</strong>.&rdquo;
          </p>
        )}
      </fieldset>
    </div>
  );
}
