"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { callWizard } from "../lib/api";
import {
  adminUrlFor,
  emptyRange,
  emptyTour,
  type Credentials,
  type Readiness,
  type StepContext,
  type TourDraft,
  type Values,
} from "../lib/onboarding";
import {
  CHAPTERS,
  FINISH_INDEX,
  REVIEW_INDEX,
  SECTION_KEYS,
  STEPS,
  stepIndexForSection,
  type Section,
} from "../lib/steps";
import { Business, Location } from "./steps/Identity";
import { Headline, Look } from "./steps/Branding";
import { Guests, Meeting } from "./steps/Operations";
import { Refunds } from "./steps/Refunds";
import { Tours } from "./steps/Tours";
import { Assistant } from "./steps/Faqs";
import { Welcome } from "./steps/Welcome";
import { Finish, Review } from "./steps/GoLive";
import Preview from "./Preview";
import Mark from "./Mark";

const SCREENS: Record<string, ComponentType<StepContext>> = {
  welcome: Welcome,
  business: Business,
  location: Location,
  look: Look,
  headline: Headline,
  meeting: Meeting,
  guests: Guests,
  refunds: Refunds,
  tours: Tours,
  assistant: Assistant,
  review: Review,
  finish: Finish,
};

/** Screens that bring their own primary button instead of Continue. */
const OWN_BUTTON = new Set(["welcome", "review", "finish"]);

/** Held as JSON strings in `values` so every answer is one flat string map. */
const JSON_KEYS = new Set(["refund_policy_tiers", "faq_json"]);

type Session = {
  business_name?: string;
  booking_site_url?: string;
  client_name?: string;
  wizard_step?: string;
};

type State = {
  business?: Record<string, unknown>;
  tours?: Record<string, unknown>[];
  creds?: Credentials;
  wizard_step?: string;
};

function toValues(business: Record<string, unknown>): Values {
  const values: Values = {};
  for (const [key, value] of Object.entries(business)) {
    if (value === null || value === undefined) continue;
    values[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
  }
  return values;
}

function toTours(rows: Record<string, unknown>[]): TourDraft[] {
  return rows.map((row) => {
    const slotCount = Number(row.slot_count) || 0;
    return {
      id: String(row.id),
      name: String(row.name ?? ""),
      base_price_per_person: String(row.base_price_per_person ?? ""),
      duration_minutes: String(row.duration_minutes ?? "120"),
      default_capacity: String(row.default_capacity ?? "10"),
      description: String(row.description ?? ""),
      slot_count: slotCount,
      // A tour that already has departures starts with no new dates, so pressing
      // Next again does not pile more slots onto the calendar.
      ranges: slotCount > 0 ? [] : [emptyRange()],
    };
  });
}

function Check() {
  return (
    <svg viewBox="0 0 16 16" className="h-3 w-3" aria-hidden="true">
      <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function Wizard({ token, session }: { token: string; session: Session }) {
  const [values, setValues] = useState<Values>({});
  const [tours, setToursState] = useState<TourDraft[]>([]);
  const [creds, setCreds] = useState<Credentials>({});
  const [index, setIndex] = useState(0);
  const [reached, setReached] = useState(0);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [note, setNote] = useState("");

  const dirty = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const heading = useRef<HTMLHeadingElement>(null);

  const step = STEPS[index];
  // v2: the step list was renumbered, so positions saved by the old wizard are meaningless.
  const storageKey = `bookingtours-wizard-v2-step-${token}`;
  // Once go-live has run the server refuses save-step, so nothing before it is editable.
  const live = values.subscription_status === "ACTIVE";

  const set = useCallback((patch: Values) => {
    dirty.current = true;
    setValues((current) => ({ ...current, ...patch }));
  }, []);

  const setTours = useCallback((next: TourDraft[]) => {
    dirty.current = true;
    setToursState(next);
  }, []);

  const load = useCallback(async () => {
    const data = await callWizard<State>("get-state", token);
    setValues(toValues(data.business || {}));
    setCreds(data.creds || {});
    const loaded = toTours(data.tours || []);
    setToursState(loaded.length > 0 ? loaded : [emptyTour()]);
    return data;
  }, [token]);

  const refresh = useCallback(async () => {
    try {
      await load();
    } catch (caught) {
      setError((caught as Error).message);
    }
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    // Loading the client's saved answers on mount is the one thing this screen
    // cannot do any other way, and the cancelled flag covers the unmount race.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
      .then((data) => {
        if (cancelled) return;
        let resume: number;
        if (data.business?.subscription_status === "ACTIVE") {
          resume = FINISH_INDEX;
        } else {
          let stored = NaN;
          try {
            stored = Number(window.localStorage.getItem(storageKey));
          } catch {
            // Private mode: fall back to the server's position.
          }
          resume =
            Number.isInteger(stored) && stored > 0 && stored < STEPS.length
              ? stored
              : stepIndexForSection(data.wizard_step || session.wizard_step);
          resume = Math.min(resume, REVIEW_INDEX);
        }
        setIndex(resume);
        setReached(resume);
      })
      .catch((caught) => {
        if (!cancelled) setError((caught as Error).message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [load, storageKey, session.wizard_step]);

  /** Runs saves one after another so a debounce and a Continue never overlap. */
  const save = useCallback(() => {
    const section: Section | null = step.section;
    if (!section || live) return Promise.resolve();

    dirty.current = false;
    setError("");
    setSaveState("saving");

    const run = async () => {
      if (section === "tours") {
        const payload = tours
          .filter((tour) => tour.name.trim())
          .map((tour, order) => ({
            ...(tour.id ? { id: tour.id } : {}),
            name: tour.name.trim(),
            base_price_per_person: Number(tour.base_price_per_person) || 0,
            duration_minutes: Number(tour.duration_minutes) || 0,
            default_capacity: Number(tour.default_capacity) || 0,
            description: tour.description,
            sort_order: order,
            ranges: tour.ranges.filter(
              (range) =>
                range.start_date &&
                range.end_date &&
                range.times.filter(Boolean).length > 0 &&
                range.days_of_week.length > 0,
            ),
          }));

        if (payload.length === 0) {
          setSaveState("idle");
          return;
        }

        const result = await callWizard<{
          tours?: { tour_id: string; name: string; slots_created: number }[];
        }>("save-step", token, { step: "tours", data: { tours: payload } });

        const created = (result.tours || []).reduce((sum, row) => sum + (row.slots_created || 0), 0);
        if (created > 0) setNote(`${created} departures added to your calendar`);
        await load();
      } else {
        const data: Record<string, unknown> = {};
        for (const key of SECTION_KEYS[section]) {
          const value = values[key];
          if (value === undefined) continue;
          if (JSON_KEYS.has(key)) {
            try {
              data[key] = JSON.parse(value);
            } catch {
              continue;
            }
          } else {
            data[key] = value;
          }
        }
        if (Object.keys(data).length === 0) {
          setSaveState("idle");
          return;
        }
        // The server writes only its own whitelist and reports back what it took,
        // so never tell the client "Saved" when nothing actually landed.
        const result = await callWizard<{ saved?: string[] }>("save-step", token, {
          step: section,
          data,
        });
        if (Array.isArray(result.saved) && result.saved.length === 0) {
          setSaveState("idle");
          return;
        }
      }
      setSaveState("saved");
    };

    queue.current = queue.current.then(run, run).catch((caught: Error) => {
      dirty.current = true;
      setSaveState("idle");
      setError(caught.message);
      throw caught;
    });

    return queue.current;
  }, [step.section, live, tours, values, token, load]);

  useEffect(() => {
    if (!dirty.current) return;
    // Saving tours reloads them from the server, which would overwrite whatever
    // the client is halfway through typing. That one screen saves on Continue only.
    if (step.section === "tours") return;
    const timer = setTimeout(() => {
      save().catch(() => {
        // Already surfaced in the error banner.
      });
    }, 1500);
    return () => clearTimeout(timer);
  }, [save, step.section]);

  useEffect(() => {
    if (loading) return;
    try {
      window.localStorage.setItem(storageKey, String(index));
    } catch {
      // Resume falls back to the server's wizard_step.
    }
    heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index, loading, storageKey]);

  function move(to: number) {
    setValidationError("");
    const next = Math.min(Math.max(to, 0), STEPS.length - 1);
    setIndex(next);
    setReached((r) => Math.max(r, next));
  }

  async function goNext() {
    setNote("");
    const failed = step.validate?.(values);
    if (failed) {
      setValidationError(failed);
      return;
    }

    if (step.id === "tours") {
      const named = tours.filter((tour) => tour.name.trim());
      if (named.length === 0) {
        setValidationError("Add at least one tour, so your guests have something to book.");
        return;
      }
      const incomplete = named.find(
        (tour) =>
          !(Number(tour.base_price_per_person) > 0) || !(Number(tour.duration_minutes) > 0),
      );
      if (incomplete) {
        setValidationError(`${incomplete.name} still needs a price and a length.`);
        return;
      }
    }

    try {
      await save();
    } catch {
      return; // Stay put so nothing is lost. The banner explains why.
    }
    move(index + 1);
  }

  async function goTo(stepId: string) {
    const to = STEPS.findIndex((s) => s.id === stepId);
    if (to === -1 || live) return;
    try {
      await save();
    } catch {
      return;
    }
    move(to);
  }

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Loading your setup
        </div>
      </div>
    );
  }

  const Screen = SCREENS[step.id];
  const businessName = values.business_name || session.business_name || "Your business";
  const bookingSiteUrl = values.booking_site_url || session.booking_site_url || "";
  const context: StepContext = {
    token,
    values,
    set,
    tours,
    setTours,
    creds,
    refresh,
    bookingSiteUrl,
    adminUrl: adminUrlFor(values.subdomain),
    businessName,
    goNext: () => void goNext(),
    goTo: (id) => void goTo(id),
    markLive: (next) => {
      setReadiness(next);
      setValues((current) => ({ ...current, subscription_status: "ACTIVE" }));
      move(FINISH_INDEX);
    },
    readiness,
  };

  const percent = Math.round((index / FINISH_INDEX) * 100);
  const minutesLeft = Math.max(1, Math.round((REVIEW_INDEX - index) * 1.5));
  const showPreview = index > 0 && index < REVIEW_INDEX;
  const canGoBack = index > 0 && !live;
  const status =
    saveState === "saving" ? "Saving" : note || (saveState === "saved" ? "All changes saved" : "");

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-line bg-bg/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Mark />
          <span className="hidden text-sm font-semibold sm:inline">Booking·Tours</span>
          <span className="hidden text-line-strong sm:inline" aria-hidden="true">/</span>
          <span className="truncate text-sm text-muted">Setting up {businessName}</span>
          <span
            className={`ml-auto flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs ${
              status ? "bg-mint text-accent-dark" : "text-muted"
            }`}
            aria-live="polite"
          >
            {saveState === "saving" ? (
              <span className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            ) : status ? (
              <Check />
            ) : null}
            {status || "Saves automatically"}
          </span>
        </div>
        <div className="h-0.5 bg-line lg:hidden" role="presentation">
          <div className="h-full bg-accent transition-all duration-500" style={{ width: `${percent}%` }} />
        </div>
      </header>

      <div
        className={`mx-auto grid max-w-7xl gap-8 px-4 py-6 sm:px-6 lg:py-10 ${
          showPreview ? "lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[220px_minmax(0,1fr)_340px]" : "lg:grid-cols-[220px_minmax(0,1fr)]"
        }`}
      >
        <nav aria-label="Setup progress" className="hidden lg:block">
          <ol className="sticky top-24 space-y-1">
            {CHAPTERS.map((chapter) => {
              const first = STEPS.findIndex((s) => s.chapter === chapter);
              const last = STEPS.findLastIndex((s) => s.chapter === chapter);
              const current = index >= first && index <= last;
              const done = index > last || (live && first < REVIEW_INDEX);
              const reachable = !live && first <= reached && !current && first < FINISH_INDEX;
              return (
                <li key={chapter}>
                  <button
                    type="button"
                    disabled={!reachable}
                    onClick={() => void goTo(STEPS[first].id)}
                    aria-current={current ? "step" : undefined}
                    className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                      current ? "bg-white font-semibold text-ink shadow-sm ring-1 ring-line" : done ? "text-ink" : "text-muted"
                    } ${reachable ? "hover:bg-white" : "cursor-default"}`}
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] ${
                        done
                          ? "bg-accent text-white"
                          : current
                            ? "border-2 border-accent bg-white"
                            : "border border-line-strong bg-white"
                      }`}
                    >
                      {done && <Check />}
                    </span>
                    {chapter}
                  </button>
                </li>
              );
            })}
          </ol>
          {index < REVIEW_INDEX && (
            <p className="mt-6 px-2.5 text-xs text-muted">About {minutesLeft} min to go</p>
          )}
        </nav>

        <main className="min-w-0">
          <form
            key={step.id}
            className="fade-in"
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              if (!OWN_BUTTON.has(step.id)) void goNext();
            }}
          >
            <div className="card">
              <p className="eyebrow">
                {step.chapter}
                <span className="ml-2 font-normal normal-case tracking-normal text-muted lg:hidden">
                  · Step {index + 1} of {STEPS.length}
                </span>
              </p>
              <h1
                ref={heading}
                tabIndex={-1}
                className="mt-2 font-display text-[1.75rem] font-semibold leading-tight tracking-tight outline-none sm:text-[2.1rem]"
              >
                {step.title}
              </h1>
              {step.intro && <p className="mt-2 max-w-xl text-[15px] text-muted">{step.intro}</p>}

              <div className="mt-7">
                <Screen {...context} />
              </div>

              {validationError && (
                <p className="mt-6 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
                  {validationError}
                </p>
              )}

              {error && (
                <p className="mt-6 rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
                  {error} Nothing is lost, try again in a moment.
                </p>
              )}
            </div>

            {(canGoBack || !OWN_BUTTON.has(step.id)) && (
              <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex items-center gap-3 border-t border-line bg-bg/90 px-4 py-3 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:pt-2">
                {canGoBack && (
                  <button type="button" className="btn-ghost" onClick={() => move(index - 1)}>
                    Back
                  </button>
                )}
                {!OWN_BUTTON.has(step.id) && (
                  <button type="submit" className="btn-primary ml-auto min-w-[9rem]" disabled={saveState === "saving" && step.section === "tours"}>
                    {saveState === "saving" && step.section === "tours" ? "Saving tours" : "Continue"}
                  </button>
                )}
              </div>
            )}
          </form>
        </main>

        {showPreview && (
          <aside className="hidden xl:block">
            <div className="sticky top-24">
              <Preview values={values} tours={tours} bookingSiteUrl={bookingSiteUrl} businessName={businessName} />
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
