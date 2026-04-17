import { createCipheriv, createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

// Simple in-memory rate limiter — max 3 onboarding attempts per IP per hour
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_MAX = 3;
const RATE_LIMIT_WINDOW = 60 * 60 * 1000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

type TourPayload = {
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

type FaqPayload = {
  question: string;
  answer: string;
};

type OnboardingPayload = {
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
    waPhoneId: string;
    yocoSecretKey: string;
    yocoWebhookSecret: string;
  };
  notes: string;
  faqs: FaqPayload[];
  tours: TourPayload[];
};

function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

function maskSecret(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed.length <= 8) return `${trimmed.slice(0, 2)}***${trimmed.slice(-2)}`;
  return `${trimmed.slice(0, 4)}***${trimmed.slice(-4)}`;
}

function protectSecret(label: string, value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return { label, status: "missing", masked: "" };
  }

  const seed = process.env.ONBOARDING_METADATA_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || "";
  const masked = maskSecret(trimmed);

  if (!seed) {
    return {
      label,
      status: "placeholder",
      masked,
      placeholder: `${label}_CAPTURED_EXTERNALLY`,
    };
  }

  const iv = randomBytes(12);
  const key = createHash("sha256").update(seed).digest();
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(trimmed, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    label,
    status: "encrypted",
    masked,
    algorithm: "aes-256-gcm",
    ciphertext: encrypted.toString("base64"),
    iv: iv.toString("base64"),
    tag: tag.toString("base64"),
  };
}

function buildDirections(payload: OnboardingPayload) {
  return [
    `Meeting point: ${payload.operations.meetingPoint}`,
    payload.operations.googleMapsUrl ? `Map: ${payload.operations.googleMapsUrl}` : "",
    payload.operations.parkingInfo ? `Parking: ${payload.operations.parkingInfo}` : "",
    payload.operations.facilities ? `Facilities: ${payload.operations.facilities}` : "",
    `Arrive ${toNumber(payload.operations.arriveEarlyMinutes, 15)} minutes early.`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildTerms(payload: OnboardingPayload) {
  return [
    `${payload.business.businessName} onboarding-generated booking terms.`,
    `Free cancellation window: ${toNumber(payload.policies.freeCancelHoursBefore, 24)} hours before departure.`,
    `No refund within: ${toNumber(payload.policies.noRefundWithinHours, 24)} hours before departure.`,
    `Partial refund: ${toNumber(payload.policies.partialRefundPercent, 95)}% if cancelled ${toNumber(payload.policies.partialRefundHoursBefore, 48)} hours or more before departure.`,
    `Reschedule allowed until ${toNumber(payload.policies.rescheduleAllowedHoursBefore, 24)} hours before departure.`,
    payload.operations.safetyInfo,
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildPrivacyPolicy(payload: OnboardingPayload) {
  return [
    `${payload.business.businessName} uses client contact details to manage bookings, reminders, and operational updates.`,
    `Primary operator contact: ${payload.business.operatorEmail || payload.business.ownerEmail}.`,
    "This placeholder policy should be reviewed before launch, especially if payment, CRM, or WhatsApp integrations are enabled.",
  ].join("\n\n");
}

function buildCookiesPolicy(payload: OnboardingPayload) {
  return [
    `${payload.business.businessName} uses cookies and local storage to keep the booking and onboarding experience stable.`,
    "Review and replace this placeholder policy before public launch if the final site includes analytics or marketing scripts.",
  ].join("\n\n");
}

function buildFaqJson(payload: OnboardingPayload): Record<string, string> {
  const faqObj: Record<string, string> = {};
  for (const faq of (payload.faqs || [])) {
    const q = faq.question?.trim();
    const a = faq.answer?.trim();
    if (q && a) faqObj[q] = a;
  }
  return faqObj;
}

function buildKnowledgeBase(payload: OnboardingPayload) {
  const faqText = payload.faqs
    .filter((faq) => faq.question.trim() && faq.answer.trim())
    .map((faq) => `Q: ${faq.question.trim()}\nA: ${faq.answer.trim()}`)
    .join("\n\n");

  const tourText = payload.tours
    .filter((tour) => tour.name.trim())
    .map((tour) =>
      [
        `${tour.name.trim()}: R${toNumber(tour.basePrice, 0)}/pp`,
        `Duration: ${toNumber(tour.durationMinutes, 0)} minutes`,
        tour.description.trim(),
        tour.inclusions.trim() ? `Includes: ${tour.inclusions.trim()}` : "",
        tour.restrictions.trim() ? `Restrictions: ${tour.restrictions.trim()}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");

  return [
    payload.automations.aiPersona.trim(),
    `Meeting point: ${payload.operations.meetingPoint}`,
    `What to bring: ${payload.operations.whatToBring}`,
    `What to wear: ${payload.operations.whatToWear}`,
    `Safety: ${payload.operations.safetyInfo}`,
    `Office hours: ${payload.operations.officeHours}`,
    `Weather cancellation SOP: ${payload.sops.weatherCancellation}`,
    `Emergency response SOP: ${payload.sops.emergencyResponse}`,
    payload.sops.preTripBriefing.trim() ? `Pre-trip briefing SOP: ${payload.sops.preTripBriefing}` : "",
    payload.sops.checkInFlow.trim() ? `Check-in SOP: ${payload.sops.checkInFlow}` : "",
    payload.sops.guideOperations.trim() ? `Guide operations SOP: ${payload.sops.guideOperations}` : "",
    payload.sops.equipmentHandling.trim() ? `Equipment SOP: ${payload.sops.equipmentHandling}` : "",
    payload.sops.incidentReporting.trim() ? `Incident reporting SOP: ${payload.sops.incidentReporting}` : "",
    payload.sops.refundEscalation.trim() ? `Refund escalation SOP: ${payload.sops.refundEscalation}` : "",
    `Tours:\n${tourText}`,
    faqText ? `FAQs:\n${faqText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function buildLandingPageMetadata(payload: OnboardingPayload, businessId: string) {
  return {
    source: "bookingtours-onboarding",
    created_for_business_id: businessId,
    tenant_slug: normalizeSlug(payload.business.tenantSlug || payload.business.businessName),
    business_profile: payload.business,
    operations: payload.operations,
    branding: payload.branding,
    policies: payload.policies,
    sops: payload.sops,
    automations: payload.automations,
    faqs: payload.faqs,
    tours: payload.tours,
    protected_secrets: {
      wa_access_token: protectSecret("WA_ACCESS_TOKEN", payload.secrets.waAccessToken),
      wa_phone_id: protectSecret("WA_PHONE_ID", payload.secrets.waPhoneId),
      yoco_secret_key: protectSecret("YOCO_SECRET_KEY", payload.secrets.yocoSecretKey),
      yoco_webhook_secret: protectSecret("YOCO_WEBHOOK_SECRET", payload.secrets.yocoWebhookSecret),
    },
    operator_notes: payload.notes,
    remaining_manual_setup: {
      whatsapp_keys_provided_later: payload.billing.whatsappKeysProvidedLater,
      yoco_key_provided_later: payload.billing.yocoKeyProvidedLater,
    },
  };
}

function tourDescription(tour: TourPayload) {
  return [
    tour.description.trim(),
    tour.inclusions.trim() ? `Includes: ${tour.inclusions.trim()}` : "",
    tour.exclusions.trim() ? `Excludes: ${tour.exclusions.trim()}` : "",
    tour.restrictions.trim() ? `Restrictions: ${tour.restrictions.trim()}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function createSlotRows(tourId: string, businessId: string, payload: TourPayload) {
  if (!payload.slotStartDate || !payload.slotEndDate) return [];

  const validTimes = payload.slotTimes.filter((time) => time.trim());
  if (validTimes.length === 0) return [];

  const start = new Date(`${payload.slotStartDate}T00:00:00`);
  const end = new Date(`${payload.slotEndDate}T00:00:00`);
  const rows = [];

  for (const current = new Date(start); current <= end; current.setDate(current.getDate() + 1)) {
    if (!payload.operatingDays.includes(current.getDay())) continue;
    const dateString = current.toISOString().slice(0, 10);

    for (const time of validTimes) {
      const startTime = new Date(`${dateString}T${time}:00+02:00`).toISOString();
      rows.push({
        business_id: businessId,
        tour_id: tourId,
        start_time: startTime,
        capacity_total: Math.max(1, toNumber(payload.defaultCapacity, 10)),
        booked: 0,
        held: 0,
        status: "OPEN",
      });
    }
  }

  return rows;
}

function validatePayload(payload: OnboardingPayload) {
  if (!payload.business.businessName.trim()) return "Business name is required.";
  if (!normalizeSlug(payload.business.tenantSlug || payload.business.businessName)) {
    return "Tenant slug is required.";
  }
  if (!payload.business.ownerName.trim()) return "Primary contact name is required.";
  if (!payload.business.ownerEmail.trim()) return "Primary contact email is required.";
  if (!payload.business.ownerPhone.trim()) return "Primary contact phone is required.";
  if (!payload.business.adminPassword.trim()) return "Admin dashboard password is required.";
  if (!payload.branding.heroTitle.trim()) return "Hero title is required.";
  if (!payload.operations.meetingPoint.trim()) return "Meeting point is required.";
  if (!payload.operations.whatToBring.trim()) return "What to bring is required.";
  if (!payload.operations.whatToWear.trim()) return "What to wear is required.";
  if (!payload.operations.safetyInfo.trim()) return "Safety info is required.";
  if (!payload.sops.weatherCancellation.trim()) return "Weather cancellation SOP is required.";
  if (!payload.sops.emergencyResponse.trim()) return "Emergency response SOP is required.";
  if (!payload.tours.some((tour) => tour.name.trim() && tour.basePrice.trim())) {
    return "Add at least one tour with a name and base price.";
  }
  return null;
}

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) return null;

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

async function cleanupProvisioning(
  supabase: ReturnType<typeof createClient>,
  businessId: string,
) {
  // Best-effort cleanup for the brand new tenant created in this request only.
  // This must never touch any other business_id.
  await supabase.from("landing_page_orders").delete().eq("business_id", businessId);
  await supabase.from("subscriptions").delete().eq("business_id", businessId);
  await supabase.from("slots").delete().eq("business_id", businessId);
  await supabase.from("tours").delete().eq("business_id", businessId);
  await supabase.from("policies").delete().eq("business_id", businessId);
  await supabase.from("admin_users").delete().eq("business_id", businessId);
  await supabase.from("businesses").delete().eq("id", businessId);
}

async function failWithCleanup(
  supabase: ReturnType<typeof createClient>,
  businessId: string | null,
  message: string,
) {
  if (businessId) {
    await cleanupProvisioning(supabase, businessId);
  }

  return NextResponse.json({ error: message }, { status: 500 });
}

export async function POST(request: Request) {
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase service role configuration. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before using automated client creation.",
      },
      { status: 500 },
    );
  }

  // Rate limiting
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: "Too many onboarding attempts. Please try again in an hour." },
      { status: 429 },
    );
  }

  const payload = (await request.json()) as OnboardingPayload;
  const validationError = validatePayload(payload);

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const normalizedOwnerEmail = payload.business.ownerEmail.trim().toLowerCase();
  const normalizedOperatorEmail =
    payload.business.operatorEmail.trim().toLowerCase() || normalizedOwnerEmail;
  const normalizedBusinessName = payload.business.businessName.trim();

  const { data: existingBusinessByName, error: existingBusinessByNameError } = await supabase
    .from("businesses")
    .select("id")
    .eq("business_name", normalizedBusinessName)
    .limit(1);

  if (existingBusinessByNameError) {
    return NextResponse.json(
      { error: `Could not validate the business name: ${existingBusinessByNameError.message}` },
      { status: 500 },
    );
  }

  if ((existingBusinessByName || []).length > 0) {
    return NextResponse.json(
      { error: "That business name already exists. Refusing to touch an existing business." },
      { status: 409 },
    );
  }

  const { data: existingAdmin, error: existingAdminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", normalizedOwnerEmail)
    .maybeSingle();

  if (existingAdminError) {
    return NextResponse.json(
      { error: `Could not validate the admin email: ${existingAdminError.message}` },
      { status: 500 },
    );
  }

  if (existingAdmin) {
    return NextResponse.json(
      { error: "That admin email already exists in admin_users. Refusing to touch an existing business." },
      { status: 409 },
    );
  }

  const { data: existingBusinessByOperator, error: existingBusinessByOperatorError } = await supabase
    .from("businesses")
    .select("id")
    .eq("operator_email", normalizedOperatorEmail)
    .limit(1);

  if (existingBusinessByOperatorError) {
    return NextResponse.json(
      { error: `Could not validate the operator email: ${existingBusinessByOperatorError.message}` },
      { status: 500 },
    );
  }

  if ((existingBusinessByOperator || []).length > 0) {
    return NextResponse.json(
      { error: "That operator email is already linked to an existing business. Refusing to touch an existing business." },
      { status: 409 },
    );
  }

  const businessInsert = {
    name: normalizedBusinessName,
    business_name: normalizedBusinessName,
    business_tagline: payload.business.tagline.trim() || null,
    operator_email: normalizedOperatorEmail,
    timezone: payload.operations.timezone.trim() || "Africa/Johannesburg",
    logo_url: payload.branding.logoUrl.trim() || null,
    directions: buildDirections(payload),
    terms_conditions: buildTerms(payload),
    privacy_policy: buildPrivacyPolicy(payload),
    cookies_policy: buildCookiesPolicy(payload),
    color_main: payload.branding.colorMain.trim() || "#185f75",
    color_secondary: payload.branding.colorSecondary.trim() || "#132833",
    color_cta: payload.branding.colorCta.trim() || "#ca6c2f",
    color_bg: payload.branding.colorBg.trim() || "#f5efe4",
    color_nav: payload.branding.colorNav.trim() || "#fffaf2",
    color_hover: payload.branding.colorHover.trim() || "#ffd9bf",
    chatbot_avatar: payload.branding.chatbotAvatar.trim() || null,
    hero_eyebrow: payload.branding.heroEyebrow.trim() || null,
    hero_title: payload.branding.heroTitle.trim(),
    hero_subtitle: payload.branding.heroSubtitle.trim() || null,
    // ── Fields that power the chatbot + booking page ──
    what_to_bring: payload.operations.whatToBring?.trim() || null,
    what_to_wear: payload.operations.whatToWear?.trim() || null,
    ai_system_prompt: payload.automations?.aiPersona?.trim() || null,
    faq_json: buildFaqJson(payload),
    ...(() => {
      const slug = payload.business.tenantSlug?.trim()?.toLowerCase()?.replace(/[^a-z0-9-]/g, "") || null;
      const base = slug ? `https://${slug}.bookingtours.co.za` : null;
      return {
        subdomain: slug,
        booking_site_url: base,
        manage_bookings_url: base ? `${base}/my-bookings` : null,
        booking_success_url: base ? `${base}/success` : null,
        booking_cancel_url: base ? `${base}/cancelled` : null,
        gift_voucher_url: base ? `${base}/voucher` : null,
        voucher_success_url: base ? `${base}/voucher-success` : null,
        waiver_url: base ? `${base}/waiver` : null,
      };
    })(),
  };

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .insert(businessInsert)
    .select("id,name,business_name")
    .single();

  if (businessError || !businessRow) {
    return NextResponse.json(
      { error: `Could not create the business row: ${businessError?.message || "Unknown error"}` },
      { status: 500 },
    );
  }

  const businessId = businessRow.id as string;
  const passwordHash = sha256(payload.business.adminPassword.trim());
  const nowIso = new Date().toISOString();

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .insert({
      business_id: businessId,
      email: normalizedOwnerEmail,
      name: payload.business.ownerName.trim(),
      role: "MAIN_ADMIN",
      password_hash: passwordHash,
      must_set_password: false,
      password_set_at: nowIso,
    })
    .select("id")
    .single();

  if (adminError || !adminRow) {
    return failWithCleanup(
      supabase,
      businessId,
      `Business created, but admin creation failed: ${adminError?.message || "Unknown error"}`,
    );
  }

  const { error: policyError } = await supabase.from("policies").insert({
    business_id: businessId,
    free_cancel_hours_before: toNumber(payload.policies.freeCancelHoursBefore, 24),
    no_refund_within_hours: toNumber(payload.policies.noRefundWithinHours, 24),
    partial_refund_hours_before: toNumber(payload.policies.partialRefundHoursBefore, 48),
    partial_refund_percent: toNumber(payload.policies.partialRefundPercent, 95),
    reschedule_allowed_hours_before: toNumber(payload.policies.rescheduleAllowedHoursBefore, 24),
    loyalty_bookings_threshold: toNumber(payload.policies.loyaltyBookingsThreshold, 2),
    loyalty_discount_percent: toNumber(payload.policies.loyaltyDiscountPercent, 10),
    loyalty_period_days: toNumber(payload.policies.loyaltyPeriodDays, 365),
    group_discount_min_qty: toNumber(payload.policies.groupDiscountMinQty, 6),
    group_discount_percent: toNumber(payload.policies.groupDiscountPercent, 5),
  });

  if (policyError) {
    return failWithCleanup(
      supabase,
      businessId,
      `Business and admin created, but policy creation failed: ${policyError.message}`,
    );
  }

  let toursCreated = 0;
  let slotsCreated = 0;

  for (let index = 0; index < payload.tours.length; index += 1) {
    const tour = payload.tours[index];
    if (!tour.name.trim()) continue;

    const { data: insertedTour, error: tourError } = await supabase
      .from("tours")
      .insert({
        business_id: businessId,
        name: tour.name.trim(),
        description: tourDescription(tour),
        base_price_per_person: toNumber(tour.basePrice, 0),
        peak_price_per_person: tour.peakPrice.trim() ? toNumber(tour.peakPrice, 0) : null,
        duration_minutes: toNumber(tour.durationMinutes, 90),
        active: true,
        hidden: false,
        image_url: tour.imageUrl.trim() || null,
        default_capacity: Math.max(1, toNumber(tour.defaultCapacity, 10)),
        sort_order: index,
      })
      .select("id")
      .single();

    if (tourError || !insertedTour) {
      return failWithCleanup(
        supabase,
        businessId,
        `Business created, but tour creation failed for "${tour.name}": ${tourError?.message || "Unknown error"}`,
      );
    }

    toursCreated += 1;
    const slotRows = createSlotRows(insertedTour.id as string, businessId, tour);
    if (slotRows.length === 0) continue;

    const { error: slotError } = await supabase.from("slots").insert(slotRows);
    if (slotError) {
      return failWithCleanup(
        supabase,
        businessId,
        `Tour "${tour.name}" was created, but slot generation failed: ${slotError.message}`,
      );
    }

    slotsCreated += slotRows.length;
  }

  let subscriptionId: string | null = null;
  let landingPageOrderId: string | null = null;

  const { data: selectedPlan, error: planError } = await supabase
    .from("plans")
    .select("id")
    .eq("id", payload.billing.planId)
    .eq("active", true)
    .maybeSingle();

  if (planError) {
    return failWithCleanup(
      supabase,
      businessId,
      `Business created, but plan lookup failed: ${planError.message}`,
    );
  }

  if (selectedPlan?.id) {
    const { data: subscriptionRow, error: subscriptionError } = await supabase
      .from("subscriptions")
      .insert({
        business_id: businessId,
        plan_id: selectedPlan.id,
        status: "ACTIVE",
        period_start: currentDate(),
      })
      .select("id")
      .single();

    if (subscriptionError) {
      return failWithCleanup(
        supabase,
        businessId,
        `Business created, but subscription creation failed: ${subscriptionError.message}`,
      );
    }

    subscriptionId = subscriptionRow?.id || null;
  }

  if (payload.billing.landingPageRequested) {
    const pagesRequested = Math.max(1, toNumber(payload.billing.pagesRequested, 1));
    const extraPages = Math.max(0, pagesRequested - 1);

    const { data: landingPageRow, error: landingPageError } = await supabase
      .from("landing_page_orders")
      .insert({
        business_id: businessId,
        base_page_count: 1,
        extra_page_count: extraPages,
        build_total_zar: 3500 + extraPages * 1500,
        hosting_active: payload.billing.hostingActive,
        hosting_fee_zar: 500,
        status: "ACTIVE",
        metadata: buildLandingPageMetadata(payload, businessId),
      })
      .select("id")
      .single();

    if (landingPageError) {
      return failWithCleanup(
        supabase,
        businessId,
        `Business created, but landing page order creation failed: ${landingPageError.message}`,
      );
    }

    landingPageOrderId = landingPageRow?.id || null;
  }

  // ── Wire live credentials into businesses.*_encrypted columns via server-side RPCs ──
  // These RPCs use pgcrypto with SETTINGS_ENCRYPTION_KEY to store encrypted values in
  // the dedicated columns that edge functions read from. Non-fatal: if encryption fails
  // or keys are blank, the operator can still complete setup via Settings → Credentials.
  const credentialWarnings: string[] = [];
  let credentialsWired = { whatsapp: false, yoco: false };
  const encryptionKey = process.env.SETTINGS_ENCRYPTION_KEY || "";

  const waToken = payload.secrets.waAccessToken?.trim() || "";
  const waPhoneId = payload.secrets.waPhoneId?.trim() || "";
  const yocoSecretKey = payload.secrets.yocoSecretKey?.trim() || "";
  const yocoWebhookSecret = payload.secrets.yocoWebhookSecret?.trim() || "";

  if (waToken && waPhoneId) {
    if (!encryptionKey || encryptionKey.length < 32) {
      credentialWarnings.push(
        "WhatsApp keys were provided but SETTINGS_ENCRYPTION_KEY is missing on the server, so they could not be wired live. Operator must re-enter in Settings → Credentials.",
      );
    } else {
      const { error: waErr } = await supabase.rpc("set_wa_credentials", {
        p_business_id: businessId,
        p_key: encryptionKey,
        p_wa_token: waToken,
        p_wa_phone_id: waPhoneId,
      });
      if (waErr) {
        console.error("ONBOARDING_WA_RPC_ERR", waErr.message);
        credentialWarnings.push(`WhatsApp credentials could not be encrypted: ${waErr.message}. Operator must re-enter in Settings → Credentials.`);
      } else {
        credentialsWired.whatsapp = true;
      }
    }
  } else if (waToken || waPhoneId) {
    credentialWarnings.push(
      "WhatsApp setup is incomplete — both Access Token AND Phone Number ID are required. Operator must finish in Settings → Credentials.",
    );
  }

  if (yocoSecretKey && yocoWebhookSecret) {
    if (!encryptionKey || encryptionKey.length < 32) {
      credentialWarnings.push(
        "Yoco keys were provided but SETTINGS_ENCRYPTION_KEY is missing on the server, so they could not be wired live. Operator must re-enter in Settings → Credentials.",
      );
    } else {
      const { error: yocoErr } = await supabase.rpc("set_yoco_credentials", {
        p_business_id: businessId,
        p_key: encryptionKey,
        p_yoco_secret_key: yocoSecretKey,
        p_yoco_webhook_secret: yocoWebhookSecret,
      });
      if (yocoErr) {
        console.error("ONBOARDING_YOCO_RPC_ERR", yocoErr.message);
        credentialWarnings.push(`Yoco credentials could not be encrypted: ${yocoErr.message}. Operator must re-enter in Settings → Credentials.`);
      } else {
        credentialsWired.yoco = true;
      }
    }
  } else if (yocoSecretKey || yocoWebhookSecret) {
    credentialWarnings.push(
      "Yoco setup is incomplete — both Secret Key AND Webhook Signing Secret are required. Operator must finish in Settings → Credentials.",
    );
  }

  const nextSteps = [
    "Log in to your new admin dashboard using your chosen password.",
    "Verify your tour schedules and pricing on the live booking site.",
    "Connect your WhatsApp business number for automated guest reminders (Contact us for secure setup).",
    "Link your Yoco payment account to start accepting credit card bookings.",
    "Invite your staff members and guides to their new workspace.",
    "Perform a test booking to see exactly what your guests will experience.",
  ];

  // ── Notify super admin of new onboarding & send welcome email to client ──
  let welcomeEmailSent = false;
  let adminLoginUrl = "";
  try {
    const RESEND_KEY = process.env.RESEND_API_KEY;
    const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || "gidslang89@gmail.com";
    // ADMIN_DASHBOARD_URL is REQUIRED — no hardcoded staging fallback (orphan staging URLs cause user confusion)
    const ADMIN_URL = (process.env.ADMIN_DASHBOARD_URL || "").trim().replace(/\/$/, "");
    adminLoginUrl = ADMIN_URL;
    if (!ADMIN_URL) {
      console.error("ADMIN_DASHBOARD_URL env var missing — cannot send welcome email with valid login link");
    }

    if (RESEND_KEY && ADMIN_URL) {
      // Internal notification (non-blocking — admin notification only)
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "BookingTours <noreply@bookingtours.co.za>",
            to: [ADMIN_EMAIL],
            subject: `New client onboarded: ${payload.business.businessName.trim()}`,
            html: [
              `<h2>New Client: ${payload.business.businessName.trim()}</h2>`,
              `<p><strong>Admin:</strong> ${payload.business.ownerName} (${payload.business.ownerEmail})</p>`,
              `<p><strong>Phone:</strong> ${payload.business.ownerPhone}</p>`,
              `<p><strong>Tours:</strong> ${toursCreated} configured, ${slotsCreated} slots generated</p>`,
              `<p><strong>Subdomain:</strong> ${normalizeSlug(payload.business.tenantSlug || payload.business.businessName)}.bookingtours.co.za</p>`,
              `<p><strong>Landing page requested:</strong> ${payload.billing?.landingPageRequested ? "Yes" : "No"}</p>`,
              `<br><p>Review in <a href="${ADMIN_URL}/super-admin">Super Admin Dashboard</a></p>`,
            ].join(""),
          }),
        });
      } catch (adminNotifyErr) {
        console.error("ADMIN_NOTIFY_ERR (non-blocking):", adminNotifyErr);
      }
    }

    // ── Welcome email to the business owner — BLOCKING (this is the user's only login link) ──
    if (RESEND_KEY && ADMIN_URL) {
      const slug = normalizeSlug(payload.business.tenantSlug || payload.business.businessName);
      const adminUrl = ADMIN_URL;
      const bookingUrl = `https://${slug}.bookingtours.co.za`;
      const welcomeRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: "Bearer " + RESEND_KEY, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "BookingTours <info@bookingtours.co.za>",
          to: [payload.business.ownerEmail.trim().toLowerCase()],
          subject: `Welcome to BookingTours — ${payload.business.businessName.trim()} is live!`,
          html: [
            `<div style="font-family:system-ui,sans-serif;max-width:600px;margin:0 auto;padding:2rem">`,
            `<h1 style="color:#1a3c34;font-size:28px;margin-bottom:8px">Welcome to BookingTours!</h1>`,
            `<p style="color:#666;font-size:16px;line-height:1.6">Hi ${payload.business.ownerName.trim().split(" ")[0]},</p>`,
            `<p style="color:#666;font-size:16px;line-height:1.6">Your business <strong>${payload.business.businessName.trim()}</strong> has been set up and is ready to accept bookings. Here's everything you need to get started:</p>`,
            `<div style="background:#f0f7f4;border-radius:12px;padding:20px;margin:20px 0">`,
            `<p style="margin:0 0 12px"><strong>🔑 Admin Dashboard:</strong><br><a href="${adminUrl}" style="color:#2d6a4f">${adminUrl}</a></p>`,
            `<p style="margin:0 0 12px"><strong>🌐 Your Booking Page:</strong><br><a href="${bookingUrl}" style="color:#2d6a4f">${bookingUrl}</a></p>`,
            `<p style="margin:0 0 12px"><strong>📧 Login Email:</strong> ${payload.business.ownerEmail.trim()}</p>`,
            `<p style="margin:0"><strong>🔒 Password:</strong> The one you chose during setup</p>`,
            `</div>`,
            `<h2 style="color:#1a3c34;font-size:20px;margin-top:24px">Your Next Steps</h2>`,
            `<ol style="color:#666;font-size:15px;line-height:1.8;padding-left:20px">`,
            `<li>Log in to your <a href="${adminUrl}" style="color:#2d6a4f">admin dashboard</a></li>`,
            `<li>Check your tours and pricing in <strong>Settings → Tours</strong></li>`,
            `<li>Connect Yoco payments in <strong>Settings → Credentials</strong></li>`,
            `<li>Share your <a href="${bookingUrl}" style="color:#2d6a4f">booking link</a> with customers</li>`,
            `<li>Make a test booking to see the full experience</li>`,
            `</ol>`,
            `<p style="color:#666;font-size:15px;line-height:1.6;margin-top:20px">Need help? Reply to this email or WhatsApp us — we're here for you.</p>`,
            `<div style="border-top:1px solid #e5e7eb;margin-top:24px;padding-top:16px;color:#999;font-size:13px">`,
            `<p>BookingTours — Built for adventure businesses</p>`,
            `</div>`,
            `</div>`,
          ].join(""),
        }),
      });
      if (welcomeRes.ok) {
        welcomeEmailSent = true;
      } else {
        const errBody = await welcomeRes.text().catch(() => "");
        console.error("WELCOME_EMAIL_RESEND_FAIL status=" + welcomeRes.status + " body=" + errBody);
      }
    }
  } catch (notifyErr) {
    console.error("NOTIFY_ERR:", notifyErr);
    // Continue — onboarding succeeded, but surface an emailDelivered: false flag in the response
  }

  return NextResponse.json({
    ok: true,
    businessId,
    adminId: adminRow.id,
    subscriptionId,
    landingPageOrderId,
    toursCreated,
    slotsCreated,
    businessName: payload.business.businessName.trim(),
    tenantSlug: normalizeSlug(payload.business.tenantSlug || payload.business.businessName),
    knowledgeBasePreview: buildKnowledgeBase(payload),
    nextSteps,
    adminLoginUrl,
    welcomeEmailSent,
    credentialsWired,
    credentialWarnings,
  });
}
