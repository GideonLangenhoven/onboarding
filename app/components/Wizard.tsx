"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { callWizard } from "../lib/api";
import {
  emptyRange,
  emptyTour,
  type Credentials,
  type StepContext,
  type TourDraft,
  type Values,
} from "../lib/onboarding";
import { SECTION_KEYS, STEPS, stepIndexForSection, type Section } from "../lib/steps";
import { IdentityContact, IdentityLocale, IdentityName, IdentityPlace } from "./steps/Identity";
import { BrandingColors, BrandingHero, BrandingLogo } from "./steps/Branding";
import { OpsBring, OpsMeeting, OpsWords } from "./steps/Operations";
import { Refunds } from "./steps/Refunds";
import { Tours } from "./steps/Tours";
import { Faqs, Persona } from "./steps/Faqs";
import { WhatsApp, Yoco } from "./steps/Connections";
import { Welcome } from "./steps/Welcome";
import { Finish, GoLive } from "./steps/GoLive";

const SCREENS: Record<string, ComponentType<StepContext>> = {
  welcome: Welcome,
  "identity-name": IdentityName,
  "identity-place": IdentityPlace,
  "identity-locale": IdentityLocale,
  "identity-contact": IdentityContact,
  "branding-logo": BrandingLogo,
  "branding-colors": BrandingColors,
  "branding-hero": BrandingHero,
  "ops-meeting": OpsMeeting,
  "ops-bring": OpsBring,
  "ops-words": OpsWords,
  refunds: Refunds,
  tours: Tours,
  faqs: Faqs,
  persona: Persona,
  whatsapp: WhatsApp,
  yoco: Yoco,
  golive: GoLive,
  finish: Finish,
};

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

export default function Wizard({ token, session }: { token: string; session: Session }) {
  const [values, setValues] = useState<Values>({});
  const [tours, setToursState] = useState<TourDraft[]>([]);
  const [creds, setCreds] = useState<Credentials>({});
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [validationError, setValidationError] = useState("");
  const [note, setNote] = useState("");

  const dirty = useRef(false);
  const queue = useRef<Promise<unknown>>(Promise.resolve());
  const heading = useRef<HTMLHeadingElement>(null);

  const step = STEPS[index];
  const storageKey = `bookingtours-wizard-step-${token}`;

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
        const stored = Number(window.localStorage.getItem(storageKey));
        const resume =
          Number.isInteger(stored) && stored > 0 && stored < STEPS.length
            ? stored
            : stepIndexForSection(data.wizard_step || session.wizard_step);
        setIndex(resume);
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

  /** Runs saves one after another so a debounce and a Next never overlap. */
  const save = useCallback(() => {
    const section: Section | null = step.section;
    if (!section) return Promise.resolve();

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
        if (created > 0) setNote(`We put ${created} departures on your calendar.`);
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
  }, [step.section, tours, values, token, load]);

  useEffect(() => {
    if (!dirty.current) return;
    // Saving tours reloads them from the server, which would overwrite whatever
    // the client is halfway through typing. That one screen saves on Next only.
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
    window.localStorage.setItem(storageKey, String(index));
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, [index, loading, storageKey]);

  function move(to: number) {
    setValidationError("");
    setIndex(Math.min(Math.max(to, 0), STEPS.length - 1));
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
        setValidationError(`${incomplete.name} still needs a price and a length in minutes.`);
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

  if (loading) {
    return (
      <p className="hint" role="status">
        Fetching your setup.
      </p>
    );
  }

  const Screen = SCREENS[step.id];
  const context: StepContext = {
    token,
    values,
    set,
    tours,
    setTours,
    creds,
    refresh,
    bookingSiteUrl: session.booking_site_url || "",
    businessName: values.business_name || session.business_name || "your business",
    goNext: () => void goNext(),
  };

  const isFirst = index === 0;
  const isLast = index === STEPS.length - 1;
  const percent = Math.round((index / (STEPS.length - 1)) * 100);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:py-12">
      <div className="mb-6">
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="text-xs font-semibold uppercase tracking-widest text-accent">
            {step.chapter}
          </span>
          <span className="hint text-xs">
            Step {index + 1} of {STEPS.length}
          </span>
        </div>
        <div
          className="h-1.5 overflow-hidden rounded-full bg-line"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="How far through setup you are"
        >
          <div
            className="h-full rounded-full bg-accent transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      <div className="card">
        <h1
          ref={heading}
          tabIndex={-1}
          className="font-serif text-2xl outline-none sm:text-3xl"
        >
          {step.title}
        </h1>
        {step.intro && <p className="hint mt-2">{step.intro}</p>}

        <div className="mt-6">
          <Screen {...context} />
        </div>

        {validationError && (
          <p className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {validationError}
          </p>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-danger/10 px-4 py-3 text-sm text-danger" role="alert">
            {error} Nothing is lost. Try again in a moment.
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center gap-3">
        {!isFirst && (
          <button type="button" className="btn-ghost" onClick={() => move(index - 1)}>
            Back
          </button>
        )}

        <span className="hint ml-auto text-xs" aria-live="polite">
          {saveState === "saving" ? "Saving" : note || (saveState === "saved" ? "Saved" : "")}
        </span>

        {!isLast && step.id !== "welcome" && step.id !== "golive" && (
          <button type="button" className="btn-primary" onClick={() => void goNext()}>
            Next
          </button>
        )}
      </div>
    </div>
  );
}
