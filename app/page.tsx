"use client";

import { useState } from "react";
import type { FormState, SubmitResult } from "./components/onboarding/types";
import { INITIAL_STATE } from "./components/onboarding/constants";
import { OnboardingForm } from "./components/onboarding/OnboardingForm";
import { LiquidGradient } from "./components/LiquidGradient";
import { BrandMarkIvory } from "./components/BrandLogo";

const FEATURES = [
  {
    img: "storefront.png",
    title: "Branded Booking Website",
    bullets: [
      "Your own .co.za domain with custom colours, logo & hero",
      "Guests see real-time availability and book in under 60 seconds",
      "Yoco card payments, promo codes & gift vouchers built in",
    ],
  },
  {
    img: ["chat1.png", "chat2.png"],
    title: "WhatsApp & Web AI Chatbot",
    bullets: [
      "Answers guest questions 24/7 on your site and WhatsApp",
      "Trained on your tours, FAQs, safety info & SOPs",
      "Handles bookings, directions, and upsells while you sleep",
    ],
  },
  {
    img: "bookings.png",
    title: "Operations Command Centre",
    bullets: [
      "Daily manifest with one-tap check-ins and walk-in bookings",
      "Revenue, pax & payment status across every slot",
      "Filter by pending, paid, confirmed or cancelled in one click",
    ],
  },
  {
    img: "Slotmanagement.png",
    title: "Visual Slot Management",
    bullets: [
      "Weekly calendar view of every tour and departure",
      "Add, cancel or reopen days and slots in seconds",
      "See live capacity — never overbook again",
    ],
  },
  {
    img: "Marketing.png",
    title: "Marketing & Broadcasts",
    bullets: [
      "Email campaigns with open-rate and click tracking",
      "Audience segmentation and automated drip sequences",
      "Promo codes and loyalty discounts that apply automatically",
    ],
  },
  {
    img: "Reports.png",
    title: "Revenue & Occupancy Insights",
    bullets: [
      "Filter by tour, date range, or status — see revenue instantly",
      "Visual pax breakdown by activity to spot your best sellers",
      "Export to CSV or PDF for your accountant in one click",
    ],
  },
];

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [slide, setSlide] = useState(0); // 0=hero, 1=features, 2=form wizard
  const [slideAnim, setSlideAnim] = useState("");

  function goSlide(next: number) {
    const dir = next > slide ? "slide-out-left" : "slide-out-right";
    setSlideAnim(dir);
    setTimeout(() => {
      setSlide(next);
      setSlideAnim("slide-in");
    }, 300);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitResult(null);
    if (form.business.adminPassword !== form.business.confirmPassword) {
      setSubmitError("Passwords do not match. Please re-enter your password.");
      setSubmitting(false);
      return;
    }
    const honeypot = (event.target as HTMLFormElement).querySelector('input[name="website_url"]') as HTMLInputElement | null;
    if (honeypot?.value) {
      setSubmitting(false);
      return;
    }
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as SubmitResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to submit.");
      setSubmitResult(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    }
    setSubmitting(false);
  }

  if (submitResult) {
    const adminUrl = submitResult.adminLoginUrl || process.env.NEXT_PUBLIC_ADMIN_URL || "";
    const bookingUrl = submitResult.tenantSlug ? `https://${submitResult.tenantSlug}.bookingtours.co.za` : "";
    return (
      <main className="fullscreen-slide">
        <div className="slide-center">
          <div className="bt-brand">
            <BrandMarkIvory size={30} />
            <span className="bt-brand-name">BookingTours</span>
          </div>
          <h1 style={{ fontSize: "2.4rem", margin: "1rem 0 0.5rem" }}>Welcome aboard, {submitResult.businessName}!</h1>
          <p className="bt-subtitle">Your business is set up and ready to accept bookings.</p>

          {/* Prominent admin login CTA — users need a one-click path to their dashboard */}
          {adminUrl && (
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.75rem", marginTop: "1.5rem" }}>
              <a
                href={adminUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="wizard-btn next"
                style={{ fontSize: "1.05rem", padding: "1rem 2.25rem" }}
              >
                Log in to admin dashboard →
              </a>
              {bookingUrl && (
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="wizard-btn"
                  style={{ fontSize: "1.05rem", padding: "1rem 2.25rem", background: "transparent", border: "1px solid var(--green)", color: "var(--green)" }}
                >
                  View my booking page
                </a>
              )}
            </div>
          )}

          {submitResult.welcomeEmailSent === false && (
            <p style={{ color: "#b45309", fontSize: "0.85rem", marginTop: "0.75rem" }}>
              Heads up: we couldn&apos;t send your welcome email. Bookmark the dashboard link above — your login is the email &amp; password you just set.
            </p>
          )}

          <div className="success-panel" style={{ marginTop: "2rem" }}>
            <div className="success-grid">
              <div className="success-card"><strong>{submitResult.businessName}</strong><span>Business Created</span></div>
              <div className="success-card"><strong>{submitResult.toursCreated}</strong><span>Tours Configured</span></div>
              <div className="success-card"><strong>{submitResult.slotsCreated}</strong><span>Booking Slots Active</span></div>
              <div className="success-card"><strong>Ready</strong><span>Admin Dashboard</span></div>
            </div>
            <h2 style={{ fontFamily: "var(--font-serif), serif", color: "var(--green)", margin: "2rem 0 1rem", fontSize: "1.4rem" }}>What&apos;s Next</h2>
            <div style={{ textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
              {[
                "Log in to your admin dashboard using your chosen email and password.",
                "Verify your tour schedules and pricing in Settings \u2192 Tours.",
                "Connect your Yoco payment account in Settings \u2192 Credentials.",
                "Set up your WhatsApp business number for automated messaging.",
                "Share your booking link with customers and on social media.",
                "Make a test booking to see the full customer experience.",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.5rem 0", borderBottom: i < 5 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ flexShrink: 0, width: 26, height: 26, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.88rem", lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="fullscreen-app">
      <div className={`fullscreen-slide ${slideAnim}`}>

        {/* ═══ Slide 0: Hero ═══ */}
        {slide === 0 && (
          <div className="slide-center" style={{ position: "relative", overflow: "hidden" }}>
            <LiquidGradient />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div className="bt-brand">
                <BrandMarkIvory size={36} />
                <span className="bt-brand-name">BookingTours</span>
              </div>
              <h1 className="hero-title">Built for guides.<br /><em>Loved by guests.</em></h1>
              <button type="button" className="wizard-btn next" style={{ marginTop: "2rem", fontSize: "1.1rem", padding: "1rem 2.5rem" }} onClick={() => goSlide(1)}>
                Get Started →
              </button>
            </div>
          </div>
        )}

        {/* ═══ Slide 1: Form Wizard ═══ */}
        {slide === 1 && (
          <div className="slide-scroll">
            <OnboardingForm
              form={form}
              setForm={setForm}
              submitting={submitting}
              submitError={submitError}
              onSubmit={handleSubmit}
              onBack={() => goSlide(0)}
            />
          </div>
        )}

      </div>
    </main>
  );
}
