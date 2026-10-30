"use client";

import { useEffect, useState, type ReactNode } from "react";
import { callWizard } from "../lib/api";
import { adminUrlFor } from "../lib/onboarding";
import Mark from "./Mark";
import Wizard from "./Wizard";

type Session = {
  valid?: boolean;
  business_name?: string;
  booking_site_url?: string;
  client_name?: string;
  wizard_step?: string;
  expires_at?: string;
};

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 flex items-center gap-2.5">
        <Mark />
        <span className="font-semibold">Booking·Tours</span>
      </div>
      <div className="card fade-in w-full max-w-md">{children}</div>
      <p className="mt-6 text-center text-sm text-muted">
        Already set up?{" "}
        <a className="font-medium text-accent underline-offset-4 hover:underline" href={adminUrlFor()}>
          Sign in to your dashboard
        </a>
      </p>
    </div>
  );
}

/** Accepts a full invite link or a bare code, and opens it. */
function OpenLink({ cta = "Open my setup" }: { cta?: string }) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState("");

  return (
    <form
      className="mt-6 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        const code = raw.match(UUID_RE)?.[0];
        if (!code) {
          setError("That does not look like a setup link. Paste the whole link from your email.");
          return;
        }
        window.location.assign(`/?token=${code}`);
      }}
    >
      <label className="field" htmlFor="invite">
        Your setup link
      </label>
      <input
        id="invite"
        className="input font-mono text-sm"
        placeholder="https://onboarding.bookingtours.co.za?token=..."
        value={raw}
        onChange={(e) => {
          setRaw(e.target.value);
          setError("");
        }}
        autoComplete="off"
        spellCheck={false}
      />
      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={!raw.trim()}>
        {cta}
      </button>
    </form>
  );
}

/** The bare address, with no token. */
export function Landing() {
  return (
    <Shell>
      <p className="eyebrow">Get set up</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        Your booking site, live in about fifteen minutes
      </h1>
      <p className="hint mt-2">
        Open the setup link we emailed you, or paste it below. Your answers save as you go, so you
        can stop and come back any time.
      </p>
      <OpenLink />
    </Shell>
  );
}

export function DeadEnd({ reason }: { reason: string }) {
  return (
    <Shell>
      <p className="eyebrow text-warm">Link not working</p>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight">
        This setup link has expired or was already used
      </h1>
      <p className="hint mt-2">{reason}</p>
      <p className="hint mt-3">
        Nothing you have filled in is lost: a new link carries on where you left off. Finished setup
        already? Sign in to your dashboard below.
      </p>
      <OpenLink cta="Try a different link" />
    </Shell>
  );
}

export default function Gate({ token }: { token: string }) {
  const [session, setSession] = useState<Session | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    let cancelled = false;
    // One attempt only. A bad token never becomes a good one by asking again.
    callWizard<Session>("validate", token)
      .then((data) => {
        if (cancelled) return;
        if (data.valid === false) setReason("This setup link is no longer active.");
        else setSession(data);
      })
      .catch((caught: Error) => {
        if (!cancelled) setReason(caught.message);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (reason) return <DeadEnd reason={reason} />;

  if (!session) {
    return (
      <div className="flex min-h-dvh items-center justify-center" role="status">
        <div className="flex items-center gap-3 text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          Opening your setup
        </div>
      </div>
    );
  }

  return <Wizard token={token} session={session} />;
}
