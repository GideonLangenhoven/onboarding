"use client";

import type { FormState } from "./types";
import { countCompleted } from "./utils";
import { PLAN_OPTIONS } from "./constants";

export function HeroPanel({ form }: { form: FormState }) {
  const completedCount = countCompleted(form);
  const plan = PLAN_OPTIONS.find((item) => item.id === form.billing.planId);

  return (
    <section className="hero-panel">
      <div className="hero-copy">
        <p className="eyebrow">BookingTours onboarding</p>
        <h1>Set up your adventure centre in minutes.</h1>
        <p className="lede">
          Welcome! This isn't just a sign-up form—it's the first step in building your modern digital business.
          Tell us about your activities and branding below, and we'll instantly prepare your dashboard,
          booking site, and guest communication systems.
        </p>
        <div className="hero-metrics">
          <div className="metric-card">
            <span className="metric-value">Instant Setup</span>
            <span className="metric-label">We build your booking site and dashboard while you type.</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Guest-Centric</span>
            <span className="metric-label">A 24/7 AI host helping your clients book the perfect tour.</span>
          </div>
          <div className="metric-card">
            <span className="metric-value">Tour Ready</span>
            <span className="metric-label">Professional tools for schedules, pricing, and manifest.</span>
          </div>
        </div>
      </div>

      <aside className="summary-card">
        <p className="summary-label">Progress snapshot</p>
        <div className="summary-progress">
          <strong>{completedCount}</strong>
          <span>/ 13 key onboarding blocks completed</span>
        </div>
        <ul className="summary-list">
          <li>Plan: {plan?.name}</li>
          <li>Landing pages requested: {form.billing.pagesRequested}</li>
          <li>Tours configured: {form.tours.filter((tour) => tour.name.trim()).length}</li>
          <li>FAQ answers captured: {form.faqs.filter((faq) => faq.answer.trim()).length}</li>
        </ul>
        <div className="summary-note">
          Your data is kept private and secure. This setup process creates a fresh, unique workspace for your business, ensuring your guest records and branding are independent and protected.
        </div>
      </aside>
    </section>
  );
}
