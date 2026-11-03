"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { callWizard } from "../../lib/api";
import { countSlots, duration, money, type Readiness, type StepContext } from "../../lib/onboarding";
import { describeTier, readTiers } from "./Refunds";
import { readFaqs } from "./Faqs";

function Row({
  label,
  value,
  warn,
  onEdit,
}: {
  label: string;
  value: ReactNode;
  warn?: string;
  onEdit: () => void;
}) {
  return (
    <li className="flex items-start gap-4 py-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium uppercase tracking-wider text-muted">{label}</p>
        <div className="mt-0.5 text-sm">{value}</div>
        {warn && <p className="mt-1 text-[13px] text-warm">{warn}</p>}
      </div>
      <button type="button" className="shrink-0 text-sm font-medium text-accent hover:underline" onClick={onEdit}>
        Edit
      </button>
    </li>
  );
}

export function Review({ token, values, tours, creds, businessName, bookingSiteUrl, goTo, markLive }: StepContext) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const named = tours.filter((t) => t.name.trim());
  // Guests know where to go once there is a main meeting point, or every tour has its own.
  const everyTourMeets = named.length > 0 && named.every((t) => t.meeting_point.trim());
  const meetingSet = Boolean(values.meeting_point || values.meeting_point_address || values.directions) || everyTourMeets;
  const departures = named.reduce((sum, t) => sum + (t.slot_count || 0) + countSlots(t.ranges), 0);
  const faqs = readFaqs(values.faq_json).filter((f) => f.question.trim() && f.answer.trim());
  const hasLogo = /^(https?:|data:)/.test(values.logo_url || "");

  async function goLive() {
    setBusy(true);
    setError("");
    try {
      const data = await callWizard<{ readiness: Readiness }>("go-live", token);
      markLive(data.readiness || {});
    } catch (caught) {
      setError((caught as Error).message);
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <ul className="divide-y divide-line rounded-xl border border-line px-4">
        <Row
          label="Business"
          value={
            <>
              <strong>{businessName}</strong>
              {values.business_address ? ` · ${values.business_address}` : ""}
              <span className="block text-muted">Bookings go to {values.operator_email || "not set"}</span>
            </>
          }
          onEdit={() => goTo("business")}
        />
        <Row
          label="Brand"
          value={
            <span className="flex items-center gap-2">
              {[values.color_main, values.color_secondary, values.color_cta].filter(Boolean).map((c, i) => (
                <span key={i} className="h-4 w-4 rounded-full ring-1 ring-line" style={{ background: c }} />
              ))}
              <span className="truncate">{values.hero_title || businessName}</span>
            </span>
          }
          warn={hasLogo ? undefined : "No logo yet. Your first letter is used instead."}
          onEdit={() => goTo("look")}
        />
        <Row
          label="Meeting point"
          value={values.meeting_point || values.meeting_point_address || (everyTourMeets ? "Set on each tour" : <span className="text-muted">Not set</span>)}
          warn={meetingSet ? undefined : "Guests won't know where to go. Worth adding."}
          onEdit={() => goTo("meeting")}
        />
        <Row
          label="Cancellations"
          value={readTiers(values.refund_policy_tiers).map(describeTier).join(" · ")}
          onEdit={() => goTo("refunds")}
        />
        <Row
          label="Tours"
          value={
            named.length ? (
              <ul className="space-y-0.5">
                {named.map((t, i) => (
                  <li key={t.id || i}>
                    {t.name}{" "}
                    <span className="text-muted">
                      · {money(values.currency, t.base_price_per_person)} · {duration(t.duration_minutes)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-muted">None yet</span>
            )
          }
          warn={
            !named.length
              ? "Add a tour so guests have something to book."
              : departures === 0
                ? "No departures on the calendar, so nothing can be booked yet."
                : undefined
          }
          onEdit={() => goTo("tours")}
        />
        <Row
          label="AI assistant"
          value={`${faqs.length} answered question${faqs.length === 1 ? "" : "s"}`}
          onEdit={() => goTo("assistant")}
        />
        <Row
          label="WhatsApp"
          value={creds.wa_status === "connected" ? "Connected" : <span className="text-muted">Not connected</span>}
          warn={creds.wa_status === "connected" ? undefined : "Guests can't message you on WhatsApp yet. Connect it now, or your BookingTours contact helps you later."}
          onEdit={() => goTo("whatsapp")}
        />
      </ul>

      <div className="rounded-xl bg-accent p-5 text-white">
        <p className="text-sm text-white/75">Your booking site will be live at</p>
        <p className="mt-0.5 break-all font-mono text-[15px]">{bookingSiteUrl || "your BookingTours address"}</p>
        <button
          type="button"
          className="btn mt-4 w-full bg-white text-accent-dark hover:bg-mint sm:w-auto"
          onClick={() => void goLive()}
          disabled={busy || !named.length}
        >
          {busy ? "Switching everything on" : "Go live"}
        </button>
        {!named.length && <p className="mt-2 text-sm text-white/80">Add at least one tour first.</p>}
      </div>

      {error && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
          {error}
        </p>
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
};

function Todo({ done, title, children }: { done: boolean; title: string; children?: ReactNode }) {
  return (
    <li className="flex gap-3">
      <span
        className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
          done ? "bg-accent text-white" : "border-2 border-line-strong bg-white"
        }`}
        aria-hidden="true"
      >
        {done ? "✓" : ""}
      </span>
      <div className="min-w-0 flex-1">
        <p className={`font-medium ${done ? "text-muted line-through decoration-line-strong" : ""}`}>
          {title}
          <span className="sr-only">{done ? ", done" : ", to do"}</span>
        </p>
        {children && <div className="hint mt-0.5">{children}</div>}
      </div>
    </li>
  );
}

export function Finish({ token, bookingSiteUrl, adminUrl, businessName, values, creds, readiness }: StepContext) {
  const [booking, setBooking] = useState<TestBooking | null>(null);
  const [copied, setCopied] = useState(false);
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
    }, 6000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token, booking]);

  useEffect(() => {
    if (!booking || done.current) return;
    done.current = true;
    // Already completed is still completed.
    callWizard("complete", token).catch(() => {});
  }, [booking, token]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(bookingSiteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the address is on screen to select by hand.
    }
  }

  const email = values.operator_email;
  const yocoDone = Boolean(readiness?.yoco ?? creds.yoco_configured);
  const waConnected = (readiness?.whatsapp ?? creds.wa_status) === "connected";

  return (
    <div className="space-y-7">
      <p className="text-[17px]">
        <strong>{businessName}</strong> is open for bookings. Here&apos;s everything you need.
      </p>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col rounded-xl border border-line p-5">
          <p className="eyebrow">Your booking site</p>
          <p className="mt-2 break-all font-mono text-sm">{bookingSiteUrl.replace(/^https?:\/\//, "") || "Coming by email"}</p>
          <p className="hint mt-1 flex-1">Share this link anywhere guests find you.</p>
          {bookingSiteUrl && (
            <div className="mt-4 flex gap-2">
              <a href={bookingSiteUrl} target="_blank" rel="noreferrer" className="btn-ghost flex-1">
                Open
              </a>
              <button type="button" className="btn-ghost flex-1" onClick={() => void copy()}>
                {copied ? "Copied" : "Copy link"}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-col rounded-xl border border-accent/30 bg-mint/40 p-5">
          <p className="eyebrow">Your dashboard</p>
          <p className="mt-2 break-all font-mono text-sm">{adminUrl.replace(/^https?:\/\//, "")}</p>
          <p className="hint mt-1 flex-1">
            Bookings, calendar, payments and settings. Sign in with {email || "your email"}.
          </p>
          <a href={adminUrl} target="_blank" rel="noreferrer" className="btn-primary mt-4">
            Open my dashboard
          </a>
        </div>
      </div>

      <div>
        <p className="field mb-3">Three things to finish today</p>
        <ol className="space-y-4">
          <Todo done={false} title="Set your dashboard password">
            {readiness?.admin_email_sent
              ? `We've just emailed ${email || "you"} a link. It works for 48 hours.`
              : `Check ${email || "your inbox"} for your password link. Can't find it? Ask your BookingTours contact to resend it.`}
          </Todo>
          <Todo done={yocoDone} title="Connect Yoco to get paid">
            {yocoDone ? (
              "Payments go straight to your Yoco account."
            ) : (
              <>
                In your dashboard, open{" "}
                <a className="font-medium text-accent hover:underline" href={`${adminUrl}/settings`} target="_blank" rel="noreferrer">
                  Settings
                </a>{" "}
                and paste your Yoco secret key. Find it in Yoco under Sell online, then Payment gateway.
              </>
            )}
          </Todo>
          <Todo done={Boolean(booking)} title="Make a test booking">
            {booking ? (
              <>
                It worked. {booking.ref_code} for {booking.customer_name},{" "}
                {money(values.currency, booking.total_amount) || booking.total_amount}. You&apos;re in business.
              </>
            ) : (
              <>
                Book yourself onto one of your tours and pay. It&apos;s the only way to know the whole thing
                works.{" "}
                <span className="inline-flex items-center gap-1.5 text-accent" aria-live="polite">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> Watching for it
                </span>
              </>
            )}
          </Todo>
        </ol>
      </div>

      <p className="rounded-lg bg-bg px-4 py-3 text-sm text-muted">
        {waConnected
          ? "WhatsApp is connected. Your assistant answers guests there too."
          : "WhatsApp isn't connected yet. Your BookingTours contact will connect it with you. There is nothing else to do today."}
      </p>
    </div>
  );
}
