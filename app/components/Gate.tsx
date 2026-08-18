"use client";

import { useEffect, useState } from "react";
import { callWizard } from "../lib/api";
import Wizard from "./Wizard";

type Session = {
  valid?: boolean;
  business_name?: string;
  booking_site_url?: string;
  client_name?: string;
  wizard_step?: string;
  expires_at?: string;
};

export function DeadEnd({ reason }: { reason: string }) {
  return (
    <div className="mx-auto w-full max-w-lg px-4 py-16">
      <div className="card text-center">
        <h1 className="font-serif text-2xl">This link will not open</h1>
        <p className="hint mt-3">{reason}</p>
        <p className="hint mt-4">
          Please go back to whoever sent you this link and ask them for a fresh one. It only takes
          them a moment and nothing you have done is lost.
        </p>
      </div>
    </div>
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
      <p className="px-4 py-16 text-center text-muted" role="status">
        Opening your setup.
      </p>
    );
  }

  return <Wizard token={token} session={session} />;
}
