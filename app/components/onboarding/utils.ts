import type { FormState, TourDraft } from "./types";

export function countCompleted(form: FormState) {
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

export function slugify(value: string) {
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

export function toNumber(value: string, fallback = 0) {
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
    source: "bookingtours-onboarding",
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

export function buildFallbackSql(form: FormState) {
  const normalizedBusinessName = form.business.businessName.trim();
  const normalizedOwnerEmail = form.business.ownerEmail.trim().toLowerCase();
  const normalizedOperatorEmail =
    form.business.operatorEmail.trim().toLowerCase() || normalizedOwnerEmail;
  const tenantSlug = slugify(form.business.tenantSlug || form.business.businessName);
  const metadataJson = JSON.stringify(buildLandingPageMetadata(form));
  const statements: string[] = [
    "-- BookingTours onboarding fallback migration",
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

export function downloadSql(filename: string, sql: string) {
  const blob = new Blob([sql], { type: "text/sql;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
