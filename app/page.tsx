"use client";

import { useState } from "react";
import type { FormState, SubmitResult } from "./components/onboarding/types";
import { INITIAL_STATE } from "./components/onboarding/constants";
import { OnboardingForm } from "./components/onboarding/OnboardingForm";

const FEATURES = [
  { img: "booking-website.png", title: "Your Booking Website", bullets: ["Custom branding & colors", "Live tour availability", "Secure Yoco checkout, promo codes & gift vouchers"] },
  { img: "ai-chat.png", title: "AI Virtual Host", bullets: ["24/7 chat on your website & WhatsApp", "Trained on your FAQs & tour info", "Guides customers through booking"] },
  { img: "admin-dashboard.png", title: "Admin Dashboard", bullets: ["Daily manifest & check-ins", "Revenue tracking at a glance", "Live weather monitoring"] },
  { img: "automation.png", title: "Smart Automation", bullets: ["Day-before reminders via WhatsApp", "Post-trip review requests", "Waiver & payment alerts"] },
  { img: "marketing.png", title: "Marketing Engine", bullets: ["Drag-and-drop email builder", "Promo codes & audience segmentation", "Automated drip campaigns"] },
  { img: "reports.png", title: "Reports & Insights", bullets: ["Revenue & attendance reports", "Marketing attribution", "CSV export for accounting"] },
];

const VIDEOS = [
  { thumb: "video-thumb-getting-started.png", title: "Getting Started", desc: "Log in, explore the dashboard, and configure your settings." },
  { thumb: "video-thumb-first-booking.png", title: "Making Your First Booking", desc: "Create a booking, send a payment link, and see the confirmation." },
  { thumb: "video-thumb-managing-day.png", title: "Managing Your Day", desc: "Check in guests, handle weather, and reply to customers." },
];

const STEPS = [
  { title: "Fill out this form", desc: "Tell us about your business, tours, and branding." },
  { title: "We set everything up", desc: "Your booking site, dashboard, and AI assistant are created instantly." },
  { title: "Connect your payments", desc: "Link Yoco for card payments — we'll walk you through it." },
  { title: "Go live", desc: "Share your booking link and start accepting guests." },
];

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitResult(null);
    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as SubmitResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Failed to submit.");
      setSubmitResult(payload);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Something went wrong.");
    }
    setSubmitting(false);
  }

  if (submitResult) {
    return (
      <main>
        <div className="bt-hero" style={{ padding: "3rem 0" }}>
          <div className="bt-hero-inner">
            <div className="bt-logo">BookingTours</div>
            <h1>Welcome aboard, {submitResult.businessName}!</h1>
            <p className="bt-subtitle">Your business is set up and ready to accept bookings.</p>
          </div>
        </div>
        <div className="shell" style={{ padding: "3rem 0 5rem" }}>
          <div className="success-panel">
            <div className="success-grid">
              <div className="success-card"><strong>{submitResult.businessName}</strong><span>Business Created</span></div>
              <div className="success-card"><strong>{submitResult.toursCreated}</strong><span>Tours Configured</span></div>
              <div className="success-card"><strong>{submitResult.slotsCreated}</strong><span>Booking Slots Active</span></div>
              <div className="success-card"><strong>Ready</strong><span>Admin Dashboard</span></div>
            </div>

            <h2 style={{ fontFamily: "var(--font-serif), serif", color: "var(--green)", margin: "2rem 0 1rem", fontSize: "1.6rem" }}>What&apos;s Next</h2>
            <div style={{ textAlign: "left", maxWidth: "600px", margin: "0 auto" }}>
              {[
                "Log in to your admin dashboard using your chosen email and password.",
                "Verify your tour schedules and pricing in Settings → Tours.",
                "Connect your Yoco payment account in Settings → Credentials.",
                "Set up your WhatsApp business number for automated messaging.",
                "Share your booking link with customers and on social media.",
                "Make a test booking to see the full customer experience.",
              ].map((step, i) => (
                <div key={i} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-start", padding: "0.6rem 0", borderBottom: i < 5 ? "1px solid var(--line)" : "none" }}>
                  <span style={{ flexShrink: 0, width: 28, height: 28, borderRadius: "50%", background: "var(--green)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ color: "var(--muted)", fontSize: "0.92rem", lineHeight: 1.55 }}>{step}</span>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem" }}>
              <a href="/BookingTours-Getting-Started.md" download className="bt-download">
                📄 Download Getting Started Guide
              </a>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main>
      {/* ═══ Hero ═══ */}
      <div className="bt-hero">
        <div className="bt-hero-inner">
          <div className="bt-logo">BookingTours</div>
          <h1>Your adventure business, online in minutes</h1>
          <p className="bt-subtitle">One form. Everything set up. Start accepting bookings today.</p>
          <a href="#features" className="bt-scroll">See what you get ↓</a>
        </div>
      </div>

      {/* ═══ Feature Showcase ═══ */}
      <section id="features" className="bt-section">
        <div className="shell">
          <div className="bt-section-header">
            <h2>Everything you need to run your business</h2>
            <p>A complete platform built specifically for adventure and tourism operators.</p>
          </div>
          <div className="bt-features">
            {FEATURES.map((f) => (
              <div key={f.title} className="bt-feature-card">
                <img src={`/showcase/${f.img}`} alt={f.title} className="bt-feature-img" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <div className="bt-feature-body">
                  <h3>{f.title}</h3>
                  <ul>{f.bullets.map((b) => <li key={b}>{b}</li>)}</ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ Video Walkthroughs ═══ */}
      <section className="bt-section bt-videos">
        <div className="shell">
          <div className="bt-section-header">
            <h2>See BookingTours in action</h2>
            <p>Short walkthroughs showing exactly how it works.</p>
          </div>
          <div className="bt-video-grid">
            {VIDEOS.map((v) => (
              <div key={v.title} className="bt-video-card">
                <div className="bt-video-thumb">
                  <img src={`/showcase/${v.thumb}`} alt={v.title} onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                  <div className="bt-play-btn" />
                </div>
                <div className="bt-video-body">
                  <h3>{v.title}</h3>
                  <p>{v.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ How It Works ═══ */}
      <section className="bt-section">
        <div className="shell">
          <div className="bt-section-header">
            <h2>How it works</h2>
            <p>From sign-up to your first booking in four simple steps.</p>
          </div>
          <div className="bt-steps">
            {STEPS.map((s) => (
              <div key={s.title} className="bt-step">
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: "center", marginTop: "2.5rem" }}>
            <a href="/BookingTours-Getting-Started.md" download className="bt-download">
              📄 Download the full Getting Started Guide
            </a>
          </div>
        </div>
      </section>

      {/* ═══ Onboarding Form ═══ */}
      <section id="onboarding" className="bt-section" style={{ background: "var(--green-light)" }}>
        <div className="shell">
          <div className="bt-section-header">
            <h2>Let&apos;s set up your business</h2>
            <p>Fill in the details below and we&apos;ll create your booking website, admin dashboard, and AI assistant automatically.</p>
          </div>
          <OnboardingForm
            form={form}
            setForm={setForm}
            submitting={submitting}
            submitError={submitError}
            onSubmit={handleSubmit}
          />
        </div>
      </section>
    </main>
  );
}
