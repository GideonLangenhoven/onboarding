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

export const CURRENCY_OPTIONS = ["ZAR", "USD", "EUR", "GBP", "AUD", "NAD"] as const;

export const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function isValidTimezone(value: string) {
  return VALID_TIMEZONES.has(String(value || "").trim());
}

export function slugify(value: string) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

export type ScheduleRange = {
  start_date: string;
  end_date: string;
  times: string[];
  days_of_week: number[];
};

export type TourDraft = {
  id?: string;
  name: string;
  base_price_per_person: string;
  duration_minutes: string;
  default_capacity: string;
  description: string;
  ranges: ScheduleRange[];
  slot_count?: number;
};

export type RefundTier = { hours_before: number; refund_percent: number };

export type Faq = { question: string; answer: string };

/** Every business-column answer, held as a string and coerced by the server. */
export type Values = Record<string, string>;

export type Credentials = {
  yoco_configured?: boolean;
  yoco_webhook_status?: string;
  wa_status?: "connected" | "pending";
};

export type Readiness = Record<string, boolean | string | number | null>;

const ADMIN_DOMAIN = "admin.bookingtours.co.za";

/** Mirrors adminOriginFor in the onboarding-wizard edge function. */
export function adminUrlFor(subdomain?: string) {
  return subdomain ? `https://${subdomain}.${ADMIN_DOMAIN}` : `https://${ADMIN_DOMAIN}`;
}

export function money(currency: string | undefined, amount: string | number) {
  const value = Number(amount);
  if (!(value > 0)) return "";
  try {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: currency || "ZAR",
      maximumFractionDigits: value % 1 ? 2 : 0,
    }).format(value);
  } catch {
    return `${currency || "ZAR"} ${value}`;
  }
}

export function duration(minutes: string | number) {
  const m = Number(minutes) || 0;
  if (m <= 0) return "";
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return [h ? `${h}h` : "", rest ? `${rest}m` : ""].filter(Boolean).join(" ");
}

/** Everything a step screen is given by the wizard. */
export type StepContext = {
  token: string;
  values: Values;
  set: (patch: Values) => void;
  tours: TourDraft[];
  setTours: (next: TourDraft[]) => void;
  creds: Credentials;
  refresh: () => Promise<void>;
  bookingSiteUrl: string;
  /** The tenant's own admin console, {subdomain}.admin.bookingtours.co.za. */
  adminUrl: string;
  businessName: string;
  goNext: () => void;
  goTo: (stepId: string) => void;
  /** Called by the review screen once go-live has switched the tenant on. */
  markLive: (readiness: Readiness) => void;
  readiness: Readiness | null;
};

export function emptyRange(): ScheduleRange {
  return { start_date: today(), end_date: "", times: ["09:00"], days_of_week: [1, 2, 3, 4, 5, 6, 0] };
}

export function emptyTour(): TourDraft {
  return {
    name: "",
    base_price_per_person: "",
    duration_minutes: "120",
    default_capacity: "10",
    description: "",
    ranges: [emptyRange()],
  };
}

/**
 * Client-side preview only. The server does the real slot generation, this just
 * tells the operator roughly how many time slots they are about to create.
 */
export function countSlots(ranges: ScheduleRange[]) {
  let total = 0;
  for (const range of ranges) {
    const times = range.times.filter(Boolean);
    if (!range.start_date || !range.end_date || times.length === 0) continue;
    if (range.days_of_week.length === 0) continue;

    const start = new Date(`${range.start_date}T00:00:00`);
    const end = new Date(`${range.end_date}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) continue;

    for (const day = new Date(start); day <= end; day.setDate(day.getDate() + 1)) {
      if (range.days_of_week.includes(day.getDay())) total += times.length;
    }
  }
  return total;
}
