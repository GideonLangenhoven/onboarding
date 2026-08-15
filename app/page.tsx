"use client";

import { useState } from "react";
import {
  TIMEZONE_OPTIONS,
  isValidTimezone,
  normalizeOnboardingPayload,
  slugify,
  type OnboardingPayload,
  type SubmitResult,
} from "@/app/lib/onboarding";

type GuideKey = "walkthrough" | "automation" | "manual" | "launch";
type TourDraft = OnboardingPayload["tours"][number];
type FaqDraft = OnboardingPayload["faqs"][number];
type FormState = OnboardingPayload;
type SectionKey =
  | "business"
  | "branding"
  | "operations"
  | "credentials"
  | "automations"
  | "policies"
  | "billing";

type OnboardingMode = "quick" | "full";

const GUIDE_CONTENT: Record<
  GuideKey,
  { title: string; summary: string; bullets: string[] }
> = {
  walkthrough: {
    title: "Client Walkthrough",
    summary:
      "Clients move through a guided flow that explains the platform, captures every setup detail, and shows exactly what happens after submission.",
    bullets: [
      "Explains the dashboard, booking site, admin access, communications, and website deliverables before the form starts.",
      "Collects business profile, operational notes, brand settings, policy rules, FAQs, and tour schedules in one place.",
      "Lets the client define the initial admin password, confirm the admin email address, and submit the onboarding invite code in one flow.",
    ],
  },
  automation: {
    title: "What Gets Automated",
    summary:
      "Submitting the form seeds the core tenant records in your shared Supabase project so the business exists in SQL immediately.",
    bullets: [
      "Creates the `businesses` row with live branding and settings fields used by the current dashboard and booking UI.",
      "Creates the `admin_users` main admin login, `policies`, `tours`, generated `slots`, optional `subscriptions`, and an onboarding-backed `landing_page_orders` dossier.",
      "Stores non-secret onboarding answers in `landing_page_orders.metadata` and saves WhatsApp and Yoco credentials through the encrypted Supabase RPC flow.",
    ],
  },
  manual: {
    title: "What Still Needs Manual Setup",
    summary:
      "The onboarding route now captures tenant credentials securely, but launch still depends on tenant-aware rollout work and final QA.",
    bullets: [
      "Verified email sender setup and any shared deployment secrets still need to be configured in the target environment.",
      "The current public booking/chat stack still contains Cape Kayak specific text and does not yet resolve tenants by domain automatically.",
      "Go-live QA still needs you to test payments, confirmations, reminders, and any client-specific website pages before launch.",
    ],
  },
  launch: {
    title: "Launch Checklist",
    summary:
      "After submission you have a concrete operator handoff: set the remaining secrets, verify content, and run a full booking test.",
    bullets: [
      "Confirm onboarding data, generated slots, plan row, landing page order metadata, and encrypted credentials in Supabase.",
      "Set any remaining shared deployment secrets, verified email sender details, and domain-specific environment variables.",
      "Run one full live test: book, pay, confirm, cancel/reschedule, and verify email or WhatsApp communication.",
    ],
  },
};

const PLAN_OPTIONS = [
  {
    id: "starter",
    name: "Starter",
    price: "R1,500/mo",
    detail: "1 admin seat, 100 paid bookings/month",
  },
  {
    id: "growth",
    name: "Growth",
    price: "R3,000/mo",
    detail: "3 admin seats, 500 paid bookings/month",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R6,500/mo",
    detail: "10 admin seats, uncapped paid bookings",
  },
] as const;

const DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

function createTour(): TourDraft {
  return {
    name: "",
    description: "",
    durationMinutes: "90",
    basePrice: "",
    peakPrice: "",
    defaultCapacity: "10",
    imageUrl: "",
    slotStartDate: "",
    slotEndDate: "",
    slotTimes: ["09:00"],
    operatingDays: [0, 1, 2, 3, 4, 5, 6],
    inclusions: "",
    exclusions: "",
    restrictions: "",
  };
}

function createFaq(): FaqDraft {
  return {
    question: "",
    answer: "",
  };
}

const INITIAL_STATE: FormState = {
  inviteCode: "",
  business: {
    businessName: "",
    legalName: "",
    tagline: "",
    industry: "Adventure & tourism",
    yearEstablished: "",
    ownerName: "",
    ownerEmail: "",
    confirmOwnerEmail: "",
    ownerPhone: "",
    operatorEmail: "",
    adminPassword: "",
    tenantSlug: "",
    bookingDomain: "",
  },
  branding: {
    logoUrl: "",
    heroEyebrow: "New client launch",
    heroTitle: "",
    heroSubtitle: "",
    chatbotAvatar:
      "https://lottie.host/f88dfbd9-9fbb-43af-9ac4-400d4f0b96ae/tc9tMgAjqf.lottie",
    colorMain: "#185f75",
    colorSecondary: "#132833",
    colorCta: "#ca6c2f",
    colorBg: "#f5efe4",
    colorNav: "#fffaf2",
    colorHover: "#ffd9bf",
  },
  operations: {
    timezone: "Africa/Johannesburg",
    meetingPoint: "",
    city: "Cape Town",
    arriveEarlyMinutes: "15",
    googleMapsUrl: "",
    facilities: "",
    parkingInfo: "",
    whatToBring: "",
    whatToWear: "",
    safetyInfo: "",
    officeHours: "09:00-17:00",
    reviewUrl: "",
    whatsappPhone: "",
  },
  credentials: {
    waAccessToken: "",
    waPhoneId: "",
    yocoSecretKey: "",
    yocoWebhookSecret: "",
  },
  automations: {
    aiPersona:
      "Friendly, concise, human tone. Keep replies short, helpful, and operationally accurate.",
    reminderEnabled: true,
    reviewRequestEnabled: true,
    reengagementEnabled: true,
    notes: "",
  },
  policies: {
    freeCancelHoursBefore: "24",
    noRefundWithinHours: "24",
    partialRefundHoursBefore: "48",
    partialRefundPercent: "95",
    rescheduleAllowedHoursBefore: "24",
    loyaltyBookingsThreshold: "2",
    loyaltyDiscountPercent: "10",
    loyaltyPeriodDays: "365",
    groupDiscountMinQty: "6",
    groupDiscountPercent: "5",
  },
  billing: {
    planId: "growth",
    landingPageRequested: true,
    pagesRequested: "5",
    hostingActive: true,
    yocoKeyProvidedLater: true,
    whatsappKeysProvidedLater: true,
  },
  notes: "",
  faqs: [
    {
      question: "What should guests bring?",
      answer: "",
    },
    {
      question: "Where is the meeting point?",
      answer: "",
    },
  ],
  tours: [createTour()],
};

function countCompleted(form: FormState) {
  const checks = [
    form.inviteCode,
    form.business.businessName,
    form.business.ownerName,
    form.business.ownerEmail,
    form.business.confirmOwnerEmail,
    form.business.ownerPhone,
    form.business.adminPassword,
    form.branding.heroTitle,
    form.operations.meetingPoint,
    form.operations.whatToBring,
    form.operations.whatToWear,
    form.operations.safetyInfo,
    form.faqs.some((faq) => faq.answer.trim()),
    form.tours.some((tour) => tour.name.trim() && tour.basePrice.trim()),
  ];

  return checks.filter(Boolean).length;
}

function quickStartSlotDates() {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const end = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  return { start, end };
}

function applyQuickStartDefaults(form: FormState): FormState {
  const businessName = form.business.businessName.trim();
  const { start, end } = quickStartSlotDates();

  return {
    ...form,
    business: {
      ...form.business,
      ownerName: form.business.ownerEmail.split("@")[0] || "Owner",
      ownerPhone: "+00 000 000 0000",
    },
    branding: {
      ...form.branding,
      heroTitle: businessName || "Welcome",
      heroSubtitle: "Book your next adventure",
      heroEyebrow: "New client launch",
    },
    operations: {
      ...form.operations,
      meetingPoint: "Contact us for directions",
      whatToBring: "Comfortable clothes, sunscreen, water",
      whatToWear: "Clothes that can get wet",
      safetyInfo: "Life jackets provided. All tours are guide-led.",
    },
    policies: {
      ...INITIAL_STATE.policies,
    },
    automations: {
      ...INITIAL_STATE.automations,
    },
    billing: {
      ...INITIAL_STATE.billing,
      yocoKeyProvidedLater: true,
      whatsappKeysProvidedLater: true,
    },
    credentials: {
      waAccessToken: "",
      waPhoneId: "",
      yocoSecretKey: "",
      yocoWebhookSecret: "",
    },
    tours: form.tours.map((tour) => ({
      ...tour,
      durationMinutes: tour.durationMinutes || "90",
      defaultCapacity: tour.defaultCapacity || "10",
      slotStartDate: tour.slotStartDate || start,
      slotEndDate: tour.slotEndDate || end,
      slotTimes: tour.slotTimes.length > 0 && tour.slotTimes.some(Boolean) ? tour.slotTimes : ["09:00"],
      operatingDays: tour.operatingDays.length > 0 ? tour.operatingDays : [0, 1, 2, 3, 4, 5, 6],
    })),
    faqs: [],
    notes: "Quick Start onboarding. Defaults applied -- customize from admin dashboard.",
  };
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [mode, setMode] = useState<OnboardingMode>("quick");
  const [activeGuide, setActiveGuide] = useState<GuideKey>("walkthrough");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [fallbackSql, setFallbackSql] = useState("");

  const completedCount = countCompleted(form);
  const plan = PLAN_OPTIONS.find((item) => item.id === form.billing.planId);
  const extraPages = Math.max(0, Number(form.billing.pagesRequested || "1") - 1);
  const landingBuildPrice = 3500 + extraPages * 1500;
  const isQuick = mode === "quick";

  function updateSection<K extends SectionKey>(
    section: K,
    key: keyof FormState[K],
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  }

  function updateInviteCode(value: string) {
    setForm((current) => ({
      ...current,
      inviteCode: value,
    }));
  }

  function updateBusinessField(
    key: keyof FormState["business"],
    value: string,
  ) {
    setForm((current) => {
      const business = {
        ...current.business,
        [key]: value,
      };

      if (key === "businessName" && !current.business.tenantSlug.trim()) {
        business.tenantSlug = slugify(value);
      }

      if (key === "tenantSlug") {
        business.tenantSlug = slugify(value);
      }

      return {
        ...current,
        business,
      };
    });
  }

  function updateTour(index: number, key: keyof TourDraft, value: string | number[]) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = {
        ...tours[index],
        [key]: value,
      };
      return { ...current, tours };
    });
  }

  function updateFaq(index: number, key: keyof FaqDraft, value: string) {
    setForm((current) => {
      const faqs = [...current.faqs];
      faqs[index] = {
        ...faqs[index],
        [key]: value,
      };
      return { ...current, faqs };
    });
  }

  function addTour() {
    setForm((current) => ({
      ...current,
      tours: [...current.tours, createTour()],
    }));
  }

  function removeTour(index: number) {
    setForm((current) => ({
      ...current,
      tours: current.tours.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  function addTimeSlot(index: number) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = {
        ...tours[index],
        slotTimes: [...tours[index].slotTimes, ""],
      };
      return { ...current, tours };
    });
  }

  function removeTimeSlot(index: number, timeIndex: number) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = {
        ...tours[index],
        slotTimes: tours[index].slotTimes.filter((_, currentTimeIndex) => currentTimeIndex !== timeIndex),
      };
      return { ...current, tours };
    });
  }

  function updateTimeSlot(index: number, timeIndex: number, value: string) {
    setForm((current) => {
      const tours = [...current.tours];
      const nextTimes = [...tours[index].slotTimes];
      nextTimes[timeIndex] = value;
      tours[index] = {
        ...tours[index],
        slotTimes: nextTimes,
      };
      return { ...current, tours };
    });
  }

  function toggleOperatingDay(index: number, day: number) {
    setForm((current) => {
      const tours = [...current.tours];
      const hasDay = tours[index].operatingDays.includes(day);
      tours[index] = {
        ...tours[index],
        operatingDays: hasDay
          ? tours[index].operatingDays.filter((value) => value !== day)
          : [...tours[index].operatingDays, day].sort(),
      };
      return { ...current, tours };
    });
  }

  function addFaq() {
    setForm((current) => ({
      ...current,
      faqs: [...current.faqs, createFaq()],
    }));
  }

  function removeFaq(index: number) {
    setForm((current) => ({
      ...current,
      faqs: current.faqs.filter((_, currentIndex) => currentIndex !== index),
    }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitResult(null);
    setFallbackSql("");

    const formToSubmit = isQuick ? applyQuickStartDefaults(form) : form;
    const normalizedForm = normalizeOnboardingPayload(formToSubmit);
    setForm(normalizedForm);

    if (normalizedForm.business.ownerEmail !== normalizedForm.business.confirmOwnerEmail) {
      setSubmitError("Primary email and confirm email address must match.");
      setSubmitting(false);
      return;
    }

    if (!isValidTimezone(normalizedForm.operations.timezone)) {
      setSubmitError("Choose a valid timezone from the list.");
      setSubmitting(false);
      return;
    }

    if (!isQuick) {
      if (
        !normalizedForm.billing.whatsappKeysProvidedLater &&
        (!normalizedForm.credentials.waAccessToken || !normalizedForm.credentials.waPhoneId)
      ) {
        setSubmitError("Provide both the WhatsApp access token and phone ID, or mark them for later.");
        setSubmitting(false);
        return;
      }

      if (
        !normalizedForm.billing.yocoKeyProvidedLater &&
        (!normalizedForm.credentials.yocoSecretKey || !normalizedForm.credentials.yocoWebhookSecret)
      ) {
        setSubmitError("Provide both the Yoco secret key and webhook signing secret, or mark them for later.");
        setSubmitting(false);
        return;
      }
    }

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(normalizedForm),
      });

      const payload = (await response.json()) as SubmitResult & { error?: string; sqlFallback?: string };

      if (payload.sqlFallback) {
        setFallbackSql(payload.sqlFallback);
      }

      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit onboarding.");
      }

      setSubmitResult(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit onboarding.");
    }

    setSubmitting(false);
  }

  return (
    <main className="shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">ActivityHub onboarding</p>
          <h1>Client onboarding that actually seeds your SQL, not just a lead form.</h1>
          <p className="lede">
            Send this to a newly signed client, let them complete the full onboarding flow,
            and create the core records you need inside the current CapeKayak stack:
            business settings, admin login, tours, slots, policies, plan, and website order data.
          </p>
          <div className="hero-metrics">
            <div className="metric-card">
              <span className="metric-value">SQL seeded</span>
              <span className="metric-label">Business, admin, policies, tours, slots</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">Client-facing</span>
              <span className="metric-label">Explains features and collects operational detail</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">Operator-ready</span>
              <span className="metric-label">Leaves you with a concrete launch checklist</span>
            </div>
          </div>
        </div>

        <aside className="summary-card">
          <p className="summary-label">Progress snapshot</p>
          <div className="summary-progress">
            <strong>{completedCount}</strong>
            <span>/ 14 key onboarding blocks completed</span>
          </div>
          <ul className="summary-list">
            <li>Plan: {plan?.name}</li>
            <li>Landing pages requested: {form.billing.pagesRequested}</li>
            <li>Tours configured: {form.tours.filter((tour) => tour.name.trim()).length}</li>
            <li>FAQ answers captured: {form.faqs.filter((faq) => faq.answer.trim()).length}</li>
          </ul>
          <div className="summary-note">
            Invite code validation, confirmed admin email, validated timezones, and encrypted tenant credential storage are enforced on submit.
          </div>
        </aside>
      </section>

      <section className="guide-panel">
        <div className="section-header">
          <p className="eyebrow">How this works</p>
          <h2>Interactive operator guide</h2>
        </div>
        <div className="guide-tabs">
          {(Object.keys(GUIDE_CONTENT) as GuideKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className={activeGuide === key ? "guide-tab active" : "guide-tab"}
              onClick={() => setActiveGuide(key)}
            >
              {GUIDE_CONTENT[key].title}
            </button>
          ))}
        </div>
        <div className="guide-card">
          <h3>{GUIDE_CONTENT[activeGuide].title}</h3>
          <p>{GUIDE_CONTENT[activeGuide].summary}</p>
          <ul>
            {GUIDE_CONTENT[activeGuide].bullets.map((bullet) => (
              <li key={bullet}>{bullet}</li>
            ))}
          </ul>
        </div>
      </section>

      {submitResult ? (
        <section className="success-panel">
          <div className="section-header">
            <p className="eyebrow">Submission complete</p>
            <h2>{submitResult.businessName} is now provisioned in SQL.</h2>
          </div>
          <div className="success-grid">
            <div className="success-card">
              <span className="metric-label">Business ID</span>
              <strong>{submitResult.businessId}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Admin ID</span>
              <strong>{submitResult.adminId}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Tours created</span>
              <strong>{submitResult.toursCreated}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Slots created</span>
              <strong>{submitResult.slotsCreated}</strong>
            </div>
          </div>
          <div className="guide-card">
            <h3>Next actions</h3>
            <ul>
              {submitResult.nextSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <form className="onboarding-form" onSubmit={handleSubmit}>
        {/* ── Mode toggle ── */}
        <section className="mode-toggle-panel">
          <div className="section-header compact">
            <p className="eyebrow">Choose your setup path</p>
            <h2>How much detail do you want to provide now?</h2>
          </div>
          <div className="mode-toggle-row">
            <button
              type="button"
              className={`mode-toggle-card ${mode === "quick" ? "active" : ""}`}
              onClick={() => setMode("quick")}
            >
              <span className="mode-toggle-badge">Recommended</span>
              <span className="mode-toggle-title">Quick Start</span>
              <span className="mode-toggle-time">~5 minutes</span>
              <span className="mode-toggle-desc">
                5 fields. Sensible defaults for everything else. Get your business live fast.
              </span>
            </button>
            <button
              type="button"
              className={`mode-toggle-card ${mode === "full" ? "active" : ""}`}
              onClick={() => setMode("full")}
            >
              <span className="mode-toggle-title">Full Setup</span>
              <span className="mode-toggle-time">~30 minutes</span>
              <span className="mode-toggle-desc">
                40+ fields across 10 sections. Complete control over every detail from the start.
              </span>
            </button>
          </div>
          {isQuick && (
            <p className="mode-toggle-hint">
              You can customize everything later from your admin dashboard. Quick Start fills in sensible defaults for branding, policies, operations, and credentials.
            </p>
          )}
        </section>

        <div className="form-grid">
          {/* ── Section 1: Business owner (always shown) ── */}
          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">{isQuick ? "1. Your business" : "1. Business owner"}</p>
              <h2>{isQuick ? "The essentials" : "Identity and access"}</h2>
            </div>

            <div className="field-grid">
              <label>
                Invite code
                <input
                  type="password"
                  value={form.inviteCode}
                  onChange={(event) => updateInviteCode(event.target.value)}
                  placeholder="Enter the onboarding invite code"
                  required
                />
              </label>
              <label>
                Business name
                <input
                  value={form.business.businessName}
                  onChange={(event) => updateBusinessField("businessName", event.target.value)}
                  placeholder="Cape Coast Adventures"
                  required
                />
              </label>
              {!isQuick && (
                <>
                  <label>
                    Legal name
                    <input
                      value={form.business.legalName}
                      onChange={(event) => updateSection("business", "legalName", event.target.value)}
                      placeholder="Cape Coast Adventures (Pty) Ltd"
                    />
                  </label>
                  <label>
                    Industry
                    <input
                      value={form.business.industry}
                      onChange={(event) => updateSection("business", "industry", event.target.value)}
                      placeholder="Kayaking, diving, safari, tours"
                    />
                  </label>
                  <label>
                    Year established
                    <input
                      value={form.business.yearEstablished}
                      onChange={(event) => updateSection("business", "yearEstablished", event.target.value)}
                      placeholder="2018"
                    />
                  </label>
                  <label>
                    Primary contact
                    <input
                      value={form.business.ownerName}
                      onChange={(event) => updateBusinessField("ownerName", event.target.value)}
                      placeholder="Jane Smith"
                      required
                    />
                  </label>
                </>
              )}
              <label>
                {isQuick ? "Owner email" : "Primary email"}
                <input
                  type="email"
                  value={form.business.ownerEmail}
                  onChange={(event) => updateBusinessField("ownerEmail", event.target.value)}
                  placeholder="jane@business.com"
                  required
                />
              </label>
              <label>
                Confirm email address
                <input
                  type="email"
                  value={form.business.confirmOwnerEmail}
                  onChange={(event) => updateBusinessField("confirmOwnerEmail", event.target.value)}
                  placeholder="jane@business.com"
                  required
                />
              </label>
              {!isQuick && (
                <label>
                  Primary phone
                  <input
                    value={form.business.ownerPhone}
                    onChange={(event) => updateBusinessField("ownerPhone", event.target.value)}
                    placeholder="+27 82 123 4567"
                    required
                  />
                </label>
              )}
              {!isQuick && (
                <label>
                  Operator email
                  <input
                    type="email"
                    value={form.business.operatorEmail}
                    onChange={(event) => updateBusinessField("operatorEmail", event.target.value)}
                    placeholder="ops@business.com"
                  />
                </label>
              )}
              <label>
                Admin dashboard password
                <input
                  type="password"
                  value={form.business.adminPassword}
                  onChange={(event) => updateBusinessField("adminPassword", event.target.value)}
                  placeholder="Choose the first admin password"
                  required
                />
              </label>
              {!isQuick && (
                <>
                  <label>
                    Tenant slug
                    <input
                      value={form.business.tenantSlug}
                      onChange={(event) => updateBusinessField("tenantSlug", event.target.value)}
                      placeholder="cape-coast-adventures"
                      required
                    />
                  </label>
                  <label>
                    Booking domain
                    <input
                      value={form.business.bookingDomain}
                      onChange={(event) => updateBusinessField("bookingDomain", event.target.value)}
                      placeholder="book.clientdomain.com"
                    />
                  </label>
                  <label className="full-span">
                    Business tagline
                    <input
                      value={form.business.tagline}
                      onChange={(event) => updateSection("business", "tagline", event.target.value)}
                      placeholder="Ocean experiences with expert local guides"
                    />
                  </label>
                </>
              )}
            </div>
          </section>

          {/* ── Quick Start: Tour + Timezone (combined card) ── */}
          {isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">2. Your first tour</p>
                <h2>Activity and timezone</h2>
              </div>

              <div className="field-grid">
                <label>
                  Tour name
                  <input
                    value={form.tours[0]?.name || ""}
                    onChange={(event) => updateTour(0, "name", event.target.value)}
                    placeholder="Morning Sea Kayak"
                    required
                  />
                </label>
                <label>
                  Base price (ZAR per person)
                  <input
                    value={form.tours[0]?.basePrice || ""}
                    onChange={(event) => updateTour(0, "basePrice", event.target.value)}
                    placeholder="600"
                    required
                  />
                </label>
                <label className="full-span">
                  Timezone
                  <select
                    value={form.operations.timezone}
                    onChange={(event) => updateSection("operations", "timezone", event.target.value)}
                    required
                  >
                    {TIMEZONE_OPTIONS.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="quick-defaults-preview">
                <p className="quick-defaults-title">Defaults applied for Quick Start</p>
                <ul>
                  <li>Hero title set to your business name</li>
                  <li>Tour: 90 min, capacity 10, all days, 09:00 start, 90-day date range</li>
                  <li>Cancellation: 24h free, no refund within 24h, 95% refund at 48h+</li>
                  <li>All automations enabled (reminders, reviews, re-engagement)</li>
                  <li>Credentials (WhatsApp, Yoco) marked for later setup</li>
                  <li>Growth plan selected with landing page order</li>
                </ul>
              </div>
            </section>
          )}

          {/* ── Full Setup sections below (hidden in Quick Start) ── */}
          {!isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">2. Brand and website</p>
                <h2>Booking-site presentation</h2>
              </div>

              <div className="field-grid">
                <label>
                  Logo URL
                  <input
                    type="url"
                    value={form.branding.logoUrl}
                    onChange={(event) => updateSection("branding", "logoUrl", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
                <label>
                  Hero eyebrow
                  <input
                    value={form.branding.heroEyebrow}
                    onChange={(event) => updateSection("branding", "heroEyebrow", event.target.value)}
                    placeholder="Cape Town adventure tours"
                  />
                </label>
                <label>
                  Hero title
                  <input
                    value={form.branding.heroTitle}
                    onChange={(event) => updateSection("branding", "heroTitle", event.target.value)}
                    placeholder="Find your next ocean adventure"
                    required
                  />
                </label>
                <label className="full-span">
                  Hero subtitle
                  <textarea
                    value={form.branding.heroSubtitle}
                    onChange={(event) => updateSection("branding", "heroSubtitle", event.target.value)}
                    rows={3}
                    placeholder="Short homepage intro that explains the signature experience."
                  />
                </label>
                <label>
                  Primary color
                  <input
                    value={form.branding.colorMain}
                    onChange={(event) => updateSection("branding", "colorMain", event.target.value)}
                  />
                </label>
                <label>
                  Secondary color
                  <input
                    value={form.branding.colorSecondary}
                    onChange={(event) => updateSection("branding", "colorSecondary", event.target.value)}
                  />
                </label>
                <label>
                  CTA color
                  <input
                    value={form.branding.colorCta}
                    onChange={(event) => updateSection("branding", "colorCta", event.target.value)}
                  />
                </label>
                <label>
                  Background color
                  <input
                    value={form.branding.colorBg}
                    onChange={(event) => updateSection("branding", "colorBg", event.target.value)}
                  />
                </label>
                <label>
                  Nav color
                  <input
                    value={form.branding.colorNav}
                    onChange={(event) => updateSection("branding", "colorNav", event.target.value)}
                  />
                </label>
                <label>
                  Hover color
                  <input
                    value={form.branding.colorHover}
                    onChange={(event) => updateSection("branding", "colorHover", event.target.value)}
                  />
                </label>
                <label className="full-span">
                  Chat avatar URL
                  <input
                    value={form.branding.chatbotAvatar}
                    onChange={(event) => updateSection("branding", "chatbotAvatar", event.target.value)}
                    placeholder="https://..."
                  />
                </label>
              </div>
            </section>
          )}

          {!isQuick && (
            <section className="form-card full-width">
              <div className="section-header compact">
                <p className="eyebrow">3. Operational setup</p>
                <h2>Meeting point, support, and client instructions</h2>
              </div>

              <div className="field-grid">
                <label>
                  Timezone
                  <select
                    value={form.operations.timezone}
                    onChange={(event) => updateSection("operations", "timezone", event.target.value)}
                    required
                  >
                    {TIMEZONE_OPTIONS.map((timezone) => (
                      <option key={timezone} value={timezone}>
                        {timezone}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  City
                  <input
                    value={form.operations.city}
                    onChange={(event) => updateSection("operations", "city", event.target.value)}
                    placeholder="Cape Town"
                  />
                </label>
                <label>
                  WhatsApp phone
                  <input
                    value={form.operations.whatsappPhone}
                    onChange={(event) => updateSection("operations", "whatsappPhone", event.target.value)}
                    placeholder="+27 21 123 4567"
                  />
                </label>
                <label>
                  Office hours
                  <input
                    value={form.operations.officeHours}
                    onChange={(event) => updateSection("operations", "officeHours", event.target.value)}
                    placeholder="08:00-17:00"
                  />
                </label>
                <label>
                  Review URL
                  <input
                    type="url"
                    value={form.operations.reviewUrl}
                    onChange={(event) => updateSection("operations", "reviewUrl", event.target.value)}
                    placeholder="https://g.page/..."
                  />
                </label>
                <label>
                  Arrive early (minutes)
                  <input
                    value={form.operations.arriveEarlyMinutes}
                    onChange={(event) => updateSection("operations", "arriveEarlyMinutes", event.target.value)}
                    placeholder="15"
                  />
                </label>
                <label className="full-span">
                  Meeting point
                  <textarea
                    value={form.operations.meetingPoint}
                    onChange={(event) => updateSection("operations", "meetingPoint", event.target.value)}
                    rows={3}
                    placeholder="180 Beach Rd, Three Anchor Bay, Cape Town"
                    required
                  />
                </label>
                <label className="full-span">
                  Google Maps URL
                  <input
                    type="url"
                    value={form.operations.googleMapsUrl}
                    onChange={(event) => updateSection("operations", "googleMapsUrl", event.target.value)}
                    placeholder="https://maps.google.com/..."
                  />
                </label>
                <label>
                  Parking info
                  <textarea
                    value={form.operations.parkingInfo}
                    onChange={(event) => updateSection("operations", "parkingInfo", event.target.value)}
                    rows={4}
                    placeholder="Street parking, paid parking, shuttle notes"
                  />
                </label>
                <label>
                  Facilities
                  <textarea
                    value={form.operations.facilities}
                    onChange={(event) => updateSection("operations", "facilities", event.target.value)}
                    rows={4}
                    placeholder="Toilets, lockers, changing rooms"
                  />
                </label>
                <label>
                  What to bring
                  <textarea
                    value={form.operations.whatToBring}
                    onChange={(event) => updateSection("operations", "whatToBring", event.target.value)}
                    rows={4}
                    placeholder="Sunscreen, hat, towel, water"
                    required
                  />
                </label>
                <label>
                  What to wear
                  <textarea
                    value={form.operations.whatToWear}
                    onChange={(event) => updateSection("operations", "whatToWear", event.target.value)}
                    rows={4}
                    placeholder="Comfortable clothes you do not mind getting wet"
                    required
                  />
                </label>
                <label className="full-span">
                  Safety info
                  <textarea
                    value={form.operations.safetyInfo}
                    onChange={(event) => updateSection("operations", "safetyInfo", event.target.value)}
                    rows={5}
                    placeholder="Guides, safety gear, age limits, restrictions"
                    required
                  />
                </label>
              </div>
            </section>
          )}

          {!isQuick && (
            <section className="form-card full-width">
              <div className="section-header compact">
                <p className="eyebrow">4. Tour catalogue</p>
                <h2>Activities, pricing, and slot generation</h2>
              </div>

              <div className="stack">
                {form.tours.map((tour, index) => (
                  <article className="tour-card" key={`${tour.name}-${index}`}>
                    <div className="tour-card-header">
                      <div>
                        <p className="tour-index">Tour {index + 1}</p>
                        <h3>{tour.name || "Untitled tour"}</h3>
                      </div>
                      {form.tours.length > 1 ? (
                        <button type="button" className="ghost-button" onClick={() => removeTour(index)}>
                          Remove
                        </button>
                      ) : null}
                    </div>

                    <div className="field-grid">
                      <label>
                        Tour name
                        <input
                          value={tour.name}
                          onChange={(event) => updateTour(index, "name", event.target.value)}
                          placeholder="Morning Sea Kayak"
                          required
                        />
                      </label>
                      <label>
                        Image URL
                        <input
                          value={tour.imageUrl}
                          onChange={(event) => updateTour(index, "imageUrl", event.target.value)}
                          placeholder="https://..."
                        />
                      </label>
                      <label>
                        Duration (minutes)
                        <input
                          value={tour.durationMinutes}
                          onChange={(event) => updateTour(index, "durationMinutes", event.target.value)}
                          placeholder="90"
                        />
                      </label>
                      <label>
                        Base price
                        <input
                          value={tour.basePrice}
                          onChange={(event) => updateTour(index, "basePrice", event.target.value)}
                          placeholder="600"
                          required
                        />
                      </label>
                      <label>
                        Peak price
                        <input
                          value={tour.peakPrice}
                          onChange={(event) => updateTour(index, "peakPrice", event.target.value)}
                          placeholder="750"
                        />
                      </label>
                      <label>
                        Default capacity
                        <input
                          value={tour.defaultCapacity}
                          onChange={(event) => updateTour(index, "defaultCapacity", event.target.value)}
                          placeholder="24"
                        />
                      </label>
                      <label className="full-span">
                        Description
                        <textarea
                          value={tour.description}
                          onChange={(event) => updateTour(index, "description", event.target.value)}
                          rows={4}
                          placeholder="Guided experience summary for clients and staff."
                        />
                      </label>
                      <label>
                        Slot start date
                        <input
                          type="date"
                          value={tour.slotStartDate}
                          onChange={(event) => updateTour(index, "slotStartDate", event.target.value)}
                        />
                      </label>
                      <label>
                        Slot end date
                        <input
                          type="date"
                          value={tour.slotEndDate}
                          onChange={(event) => updateTour(index, "slotEndDate", event.target.value)}
                        />
                      </label>
                      <label className="full-span">
                        Inclusions
                        <textarea
                          value={tour.inclusions}
                          onChange={(event) => updateTour(index, "inclusions", event.target.value)}
                          rows={3}
                          placeholder="Guide, equipment, briefing, snacks"
                        />
                      </label>
                      <label>
                        Exclusions
                        <textarea
                          value={tour.exclusions}
                          onChange={(event) => updateTour(index, "exclusions", event.target.value)}
                          rows={3}
                          placeholder="Transport, drinks, wetsuit rental"
                        />
                      </label>
                      <label>
                        Restrictions
                        <textarea
                          value={tour.restrictions}
                          onChange={(event) => updateTour(index, "restrictions", event.target.value)}
                          rows={3}
                          placeholder="Age, weight, health, experience"
                        />
                      </label>
                    </div>

                    <div className="subsection">
                      <div className="subsection-header">
                        <h4>Operating days</h4>
                        <span>Used for initial slot generation</span>
                      </div>
                      <div className="day-toggle-row">
                        {DAY_OPTIONS.map((day) => {
                          const active = tour.operatingDays.includes(day.value);
                          return (
                            <button
                              key={day.value}
                              type="button"
                              className={active ? "day-toggle active" : "day-toggle"}
                              onClick={() => toggleOperatingDay(index, day.value)}
                            >
                              {day.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="subsection">
                      <div className="subsection-header">
                        <h4>Departure times</h4>
                        <button type="button" className="ghost-button" onClick={() => addTimeSlot(index)}>
                          Add time
                        </button>
                      </div>
                      <div className="time-grid">
                        {tour.slotTimes.map((slotTime, timeIndex) => (
                          <div key={`${index}-${timeIndex}`} className="time-row">
                            <input
                              type="time"
                              value={slotTime}
                              onChange={(event) => updateTimeSlot(index, timeIndex, event.target.value)}
                            />
                            {tour.slotTimes.length > 1 ? (
                              <button
                                type="button"
                                className="ghost-button"
                                onClick={() => removeTimeSlot(index, timeIndex)}
                              >
                                Remove
                              </button>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </article>
                ))}
              </div>

              <button type="button" className="primary-button secondary" onClick={addTour}>
                Add another tour
              </button>
            </section>
          )}

          {!isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">5. Policies</p>
                <h2>Discount and cancellation logic</h2>
              </div>

              <div className="field-grid">
                <label>
                  Free cancel hours before
                  <input
                    value={form.policies.freeCancelHoursBefore}
                    onChange={(event) => updateSection("policies", "freeCancelHoursBefore", event.target.value)}
                  />
                </label>
                <label>
                  No refund within hours
                  <input
                    value={form.policies.noRefundWithinHours}
                    onChange={(event) => updateSection("policies", "noRefundWithinHours", event.target.value)}
                  />
                </label>
                <label>
                  Partial refund window
                  <input
                    value={form.policies.partialRefundHoursBefore}
                    onChange={(event) => updateSection("policies", "partialRefundHoursBefore", event.target.value)}
                  />
                </label>
                <label>
                  Partial refund percent
                  <input
                    value={form.policies.partialRefundPercent}
                    onChange={(event) => updateSection("policies", "partialRefundPercent", event.target.value)}
                  />
                </label>
                <label>
                  Reschedule allowed before
                  <input
                    value={form.policies.rescheduleAllowedHoursBefore}
                    onChange={(event) => updateSection("policies", "rescheduleAllowedHoursBefore", event.target.value)}
                  />
                </label>
                <label>
                  Group discount minimum qty
                  <input
                    value={form.policies.groupDiscountMinQty}
                    onChange={(event) => updateSection("policies", "groupDiscountMinQty", event.target.value)}
                  />
                </label>
                <label>
                  Group discount percent
                  <input
                    value={form.policies.groupDiscountPercent}
                    onChange={(event) => updateSection("policies", "groupDiscountPercent", event.target.value)}
                  />
                </label>
                <label>
                  Loyalty threshold
                  <input
                    value={form.policies.loyaltyBookingsThreshold}
                    onChange={(event) => updateSection("policies", "loyaltyBookingsThreshold", event.target.value)}
                  />
                </label>
                <label>
                  Loyalty discount percent
                  <input
                    value={form.policies.loyaltyDiscountPercent}
                    onChange={(event) => updateSection("policies", "loyaltyDiscountPercent", event.target.value)}
                  />
                </label>
                <label>
                  Loyalty period days
                  <input
                    value={form.policies.loyaltyPeriodDays}
                    onChange={(event) => updateSection("policies", "loyaltyPeriodDays", event.target.value)}
                  />
                </label>
              </div>
            </section>
          )}

          {!isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">6. Automation settings</p>
                <h2>AI tone and messaging defaults</h2>
              </div>

              <div className="field-grid">
                <label className="full-span">
                  AI persona
                  <textarea
                    value={form.automations.aiPersona}
                    onChange={(event) => updateSection("automations", "aiPersona", event.target.value)}
                    rows={5}
                    placeholder="Friendly, operational, concise."
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.automations.reminderEnabled}
                    onChange={(event) => updateSection("automations", "reminderEnabled", event.target.checked)}
                  />
                  Enable day-before reminders
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.automations.reviewRequestEnabled}
                    onChange={(event) => updateSection("automations", "reviewRequestEnabled", event.target.checked)}
                  />
                  Enable post-trip review requests
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.automations.reengagementEnabled}
                    onChange={(event) => updateSection("automations", "reengagementEnabled", event.target.checked)}
                  />
                  Enable re-engagement campaigns
                </label>
                <label className="full-span">
                  Automation notes
                  <textarea
                    value={form.automations.notes}
                    onChange={(event) => updateSection("automations", "notes", event.target.value)}
                    rows={4}
                    placeholder="Anything special about support tone, upsells, reminders, or follow-up rules."
                  />
                </label>
              </div>
            </section>
          )}

          {!isQuick && (
            <section className="form-card full-width">
              <div className="section-header compact">
                <p className="eyebrow">7. FAQ knowledge base</p>
                <h2>Interactive help content for chat and client training</h2>
              </div>

              <div className="stack">
                {form.faqs.map((faq, index) => (
                  <div key={`${faq.question}-${index}`} className="faq-card">
                    <div className="field-grid">
                      <label>
                        Question
                        <input
                          value={faq.question}
                          onChange={(event) => updateFaq(index, "question", event.target.value)}
                          placeholder="What should guests bring?"
                        />
                      </label>
                      <label className="full-span">
                        Answer
                        <textarea
                          value={faq.answer}
                          onChange={(event) => updateFaq(index, "answer", event.target.value)}
                          rows={4}
                          placeholder="Write the approved business answer for this FAQ."
                        />
                      </label>
                    </div>
                    {form.faqs.length > 1 ? (
                      <button type="button" className="ghost-button" onClick={() => removeFaq(index)}>
                        Remove FAQ
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>

              <button type="button" className="primary-button secondary" onClick={addFaq}>
                Add FAQ item
              </button>
            </section>
          )}

          {!isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">8. Commercial setup</p>
                <h2>Plan and landing page package</h2>
              </div>

              <div className="plan-grid">
                {PLAN_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    className={form.billing.planId === option.id ? "plan-option active" : "plan-option"}
                    onClick={() => updateSection("billing", "planId", option.id)}
                  >
                    <span>{option.name}</span>
                    <strong>{option.price}</strong>
                    <small>{option.detail}</small>
                  </button>
                ))}
              </div>

              <div className="field-grid">
                <label>
                  Pages requested
                  <input
                    value={form.billing.pagesRequested}
                    onChange={(event) => updateSection("billing", "pagesRequested", event.target.value)}
                    placeholder="5"
                  />
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.billing.landingPageRequested}
                    onChange={(event) => updateSection("billing", "landingPageRequested", event.target.checked)}
                  />
                  Create landing page order in SQL
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.billing.hostingActive}
                    onChange={(event) => updateSection("billing", "hostingActive", event.target.checked)}
                  />
                  Keep monthly hosting active
                </label>
              </div>

              <div className="cost-preview">
                <span>Estimated build fee</span>
                <strong>R{landingBuildPrice.toLocaleString("en-ZA")}</strong>
              </div>
            </section>
          )}

          {!isQuick && (
            <section className="form-card">
              <div className="section-header compact">
                <p className="eyebrow">9. Credentials</p>
                <h2>Encrypted tenant secrets</h2>
              </div>

              <div className="field-grid">
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.billing.whatsappKeysProvidedLater}
                    onChange={(event) =>
                      updateSection("billing", "whatsappKeysProvidedLater", event.target.checked)
                    }
                  />
                  WhatsApp credentials will be provided later
                </label>
                <label className="checkbox-field">
                  <input
                    type="checkbox"
                    checked={form.billing.yocoKeyProvidedLater}
                    onChange={(event) => updateSection("billing", "yocoKeyProvidedLater", event.target.checked)}
                  />
                  Yoco credentials will be provided later
                </label>
                <label>
                  WhatsApp access token
                  <input
                    type="password"
                    value={form.credentials.waAccessToken}
                    onChange={(event) => updateSection("credentials", "waAccessToken", event.target.value)}
                    placeholder="EAAG..."
                    required={!form.billing.whatsappKeysProvidedLater}
                  />
                </label>
                <label>
                  WhatsApp phone ID
                  <input
                    value={form.credentials.waPhoneId}
                    onChange={(event) => updateSection("credentials", "waPhoneId", event.target.value)}
                    placeholder="123456789012345"
                    required={!form.billing.whatsappKeysProvidedLater}
                  />
                </label>
                <label>
                  Yoco secret key
                  <input
                    type="password"
                    value={form.credentials.yocoSecretKey}
                    onChange={(event) => updateSection("credentials", "yocoSecretKey", event.target.value)}
                    placeholder="sk_live_..."
                    required={!form.billing.yocoKeyProvidedLater}
                  />
                </label>
                <label>
                  Yoco webhook signing secret
                  <input
                    type="password"
                    value={form.credentials.yocoWebhookSecret}
                    onChange={(event) =>
                      updateSection("credentials", "yocoWebhookSecret", event.target.value)
                    }
                    placeholder="whsec_..."
                    required={!form.billing.yocoKeyProvidedLater}
                  />
                </label>
              </div>
            </section>
          )}

          {/* ── Submit section (always shown) ── */}
          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">{isQuick ? "3. Submit" : "10. Operator notes"}</p>
              <h2>{isQuick ? "Create your business" : "Anything not covered above"}</h2>
            </div>

            {!isQuick && (
              <label className="full-span">
                Internal notes
                <textarea
                  value={form.notes}
                  onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                  rows={7}
                  placeholder="Special launch notes, exceptions, or follow-up requests."
                />
              </label>
            )}

            <div className="submit-box">
              {isQuick ? (
                <p>
                  Quick Start will create your business with sensible defaults.
                  You can customize branding, policies, credentials, FAQs, and tour details
                  from your admin dashboard after setup.
                </p>
              ) : (
                <p>
                  On submit, the app validates the invite code, saves tenant credentials through the encrypted Supabase RPC flow, and returns the IDs you need for the launch handoff.
                </p>
              )}
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting
                  ? "Creating client..."
                  : isQuick
                    ? "Quick Start -- Create business"
                    : "Create client securely"}
              </button>
              {submitError ? <p className="error-text">{submitError}</p> : null}
              {fallbackSql ? (
                <label className="full-span">
                  Manual SQL fallback
                  <textarea value={fallbackSql} rows={18} readOnly />
                </label>
              ) : null}
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}
