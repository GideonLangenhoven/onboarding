import type { GuideKey, FeatureKey, FormState, TourDraft, FaqDraft } from "./types";

export const GUIDE_CONTENT: Record<
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

export const PLAN_OPTIONS = [
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

export const FEATURE_ORDER: FeatureKey[] = [
  "storefront",
  "chat",
  "operations",
  "automation",
  "reports",
  "billing",
];

export const PRODUCT_PRESENTATION: Record<
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

export const DAY_OPTIONS = [
  { label: "Sun", value: 0 },
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
];

export function createTour(): TourDraft {
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

export function createFaq(): FaqDraft {
  return {
    question: "",
    answer: "",
  };
}

export const INITIAL_STATE: FormState = {
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
    confirmPassword: "",
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
    waPhoneId: "",
    yocoSecretKey: "",
    yocoWebhookSecret: "",
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
