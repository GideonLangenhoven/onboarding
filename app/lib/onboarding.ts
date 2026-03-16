export type PlanId = "starter" | "growth" | "pro";

export type TourPayload = {
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

export type FaqPayload = {
  question: string;
  answer: string;
};

export type OnboardingPayload = {
  inviteCode: string;
  business: {
    businessName: string;
    legalName: string;
    tagline: string;
    industry: string;
    yearEstablished: string;
    ownerName: string;
    ownerEmail: string;
    confirmOwnerEmail: string;
    ownerPhone: string;
    operatorEmail: string;
    adminPassword: string;
    tenantSlug: string;
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
  credentials: {
    waAccessToken: string;
    waPhoneId: string;
    yocoSecretKey: string;
    yocoWebhookSecret: string;
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
  billing: {
    planId: PlanId;
    landingPageRequested: boolean;
    pagesRequested: string;
    hostingActive: boolean;
    yocoKeyProvidedLater: boolean;
    whatsappKeysProvidedLater: boolean;
  };
  notes: string;
  faqs: FaqPayload[];
  tours: TourPayload[];
};

export type SubmitResult = {
  ok: boolean;
  businessId: string;
  adminId: string;
  subscriptionId: string | null;
  landingPageOrderId: string | null;
  toursCreated: number;
  slotsCreated: number;
  businessName: string;
  nextSteps: string[];
};

export const TIMEZONE_OPTIONS = [
  "Africa/Johannesburg",
  "UTC",
  "Africa/Cairo",
  "Africa/Lagos",
  "America/Anchorage",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/New_York",
  "America/Phoenix",
  "Asia/Bangkok",
  "Asia/Dubai",
  "Asia/Hong_Kong",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Perth",
  "Australia/Sydney",
  "Europe/Amsterdam",
  "Europe/Berlin",
  "Europe/London",
  "Europe/Paris",
] as const;

const VALID_TIMEZONES = new Set<string>(TIMEZONE_OPTIONS);

function trim(value: string | undefined | null) {
  return String(value || "").trim();
}

function trimLower(value: string | undefined | null) {
  return trim(value).toLowerCase();
}

export function slugify(value: string) {
  return trim(value)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isValidTimezone(value: string) {
  return VALID_TIMEZONES.has(trim(value));
}

export function toNumber(value: string, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

export function normalizeOnboardingPayload(payload: OnboardingPayload): OnboardingPayload {
  const businessName = trim(payload.business.businessName);
  const normalizedSlug = slugify(payload.business.tenantSlug || businessName);

  return {
    inviteCode: trim(payload.inviteCode),
    business: {
      businessName,
      legalName: trim(payload.business.legalName),
      tagline: trim(payload.business.tagline),
      industry: trim(payload.business.industry),
      yearEstablished: trim(payload.business.yearEstablished),
      ownerName: trim(payload.business.ownerName),
      ownerEmail: trimLower(payload.business.ownerEmail),
      confirmOwnerEmail: trimLower(payload.business.confirmOwnerEmail),
      ownerPhone: trim(payload.business.ownerPhone),
      operatorEmail: trimLower(payload.business.operatorEmail),
      adminPassword: trim(payload.business.adminPassword),
      tenantSlug: normalizedSlug,
      bookingDomain: trimLower(payload.business.bookingDomain),
    },
    branding: {
      logoUrl: trim(payload.branding.logoUrl),
      heroEyebrow: trim(payload.branding.heroEyebrow),
      heroTitle: trim(payload.branding.heroTitle),
      heroSubtitle: trim(payload.branding.heroSubtitle),
      chatbotAvatar: trim(payload.branding.chatbotAvatar),
      colorMain: trim(payload.branding.colorMain),
      colorSecondary: trim(payload.branding.colorSecondary),
      colorCta: trim(payload.branding.colorCta),
      colorBg: trim(payload.branding.colorBg),
      colorNav: trim(payload.branding.colorNav),
      colorHover: trim(payload.branding.colorHover),
    },
    operations: {
      timezone: trim(payload.operations.timezone),
      meetingPoint: trim(payload.operations.meetingPoint),
      city: trim(payload.operations.city),
      arriveEarlyMinutes: trim(payload.operations.arriveEarlyMinutes),
      googleMapsUrl: trim(payload.operations.googleMapsUrl),
      facilities: trim(payload.operations.facilities),
      parkingInfo: trim(payload.operations.parkingInfo),
      whatToBring: trim(payload.operations.whatToBring),
      whatToWear: trim(payload.operations.whatToWear),
      safetyInfo: trim(payload.operations.safetyInfo),
      officeHours: trim(payload.operations.officeHours),
      reviewUrl: trim(payload.operations.reviewUrl),
      whatsappPhone: trim(payload.operations.whatsappPhone),
    },
    credentials: {
      waAccessToken: trim(payload.credentials.waAccessToken),
      waPhoneId: trim(payload.credentials.waPhoneId),
      yocoSecretKey: trim(payload.credentials.yocoSecretKey),
      yocoWebhookSecret: trim(payload.credentials.yocoWebhookSecret),
    },
    automations: {
      aiPersona: trim(payload.automations.aiPersona),
      reminderEnabled: Boolean(payload.automations.reminderEnabled),
      reviewRequestEnabled: Boolean(payload.automations.reviewRequestEnabled),
      reengagementEnabled: Boolean(payload.automations.reengagementEnabled),
      notes: trim(payload.automations.notes),
    },
    policies: {
      freeCancelHoursBefore: trim(payload.policies.freeCancelHoursBefore),
      noRefundWithinHours: trim(payload.policies.noRefundWithinHours),
      partialRefundHoursBefore: trim(payload.policies.partialRefundHoursBefore),
      partialRefundPercent: trim(payload.policies.partialRefundPercent),
      rescheduleAllowedHoursBefore: trim(payload.policies.rescheduleAllowedHoursBefore),
      loyaltyBookingsThreshold: trim(payload.policies.loyaltyBookingsThreshold),
      loyaltyDiscountPercent: trim(payload.policies.loyaltyDiscountPercent),
      loyaltyPeriodDays: trim(payload.policies.loyaltyPeriodDays),
      groupDiscountMinQty: trim(payload.policies.groupDiscountMinQty),
      groupDiscountPercent: trim(payload.policies.groupDiscountPercent),
    },
    billing: {
      planId: payload.billing.planId,
      landingPageRequested: Boolean(payload.billing.landingPageRequested),
      pagesRequested: trim(payload.billing.pagesRequested),
      hostingActive: Boolean(payload.billing.hostingActive),
      yocoKeyProvidedLater: Boolean(payload.billing.yocoKeyProvidedLater),
      whatsappKeysProvidedLater: Boolean(payload.billing.whatsappKeysProvidedLater),
    },
    notes: trim(payload.notes),
    faqs: payload.faqs.map((faq) => ({
      question: trim(faq.question),
      answer: trim(faq.answer),
    })),
    tours: payload.tours.map((tour) => ({
      name: trim(tour.name),
      description: trim(tour.description),
      durationMinutes: trim(tour.durationMinutes),
      basePrice: trim(tour.basePrice),
      peakPrice: trim(tour.peakPrice),
      defaultCapacity: trim(tour.defaultCapacity),
      imageUrl: trim(tour.imageUrl),
      slotStartDate: trim(tour.slotStartDate),
      slotEndDate: trim(tour.slotEndDate),
      slotTimes: tour.slotTimes.map((time) => trim(time)).filter(Boolean),
      operatingDays: [...new Set(tour.operatingDays)].sort((left, right) => left - right),
      inclusions: trim(tour.inclusions),
      exclusions: trim(tour.exclusions),
      restrictions: trim(tour.restrictions),
    })),
  };
}

export function buildSafeLandingPageMetadata(payload: OnboardingPayload, businessId: string) {
  return {
    source: "activityhub-onboarding",
    created_for_business_id: businessId,
    business_profile: {
      business_name: payload.business.businessName,
      legal_name: payload.business.legalName,
      tagline: payload.business.tagline,
      industry: payload.business.industry,
      year_established: payload.business.yearEstablished,
      owner_name: payload.business.ownerName,
      owner_email: payload.business.ownerEmail,
      owner_phone: payload.business.ownerPhone,
      operator_email: payload.business.operatorEmail,
      tenant_slug: payload.business.tenantSlug,
      booking_domain: payload.business.bookingDomain,
    },
    operations: payload.operations,
    branding: payload.branding,
    policies: payload.policies,
    automations: payload.automations,
    faqs: payload.faqs,
    tours: payload.tours,
    operator_notes: payload.notes,
    credentials_status: {
      whatsapp_keys_provided_later: payload.billing.whatsappKeysProvidedLater,
      yoco_key_provided_later: payload.billing.yocoKeyProvidedLater,
      whatsapp_configured_now:
        Boolean(payload.credentials.waAccessToken) && Boolean(payload.credentials.waPhoneId),
      yoco_configured_now:
        Boolean(payload.credentials.yocoSecretKey) && Boolean(payload.credentials.yocoWebhookSecret),
    },
  };
}

function sqlString(value: string) {
  return `'${value.replace(/'/g, "''")}'`;
}

function sqlNullableText(value: string) {
  return value ? sqlString(value) : "null";
}

function sqlJson(value: unknown) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function buildCredentialSql(payload: OnboardingPayload) {
  if (
    !payload.credentials.waAccessToken &&
    !payload.credentials.waPhoneId &&
    !payload.credentials.yocoSecretKey &&
    !payload.credentials.yocoWebhookSecret
  ) {
    return [
      "  -- Credentials were not supplied in this submission.",
      "  -- If needed, run public.set_app_settings_encryption_key(...) and public.set_business_credentials(...) in a secure service-role session after this migration.",
    ].join("\n");
  }

  return [
    "  -- Run the following in the same secure session after setting the encryption key.",
    "  -- Do not paste the platform encryption key into a client-facing screen or shared document.",
    "  PERFORM public.set_business_credentials(",
    "    v_business_id,",
    `    ${sqlNullableText(payload.credentials.waAccessToken)},`,
    `    ${sqlNullableText(payload.credentials.waPhoneId)},`,
    `    ${sqlNullableText(payload.credentials.yocoSecretKey)},`,
    `    ${sqlNullableText(payload.credentials.yocoWebhookSecret)}`,
    "  );",
  ].join("\n");
}

export function createSlotRows(tourId: string, businessId: string, payload: TourPayload) {
  if (!payload.slotStartDate || !payload.slotEndDate) return [];

  const validTimes = payload.slotTimes.filter(Boolean);
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

export function buildManualSqlFallback(payload: OnboardingPayload) {
  const metadata = buildSafeLandingPageMetadata(payload, "__BUSINESS_ID__");
  const toursSql = payload.tours
    .filter((tour) => tour.name)
    .map((tour, index) => {
      const slots = createSlotRows("__TOUR_ID__", "__BUSINESS_ID__", tour);
      const slotValues = slots
        .map(
          (slot) =>
            `      (v_business_id, v_tour_id, ${sqlString(slot.start_time)}, ${slot.capacity_total}, 0, 0, 'OPEN')`,
        )
        .join(",\n");

      return [
        `  -- Tour ${index + 1}: ${tour.name}`,
        "  INSERT INTO public.tours (",
        "    business_id,",
        "    name,",
        "    description,",
        "    base_price_per_person,",
        "    peak_price_per_person,",
        "    duration_minutes,",
        "    active,",
        "    hidden,",
        "    image_url,",
        "    default_capacity,",
        "    sort_order",
        "  )",
        "  VALUES (",
        "    v_business_id,",
        `    ${sqlString(tour.name)},`,
        `    ${sqlString(
          [tour.description, tour.inclusions ? `Includes: ${tour.inclusions}` : "", tour.exclusions ? `Excludes: ${tour.exclusions}` : "", tour.restrictions ? `Restrictions: ${tour.restrictions}` : ""]
            .filter(Boolean)
            .join("\n\n"),
        )},`,
        `    ${toNumber(tour.basePrice, 0)},`,
        `    ${tour.peakPrice ? toNumber(tour.peakPrice, 0) : "null"},`,
        `    ${toNumber(tour.durationMinutes, 90)},`,
        "    true,",
        "    false,",
        `    ${sqlNullableText(tour.imageUrl)},`,
        `    ${Math.max(1, toNumber(tour.defaultCapacity, 10))},`,
        `    ${index}`,
        "  )",
        "  RETURNING id INTO v_tour_id;",
        slotValues
          ? [
              "  INSERT INTO public.slots (business_id, tour_id, start_time, capacity_total, booked, held, status)",
              "  VALUES",
              slotValues + ";",
            ].join("\n")
          : "",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");

  return [
    "CREATE EXTENSION IF NOT EXISTS pgcrypto;",
    "",
    "-- Review existing rows before running this fallback to avoid duplicate businesses, admins, subscriptions, or tours.",
    "-- Run this script in a trusted admin session only.",
    "",
    "DO $onboarding$",
    "DECLARE",
    "  v_business_id uuid;",
    "  v_tour_id uuid;",
    "BEGIN",
    "  INSERT INTO public.businesses (",
    "    name,",
    "    business_name,",
    "    business_tagline,",
    "    operator_email,",
    "    timezone,",
    "    logo_url,",
    "    directions,",
    "    terms_conditions,",
    "    privacy_policy,",
    "    cookies_policy,",
    "    color_main,",
    "    color_secondary,",
    "    color_cta,",
    "    color_bg,",
    "    color_nav,",
    "    color_hover,",
    "    chatbot_avatar,",
    "    hero_eyebrow,",
    "    hero_title,",
    "    hero_subtitle",
    "  )",
    "  VALUES (",
    `    ${sqlString(payload.business.businessName)},`,
    `    ${sqlString(payload.business.businessName)},`,
    `    ${sqlNullableText(payload.business.tagline)},`,
    `    ${sqlNullableText(payload.business.operatorEmail || payload.business.ownerEmail)},`,
    `    ${sqlString(payload.operations.timezone)},`,
    `    ${sqlNullableText(payload.branding.logoUrl)},`,
    `    ${sqlString(
      [
        `Meeting point: ${payload.operations.meetingPoint}`,
        payload.operations.googleMapsUrl ? `Map: ${payload.operations.googleMapsUrl}` : "",
        payload.operations.parkingInfo ? `Parking: ${payload.operations.parkingInfo}` : "",
        payload.operations.facilities ? `Facilities: ${payload.operations.facilities}` : "",
        `Arrive ${toNumber(payload.operations.arriveEarlyMinutes, 15)} minutes early.`,
      ]
        .filter(Boolean)
        .join("\n\n"),
    )},`,
    `    ${sqlString(
      [
        `${payload.business.businessName} onboarding-generated booking terms.`,
        `Free cancellation window: ${toNumber(payload.policies.freeCancelHoursBefore, 24)} hours before departure.`,
        `No refund within: ${toNumber(payload.policies.noRefundWithinHours, 24)} hours before departure.`,
        `Partial refund: ${toNumber(payload.policies.partialRefundPercent, 95)}% if cancelled ${toNumber(payload.policies.partialRefundHoursBefore, 48)} hours or more before departure.`,
        `Reschedule allowed until ${toNumber(payload.policies.rescheduleAllowedHoursBefore, 24)} hours before departure.`,
        payload.operations.safetyInfo,
      ]
        .filter(Boolean)
        .join("\n\n"),
    )},`,
    `    ${sqlString(
      [
        `${payload.business.businessName} uses client contact details to manage bookings, reminders, and operational updates.`,
        `Primary operator contact: ${payload.business.operatorEmail || payload.business.ownerEmail}.`,
        "This placeholder policy should be reviewed before launch, especially if payment, CRM, or WhatsApp integrations are enabled.",
      ].join("\n\n"),
    )},`,
    `    ${sqlString(
      [
        `${payload.business.businessName} uses cookies and local storage to keep the booking and onboarding experience stable.`,
        "Review and replace this placeholder policy before public launch if the final site includes analytics or marketing scripts.",
      ].join("\n\n"),
    )},`,
    `    ${sqlString(payload.branding.colorMain || "#185f75")},`,
    `    ${sqlString(payload.branding.colorSecondary || "#132833")},`,
    `    ${sqlString(payload.branding.colorCta || "#ca6c2f")},`,
    `    ${sqlString(payload.branding.colorBg || "#f5efe4")},`,
    `    ${sqlString(payload.branding.colorNav || "#fffaf2")},`,
    `    ${sqlString(payload.branding.colorHover || "#ffd9bf")},`,
    `    ${sqlNullableText(payload.branding.chatbotAvatar)},`,
    `    ${sqlNullableText(payload.branding.heroEyebrow)},`,
    `    ${sqlString(payload.branding.heroTitle)},`,
    `    ${sqlNullableText(payload.branding.heroSubtitle)}`,
    "  )",
    "  RETURNING id INTO v_business_id;",
    "",
    "  INSERT INTO public.admin_users (",
    "    business_id,",
    "    email,",
    "    name,",
    "    role,",
    "    password_hash,",
    "    must_set_password,",
    "    password_set_at",
    "  )",
    "  VALUES (",
    "    v_business_id,",
    `    ${sqlString(payload.business.ownerEmail)},`,
    `    ${sqlString(payload.business.ownerName)},`,
    "    'MAIN_ADMIN',",
    `    encode(digest(${sqlString(payload.business.adminPassword)}, 'sha256'), 'hex'),`,
    "    false,",
    "    now()",
    "  );",
    "",
    "  INSERT INTO public.policies (",
    "    business_id,",
    "    free_cancel_hours_before,",
    "    no_refund_within_hours,",
    "    partial_refund_hours_before,",
    "    partial_refund_percent,",
    "    reschedule_allowed_hours_before,",
    "    loyalty_bookings_threshold,",
    "    loyalty_discount_percent,",
    "    loyalty_period_days,",
    "    group_discount_min_qty,",
    "    group_discount_percent",
    "  )",
    "  VALUES (",
    "    v_business_id,",
    `    ${toNumber(payload.policies.freeCancelHoursBefore, 24)},`,
    `    ${toNumber(payload.policies.noRefundWithinHours, 24)},`,
    `    ${toNumber(payload.policies.partialRefundHoursBefore, 48)},`,
    `    ${toNumber(payload.policies.partialRefundPercent, 95)},`,
    `    ${toNumber(payload.policies.rescheduleAllowedHoursBefore, 24)},`,
    `    ${toNumber(payload.policies.loyaltyBookingsThreshold, 2)},`,
    `    ${toNumber(payload.policies.loyaltyDiscountPercent, 10)},`,
    `    ${toNumber(payload.policies.loyaltyPeriodDays, 365)},`,
    `    ${toNumber(payload.policies.groupDiscountMinQty, 6)},`,
    `    ${toNumber(payload.policies.groupDiscountPercent, 5)}`,
    "  );",
    "",
    "  IF EXISTS (SELECT 1 FROM public.plans WHERE id = " + sqlString(payload.billing.planId) + " AND active = true) THEN",
    "    INSERT INTO public.subscriptions (business_id, plan_id, status, period_start)",
    "    VALUES (v_business_id, " + sqlString(payload.billing.planId) + ", 'ACTIVE', CURRENT_DATE);",
    "  END IF;",
    "",
    payload.billing.landingPageRequested
      ? [
          "  INSERT INTO public.landing_page_orders (",
          "    business_id,",
          "    base_page_count,",
          "    extra_page_count,",
          "    build_total_zar,",
          "    hosting_active,",
          "    hosting_fee_zar,",
          "    status,",
          "    metadata",
          "  )",
          "  VALUES (",
          "    v_business_id,",
          "    1,",
          `    ${Math.max(0, Math.max(1, toNumber(payload.billing.pagesRequested, 1)) - 1)},`,
          `    ${3500 + Math.max(0, Math.max(1, toNumber(payload.billing.pagesRequested, 1)) - 1) * 1500},`,
          `    ${payload.billing.hostingActive ? "true" : "false"},`,
          "    500,",
          "    'ACTIVE',",
          `    ${sqlJson(metadata)}`,
          "  );",
          "",
        ].join("\n")
      : "",
    buildCredentialSql(payload),
    toursSql ? `\n${toursSql}\n` : "",
    "END",
    "$onboarding$;",
  ]
    .filter(Boolean)
    .join("\n");
}
