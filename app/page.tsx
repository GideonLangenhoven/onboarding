"use client";

import { useState } from "react";

type GuideKey = "walkthrough" | "automation" | "manual" | "launch";
type FeatureKey =
  | "storefront"
  | "chat"
  | "operations"
  | "automation"
  | "reports"
  | "billing";

type TourDraft = {
  name: string;
  description: string;
  durationMinutes: string;
  basePrice: string;
  peakPrice: string;
  defaultCapacity: string;
  imageUrl: string;
  slotStartDate: string;
  slotEndDate: string;
  slotTimes: string[];
  operatingDays: number[];
  inclusions: string;
  exclusions: string;
  restrictions: string;
};

type FaqDraft = {
  question: string;
  answer: string;
};

type SubmitResult = {
  ok: boolean;
  businessId: string;
  adminId: string;
  subscriptionId: string | null;
  landingPageOrderId: string | null;
  toursCreated: number;
  slotsCreated: number;
  businessName: string;
  tenantSlug?: string;
  nextSteps: string[];
};

type FormState = {
  business: {
    businessName: string;
    tenantSlug: string;
    legalName: string;
    tagline: string;
    industry: string;
    yearEstablished: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    operatorEmail: string;
    adminPassword: string;
    bookingDomain: string;
  };
  branding: {
    logoUrl: string;
    heroEyebrow: string;
    heroTitle: string;
    heroSubtitle: string;
    chatbotAvatar: string;
    colorMain: string;
    colorSecondary: string;
    colorCta: string;
    colorBg: string;
    colorNav: string;
    colorHover: string;
  };
  operations: {
    timezone: string;
    meetingPoint: string;
    city: string;
    arriveEarlyMinutes: string;
    googleMapsUrl: string;
    facilities: string;
    parkingInfo: string;
    whatToBring: string;
    whatToWear: string;
    safetyInfo: string;
    officeHours: string;
    reviewUrl: string;
    whatsappPhone: string;
  };
  automations: {
    aiPersona: string;
    reminderEnabled: boolean;
    reviewRequestEnabled: boolean;
    reengagementEnabled: boolean;
    notes: string;
  };
  policies: {
    freeCancelHoursBefore: string;
    noRefundWithinHours: string;
    partialRefundHoursBefore: string;
    partialRefundPercent: string;
    rescheduleAllowedHoursBefore: string;
    loyaltyBookingsThreshold: string;
    loyaltyDiscountPercent: string;
    loyaltyPeriodDays: string;
    groupDiscountMinQty: string;
    groupDiscountPercent: string;
  };
  sops: {
    weatherCancellation: string;
    emergencyResponse: string;
    preTripBriefing: string;
    checkInFlow: string;
    guideOperations: string;
    equipmentHandling: string;
    incidentReporting: string;
    refundEscalation: string;
  };
  billing: {
    planId: "starter" | "growth" | "pro";
    landingPageRequested: boolean;
    pagesRequested: string;
    hostingActive: boolean;
    yocoKeyProvidedLater: boolean;
    whatsappKeysProvidedLater: boolean;
  };
  secrets: {
    waAccessToken: string;
    yocoSecretKey: string;
  };
  notes: string;
  faqs: FaqDraft[];
  tours: TourDraft[];
};

const GUIDE_CONTENT: Record<
  GuideKey,
  { title: string; summary: string; bullets: string[] }
> = {
  walkthrough: {
    title: "Your Journey to Go-Live",
    summary:
      "We've designed this flow to be as easy as possible. Tell us about your business, and we'll handle the complex digital setup behind the scenes.",
    bullets: [
      "No technical knowledge needed—just answer simple questions about your tours and team.",
      "See a live preview of your new dashboard, booking site, and automated guest communications.",
      "Set your own passwords and access rules so you're in control from day one.",
    ],
  },
  automation: {
    title: "The Magic of Instant Setup",
    summary:
      "While you're filling out this form, our system is busy building your custom workspace. No waiting weeks for a developer.",
    bullets: [
      "Instantly creates your branded booking website with your unique colors and logo.",
      "Sets up your tour calendar, pricing rules, and automatic availability slots.",
      "Prepares your secure staff dashboard so you can start taking bookings immediately after launch.",
    ],
  },
  manual: {
    title: "The Finishing Touches",
    summary:
      "A few small items like connecting your local bank account or WhatsApp number require a quick manual step from our team to ensure everything is secure.",
    bullets: [
      "We'll help you link your payment provider (like Yoco) so you get paid directly.",
      "We'll verify your business WhatsApp number to enable automated guest reminders.",
      "Our team performs a final quality check to ensure your site looks perfect on all devices.",
    ],
  },
  launch: {
    title: "Ready for Guests",
    summary:
      "Once you submit, you'll receive a clear checklist of the final steps to 'flip the switch' and go live.",
    bullets: [
      "Verify your tour times and descriptions on the new booking site.",
      "Run a test booking to see the guest experience from start to finish.",
      "Invite your staff members to join the dashboard and start managing activities.",
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

const FEATURE_ORDER: FeatureKey[] = [
  "storefront",
  "chat",
  "operations",
  "automation",
  "reports",
  "billing",
];

const PRODUCT_PRESENTATION: Record<
  FeatureKey,
  {
    tab: string;
    eyebrow: string;
    title: string;
    summary: string;
    image: string;
    highlights: string[];
    walkthrough: string[];
  }
> = {
  storefront: {
    tab: "Your Storefront",
    eyebrow: "Step 1: Get Noticed",
    title: "A stunning website that sells for you 24/7",
    summary:
      "We don't just give you a booking link. We build a beautiful, branded storefront that showcases your activities, handles pricing, and captures bookings while you sleep.",
    image: "/showcase/storefront.png",
    highlights: [
      "Custom branding: Your colors, your logo, and your unique business voice.",
      "Mobile-perfect: Guests can book on the go from any smartphone or tablet.",
      "Live availability: Clients only see times that are actually available, preventing overbooking.",
    ],
    walkthrough: [
      "A guest lands on your site and is 'wowed' by your high-quality activity photos.",
      "They effortlessly browse your tours and pick the perfect date.",
      "The system handles the entire payment and confirmation flow automatically.",
    ],
  },
  chat: {
    tab: "Virtual Host",
    eyebrow: "Step 2: Guest Support",
    title: "An AI assistant that knows your business as well as you do",
    summary:
      "Never miss a booking inquiry again. Our virtual host answers guest questions about gear, timing, and policies instantly, guiding them to a successful booking.",
    image: "/showcase/chat.png",
    highlights: [
      "Instant answers: No more guests waiting for a WhatsApp reply—get answers in seconds.",
      "Guided booking: The AI helps guests find the right tour and date for their needs.",
      "Multi-lingual & always on: Your business stays 'open' with AI support in any time zone.",
    ],
    walkthrough: [
      "A guest asks: 'What should I bring for the sunset kayak?' on your website.",
      "The virtual host uses your custom 'What to Bring' list to answer immediately.",
      "The guest, now confident, clicks 'Book Now' right inside the chat window.",
    ],
  },
  operations: {
    tab: "The Engine Room",
    eyebrow: "Step 3: Daily Ops",
    title: "A central dashboard to manage your busy activity centre",
    summary:
      "Stop juggling spreadsheets. Manage all your activities, staff, and guests from one high-performance dashboard designed specifically for tour operators.",
    image: "/showcase/admin.png",
    highlights: [
      "One-click bookings: Quickly add walk-ins or phone bookings to your central calendar.",
      "Slot control: Easily open or close sessions, adjust capacity, or change departure times.",
      "Guest manifest: See exactly who is arriving and when, with clear 'Paid' and 'Checked-in' status.",
    ],
    walkthrough: [
      "Your team signs in and sees the day's departures at a glance.",
      "They check in arriving guests and issue digital vouchers for equipment.",
      "Updates on the dashboard reflect on your website in real-time.",
    ],
  },
  automation: {
    tab: "Smart Rules",
    eyebrow: "Step 4: Smart Policies",
    title: "Automate your rules so you can focus on the fun stuff",
    summary:
      "From group discounts to weather policies, build your business logic directly into the software. Consistent rules mean happier guests and less stress for your team.",
    image: "/showcase/policies.png",
    highlights: [
      "Automated reminders: Guests get a 'Don't forget!' message with your custom SOP tips.",
      "Fair cancellation rules: Set windows for full or partial refunds that apply automatically.",
      "Group & Loyalty rewards: Automatically reward your best customers and biggest groups.",
    ],
    walkthrough: [
      "You define your 'Weather Policy'—e.g., 'We cancel if winds exceed 20 knots'.",
      "During a storm, you click one button to notify all affected guests via WhatsApp.",
      "The system handles the re-scheduling or refunds based on the rules you set today.",
    ],
  },
  reports: {
    tab: "Insights",
    eyebrow: "Step 5: Growth",
    title: "Professional reports that show you exactly where your money is",
    summary:
      "Know your numbers. Track revenue, identify your best-selling tours, and see where your most profitable guests are coming from with clean, actionable data.",
    image: "/showcase/reports.png",
    highlights: [
      "Revenue tracking: See your earnings by day, month, or specific activity.",
      "Occupancy stats: Identify your 'quiet times' and plan promotions to fill slots.",
      "Marketing source: See if you're getting more bookings from Your Site vs Viator/Expedia.",
    ],
    walkthrough: [
      "At the end of the month, you pull a 'Revenue & PAX' report for your accountant.",
      "You notice your 10 AM slot is always full, while 2 PM is quiet.",
      "You use this insight to launch a 'Mid-day Special' to maximize your profit.",
    ],
  },
  billing: {
    tab: "Business Growth",
    eyebrow: "Step 6: Scalability",
    title: "Software that grows as fast as your business does",
    summary:
      "Whether you're a solo guide or a multi-location operation, our flexible plans and built-in expansion tools ensure you always have the right power for the job.",
    image: "/showcase/billing.png",
    highlights: [
      "Flexible plans: Start small and upgrade as your booking volume increases.",
      "Built-in marketing: Order new landing pages or marketing services from the same portal.",
      "Multiple users: Add guides and office staff with their own secure logins.",
    ],
    walkthrough: [
      "You start on the 'Growth' plan as you launch your first three tours.",
      "Business booms—you easily add five more guides to the system.",
      "You order a custom landing page for your new 'Whale Watching' season via the app.",
    ],
  },
};

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
  business: {
    businessName: "",
    tenantSlug: "",
    legalName: "",
    tagline: "",
    industry: "Adventure & tourism",
    yearEstablished: "",
    ownerName: "",
    ownerEmail: "",
    ownerPhone: "",
    operatorEmail: "",
    adminPassword: "",
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
  sops: {
    weatherCancellation: "",
    emergencyResponse: "",
    preTripBriefing: "",
    checkInFlow: "",
    guideOperations: "",
    equipmentHandling: "",
    incidentReporting: "",
    refundEscalation: "",
  },
  billing: {
    planId: "growth",
    landingPageRequested: true,
    pagesRequested: "5",
    hostingActive: true,
    yocoKeyProvidedLater: true,
    whatsappKeysProvidedLater: true,
  },
  secrets: {
    waAccessToken: "",
    yocoSecretKey: "",
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
    form.business.businessName,
    form.business.tenantSlug,
    form.business.ownerName,
    form.business.ownerEmail,
    form.business.ownerPhone,
    form.business.adminPassword,
    form.branding.heroTitle,
    form.operations.meetingPoint,
    form.operations.whatToBring,
    form.operations.whatToWear,
    form.operations.safetyInfo,
    form.sops.weatherCancellation,
    form.sops.emergencyResponse,
    form.faqs.some((faq) => faq.answer.trim()),
    form.tours.some((tour) => tour.name.trim() && tour.basePrice.trim()),
  ];

  return checks.filter(Boolean).length;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function escapeSqlLiteral(value: string) {
  return value.replace(/'/g, "''");
}

function sqlString(value: string) {
  return `'${escapeSqlLiteral(value)}'`;
}

function sqlNullable(value: string) {
  return value.trim() ? sqlString(value.trim()) : "null";
}

function sqlBoolean(value: boolean) {
  return value ? "true" : "false";
}

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function maskSecret(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

function buildDirections(form: FormState) {
  return [
    `Meeting point: ${form.operations.meetingPoint}`,
    form.operations.googleMapsUrl ? `Map: ${form.operations.googleMapsUrl}` : "",
    form.operations.parkingInfo ? `Parking: ${form.operations.parkingInfo}` : "",
    form.operations.facilities ? `Facilities: ${form.operations.facilities}` : "",
    `Arrive ${toNumber(form.operations.arriveEarlyMinutes, 15)} minutes early.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildTerms(form: FormState) {
  return [
    `${form.business.businessName} onboarding-generated booking terms.`,
    `Free cancellation window: ${toNumber(form.policies.freeCancelHoursBefore, 24)} hours before departure.`,
    `No refund within: ${toNumber(form.policies.noRefundWithinHours, 24)} hours before departure.`,
    `Partial refund: ${toNumber(form.policies.partialRefundPercent, 95)}% if cancelled ${toNumber(form.policies.partialRefundHoursBefore, 48)} hours or more before departure.`,
    `Reschedule allowed until ${toNumber(form.policies.rescheduleAllowedHoursBefore, 24)} hours before departure.`,
    form.operations.safetyInfo,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPrivacyPolicy(form: FormState) {
  return [
    `${form.business.businessName} uses client contact details to manage bookings, reminders, and operational updates.`,
    `Primary operator contact: ${form.business.operatorEmail || form.business.ownerEmail}.`,
    "This placeholder policy should be reviewed before launch, especially if payment, CRM, or WhatsApp integrations are enabled.",
  ].join("\n\n");
}

function buildCookiesPolicy(form: FormState) {
  return [
    `${form.business.businessName} uses cookies and local storage to keep the booking and onboarding experience stable.`,
    "Review and replace this placeholder policy before public launch if the final site includes analytics or marketing scripts.",
  ].join("\n\n");
}

function buildProtectedSecret(label: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { label, status: "missing", masked: "" };
  }

  return {
    label,
    status: "placeholder",
    masked: maskSecret(trimmed),
    placeholder: `${label}_CAPTURED_IN_FORM_REQUIRES_SECURE_SERVER_ENTRY`,
  };
}

function buildLandingPageMetadata(form: FormState) {
  return {
    source: "activityhub-onboarding",
    tenant_slug: slugify(form.business.tenantSlug || form.business.businessName),
    business_profile: form.business,
    operations: form.operations,
    branding: form.branding,
    policies: form.policies,
    sops: form.sops,
    automations: form.automations,
    faqs: form.faqs,
    tours: form.tours,
    protected_secrets: {
      wa_access_token: buildProtectedSecret("WA_ACCESS_TOKEN", form.secrets.waAccessToken),
      yoco_secret_key: buildProtectedSecret("YOCO_SECRET_KEY", form.secrets.yocoSecretKey),
    },
    operator_notes: form.notes,
    remaining_manual_setup: {
      whatsapp_keys_provided_later: form.billing.whatsappKeysProvidedLater,
      yoco_key_provided_later: form.billing.yocoKeyProvidedLater,
    },
  };
}

function buildTourDescription(tour: TourDraft) {
  return [
    tour.description.trim(),
    tour.inclusions.trim() ? `Includes: ${tour.inclusions.trim()}` : "",
    tour.exclusions.trim() ? `Excludes: ${tour.exclusions.trim()}` : "",
    tour.restrictions.trim() ? `Restrictions: ${tour.restrictions.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function createSlotRows(tour: TourDraft) {
  if (!tour.slotStartDate || !tour.slotEndDate) return [];

  const validTimes = tour.slotTimes.filter((time) => time.trim());
  if (validTimes.length === 0) return [];

  const start = new Date(`${tour.slotStartDate}T00:00:00`);
  const end = new Date(`${tour.slotEndDate}T00:00:00`);
  const rows: Array<{ startTime: string; capacityTotal: number }> = [];

  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    if (!tour.operatingDays.includes(current.getDay())) continue;
    const dateString = current.toISOString().slice(0, 10);

    for (const time of validTimes) {
      rows.push({
        startTime: `${dateString}T${time}:00+02:00`,
        capacityTotal: Math.max(1, toNumber(tour.defaultCapacity, 10)),
      });
    }
  }

  return rows;
}

function buildFallbackSql(form: FormState) {
  const normalizedBusinessName = form.business.businessName.trim();
  const normalizedOwnerEmail = form.business.ownerEmail.trim().toLowerCase();
  const normalizedOperatorEmail =
    form.business.operatorEmail.trim().toLowerCase() || normalizedOwnerEmail;
  const tenantSlug = slugify(form.business.tenantSlug || form.business.businessName);
  const metadataJson = JSON.stringify(buildLandingPageMetadata(form));
  const statements: string[] = [
    "-- ActivityHub onboarding fallback migration",
    "-- This script inserts a brand new tenant only. It aborts if the business name or emails already exist.",
    "-- Protected secret metadata below uses masked placeholders so the SQL file never exposes raw keys.",
    "DO $$",
    "DECLARE",
    "  v_business_id uuid;",
    "  v_tour_id uuid;",
    "BEGIN",
    `  IF EXISTS (SELECT 1 FROM businesses WHERE business_name = ${sqlString(normalizedBusinessName)}) THEN`,
    `    RAISE EXCEPTION 'Business % already exists', ${sqlString(normalizedBusinessName)};`,
    "  END IF;",
    `  IF EXISTS (SELECT 1 FROM admin_users WHERE email = ${sqlString(normalizedOwnerEmail)}) THEN`,
    `    RAISE EXCEPTION 'Admin email % already exists', ${sqlString(normalizedOwnerEmail)};`,
    "  END IF;",
    `  IF EXISTS (SELECT 1 FROM businesses WHERE operator_email = ${sqlString(normalizedOperatorEmail)}) THEN`,
    `    RAISE EXCEPTION 'Operator email % already exists', ${sqlString(normalizedOperatorEmail)};`,
    "  END IF;",
    "",
    "  INSERT INTO businesses (",
    "    name, business_name, business_tagline, operator_email, timezone, logo_url, directions,",
    "    terms_conditions, privacy_policy, cookies_policy, color_main, color_secondary, color_cta,",
    "    color_bg, color_nav, color_hover, chatbot_avatar, hero_eyebrow, hero_title, hero_subtitle",
    "  ) VALUES (",
    `    ${sqlString(normalizedBusinessName)},`,
    `    ${sqlString(normalizedBusinessName)},`,
    `    ${sqlNullable(form.business.tagline)},`,
    `    ${sqlString(normalizedOperatorEmail)},`,
    `    ${sqlString(form.operations.timezone.trim() || "Africa/Johannesburg")},`,
    `    ${sqlNullable(form.branding.logoUrl)},`,
    `    ${sqlString(buildDirections(form))},`,
    `    ${sqlString(buildTerms(form))},`,
    `    ${sqlString(buildPrivacyPolicy(form))},`,
    `    ${sqlString(buildCookiesPolicy(form))},`,
    `    ${sqlString(form.branding.colorMain.trim() || "#185f75")},`,
    `    ${sqlString(form.branding.colorSecondary.trim() || "#132833")},`,
    `    ${sqlString(form.branding.colorCta.trim() || "#ca6c2f")},`,
    `    ${sqlString(form.branding.colorBg.trim() || "#f5efe4")},`,
    `    ${sqlString(form.branding.colorNav.trim() || "#fffaf2")},`,
    `    ${sqlString(form.branding.colorHover.trim() || "#ffd9bf")},`,
    `    ${sqlNullable(form.branding.chatbotAvatar)},`,
    `    ${sqlNullable(form.branding.heroEyebrow)},`,
    `    ${sqlString(form.branding.heroTitle.trim())},`,
    `    ${sqlNullable(form.branding.heroSubtitle)}`,
    "  ) RETURNING id INTO v_business_id;",
    "",
    "  INSERT INTO admin_users (",
    "    business_id, email, name, role, password_hash, must_set_password, password_set_at",
    "  ) VALUES (",
    "    v_business_id,",
    `    ${sqlString(normalizedOwnerEmail)},`,
    `    ${sqlString(form.business.ownerName.trim())},`,
    "    'MAIN_ADMIN',",
    `    encode(digest(${sqlString(form.business.adminPassword.trim())}, 'sha256'), 'hex'),`,
    "    false,",
    "    now()",
    "  );",
    "",
    "  INSERT INTO policies (",
    "    business_id, free_cancel_hours_before, no_refund_within_hours, partial_refund_hours_before,",
    "    partial_refund_percent, reschedule_allowed_hours_before, loyalty_bookings_threshold,",
    "    loyalty_discount_percent, loyalty_period_days, group_discount_min_qty, group_discount_percent",
    "  ) VALUES (",
    "    v_business_id,",
    `    ${toNumber(form.policies.freeCancelHoursBefore, 24)},`,
    `    ${toNumber(form.policies.noRefundWithinHours, 24)},`,
    `    ${toNumber(form.policies.partialRefundHoursBefore, 48)},`,
    `    ${toNumber(form.policies.partialRefundPercent, 95)},`,
    `    ${toNumber(form.policies.rescheduleAllowedHoursBefore, 24)},`,
    `    ${toNumber(form.policies.loyaltyBookingsThreshold, 2)},`,
    `    ${toNumber(form.policies.loyaltyDiscountPercent, 10)},`,
    `    ${toNumber(form.policies.loyaltyPeriodDays, 365)},`,
    `    ${toNumber(form.policies.groupDiscountMinQty, 6)},`,
    `    ${toNumber(form.policies.groupDiscountPercent, 5)}`,
    "  );",
  ];

  for (let index = 0; index < form.tours.length; index += 1) {
    const tour = form.tours[index];
    if (!tour.name.trim()) continue;

    statements.push(
      "",
      `  INSERT INTO tours (`,
      "    business_id, name, description, base_price_per_person, peak_price_per_person,",
      "    duration_minutes, active, hidden, image_url, default_capacity, sort_order",
      "  ) VALUES (",
      "    v_business_id,",
      `    ${sqlString(tour.name.trim())},`,
      `    ${sqlString(buildTourDescription(tour))},`,
      `    ${toNumber(tour.basePrice, 0)},`,
      `    ${tour.peakPrice.trim() ? toNumber(tour.peakPrice, 0) : "null"},`,
      `    ${toNumber(tour.durationMinutes, 90)},`,
      "    true,",
      "    false,",
      `    ${sqlNullable(tour.imageUrl)},`,
      `    ${Math.max(1, toNumber(tour.defaultCapacity, 10))},`,
      `    ${index}`,
      "  ) RETURNING id INTO v_tour_id;",
    );

    const slotRows = createSlotRows(tour);
    if (slotRows.length > 0) {
      statements.push(
        "  INSERT INTO slots (business_id, tour_id, start_time, capacity_total, booked, held, status) VALUES",
        slotRows
          .map(
            (slot) =>
              `    (v_business_id, v_tour_id, ${sqlString(slot.startTime)}, ${slot.capacityTotal}, 0, 0, 'OPEN')`,
          )
          .join(",\n") + ";",
      );
    }
  }

  statements.push("");

  if (form.billing.planId) {
    statements.push(
      "  INSERT INTO subscriptions (business_id, plan_id, status, period_start) VALUES (",
      "    v_business_id,",
      `    ${sqlString(form.billing.planId)},`,
      "    'ACTIVE',",
      "    current_date",
      "  );",
      "",
    );
  }

  if (form.billing.landingPageRequested) {
    const pagesRequested = Math.max(1, toNumber(form.billing.pagesRequested, 1));
    const extraPages = Math.max(0, pagesRequested - 1);
    statements.push(
      "  INSERT INTO landing_page_orders (",
      "    business_id, base_page_count, extra_page_count, build_total_zar, hosting_active, hosting_fee_zar, status, metadata",
      "  ) VALUES (",
      "    v_business_id,",
      "    1,",
      `    ${extraPages},`,
      `    ${3500 + extraPages * 1500},`,
      `    ${sqlBoolean(form.billing.hostingActive)},`,
      "    500,",
      "    'ACTIVE',",
      `    ${sqlString(metadataJson)}::jsonb`,
      "  );",
      "",
    );
  }

  statements.push(
    `  RAISE NOTICE 'Tenant % created for slug %', v_business_id, ${sqlString(tenantSlug)};`,
    "END $$;",
  );

  return statements.join("\n");
}

function downloadSql(filename: string, sql: string) {
  const blob = new Blob([sql], { type: "text/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [activeGuide, setActiveGuide] = useState<GuideKey>("walkthrough");
  const [activeFeature, setActiveFeature] = useState<FeatureKey>("storefront");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  const completedCount = countCompleted(form);
  const plan = PLAN_OPTIONS.find((item) => item.id === form.billing.planId);
  const extraPages = Math.max(0, Number(form.billing.pagesRequested || "1") - 1);
  const landingBuildPrice = 3500 + extraPages * 1500;
  const migrationSql = buildFallbackSql(form);
  const feature = PRODUCT_PRESENTATION[activeFeature];

  function updateBusinessName(value: string) {
    setForm((current) => {
      const previousSlug = slugify(current.business.tenantSlug);
      const previousNameSlug = slugify(current.business.businessName);
      const nextName = value;
      const nextSlug =
        !current.business.tenantSlug.trim() || previousSlug === previousNameSlug
          ? slugify(nextName)
          : current.business.tenantSlug;

      return {
        ...current,
        business: {
          ...current.business,
          businessName: nextName,
          tenantSlug: nextSlug,
        },
      };
    });
  }

  function updateSection<K extends keyof FormState>(
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

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as SubmitResult & { error?: string };

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

      <section className="presentation-panel">
        <div className="section-header">
          <p className="eyebrow">Platform presentation</p>
          <h2>Take a quick tour of your new software.</h2>
          <p className="presentation-intro">
            See how your business will look to your guests and your team. These slides show real-world examples of the storefront, the AI virtual host, and the central dashboard you're about to set up.
          </p>
        </div>

        <div className="presentation-tabs">
          {FEATURE_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className={activeFeature === key ? "presentation-tab active" : "presentation-tab"}
              onClick={() => setActiveFeature(key)}
            >
              {PRODUCT_PRESENTATION[key].tab}
            </button>
          ))}
        </div>

        <div className="presentation-stage">
          <div className="presentation-copy">
            <p className="eyebrow">{feature.eyebrow}</p>
            <h3>{feature.title}</h3>
            <p>{feature.summary}</p>

            <div className="presentation-block">
              <h4>What it does</h4>
              <ul>
                {feature.highlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="presentation-block">
              <h4>How it works</h4>
              <ol>
                {feature.walkthrough.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </div>
          </div>

          <div className="presentation-screen">
            <div className="presentation-screen-frame">
              <img src={feature.image} alt={`${feature.title} screenshot`} />
            </div>
            <p className="presentation-caption">
              Visual preview of your future business operations.
            </p>
          </div>
        </div>

        <div className="screenshot-grid">
          {FEATURE_ORDER.map((key) => (
            <button
              key={key}
              type="button"
              className={activeFeature === key ? "screenshot-card active" : "screenshot-card"}
              onClick={() => setActiveFeature(key)}
            >
              <img src={PRODUCT_PRESENTATION[key].image} alt={`${PRODUCT_PRESENTATION[key].title} thumbnail`} />
              <div>
                <strong>{PRODUCT_PRESENTATION[key].tab}</strong>
                <span>{PRODUCT_PRESENTATION[key].title}</span>
              </div>
            </button>
          ))}
        </div>
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
            <p className="eyebrow">Onboarding Complete</p>
            <h2>Success! {submitResult.businessName} is now ready for launch.</h2>
            <p className="lede">
              We've successfully created your workspace. Below are your account details and the next steps to start welcoming guests.
            </p>
          </div>
          <div className="success-grid">
            <div className="success-card">
              <span className="metric-label">Account Link</span>
              <strong>{submitResult.tenantSlug || slugify(form.business.tenantSlug)}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Activities Provisioned</span>
              <strong>{submitResult.toursCreated}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Booking Slots Active</span>
              <strong>{submitResult.slotsCreated}</strong>
            </div>
            <div className="success-card">
              <span className="metric-label">Admin Login</span>
              <strong>Ready</strong>
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
          <div className="guide-card">
            <h3>Technical Reference (Internal)</h3>
            <p>
              In the unlikely event our automated setup system is interrupted, you can download this backup configuration. Our support team can use this to manually restore your account.
            </p>
            <div className="stack">
              <button
                type="button"
                className="primary-button secondary"
                onClick={() =>
                  downloadSql(
                    `${submitResult.tenantSlug || slugify(form.business.tenantSlug || form.business.businessName)}-onboarding-fallback.sql`,
                    migrationSql,
                  )
                }
              >
                Download migration SQL
              </button>
              <label className="full-span">
                SQL preview
                <textarea value={migrationSql} readOnly rows={16} />
              </label>
            </div>
          </div>
        </section>
      ) : null}

      <form className="onboarding-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">1. Business owner</p>
              <h2>Identity and access</h2>
            </div>

            <div className="field-grid">
              <label>
                Public business name
                <input
                  value={form.business.businessName}
                  onChange={(event) => updateBusinessName(event.target.value)}
                  placeholder="e.g. Coastline Adventures"
                  required
                />
              </label>
              <label>
                Your unique link (URL)
                <input
                  value={form.business.tenantSlug}
                  onChange={(event) =>
                    updateSection("business", "tenantSlug", slugify(event.target.value))
                  }
                  placeholder="e.g. coastline-adventures"
                  required
                />
              </label>
              <label>
                Legal entity name
                <input
                  value={form.business.legalName}
                  onChange={(event) => updateSection("business", "legalName", event.target.value)}
                  placeholder="Coastline Adventures (Pty) Ltd"
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
                  onChange={(event) => updateSection("business", "ownerName", event.target.value)}
                  placeholder="Jane Smith"
                  required
                />
              </label>
              <label>
                Primary email
                <input
                  type="email"
                  value={form.business.ownerEmail}
                  onChange={(event) => updateSection("business", "ownerEmail", event.target.value)}
                  placeholder="jane@business.com"
                  required
                />
              </label>
              <label>
                Primary phone
                <input
                  value={form.business.ownerPhone}
                  onChange={(event) => updateSection("business", "ownerPhone", event.target.value)}
                  placeholder="+27 82 123 4567"
                  required
                />
              </label>
              <label>
                Operator email
                <input
                  type="email"
                  value={form.business.operatorEmail}
                  onChange={(event) => updateSection("business", "operatorEmail", event.target.value)}
                  placeholder="ops@business.com"
                />
              </label>
              <label>
                Your admin password
                <input
                  type="password"
                  value={form.business.adminPassword}
                  onChange={(event) => updateSection("business", "adminPassword", event.target.value)}
                  placeholder="Choose your first secure password"
                  required
                />
              </label>
              <label>
                Preferred web domain
                <input
                  value={form.business.bookingDomain}
                  onChange={(event) => updateSection("business", "bookingDomain", event.target.value)}
                  placeholder="e.g. book.yourbusiness.com"
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
            </div>
          </section>

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

          <section className="form-card full-width">
            <div className="section-header compact">
              <p className="eyebrow">3. Operational setup</p>
              <h2>Meeting point, support, and client instructions</h2>
            </div>

            <div className="field-grid">
              <label>
                Timezone
                <input
                  value={form.operations.timezone}
                  onChange={(event) => updateSection("operations", "timezone", event.target.value)}
                  placeholder="Africa/Johannesburg"
                />
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

          <section className="form-card full-width">
            <div className="section-header compact">
              <p className="eyebrow">6. How you run your business</p>
              <h2>Standard Operating Procedures (SOPs)</h2>
            </div>

            <div className="field-grid">
              <label>
                Weather cancellation SOP
                <textarea
                  value={form.sops.weatherCancellation}
                  onChange={(event) => updateSection("sops", "weatherCancellation", event.target.value)}
                  rows={5}
                  placeholder="Wind thresholds, cancellation authority, client comms timing, refund or reschedule rule."
                  required
                />
              </label>
              <label>
                Emergency response SOP
                <textarea
                  value={form.sops.emergencyResponse}
                  onChange={(event) => updateSection("sops", "emergencyResponse", event.target.value)}
                  rows={5}
                  placeholder="Emergency contacts, escalation steps, medical protocol, evacuation notes."
                  required
                />
              </label>
              <label>
                Pre-trip briefing SOP
                <textarea
                  value={form.sops.preTripBriefing}
                  onChange={(event) => updateSection("sops", "preTripBriefing", event.target.value)}
                  rows={5}
                  placeholder="Safety script, waiver reminder, gear fit, route explanation."
                />
              </label>
              <label>
                Check-in flow SOP
                <textarea
                  value={form.sops.checkInFlow}
                  onChange={(event) => updateSection("sops", "checkInFlow", event.target.value)}
                  rows={5}
                  placeholder="Arrival handling, waiver checks, payment check, attendance marking."
                />
              </label>
              <label>
                Guide operations SOP
                <textarea
                  value={form.sops.guideOperations}
                  onChange={(event) => updateSection("sops", "guideOperations", event.target.value)}
                  rows={5}
                  placeholder="Guide roster expectations, handoff, route changes, communication rules."
                />
              </label>
              <label>
                Equipment handling SOP
                <textarea
                  value={form.sops.equipmentHandling}
                  onChange={(event) => updateSection("sops", "equipmentHandling", event.target.value)}
                  rows={5}
                  placeholder="Gear issue, maintenance, wash-down, storage, damage reporting."
                />
              </label>
              <label>
                Incident reporting SOP
                <textarea
                  value={form.sops.incidentReporting}
                  onChange={(event) => updateSection("sops", "incidentReporting", event.target.value)}
                  rows={5}
                  placeholder="Near misses, injuries, customer complaints, who logs what and when."
                />
              </label>
              <label>
                Refund and escalation SOP
                <textarea
                  value={form.sops.refundEscalation}
                  onChange={(event) => updateSection("sops", "refundEscalation", event.target.value)}
                  rows={5}
                  placeholder="When staff may refund, when to escalate, expected response times."
                />
              </label>
            </div>
          </section>

          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">7. Your Virtual Host</p>
              <h2>AI tone and automatic messages</h2>
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

          <section className="form-card full-width">
            <div className="section-header compact">
              <p className="eyebrow">8. Common Questions</p>
              <h2>Teach your AI virtual host how to answer guests</h2>
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

          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">9. Commercial setup</p>
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
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.billing.whatsappKeysProvidedLater}
                  onChange={(event) =>
                    updateSection("billing", "whatsappKeysProvidedLater", event.target.checked)
                  }
                />
                WhatsApp keys will be provided by you later
              </label>
              <label className="checkbox-field">
                <input
                  type="checkbox"
                  checked={form.billing.yocoKeyProvidedLater}
                  onChange={(event) => updateSection("billing", "yocoKeyProvidedLater", event.target.checked)}
                />
                Yoco key will be configured later
              </label>
              <label className="full-span">
                WA_ACCESS_TOKEN
                <input
                  type="password"
                  value={form.secrets.waAccessToken}
                  onChange={(event) => updateSection("secrets", "waAccessToken", event.target.value)}
                  placeholder="Optional: captured into protected metadata only"
                />
              </label>
              <label className="full-span">
                YOCO_SECRET_KEY
                <input
                  type="password"
                  value={form.secrets.yocoSecretKey}
                  onChange={(event) => updateSection("secrets", "yocoSecretKey", event.target.value)}
                  placeholder="Optional: captured into protected metadata only"
                />
              </label>
            </div>

            <div className="cost-preview">
              <span>Estimated build fee</span>
              <strong>R{landingBuildPrice.toLocaleString("en-ZA")}</strong>
            </div>
          </section>

          <section className="form-card">
            <div className="section-header compact">
              <p className="eyebrow">10. Operator notes</p>
              <h2>Anything not covered above</h2>
            </div>

            <label className="full-span">
              Internal notes
              <textarea
                value={form.notes}
                onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                rows={7}
                placeholder="Special launch notes, exceptions, or follow-up requests."
              />
            </label>

            <div className="submit-box">
              <p>
                On submit, the app creates the tenant data in Supabase and returns the IDs you need for the launch handoff.
              </p>
              <p>
                The fallback SQL below is generated locally from the same form data, so you still have a manual path if the automated provisioning endpoint is unavailable.
              </p>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? "Preparing your business..." : "Complete Setup & Launch"}
              </button>
              {submitError ? <p className="error-text">{submitError}</p> : null}
              {submitError ? (
                <div className="guide-card">
                  <h3>Manual fallback available</h3>
                  <p>
                    Automated provisioning failed, but the SQL fallback is ready. Review it, then run it manually if needed.
                  </p>
                  <div className="stack">
                    <button
                      type="button"
                      className="primary-button secondary"
                      onClick={() =>
                        downloadSql(
                          `${slugify(form.business.tenantSlug || form.business.businessName)}-onboarding-fallback.sql`,
                          migrationSql,
                        )
                      }
                    >
                      Download migration SQL
                    </button>
                    <label className="full-span">
                      SQL preview
                      <textarea value={migrationSql} readOnly rows={14} />
                    </label>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </form>
    </main>
  );
}
