"use client";

import type { SubmitResult } from "@/app/lib/onboarding";

type IntegrationFlags = {
  yocoProvided: boolean;
  whatsappProvided: boolean;
  tenantSlug: string;
  adminEmail: string;
  bookingDomain: string;
};

type Props = {
  result: SubmitResult;
  flags: IntegrationFlags;
};

type StatusLevel = "done" | "pending" | "action";

type StatusItem = {
  level: StatusLevel;
  title: string;
  detail: string;
  instruction?: string;
};

function StatusIcon({ level }: { level: StatusLevel }) {
  if (level === "done") {
    return (
      <span className="status-icon status-icon--done" aria-label="Complete">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
          <path
            d="M6 10.5l2.5 2.5 5.5-5.5"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    );
  }
  if (level === "pending") {
    return (
      <span className="status-icon status-icon--pending" aria-label="Pending">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
          <circle cx="10" cy="10" r="4" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 7.5V10l1.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </span>
    );
  }
  return (
    <span className="status-icon status-icon--action" aria-label="Needs action">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.14" />
        <path d="M10 6v5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <circle cx="10" cy="14" r="1.2" fill="currentColor" />
      </svg>
    </span>
  );
}

function StatusRow({ item }: { item: StatusItem }) {
  return (
    <div className={`status-row status-row--${item.level}`}>
      <StatusIcon level={item.level} />
      <div className="status-row-content">
        <div className="status-row-header">
          <strong className="status-row-title">{item.title}</strong>
          <span className={`status-badge status-badge--${item.level}`}>{item.detail}</span>
        </div>
        {item.instruction ? (
          <p className="status-row-instruction">{item.instruction}</p>
        ) : null}
      </div>
    </div>
  );
}

function buildStatusSections(result: SubmitResult, flags: IntegrationFlags) {
  const sections: { heading: string; items: StatusItem[] }[] = [];

  // 1. Account Setup -- always complete
  sections.push({
    heading: "Account setup",
    items: [
      { level: "done", title: "Business created", detail: "Complete" },
      { level: "done", title: "Admin user created", detail: "Complete" },
      {
        level: "done",
        title: "Tours & slots generated",
        detail: `${result.toursCreated} tour${result.toursCreated !== 1 ? "s" : ""}, ${result.slotsCreated} slot${result.slotsCreated !== 1 ? "s" : ""}`,
      },
    ],
  });

  // 2. Payment Integration
  const paymentItems: StatusItem[] = [];
  if (flags.yocoProvided) {
    paymentItems.push({
      level: "done",
      title: "Yoco payment gateway",
      detail: "Connected",
    });
  } else {
    paymentItems.push({
      level: "pending",
      title: "Yoco payment gateway",
      detail: "Pending setup",
      instruction:
        "Provide your Yoco secret key and webhook signing secret through the admin dashboard settings before accepting payments.",
    });
  }
  sections.push({ heading: "Payment integration", items: paymentItems });

  // 3. WhatsApp Integration
  const waItems: StatusItem[] = [];
  if (flags.whatsappProvided) {
    waItems.push({
      level: "done",
      title: "WhatsApp Business API",
      detail: "Connected",
    });
  } else {
    waItems.push({
      level: "pending",
      title: "WhatsApp Business API",
      detail: "Pending setup",
      instruction:
        "Provide your WhatsApp Cloud API access token and phone number ID through the admin dashboard settings before enabling messaging.",
    });
  }
  sections.push({ heading: "WhatsApp integration", items: waItems });

  // 4. Booking Site
  const bookingUrl = flags.bookingDomain
    ? `https://${flags.bookingDomain}`
    : flags.tenantSlug
      ? `https://${flags.tenantSlug}.activityhub.co.za`
      : null;

  sections.push({
    heading: "Booking site",
    items: [
      {
        level: "done",
        title: "Multi-tenant booking site",
        detail: "Ready",
        instruction: bookingUrl
          ? `Your booking page: ${bookingUrl}`
          : undefined,
      },
    ],
  });

  // 5. Email Notifications
  sections.push({
    heading: "Email notifications",
    items: [
      {
        level: "action",
        title: "Verified email sender",
        detail: "Requires setup",
        instruction:
          "Contact support to verify your email domain with the Resend provider. Booking confirmations and receipts need a verified sender before going live.",
      },
    ],
  });

  return sections;
}

export default function SetupStatusDashboard({ result, flags }: Props) {
  const sections = buildStatusSections(result, flags);

  const adminUrl = flags.tenantSlug
    ? `https://admin.activityhub.co.za`
    : "#";

  const bookingUrl = flags.bookingDomain
    ? `https://${flags.bookingDomain}`
    : flags.tenantSlug
      ? `https://${flags.tenantSlug}.activityhub.co.za`
      : "#";

  return (
    <section className="status-dashboard">
      <div className="section-header">
        <p className="eyebrow">Submission complete</p>
        <h2>{result.businessName} is now live.</h2>
      </div>

      <div className="status-reference-grid">
        <div className="status-reference-card">
          <span className="metric-label">Business ID</span>
          <strong className="status-reference-value">{result.businessId}</strong>
        </div>
        <div className="status-reference-card">
          <span className="metric-label">Admin login</span>
          <strong className="status-reference-value">{flags.adminEmail}</strong>
        </div>
        {result.subscriptionId ? (
          <div className="status-reference-card">
            <span className="metric-label">Subscription</span>
            <strong className="status-reference-value">Active</strong>
          </div>
        ) : null}
        {result.landingPageOrderId ? (
          <div className="status-reference-card">
            <span className="metric-label">Landing page order</span>
            <strong className="status-reference-value">Submitted</strong>
          </div>
        ) : null}
      </div>

      <div className="status-sections">
        {sections.map((section) => (
          <div key={section.heading} className="status-section">
            <h3 className="status-section-heading">{section.heading}</h3>
            <div className="status-rows">
              {section.items.map((item) => (
                <StatusRow key={item.title} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="status-actions">
        <a
          href={adminUrl}
          className="primary-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Go to Admin Dashboard
        </a>
        <a
          href={bookingUrl}
          className="ghost-button"
          target="_blank"
          rel="noopener noreferrer"
        >
          Test Your Booking Site
        </a>
      </div>
    </section>
  );
}
