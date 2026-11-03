import type { Values } from "./onboarding";
import { isValidTimezone } from "./onboarding";

/** The step names the edge function accepts for save-step. */
export type Section = "identity" | "branding" | "operations" | "refunds" | "faqs" | "tours";

/** Exactly the columns each section is allowed to write. */
export const SECTION_KEYS: Record<Exclude<Section, "tours">, string[]> = {
  identity: [
    "name",
    "business_name",
    "business_tagline",
    "business_address",
    "timezone",
    "currency",
    "google_place_id",
    "social_google_reviews",
    "operator_email",
    "notification_email",
  ],
  branding: [
    "logo_url",
    "color_main",
    "color_secondary",
    "color_cta",
    "hero_eyebrow",
    "hero_title",
    "hero_subtitle",
  ],
  operations: [
    "meeting_point",
    "meeting_point_address",
    "directions",
    "arrival_instructions",
    "what_to_bring",
    "what_to_wear",
    "activity_noun",
    "activity_verb_past",
  ],
  refunds: ["refund_policy_tiers", "refund_policy_text"],
  faqs: ["faq_json", "ai_system_prompt"],
};

export type StepId =
  | "welcome"
  | "business"
  | "location"
  | "look"
  | "headline"
  | "meeting"
  | "guests"
  | "refunds"
  | "tours"
  | "assistant"
  | "whatsapp"
  | "review"
  | "finish";

export type Step = {
  id: StepId;
  /** null means this screen has nothing to save through save-step. */
  section: Section | null;
  /** Shown in the progress rail. */
  chapter: string;
  title: string;
  intro?: string;
  validate?: (values: Values) => string | null;
};

const email = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const STEPS: Step[] = [
  {
    id: "welcome",
    section: null,
    chapter: "Welcome",
    title: "Let's get you taking bookings",
  },
  {
    id: "business",
    section: "identity",
    chapter: "Your business",
    title: "Tell us about your business",
    intro: "This is the name guests see on your booking site and on every confirmation.",
    validate: (v) =>
      !v.business_name?.trim()
        ? "Please enter your business name."
        : !email(v.operator_email || "")
          ? "Please enter a valid email address for your bookings."
          : v.notification_email?.trim() && !email(v.notification_email)
            ? "The booking alerts address does not look right."
            : null,
  },
  {
    id: "location",
    section: "identity",
    chapter: "Your business",
    title: "Where are you based?",
    intro: "Find yourself on Google and we fill in your address and link your reviews.",
    validate: (v) =>
      isValidTimezone(v.timezone || "") ? null : "Please choose the time zone you operate in.",
  },
  {
    id: "look",
    section: "branding",
    chapter: "Your brand",
    title: "Make it look like you",
    intro: "Add your logo and colours. Watch the preview update as you go.",
  },
  {
    id: "headline",
    section: "branding",
    chapter: "Your brand",
    title: "Write your headline",
    intro: "The first thing guests read on your booking site.",
  },
  {
    id: "meeting",
    section: "operations",
    chapter: "On the day",
    title: "Where do guests meet you?",
    intro: "Your main meeting point, used for every tour unless you give a tour its own. It goes into every confirmation and reminder, so be specific.",
  },
  {
    id: "guests",
    section: "operations",
    chapter: "On the day",
    title: "Help guests arrive prepared",
  },
  {
    id: "refunds",
    section: "refunds",
    chapter: "Policies",
    title: "Your cancellation policy",
    intro: "How much a guest gets back depending on how early they cancel. Most operators keep our default.",
  },
  {
    id: "tours",
    section: "tours",
    chapter: "Your tours",
    title: "What do you sell?",
    intro: "Add each tour with its price and the times you run it. You can add more later.",
    validate: () => null,
  },
  {
    id: "assistant",
    section: "faqs",
    chapter: "AI assistant",
    title: "Teach your assistant",
    intro: "Your assistant answers guests on your site and WhatsApp, day and night.",
  },
  {
    id: "whatsapp",
    section: null,
    chapter: "WhatsApp",
    title: "Connect your WhatsApp number",
    intro:
      "Guests message this number and your assistant replies, day and night. It takes about five minutes with your phone next to you. No phone with you? Press Continue and come back to this step before you go live.",
  },
  {
    id: "review",
    section: null,
    chapter: "Go live",
    title: "Check everything, then go live",
    intro: "Your booking site opens the moment you press the button. You can change anything later.",
  },
  {
    id: "finish",
    section: null,
    chapter: "Go live",
    title: "You're live",
  },
];

/** Screens after this point run once the tenant is trading, so nothing before it may be edited. */
export const REVIEW_INDEX = STEPS.findIndex((s) => s.id === "review");
export const FINISH_INDEX = STEPS.length - 1;

export const CHAPTERS = [...new Set(STEPS.map((s) => s.chapter))];

/**
 * The server only remembers which section was last saved. Resume at the first
 * screen of that section: any screen already answered comes back pre-filled,
 * so re-confirming one or two is cheaper than skipping an unanswered one.
 */
export function stepIndexForSection(section: string | null | undefined) {
  if (!section) return 0;
  if (section === "go-live" || section === "done") return FINISH_INDEX;
  const index = STEPS.findIndex((step) => step.section === section);
  return index === -1 ? 0 : index;
}
