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

function RangeEditor({
  range,
  index,
  tourIndex,
  onChange,
  onRemove,
}: {
  range: ScheduleRange;
  index: number;
  tourIndex: number;
  onChange: (next: ScheduleRange) => void;
  onRemove: (() => void) | null;
}) {
  const prefix = `t${tourIndex}r${index}`;

  return (
    <div className="space-y-4 rounded-xl border border-line bg-white/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="field" htmlFor={`${prefix}-start`}>
            Running from
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
            value={range.end_date}
            onChange={(e) => onChange({ ...range, end_date: e.target.value })}
          />
        </div>
      </div>

      <fieldset>
        <legend className="field">Days you run it</legend>
        <div className="flex flex-wrap gap-2">
          {DAY_LABELS.map((label, day) => {
            const on = range.days_of_week.includes(day);
            return (
              <button
                key={day}
                type="button"
                aria-pressed={on}
                className={
                  on ? "btn-small border-accent bg-accent text-white hover:bg-accent" : "btn-small"
                }
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
            <span key={timeIndex} className="flex items-center gap-1">
              <input
                type="time"
                className="input w-32"
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
                  className="btn-small"
                  aria-label={`Remove start time ${timeIndex + 1}`}
                  onClick={() =>
                    onChange({ ...range, times: range.times.filter((_, i) => i !== timeIndex) })
                  }
                >
                  Remove
                </button>
              )}
            </span>
          ))}
          <button
            type="button"
            className="btn-small"
            onClick={() => onChange({ ...range, times: [...range.times, "14:00"] })}
          >
            Add a time
          </button>
        </div>
      </fieldset>

      {onRemove && (
        <button type="button" className="btn-small" onClick={onRemove}>
          Remove these dates
        </button>
      )}
    </div>
  );
}

export function Tours({ tours, setTours }: StepContext) {
  const list = tours.length > 0 ? tours : [emptyTour()];

  function updateTour(index: number, patch: Partial<TourDraft>) {
    setTours(list.map((tour, i) => (i === index ? { ...tour, ...patch } : tour)));
  }

  return (
    <div className="space-y-6">
      {list.map((tour, index) => {
        const slots = countSlots(tour.ranges);
        return (
          <div key={tour.id || index} className="space-y-5 rounded-2xl border border-line bg-white/70 p-5">
            <div className="flex items-start justify-between gap-3">
              <h2 className="font-serif text-lg">Tour {index + 1}</h2>
              {list.length > 1 && (
                <button
                  type="button"
                  className="btn-small"
                  onClick={() => setTours(list.filter((_, i) => i !== index))}
                >
                  Remove this tour
                </button>
              )}
            </div>

            <div>
              <label className="field" htmlFor={`tour-${index}-name`}>
                Tour name
              </label>
              <input
                id={`tour-${index}-name`}
                className="input"
                value={tour.name}
                onChange={(e) => updateTour(index, { name: e.target.value })}
                required
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="field" htmlFor={`tour-${index}-price`}>
                  Price per person
                </label>
                <input
                  id={`tour-${index}-price`}
                  className="input"
                  inputMode="numeric"
                  value={tour.base_price_per_person}
                  onChange={(e) =>
                    updateTour(index, { base_price_per_person: e.target.value.replace(/[^0-9.]/g, "") })
                  }
                />
              </div>
              <div>
                <label className="field" htmlFor={`tour-${index}-duration`}>
                  How long, in minutes
                </label>
                <input
                  id={`tour-${index}-duration`}
                  className="input"
                  inputMode="numeric"
                  value={tour.duration_minutes}
                  onChange={(e) =>
                    updateTour(index, { duration_minutes: e.target.value.replace(/[^0-9]/g, "") })
                  }
                />
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

            <div>
              <label className="field" htmlFor={`tour-${index}-description`}>
                Describe it
              </label>
              <textarea
                id={`tour-${index}-description`}
                rows={3}
                className="input"
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
                  index={rangeIndex}
                  tourIndex={index}
                  onChange={(next) =>
                    updateTour(index, {
                      ranges: tour.ranges.map((r, i) => (i === rangeIndex ? next : r)),
                    })
                  }
                  onRemove={
                    tour.ranges.length > 1
                      ? () =>
                          updateTour(index, {
                            ranges: tour.ranges.filter((_, i) => i !== rangeIndex),
                          })
                      : null
                  }
                />
              ))}
              <button
                type="button"
                className="btn-small"
                onClick={() => updateTour(index, { ranges: [...tour.ranges, emptyRange()] })}
              >
                Add another set of dates
              </button>
            </div>

            <p className="hint" aria-live="polite">
              {tour.slot_count
                ? `${tour.slot_count} departures are already on your calendar. `
                : ""}
              {slots > 0
                ? `These dates add about ${slots} more.`
                : "Set a start date, an end date and at least one time to create departures."}
            </p>
          </div>
        );
      })}

      <button type="button" className="btn-ghost" onClick={() => setTours([...list, emptyTour()])}>
        Add another tour
      </button>
    </div>
  );
}
