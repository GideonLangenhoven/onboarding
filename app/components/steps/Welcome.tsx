"use client";

import type { StepContext } from "../../lib/onboarding";

const CHAPTERS = [
  "Your business, and how guests reach you",
  "Your logo, colours and headline",
  "Where guests meet you, and what to bring",
  "Your cancellation policy",
  "Your tours, prices and times",
  "The questions guests always ask",
  "Taking payments",
];

export function Welcome({ values, businessName, goNext }: StepContext) {
  return (
    <div className="space-y-6">
      <p>
        Hello{values.name ? ` ${values.name}` : ""}. We are going to set up{" "}
        <strong>{businessName}</strong> together, one question at a time. It takes about twenty
        minutes.
      </p>
      <p className="hint">
        Every answer saves as you go, so if the call drops or you close this page, you can come back
        to the same link and carry on exactly where you left off.
      </p>

      <div>
        <p className="field">Here is what we will cover</p>
        <ol className="space-y-1.5">
          {CHAPTERS.map((chapter, index) => (
            <li key={chapter} className="flex gap-3">
              <span className="text-muted tabular-nums">{index + 1}.</span>
              <span>{chapter}</span>
            </li>
          ))}
        </ol>
      </div>

      <button type="button" className="btn-primary" onClick={goNext}>
        Let us begin
      </button>
    </div>
  );
}
