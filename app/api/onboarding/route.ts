import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  buildManualSqlFallback,
  buildSafeLandingPageMetadata,
  createSlotRows,
  currentDate,
  isValidTimezone,
  normalizeOnboardingPayload,
  type OnboardingPayload,
  toNumber,
} from "@/app/lib/onboarding";

export const runtime = "nodejs";

function sha256(value: string) {
  return createHash("sha256").update(value).digest("hex");
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

function buildKnowledgeBase(payload: OnboardingPayload) {
  const faqText = payload.faqs
    .filter((faq) => faq.question && faq.answer)
    .map((faq) => `Q: ${faq.question}\nA: ${faq.answer}`)
    .join("\n\n");

  const tourText = payload.tours
    .filter((tour) => tour.name)
    .map((tour) =>
      [
        `${tour.name}: R${toNumber(tour.basePrice, 0)}/pp`,
        `Duration: ${toNumber(tour.durationMinutes, 0)} minutes`,
        tour.description,
        tour.inclusions ? `Includes: ${tour.inclusions}` : "",
        tour.restrictions ? `Restrictions: ${tour.restrictions}` : "",
      ]
        .filter(Boolean)
        .join(" | "),
    )
    .join("\n");

  return [
    payload.automations.aiPersona,
    `Meeting point: ${payload.operations.meetingPoint}`,
    `What to bring: ${payload.operations.whatToBring}`,
    `What to wear: ${payload.operations.whatToWear}`,
    `Safety: ${payload.operations.safetyInfo}`,
    `Office hours: ${payload.operations.officeHours}`,
    `Tours:\n${tourText}`,
    faqText ? `FAQs:\n${faqText}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function tourDescription(payload: OnboardingPayload["tours"][number]) {
  return [
    payload.description,
    payload.inclusions ? `Includes: ${payload.inclusions}` : "",
    payload.exclusions ? `Excludes: ${payload.exclusions}` : "",
    payload.restrictions ? `Restrictions: ${payload.restrictions}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

function validatePayload(payload: OnboardingPayload) {
  if (!payload.business.businessName) return "Business name is required.";
  if (!payload.business.ownerName) return "Primary contact name is required.";
  if (!payload.business.ownerEmail) return "Primary contact email is required.";
  if (!payload.business.confirmOwnerEmail) return "Confirm email address is required.";
  if (payload.business.ownerEmail !== payload.business.confirmOwnerEmail) {
    return "Primary email and confirm email address must match.";
  }
  if (!payload.business.ownerPhone) return "Primary contact phone is required.";
  if (!payload.business.adminPassword) return "Admin dashboard password is required.";
  if (!payload.business.tenantSlug) return "Tenant slug is required.";
  if (!payload.branding.heroTitle) return "Hero title is required.";
  if (!isValidTimezone(payload.operations.timezone)) {
    return "Choose a valid timezone from the list.";
  }
  if (!payload.operations.meetingPoint) return "Meeting point is required.";
  if (!payload.operations.whatToBring) return "What to bring is required.";
  if (!payload.operations.whatToWear) return "What to wear is required.";
  if (!payload.operations.safetyInfo) return "Safety info is required.";
  if (!payload.tours.some((tour) => tour.name && tour.basePrice)) {
    return "Add at least one tour with a name and base price.";
  }
  if (!payload.billing.whatsappKeysProvidedLater) {
    if (!payload.credentials.waAccessToken) return "WhatsApp access token is required.";
    if (!payload.credentials.waPhoneId) return "WhatsApp phone ID is required.";
  }
  if (
    (payload.credentials.waAccessToken && !payload.credentials.waPhoneId) ||
    (!payload.credentials.waAccessToken && payload.credentials.waPhoneId)
  ) {
    return "WhatsApp credentials must include both the access token and phone ID.";
  }
  if (!payload.billing.yocoKeyProvidedLater) {
    if (!payload.credentials.yocoSecretKey) return "Yoco secret key is required.";
    if (!payload.credentials.yocoWebhookSecret) return "Yoco webhook signing secret is required.";
  }
  if (
    (payload.credentials.yocoSecretKey && !payload.credentials.yocoWebhookSecret) ||
    (!payload.credentials.yocoSecretKey && payload.credentials.yocoWebhookSecret)
  ) {
    return "Yoco credentials must include both the secret key and webhook signing secret.";
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

async function setEncryptionContextIfNeeded(supabase: NonNullable<ReturnType<typeof getAdminClient>>) {
  const encryptionKey = process.env.SETTINGS_ENCRYPTION_KEY;

  if (!encryptionKey) {
    return "Missing SETTINGS_ENCRYPTION_KEY. The onboarding route cannot securely save WhatsApp or Yoco credentials without it.";
  }

  const { error } = await supabase.rpc("set_app_settings_encryption_key", {
    p_value: encryptionKey,
  });

  return error?.message || null;
}

export async function POST(request: Request) {
  const rawPayload = (await request.json()) as OnboardingPayload;
  const payload = normalizeOnboardingPayload(rawPayload);
  const inviteCode = process.env.ONBOARDING_INVITE_CODE?.trim();

  if (!inviteCode) {
    return NextResponse.json(
      {
        error:
          "Missing ONBOARDING_INVITE_CODE. Configure the invite code before exposing the onboarding route.",
      },
      { status: 500 },
    );
  }

  if (payload.inviteCode !== inviteCode) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }

  const validationError = validatePayload(payload);
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const sqlFallback = buildManualSqlFallback(payload);
  const supabase = getAdminClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          "Missing Supabase service role configuration. Add NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before using automated client creation.",
        sqlFallback,
      },
      { status: 500 },
    );
  }

  const normalizedOwnerEmail = payload.business.ownerEmail;
  const normalizedOperatorEmail = payload.business.operatorEmail || normalizedOwnerEmail;

  const { data: existingAdmin, error: existingAdminError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("email", normalizedOwnerEmail)
    .maybeSingle();

  if (existingAdminError) {
    return NextResponse.json(
      { error: `Could not validate the admin email: ${existingAdminError.message}`, sqlFallback },
      { status: 500 },
    );
  }

  if (existingAdmin) {
    return NextResponse.json(
      { error: "That admin email already exists in admin_users." },
      { status: 409 },
    );
  }

  const businessInsert = {
    name: payload.business.businessName,
    business_name: payload.business.businessName,
    business_tagline: payload.business.tagline || null,
    operator_email: normalizedOperatorEmail,
    timezone: payload.operations.timezone || "Africa/Johannesburg",
    logo_url: payload.branding.logoUrl || null,
    directions: buildDirections(payload),
    terms_conditions: buildTerms(payload),
    privacy_policy: buildPrivacyPolicy(payload),
    cookies_policy: buildCookiesPolicy(payload),
    color_main: payload.branding.colorMain || "#185f75",
    color_secondary: payload.branding.colorSecondary || "#132833",
    color_cta: payload.branding.colorCta || "#ca6c2f",
    color_bg: payload.branding.colorBg || "#f5efe4",
    color_nav: payload.branding.colorNav || "#fffaf2",
    color_hover: payload.branding.colorHover || "#ffd9bf",
    chatbot_avatar: payload.branding.chatbotAvatar || null,
    hero_eyebrow: payload.branding.heroEyebrow || null,
    hero_title: payload.branding.heroTitle,
    hero_subtitle: payload.branding.heroSubtitle || null,
  };

  const { data: businessRow, error: businessError } = await supabase
    .from("businesses")
    .insert(businessInsert)
    .select("id,name,business_name")
    .single();

  if (businessError || !businessRow) {
    return NextResponse.json(
      { error: `Could not create the business row: ${businessError?.message || "Unknown error"}`, sqlFallback },
      { status: 500 },
    );
  }

  const businessId = businessRow.id as string;
  const credentialsProvided =
    Boolean(payload.credentials.waAccessToken) ||
    Boolean(payload.credentials.waPhoneId) ||
    Boolean(payload.credentials.yocoSecretKey) ||
    Boolean(payload.credentials.yocoWebhookSecret);

  if (credentialsProvided) {
    const encryptionError = await setEncryptionContextIfNeeded(supabase);
    if (encryptionError) {
      return NextResponse.json(
        {
          error: `Business created, but credential encryption setup failed: ${encryptionError}`,
          sqlFallback,
        },
        { status: 500 },
      );
    }

    const { error: credentialError } = await supabase.rpc("set_business_credentials", {
      p_business_id: businessId,
      p_wa_token: payload.credentials.waAccessToken || null,
      p_wa_phone_id: payload.credentials.waPhoneId || null,
      p_yoco_secret_key: payload.credentials.yocoSecretKey || null,
      p_yoco_webhook_secret: payload.credentials.yocoWebhookSecret || null,
    });

    if (credentialError) {
      return NextResponse.json(
        {
          error: `Business created, but encrypted credential storage failed: ${credentialError.message}`,
          sqlFallback,
        },
        { status: 500 },
      );
    }
  }

  const passwordHash = sha256(payload.business.adminPassword);
  const nowIso = new Date().toISOString();

  const { data: adminRow, error: adminError } = await supabase
    .from("admin_users")
    .insert({
      business_id: businessId,
      email: normalizedOwnerEmail,
      name: payload.business.ownerName,
      role: "MAIN_ADMIN",
      password_hash: passwordHash,
      must_set_password: false,
      password_set_at: nowIso,
    })
    .select("id")
    .single();

  if (adminError || !adminRow) {
    return NextResponse.json(
      {
        error: `Business created, but admin creation failed: ${adminError?.message || "Unknown error"}`,
        sqlFallback,
      },
      { status: 500 },
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
    return NextResponse.json(
      { error: `Business and admin created, but policy creation failed: ${policyError.message}`, sqlFallback },
      { status: 500 },
    );
  }

  let toursCreated = 0;
  let slotsCreated = 0;

  for (let index = 0; index < payload.tours.length; index += 1) {
    const tour = payload.tours[index];
    if (!tour.name) continue;

    const { data: insertedTour, error: tourError } = await supabase
      .from("tours")
      .insert({
        business_id: businessId,
        name: tour.name,
        description: tourDescription(tour),
        base_price_per_person: toNumber(tour.basePrice, 0),
        peak_price_per_person: tour.peakPrice ? toNumber(tour.peakPrice, 0) : null,
        duration_minutes: toNumber(tour.durationMinutes, 90),
        active: true,
        hidden: false,
        image_url: tour.imageUrl || null,
        default_capacity: Math.max(1, toNumber(tour.defaultCapacity, 10)),
        sort_order: index,
      })
      .select("id")
      .single();

    if (tourError || !insertedTour) {
      return NextResponse.json(
        {
          error: `Business created, but tour creation failed for "${tour.name}": ${tourError?.message || "Unknown error"}`,
          sqlFallback,
        },
        { status: 500 },
      );
    }

    toursCreated += 1;
    const slotRows = createSlotRows(insertedTour.id as string, businessId, tour);
    if (slotRows.length === 0) continue;

    const { error: slotError } = await supabase.from("slots").insert(slotRows);
    if (slotError) {
      return NextResponse.json(
        {
          error: `Tour "${tour.name}" was created, but slot generation failed: ${slotError.message}`,
          sqlFallback,
        },
        { status: 500 },
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
    return NextResponse.json(
      { error: `Business created, but plan lookup failed: ${planError.message}`, sqlFallback },
      { status: 500 },
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
      return NextResponse.json(
        { error: `Business created, but subscription creation failed: ${subscriptionError.message}`, sqlFallback },
        { status: 500 },
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
        metadata: buildSafeLandingPageMetadata(payload, businessId),
      })
      .select("id")
      .single();

    if (landingPageError) {
      return NextResponse.json(
        {
          error: `Business created, but landing page order creation failed: ${landingPageError.message}`,
          sqlFallback,
        },
        { status: 500 },
      );
    }

    landingPageOrderId = landingPageRow?.id || null;
  }

  const nextSteps = [
    payload.billing.whatsappKeysProvidedLater
      ? "Save the tenant's WhatsApp access token and phone ID later through the encrypted credential flow before go-live."
      : "Verify the saved WhatsApp token and phone ID against the correct tenant phone number before go-live.",
    payload.billing.yocoKeyProvidedLater
      ? "Save the tenant's Yoco secret key and webhook signing secret later through the encrypted credential flow before taking payments."
      : "Verify the saved Yoco secret key and webhook signing secret before testing the payment flow.",
    "Review the landing page order metadata in SQL for tenant slug, domain, brand details, and client content not mapped to dedicated columns yet.",
    "Run one end-to-end test booking to verify booking creation, payment, confirmation, and cancellation policy behavior.",
    "Review the operator runbook in docs/NEW_CLIENT_SETUP.md for the remaining deployment-specific steps.",
  ];

  return NextResponse.json({
    ok: true,
    businessId,
    adminId: adminRow.id,
    subscriptionId,
    landingPageOrderId,
    toursCreated,
    slotsCreated,
    businessName: payload.business.businessName,
    knowledgeBasePreview: buildKnowledgeBase(payload),
    nextSteps,
  });
}
