"use client";

import { useEffect } from "react";
import { TextArea } from "../Field";
import type { RefundTier, StepContext } from "../../lib/onboarding";

const PRESETS: { name: string; detail: string; tiers: RefundTier[] }[] = [
  {
    name: "Flexible",
    detail: "Full refund up to 24 hours before",
    tiers: [
      { hours_before: 24, refund_percent: 100 },
      { hours_before: 0, refund_percent: 0 },
    ],
  },
  {
    name: "Standard",
    detail: "Full refund 48h before, half refund 24h before",
    tiers: [
      { hours_before: 48, refund_percent: 100 },
      { hours_before: 24, refund_percent: 50 },
      { hours_before: 0, refund_percent: 0 },
    ],
  },
  {
    name: "Strict",
    detail: "Half refund up to 7 days before",
    tiers: [
      { hours_before: 168, refund_percent: 50 },
      { hours_before: 0, refund_percent: 0 },
    ],
  },
];

const DEFAULT_TIERS = PRESETS[1].tiers;

export function readTiers(raw: string | undefined): RefundTier[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as RefundTier[]) : DEFAULT_TIERS;
  } catch {
    return DEFAULT_TIERS;
  }
}

export function describeTier(tier: RefundTier) {
  const when =
    tier.hours_before === 0
      ? "Later than that"
      : tier.hours_before % 24 === 0
        ? `${tier.hours_before / 24} day${tier.hours_before === 24 ? "" : "s"}+ before`
        : `${tier.hours_before}h+ before`;
  return `${when}: ${tier.refund_percent}% back`;
}

export function Refunds({ values, set }: StepContext) {
  const tiers = readTiers(values.refund_policy_tiers);
  const current = JSON.stringify(tiers);

  // Nobody should land on go-live with no policy just because they agreed with
  // the defaults and pressed Continue, so write them in the moment they are shown.
  useEffect(() => {
    if (!values.refund_policy_tiers) set({ refund_policy_tiers: JSON.stringify(DEFAULT_TIERS) });
  }, [values.refund_policy_tiers, set]);

  function write(next: RefundTier[]) {
    const sorted = [...next].sort((a, b) => b.hours_before - a.hours_before);
    set({ refund_policy_tiers: JSON.stringify(sorted) });
  }

  function update(index: number, patch: Partial<RefundTier>) {
    write(tiers.map((tier, i) => (i === index ? { ...tier, ...patch } : tier)));
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-2 sm:grid-cols-3" role="radiogroup" aria-label="Policy presets">
        {PRESETS.map((preset) => {
          const on = JSON.stringify(preset.tiers) === current;
          return (
            <button
              key={preset.name}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => write(preset.tiers)}
              className={`rounded-xl border p-3.5 text-left transition ${
                on ? "border-accent bg-mint/40 ring-1 ring-accent" : "border-line hover:border-line-strong"
              }`}
            >
              <span className="block text-sm font-semibold">{preset.name}</span>
              <span className="hint text-[13px]">{preset.detail}</span>
            </button>
          );
        })}
      </div>

      <details className="group rounded-xl border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span className="min-w-0">
            <span className="font-medium">Fine-tune</span>
            <span className="hint ml-2">{tiers.map(describeTier).join(" · ")}</span>
          </span>
          <span className="ml-3 text-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="space-y-3 border-t border-line p-4">
          {tiers.map((tier, index) => (
            <div key={index} className="flex flex-wrap items-center gap-2 text-sm">
              <label htmlFor={`hours-${index}`}>Cancels</label>
              <input
                id={`hours-${index}`}
                className="input w-20 py-1.5"
                type="number"
                inputMode="numeric"
                min={0}
                value={tier.hours_before}
                onChange={(e) => update(index, { hours_before: Number(e.target.value) })}
              />
              <span className="text-muted">hours or more before, gets</span>
              <input
                id={`percent-${index}`}
                aria-label="Percent refunded"
                className="input w-20 py-1.5"
                type="number"
                inputMode="numeric"
                min={0}
                max={100}
                value={tier.refund_percent}
                onChange={(e) => update(index, { refund_percent: Number(e.target.value) })}
              />
              <span className="text-muted">% back</span>
              {tiers.length > 1 && (
                <button
                  type="button"
                  className="ml-auto text-sm text-muted underline-offset-4 hover:text-danger hover:underline"
                  onClick={() => write(tiers.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="btn-small"
            onClick={() => write([...tiers, { hours_before: 12, refund_percent: 25 }])}
          >
            + Add a step
          </button>
        </div>
      </details>

      <TextArea
        id="refund_policy_text"
        label="Anything else guests should know"
        hint="Optional. Shown with the policy at checkout, for example how weather cancellations work."
        rows={3}
        value={values.refund_policy_text || ""}
        onChange={(e) => set({ refund_policy_text: e.target.value })}
      />
    </div>
  );
}
