"use client";

import type { StepContext } from "../../lib/onboarding";

const CHAPTERS = [
  ["Your business", "Name, address and where bookings go"],
  ["Your brand", "Logo, colours and headline"],
  ["On the day", "Meeting point and what to bring"],
  ["Your tours", "Prices, times and seats"],
  ["AI assistant", "The questions guests always ask"],
  ["Go live", "Your booking site and dashboard switch on"],
] as const;

export function Welcome({ values, businessName, goNext }: StepContext) {
  const firstName = (values.name || "").trim().split(/\s+/)[0];

  return (
    <div className="space-y-7">
      <p className="text-[17px] leading-relaxed">
        {firstName ? `Hi ${firstName}. ` : ""}We&apos;ll set up <strong>{businessName}</strong> together.
        It takes about fifteen minutes, and every answer saves as you go. Close the tab and come back
        to the same link any time.
      </p>

      <ol className="grid gap-2 sm:grid-cols-2">
        {CHAPTERS.map(([title, detail], i) => (
          <li key={title} className="flex gap-3 rounded-xl border border-line bg-bg/60 p-3.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-semibold text-accent-dark">
              {i + 1}
            </span>
            <span>
              <span className="block text-sm font-semibold">{title}</span>
              <span className="hint text-[13px]">{detail}</span>
            </span>
          </li>
        ))}
      </ol>

      <div className="flex flex-wrap items-center gap-4">
        <button type="button" className="btn-primary px-7" onClick={goNext}>
          Let&apos;s begin
        </button>
        <span className="hint">You don&apos;t need any passwords or payment details for this.</span>
      </div>
    </div>
  );
}
