"use client";

import { useEffect } from "react";
import { TextArea } from "../Field";
import type { RefundTier, StepContext } from "../../lib/onboarding";

const DEFAULT_TIERS: RefundTier[] = [
  { hours_before: 48, refund_percent: 100 },
  { hours_before: 24, refund_percent: 50 },
  { hours_before: 0, refund_percent: 0 },
];

export function readTiers(raw: string | undefined): RefundTier[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) && parsed.length > 0 ? (parsed as RefundTier[]) : DEFAULT_TIERS;
  } catch {
    return DEFAULT_TIERS;
  }
}

export function Refunds({ values, set }: StepContext) {
  const tiers = readTiers(values.refund_policy_tiers);

  // Nobody should land on go-live with no policy just because they agreed with
  // the defaults and pressed Next, so write them in the moment they are shown.
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
    <div className="space-y-5">
      <ul className="space-y-3">
        {tiers.map((tier, index) => (
          <li key={index} className="flex flex-wrap items-end gap-3 rounded-xl border border-line bg-white/70 p-4">
            <div>
              <label className="field" htmlFor={`hours-${index}`}>
                Cancels at least
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`hours-${index}`}
                  className="input w-24"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={tier.hours_before}
                  onChange={(e) => update(index, { hours_before: Number(e.target.value) })}
                />
                <span className="hint">hours before</span>
              </div>
            </div>

            <div>
              <label className="field" htmlFor={`percent-${index}`}>
                They get back
              </label>
              <div className="flex items-center gap-2">
                <input
                  id={`percent-${index}`}
                  className="input w-24"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100}
                  value={tier.refund_percent}
                  onChange={(e) => update(index, { refund_percent: Number(e.target.value) })}
                />
                <span className="hint">percent</span>
              </div>
            </div>

            {tiers.length > 1 && (
              <button
                type="button"
                className="btn-small ml-auto"
                onClick={() => write(tiers.filter((_, i) => i !== index))}
              >
                Remove
              </button>
            )}
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn-small"
        onClick={() => write([...tiers, { hours_before: 12, refund_percent: 25 }])}
      >
        Add another step
      </button>

      <TextArea
        id="refund_policy_text"
        label="Anything else guests should know"
        hint="Optional. Shown with the policy at checkout."
        rows={3}
        value={values.refund_policy_text || ""}
        onChange={(e) => set({ refund_policy_text: e.target.value })}
      />
    </div>
  );
}
