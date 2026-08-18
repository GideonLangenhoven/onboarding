"use client";

import { TextArea, TextField } from "../Field";
import type { StepContext } from "../../lib/onboarding";

export function OpsMeeting({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="meeting_point"
        label="Meeting point"
        hint="The name of the spot, for example the slipway at Long Beach."
        value={values.meeting_point || ""}
        onChange={(e) => set({ meeting_point: e.target.value })}
      />
      <TextField
        id="meeting_point_address"
        label="Its address"
        value={values.meeting_point_address || ""}
        onChange={(e) => set({ meeting_point_address: e.target.value })}
      />
      <TextArea
        id="directions"
        label="How to find it"
        hint="Parking, landmarks, anything that stops a guest phoning you lost."
        value={values.directions || ""}
        onChange={(e) => set({ directions: e.target.value })}
      />
      <TextArea
        id="arrival_instructions"
        label="What to do on arrival"
        hint="For example, come to the blue container fifteen minutes before your start time."
        rows={3}
        value={values.arrival_instructions || ""}
        onChange={(e) => set({ arrival_instructions: e.target.value })}
      />
    </div>
  );
}

export function OpsBring({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextArea
        id="what_to_bring"
        label="What to bring"
        hint="One per line works well."
        value={values.what_to_bring || ""}
        onChange={(e) => set({ what_to_bring: e.target.value })}
      />
      <TextArea
        id="what_to_wear"
        label="What to wear"
        value={values.what_to_wear || ""}
        onChange={(e) => set({ what_to_wear: e.target.value })}
      />
    </div>
  );
}

export function OpsWords({ values, set }: StepContext) {
  return (
    <div className="space-y-5">
      <TextField
        id="activity_noun"
        label="What do you call one of your trips?"
        hint="For example paddle, dive, ride, hike."
        value={values.activity_noun || ""}
        onChange={(e) => set({ activity_noun: e.target.value })}
      />
      <TextField
        id="activity_verb_past"
        label="And afterwards, what did they do?"
        hint="For example paddled, dived, rode, hiked."
        value={values.activity_verb_past || ""}
        onChange={(e) => set({ activity_verb_past: e.target.value })}
      />
      {(values.activity_noun || values.activity_verb_past) && (
        <p className="hint">
          A guest will read, we hope you enjoyed your{" "}
          <strong>{values.activity_noun || "trip"}</strong>, and later, thanks for joining us, we
          loved having you along on the <strong>{values.activity_noun || "trip"}</strong> you{" "}
          <strong>{values.activity_verb_past || "did"}</strong> with us.
        </p>
      )}
    </div>
  );
}
