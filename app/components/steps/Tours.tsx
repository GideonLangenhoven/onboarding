"use client";

import {
  DAY_LABELS,
  countSlots,
  emptyRange,
  emptyTour,
  type ScheduleRange,
  type StepContext,
  type TourDraft,
} from "../../lib/onboarding";

const DURATIONS = [
  [60, "1h"],
  [90, "1½h"],
  [120, "2h"],
  [180, "3h"],
  [240, "Half day"],
  [480, "Full day"],
] as const;

const DAY_PRESETS = [
  ["Every day", [0, 1, 2, 3, 4, 5, 6]],
  ["Weekdays", [1, 2, 3, 4, 5]],
  ["Weekends", [0, 6]],
] as const;

const HORIZONS = [
  [3, "3 months"],
  [6, "6 months"],
  [12, "1 year"],
] as const;

/** Plain calendar arithmetic in UTC, so the browser's time zone can't shift the day. */
function monthsFrom(start: string, months: number) {
  const date = new Date(`${start || new Date().toISOString().slice(0, 10)}T00:00:00Z`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return date.toISOString().slice(0, 10);
}

const same = (a: readonly number[], b: readonly number[]) =>
  a.length === b.length && [...a].sort().every((v, i) => v === [...b].sort()[i]);

function RangeEditor({
  range,
  prefix,
  onChange,
  onRemove,
}: {
  range: ScheduleRange;
  prefix: string;
  onChange: (next: ScheduleRange) => void;
  onRemove: (() => void) | null;
}) {
  return (
    <div className="space-y-4 rounded-xl border border-line bg-bg/60 p-4">
      <fieldset>
        <legend className="field">Days</legend>
        <div className="flex flex-wrap items-center gap-1.5">
          {DAY_PRESETS.map(([label, days]) => (
            <button
              key={label}
              type="button"
              className="chip"
              aria-pressed={same(range.days_of_week, days)}
              onClick={() => onChange({ ...range, days_of_week: [...days] })}
            >
              {label}
            </button>
          ))}
          <span className="mx-1 h-5 w-px bg-line-strong" aria-hidden="true" />
          {DAY_LABELS.map((label, day) => {
            const on = range.days_of_week.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                className="chip w-11 justify-center px-0"
                onClick={() =>
                  onChange({
                    ...range,
                    days_of_week: on
                      ? range.days_of_week.filter((d) => d !== day)
                      : [...range.days_of_week, day].sort(),
                  })
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset>
        <legend className="field">Start times</legend>
        <div className="flex flex-wrap items-center gap-2">
          {range.times.map((time, timeIndex) => (
            <span key={timeIndex} className="flex items-center rounded-[10px] border border-line-strong bg-white pr-1">
              <input
                type="time"
                className="rounded-[10px] bg-transparent px-3 py-2 outline-none"
                aria-label={`Start time ${timeIndex + 1}`}
                value={time}
                onChange={(e) =>
                  onChange({
                    ...range,
                    times: range.times.map((t, i) => (i === timeIndex ? e.target.value : t)),
                  })
                }
              />
              {range.times.length > 1 && (
                <button
                  type="button"
                  className="px-1.5 text-muted hover:text-danger"
                  aria-label={`Remove start time ${timeIndex + 1}`}
                  onClick={() => onChange({ ...range, times: range.times.filter((_, i) => i !== timeIndex) })}
                >
                  ×
                </button>
              )}
            </span>
          ))}
          <button
            type="button"
            className="btn-small"
            onClick={() => onChange({ ...range, times: [...range.times, "14:00"] })}
          >
            + Time
          </button>
        </div>
      </fieldset>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field" htmlFor={`${prefix}-start`}>
            From
          </label>
          <input
            id={`${prefix}-start`}
            type="date"
            className="input"
            value={range.start_date}
            onChange={(e) => onChange({ ...range, start_date: e.target.value })}
          />
        </div>
        <div>
          <label className="field" htmlFor={`${prefix}-end`}>
            Until
          </label>
          <input
            id={`${prefix}-end`}
            type="date"
            className="input"
            min={range.start_date}
            value={range.end_date}
            onChange={(e) => onChange({ ...range, end_date: e.target.value })}
          />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="hint mr-1 text-[13px]">Run it for</span>
        {HORIZONS.map(([months, label]) => {
          const end = monthsFrom(range.start_date, months);
          return (
            <button
              key={months}
              type="button"
              className="chip"
              aria-pressed={range.end_date === end}
              onClick={() => onChange({ ...range, end_date: end })}
            >
              {label}
            </button>
          );
        })}
        {onRemove && (
          <button type="button" className="ml-auto text-sm text-muted hover:text-danger" onClick={onRemove}>
            Remove dates
          </button>
        )}
      </div>
    </div>
  );
}

export function Tours({ tours, setTours, values }: StepContext) {
  const list = tours.length > 0 ? tours : [emptyTour()];
  const currency = values.currency || "ZAR";

  function updateTour(index: number, patch: Partial<TourDraft>) {
    setTours(list.map((tour, i) => (i === index ? { ...tour, ...patch } : tour)));
  }

  return (
    <div className="space-y-5">
      {list.map((tour, index) => {
        const slots = countSlots(tour.ranges);
        const missingEnd = tour.ranges.some((r) => !r.end_date);
        return (
          <section
            key={tour.id || index}
            aria-label={tour.name || `Tour ${index + 1}`}
            className="space-y-5 rounded-2xl border border-line p-4 sm:p-5"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-semibold text-accent-dark">
                {index + 1}
              </span>
              <input
                id={`tour-${index}-name`}
                aria-label="Tour name"
                className="input text-[15px] font-semibold"
                placeholder="Tour name, e.g. Sunrise Penguin Paddle"
                value={tour.name}
                onChange={(e) => updateTour(index, { name: e.target.value })}
                required
              />
              {list.length > 1 && (
                <button
                  type="button"
                  className="shrink-0 text-sm text-muted hover:text-danger"
                  onClick={() => setTours(list.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
              <div>
                <label className="field" htmlFor={`tour-${index}-price`}>
                  Price per person
                </label>
                <div className="flex items-center rounded-[10px] border border-line-strong bg-white focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/15">
                  <span className="pl-3.5 text-sm text-muted">{currency}</span>
                  <input
                    id={`tour-${index}-price`}
                    className="w-full rounded-[10px] bg-transparent px-2 py-2.5 outline-none"
                    inputMode="decimal"
                    placeholder="650"
                    value={tour.base_price_per_person}
                    onChange={(e) =>
                      updateTour(index, { base_price_per_person: e.target.value.replace(/[^0-9.]/g, "") })
                    }
                  />
                </div>
              </div>
              <div>
                <label className="field" htmlFor={`tour-${index}-capacity`}>
                  Seats per departure
                </label>
                <input
                  id={`tour-${index}-capacity`}
                  className="input"
                  inputMode="numeric"
                  value={tour.default_capacity}
                  onChange={(e) =>
                    updateTour(index, { default_capacity: e.target.value.replace(/[^0-9]/g, "") })
                  }
                />
              </div>
            </div>

            <fieldset>
              <legend className="field">How long is it?</legend>
              <div className="flex flex-wrap items-center gap-1.5">
                {DURATIONS.map(([minutes, label]) => (
                  <button
                    key={minutes}
                    type="button"
                    className="chip"
                    aria-pressed={Number(tour.duration_minutes) === minutes}
                    onClick={() => updateTour(index, { duration_minutes: String(minutes) })}
                  >
                    {label}
                  </button>
                ))}
                <span className="ml-1 flex items-center gap-1.5 text-sm text-muted">
                  or
                  <input
                    id={`tour-${index}-duration`}
                    aria-label="Length in minutes"
                    className="input w-20 py-1.5"
                    inputMode="numeric"
                    value={tour.duration_minutes}
                    onChange={(e) =>
                      updateTour(index, { duration_minutes: e.target.value.replace(/[^0-9]/g, "") })
                    }
                  />
                  min
                </span>
              </div>
            </fieldset>

            <div>
              <label className="field" htmlFor={`tour-${index}-description`}>
                Describe it <span className="font-normal text-muted">(optional)</span>
              </label>
              <textarea
                id={`tour-${index}-description`}
                rows={2}
                className="input"
                placeholder="What makes it special, who it suits, what's included."
                value={tour.description}
                onChange={(e) => updateTour(index, { description: e.target.value })}
              />
            </div>

            <div className="space-y-3">
              <p className="field mb-0">When do you run it?</p>
              {tour.ranges.map((range, rangeIndex) => (
                <RangeEditor
                  key={rangeIndex}
                  range={range}
                  prefix={`t${index}r${rangeIndex}`}
                  onChange={(next) =>
                    updateTour(index, {
                      ranges: tour.ranges.map((r, i) => (i === rangeIndex ? next : r)),
                    })
                  }
                  onRemove={() =>
                    updateTour(index, { ranges: tour.ranges.filter((_, i) => i !== rangeIndex) })
                  }
                />
              ))}
              <button
                type="button"
                className="btn-small"
                onClick={() => updateTour(index, { ranges: [...tour.ranges, emptyRange()] })}
              >
                + {tour.ranges.length ? "Another season or schedule" : "Add more dates"}
              </button>
            </div>

            <p
              className={`rounded-lg px-3.5 py-2.5 text-sm ${
                slots > 0 ? "bg-mint/60 text-accent-dark" : "bg-bg text-muted"
              }`}
              aria-live="polite"
            >
              {tour.slot_count ? `${tour.slot_count} departures already on your calendar. ` : ""}
              {slots > 0
                ? `Continue adds ${slots} departure${slots === 1 ? "" : "s"}.`
                : missingEnd
                  ? "Pick how long to run it for, and we'll put the departures on your calendar."
                  : tour.slot_count
                    ? ""
                    : "No departures yet. Add dates above."}
            </p>
          </section>
        );
      })}

      <button type="button" className="btn-ghost w-full border-dashed" onClick={() => setTours([...list, emptyTour()])}>
        + Add another tour
      </button>
    </div>
  );
}
