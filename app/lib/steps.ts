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
  | "identity-name"
  | "identity-place"
  | "identity-locale"
  | "identity-contact"
  | "branding-logo"
  | "branding-colors"
  | "branding-hero"
  | "ops-meeting"
  | "ops-bring"
  | "ops-words"
  | "refunds"
  | "tours"
  | "faqs"
  | "persona"
  | "whatsapp"
  | "yoco"
  | "golive"
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
    chapter: "Start",
    title: "Welcome",
  },
  {
    id: "identity-name",
    section: "identity",
    chapter: "Your business",
    title: "What is your business called?",
    intro: "This is the name guests will see on your booking site and on their confirmations.",
    validate: (v) => (v.business_name?.trim() ? null : "Please enter your business name."),
  },
  {
    id: "identity-place",
    section: "identity",
    chapter: "Your business",
    title: "Where are you based?",
    intro: "We can look you up on Google and fill this in for you.",
  },
  {
    id: "identity-locale",
    section: "identity",
    chapter: "Your business",
    title: "Your time zone and currency",
    intro: "Everything, from booking times to reminder messages, follows your local time.",
    validate: (v) =>
      isValidTimezone(v.timezone || "") ? null : "Please choose the time zone you operate in.",
  },
  {
    id: "identity-contact",
    section: "identity",
    chapter: "Your business",
    title: "Where should we send your bookings?",
    intro: "Every new booking lands in this inbox.",
    validate: (v) =>
      email(v.operator_email || "") ? null : "Please enter a valid email address.",
  },
  {
    id: "branding-logo",
    section: "branding",
    chapter: "Your look",
    title: "Add your logo",
    intro: "Upload a logo, or skip this and add one later.",
  },
  {
    id: "branding-colors",
    section: "branding",
    chapter: "Your look",
    title: "Pick your colours",
    intro: "If you already have a website we can borrow the colours from it.",
  },
  {
    id: "branding-hero",
    section: "branding",
    chapter: "Your look",
    title: "The first thing guests read",
    intro: "This is the headline across the top of your booking site.",
  },
  {
    id: "ops-meeting",
    section: "operations",
    chapter: "On the day",
    title: "Where do guests meet you?",
    intro: "This goes into every confirmation and reminder, so be specific.",
  },
  {
    id: "ops-bring",
    section: "operations",
    chapter: "On the day",
    title: "What should guests bring and wear?",
  },
  {
    id: "ops-words",
    section: "operations",
    chapter: "On the day",
    title: "How do you describe what you do?",
    intro: "We use these words in messages, for example \"your paddle\" or \"you paddled\".",
  },
  {
    id: "refunds",
    section: "refunds",
    chapter: "Money",
    title: "Your cancellation policy",
    intro: "Set how much a guest gets back depending on how early they cancel.",
  },
  {
    id: "tours",
    section: "tours",
    chapter: "Your tours",
    title: "What do you sell?",
    intro: "Add each tour with its price and the times you run it.",
    validate: () => null,
  },
  {
    id: "faqs",
    section: "faqs",
    chapter: "Your assistant",
    title: "Questions guests always ask",
    intro: "Your AI assistant answers these automatically, day and night.",
  },
  {
    id: "persona",
    section: "faqs",
    chapter: "Your assistant",
    title: "How should your assistant sound?",
  },
  {
    id: "whatsapp",
    section: null,
    chapter: "Connections",
    title: "WhatsApp",
  },
  {
    id: "yoco",
    section: null,
    chapter: "Connections",
    title: "Taking payments",
  },
  {
    id: "golive",
    section: null,
    chapter: "Go live",
    title: "Ready to go live",
  },
  {
    id: "finish",
    section: null,
    chapter: "Go live",
    title: "You are live",
  },
];

export const CHAPTERS = [...new Set(STEPS.map((s) => s.chapter))];

/**
 * The server only remembers which section was last saved. Resume at the first
 * screen of that section: any screen already answered comes back pre-filled,
 * so re-confirming one or two is cheaper than skipping an unanswered one.
 */
export function stepIndexForSection(section: string | null | undefined) {
  if (!section) return 0;
  const index = STEPS.findIndex((step) => step.section === section);
  return index === -1 ? 0 : index;
}
