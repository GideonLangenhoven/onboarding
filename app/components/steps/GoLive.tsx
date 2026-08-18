"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { callWizard } from "../../lib/api";
import type { Readiness, StepContext } from "../../lib/onboarding";

const LABELS: Record<string, string> = {
  subscription: "Your account is active",
  policies: "Your cancellation policy is set",
  admin_email_sent: "Your dashboard login has been emailed to you",
  yoco: "Yoco is connected",
  webhook: "Payments confirm bookings automatically",
  whatsapp: "WhatsApp is connected",
  tours: "Your tours are loaded",
  slots: "Your departures are on the calendar",
  trading: "Your booking site is open for business",
};

export function GoLive({ token, goNext }: StepContext) {
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");

  const run = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const data = await callWizard<{ readiness: Readiness }>("go-live", token);
      setReadiness(data.readiness || {});
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }, [token]);

  useEffect(() => {
    // Arriving on this screen is what triggers go-live, so the call belongs here.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void run();
  }, [run]);

  const rows = Object.entries(LABELS).filter(([key]) => readiness && key in readiness);
  const outstanding = rows.filter(([key]) => !readiness?.[key]);

  return (
    <div className="space-y-5">
      {busy && !readiness && <p className="hint">Turning everything on, one moment.</p>}

      {error && (
        <div className="space-y-3">
          <p className="text-sm text-danger" role="alert">
            {error}
          </p>
          <button type="button" className="btn-ghost" onClick={() => void run()}>
            Try again
          </button>
        </div>
      )}

      {readiness && (
        <>
          <ul className="space-y-2">
            {rows.map(([key, label]) => {
              const done = Boolean(readiness[key]);
              return (
                <li key={key} className="flex items-start gap-3">
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? "bg-accent text-white" : "border border-line text-muted"
                    }`}
                  >
                    {done ? "y" : ""}
                  </span>
                  <span className={done ? "" : "text-muted"}>
                    {label}
                    <span className="sr-only">{done ? ", done" : ", still to come"}</span>
                  </span>
                </li>
              );
            })}
          </ul>

          {outstanding.length > 0 && (
            <p className="hint">
              The items without a tick are not in your hands and they do not stop you taking
              bookings. We finish them off from our side.
            </p>
          )}

          <div className="flex flex-wrap gap-3">
            <button type="button" className="btn-primary" onClick={goNext}>
              See my booking site
            </button>
            <button type="button" className="btn-ghost" onClick={() => void run()} disabled={busy}>
              {busy ? "Checking" : "Check again"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

type TestBooking = {
  id: string;
  ref_code: string;
  customer_name: string;
  total_amount: number;
  status: string;
  created_at: string;
};

export function Finish({ token, bookingSiteUrl, businessName, values }: StepContext) {
  const [booking, setBooking] = useState<TestBooking | null>(null);
  const [completed, setCompleted] = useState(false);
  const done = useRef(false);

  useEffect(() => {
    if (booking) return;
    let cancelled = false;

    const timer = setInterval(async () => {
      try {
        const data = await callWizard<{ found: boolean; booking: TestBooking | null }>(
          "check-test-booking",
          token,
        );
        if (!cancelled && data.found && data.booking) setBooking(data.booking);
      } catch {
        // Keep polling quietly. A blip here should not alarm anyone.
      }
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, booking]);

  useEffect(() => {
    if (!booking || done.current) return;
    done.current = true;
    callWizard("complete", token)
      .then(() => setCompleted(true))
      .catch(() => setCompleted(true)); // Already completed is still completed.
  }, [booking, token]);

  const currency = values.currency || "ZAR";

  return (
    <div className="space-y-6">
      <p>
        <strong>{businessName}</strong> is live. This is your booking site, and anyone in the world
        can use it right now.
      </p>

      {bookingSiteUrl ? (
        <a
          href={bookingSiteUrl}
          target="_blank"
          rel="noreferrer"
          className="btn-primary w-full text-center sm:w-auto"
        >
          Open my booking site
        </a>
      ) : (
        <p className="hint">Your booking site address is on its way to you by email.</p>
      )}

      {!booking ? (
        <div className="rounded-xl border border-line bg-white/70 p-5">
          <p className="font-semibold">Make a real booking now, while we are still on the call</p>
          <p className="hint mt-1">
            Book yourself onto one of your own tours and pay for it. It is the only way to know the
            whole thing works. We are watching for it and it shows up here the moment it lands.
          </p>
          <p className="hint mt-3" aria-live="polite">
            Waiting for your first booking.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-accent bg-accent/5 p-5" aria-live="polite">
          <p className="font-serif text-xl">Your first booking just came in.</p>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex gap-2">
              <dt className="text-muted">Reference</dt>
              <dd className="font-semibold">{booking.ref_code}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Guest</dt>
              <dd className="font-semibold">{booking.customer_name}</dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Amount</dt>
              <dd className="font-semibold">
                {currency} {Number(booking.total_amount).toFixed(2)}
              </dd>
            </div>
            <div className="flex gap-2">
              <dt className="text-muted">Status</dt>
              <dd className="font-semibold">{booking.status}</dd>
            </div>
          </dl>
          <p className="hint mt-4">
            That booking is in your dashboard, the guest has an email, and your calendar has one
            fewer seat. You are open. {completed ? "We have closed off your setup." : ""}
          </p>
        </div>
      )}
    </div>
  );
}
