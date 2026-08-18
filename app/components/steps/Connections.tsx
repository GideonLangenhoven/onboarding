"use client";

import { useState } from "react";
import { callWizard } from "../../lib/api";
import type { StepContext } from "../../lib/onboarding";

export function WhatsApp({ creds, refresh }: StepContext) {
  const connected = creds.wa_status === "connected";

  return (
    <div className="space-y-5">
      <div
        className={`rounded-xl border p-5 ${
          connected ? "border-accent bg-accent/5" : "border-line bg-white/70"
        }`}
      >
        <p className="font-semibold">
          {connected ? "WhatsApp is connected" : "WhatsApp is being set up"}
        </p>
        <p className="hint mt-1">
          {connected
            ? "Guests can message you on WhatsApp and your assistant will answer."
            : "There is nothing for you to do here. We connect your WhatsApp number for you behind the scenes, and it usually lands within a day or two of going live."}
        </p>
      </div>

      <p className="hint">
        We will never ask you for a WhatsApp password or access token. If anyone does, it is not us.
      </p>

      <button type="button" className="btn-small" onClick={() => void refresh()}>
        Check again
      </button>
    </div>
  );
}

export function Yoco({ token, creds, refresh }: StepContext) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  async function submit() {
    if (!key.trim()) return;
    setBusy(true);
    setError("");
    setNote("");
    try {
      const data = await callWizard<{ webhook: string; note?: string }>(
        "save-credentials",
        token,
        { yoco_secret_key: key.trim() },
      );
      setKey("");
      setNote(
        data.webhook === "registered"
          ? "Your Yoco account is connected and ready to take payments."
          : data.note ||
              "Your key is saved. We are still finishing the last bit of the connection, and it does not hold you up.",
      );
      await refresh();
    } catch (caught) {
      setError((caught as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (creds.yoco_configured && !note) {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent bg-accent/5 p-5">
          <p className="font-semibold">Your Yoco account is connected</p>
          <p className="hint mt-1">
            Payments will come straight into your Yoco account.{" "}
            {creds.yoco_webhook_status === "registered"
              ? "Bookings confirm the moment a guest pays."
              : "We are still finishing the last bit of the connection."}
          </p>
        </div>
        <button type="button" className="btn-small" onClick={() => setNote(" ")}>
          Use a different key
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <p className="hint">
        Sign in to Yoco, go to Sell online, then Payment gateway, and copy your secret key. It starts
        with sk. We store it encrypted and it is never shown again.
      </p>

      <div>
        <label className="field" htmlFor="yoco_secret_key">
          Yoco secret key
        </label>
        <input
          id="yoco_secret_key"
          className="input font-mono"
          type="password"
          autoComplete="off"
          spellCheck={false}
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="sk_live_..."
        />
      </div>

      {error && (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      )}
      {note.trim() && <p className="hint">{note}</p>}

      <button type="button" className="btn-primary" onClick={() => void submit()} disabled={busy || !key.trim()}>
        {busy ? "Connecting" : "Connect Yoco"}
      </button>
    </div>
  );
}
