"use client";

import { useEffect, useRef, useState } from "react";
import { TextArea, TextField } from "../Field";
import { callWizard } from "../../lib/api";
import type { StepContext } from "../../lib/onboarding";

/** Must match GRAPH_VERSION in the onboarding-wizard edge function. */
const GRAPH_VERSION = "v25.0";
/** Where Meta's Embedded Signup window posts its progress from: any https facebook.com host, as Meta's own sample checks. */
const META_ORIGIN = /^https:\/\/([a-z0-9-]+\.)*facebook\.com$/;
/** BookingTours' Meta business, which an operator shares their WhatsApp account with by hand. */
const PARTNER_BUSINESS_ID = "2304217393358934";

type Phone = {
  phone_number_id: string;
  display_phone_number: string | null;
  verified_name: string | null;
  status: string | null;
};

type LoginResponse = { authResponse?: { code?: string } | null };

type MetaSdk = {
  init: (options: Record<string, unknown>) => void;
  login: (callback: (response: LoginResponse) => void, options: Record<string, unknown>) => void;
};

declare global {
  interface Window {
    FB?: MetaSdk;
    fbAsyncInit?: () => void;
  }
}

let sdk: Promise<MetaSdk> | null = null;

/** Meta's sign-in script, loaded once and ahead of the click: the popup has to open from the click itself. */
function loadSdk(appId: string) {
  if (!sdk) {
    sdk = new Promise((resolve, reject) => {
      if (window.FB) {
        resolve(window.FB);
        return;
      }
      window.fbAsyncInit = () => {
        window.FB?.init({ appId, version: GRAPH_VERSION, cookie: false, xfbml: false, autoLogAppEvents: false });
        if (window.FB) resolve(window.FB);
      };
      const script = document.createElement("script");
      script.src = "https://connect.facebook.net/en_US/sdk.js";
      script.async = true;
      script.crossOrigin = "anonymous";
      script.onerror = () => {
        sdk = null;
        reject(new Error("Meta's sign-in script could not load. If you use an ad blocker, pause it for this page and reload."));
      };
      document.body.appendChild(script);
    });
  }
  return sdk;
}

function Steps({ items }: { items: string[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((text, i) => (
        <li key={text} className="flex gap-3 text-sm">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-mint text-xs font-semibold text-accent-dark">
            {i + 1}
          </span>
          <span className="pt-0.5">{text}</span>
        </li>
      ))}
    </ol>
  );
}

const WHERE = [
  {
    value: true,
    name: "Yes, in the WhatsApp Business app",
    detail: "Your chats and contacts stay on your phone. Needs app version 2.24.17 or newer.",
  },
  {
    value: false,
    name: "No, it's new or not on WhatsApp",
    detail: "Meta checks it with an SMS or a phone call.",
  },
];

export function WhatsApp({ token, creds, businessName, refresh }: StepContext) {
  const signup = creds.wa_signup || null;
  const [phone, setPhone] = useState<Phone | null>(null);
  const [reconnect, setReconnect] = useState(false);
  const [onBusinessApp, setOnBusinessApp] = useState<boolean | null>(null);
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState<"" | "meta" | "saving">("");
  const [message, setMessage] = useState("");
  const [sdkReady, setSdkReady] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualPhoneId, setManualPhoneId] = useState("");
  /** Ids Meta's window reports on Finish, picked up before the login callback fires. */
  const reported = useRef<{ phone_number_id?: string; waba_id?: string }>({});

  useEffect(() => {
    if (!signup) return;
    let cancelled = false;
    loadSdk(signup.app_id)
      .then(() => {
        if (!cancelled) setSdkReady(true);
      })
      .catch((caught) => {
        if (!cancelled) setMessage((caught as Error).message);
      });
    return () => {
      cancelled = true;
    };
  }, [signup]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (!META_ORIGIN.test(event.origin)) return;
      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data;
        if (data?.type !== "WA_EMBEDDED_SIGNUP") return;
        if (String(data.event || "").startsWith("FINISH")) {
          reported.current = { phone_number_id: data.data?.phone_number_id, waba_id: data.data?.waba_id };
        } else if (data.event === "ERROR" && data.data?.error_message) {
          setMessage(String(data.data.error_message));
        }
      } catch {
        // Not one of Meta's signup messages.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  async function connect(payload: Record<string, unknown>) {
    setBusy("saving");
    setMessage("");
    try {
      const data = await callWizard<{ phone: Phone }>("wa-connect", token, payload);
      setPhone(data.phone);
      setReconnect(false);
      await refresh();
    } catch (caught) {
      setMessage((caught as Error).message);
    } finally {
      setBusy("");
    }
  }

  function openMeta() {
    if (!signup || !window.FB) return;
    if (onBusinessApp === null) {
      setMessage("First tell us whether the number is already in the WhatsApp Business app.");
      return;
    }
    if (!onBusinessApp && !/^\d{6}$/.test(pin)) {
      setMessage("Choose a 6-digit PIN first.");
      return;
    }
    setMessage("");
    setBusy("meta");
    reported.current = {};
    window.FB.login(
      (response) => {
        const code = response?.authResponse?.code;
        if (!code) {
          setBusy("");
          setMessage("Meta's window closed before the number was connected. Nothing has changed. Try again whenever you're ready.");
          return;
        }
        void connect({ code, on_business_app: onBusinessApp, ...(onBusinessApp ? {} : { pin }), ...reported.current });
      },
      {
        config_id: signup.config_id,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: { business: { name: businessName }, phone: { displayName: businessName } },
          featureType: onBusinessApp ? "whatsapp_business_app_onboarding" : "",
          sessionInfoVersion: "3",
        },
      },
    );
  }

  if (creds.wa_status === "connected" && !reconnect) {
    const live = !phone?.status || phone.status === "CONNECTED";
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-accent/30 bg-mint/40 p-5">
          <p className="font-semibold">WhatsApp is connected</p>
          <p className="hint mt-1">
            {phone?.display_phone_number
              ? `${phone.display_phone_number}${phone.verified_name ? `, shown to guests as ${phone.verified_name}` : ""}. `
              : ""}
            Guests who message this number get your assistant&apos;s reply.
          </p>
          {!live && (
            <p className="mt-2 text-[13px] text-warm">
              WhatsApp still lists this number as {String(phone?.status).toLowerCase()}. Your BookingTours contact will
              check it before you go live.
            </p>
          )}
        </div>
        <button type="button" className="btn-small" onClick={() => setReconnect(true)}>
          Connect a different number
        </button>
      </div>
    );
  }

  const waiting = busy === "meta" ? "Finish in Meta's window" : busy === "saving" ? "Connecting your number" : "";

  return (
    <div className="space-y-7">
      {signup ? (
        <>
          <div className="panel">
            <p className="field">Before you start, have these ready</p>
            <Steps
              items={[
                "The phone with your business number in it. Meta sends it a code.",
                "The Facebook login you use for your business page. No page yet? Meta creates one for you along the way.",
                "If the number is not on WhatsApp yet: a 6-digit PIN you will remember. WhatsApp uses it to protect your number.",
              ]}
            />
          </div>

          <div>
            <p className="field">Is this number already on WhatsApp on that phone?</p>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Where the number is now">
              {WHERE.map((option) => {
                const on = onBusinessApp === option.value;
                return (
                  <button
                    key={option.name}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setOnBusinessApp(option.value)}
                    className={`rounded-xl border p-3.5 text-left transition ${
                      on ? "border-accent bg-mint/40 ring-1 ring-accent" : "border-line hover:border-line-strong"
                    }`}
                  >
                    <span className="block text-sm font-semibold">{option.name}</span>
                    <span className="hint text-[13px]">{option.detail}</span>
                  </button>
                );
              })}
            </div>
            <p className="hint mt-2">
              On the regular WhatsApp app instead? Install the free WhatsApp Business app first. It moves your number
              and chats across. Then pick the first option.
            </p>
          </div>

          {onBusinessApp === false && (
          <TextField
            id="wa_pin"
            label="Your 6-digit WhatsApp PIN"
            hint="Pick six digits and write them down. If this number already has a two-step verification PIN in WhatsApp, enter that one instead. You get ten tries in three days, so check it before you continue."
            inputMode="numeric"
            autoComplete="off"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
          />
          )}

          <div>
            <button type="button" className="btn-primary" onClick={openMeta} disabled={Boolean(busy) || !sdkReady}>
              {waiting || (sdkReady ? "Connect with Facebook" : "Loading Meta sign-in")}
            </button>
            <p className="hint mt-2">Opens Meta&apos;s window. Your Facebook password stays with Meta; we never see it.</p>
          </div>

          <div className="panel">
            <p className="field">What happens in Meta&apos;s window</p>
            <Steps
              items={
                onBusinessApp
                  ? [
                      "Log in to Facebook.",
                      "Choose your business, or create one with your business name.",
                      "Choose to connect your existing WhatsApp Business app account and enter your number. Meta shows you a code.",
                      "On your phone, open the message from Facebook in WhatsApp Business, tap Connect, then Connect to the Business Platform, and choose whether to share your chat history.",
                      "Back in Meta's window, enter the code and press Finish. We take it from there and tell you here when the number is live.",
                    ]
                  : [
                      "Log in to Facebook.",
                      "Choose your business, or create one with your business name.",
                      `Create your WhatsApp Business account. The display name is what guests see at the top of the chat, so use ${businessName}.`,
                      "Add your number and type in the code Meta sends you.",
                      "Press Finish. We take it from there and tell you here when the number is live.",
                    ]
              }
            />
          </div>
        </>
      ) : (
        <div className="panel">
          <p className="text-sm">
            Connecting through Facebook isn&apos;t switched on for this page yet. Your BookingTours contact connects your
            number with you on the call. If they have sent you an access token, enter it below.
          </p>
        </div>
      )}

      {message && (
        <p className="rounded-lg border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger" role="alert">
          {message}
        </p>
      )}

      <details className="group rounded-xl border border-line" open={!signup}>
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span className="font-medium">Have an access token from your BookingTours contact? Enter the details by hand</span>
          <span className="ml-3 text-muted transition group-open:rotate-180" aria-hidden="true">
            ⌄
          </span>
        </summary>
        <div className="space-y-5 border-t border-line p-4">
          <Steps
            items={[
              `Share your WhatsApp account with BookingTours. In business.facebook.com open Settings, then Business settings. Under Users choose Partners, press Add and pick "Give a partner access to your assets". Enter partner business ID ${PARTNER_BUSINESS_ID} (it shows as CapeWeb), tick your WhatsApp account, switch on Full control and save.`,
              "Tell your BookingTours contact. They create the access token for you and send it to you securely.",
              'Find your Phone Number ID. In business.facebook.com open WhatsApp Manager, then Phone numbers, and click your number. Copy "Phone number ID". It is a long number, not your phone number.',
              "Paste both below. We check them with Meta before saving.",
            ]}
          />
          <TextArea
            id="wa_token"
            label="Access token"
            rows={3}
            autoComplete="off"
            spellCheck={false}
            value={manualToken}
            onChange={(e) => setManualToken(e.target.value)}
          />
          <TextField
            id="wa_phone_id"
            label="Phone Number ID"
            hint="Digits only, for example 123456789012345."
            inputMode="numeric"
            autoComplete="off"
            value={manualPhoneId}
            onChange={(e) => setManualPhoneId(e.target.value)}
          />
          <button
            type="button"
            className="btn-ghost"
            disabled={Boolean(busy) || !manualToken.trim() || !manualPhoneId.trim()}
            onClick={() => void connect({ wa_token: manualToken.trim(), wa_phone_id: manualPhoneId.trim() })}
          >
            {busy === "saving" ? "Checking with Meta" : "Save and check with Meta"}
          </button>
        </div>
      </details>
    </div>
  );
}
