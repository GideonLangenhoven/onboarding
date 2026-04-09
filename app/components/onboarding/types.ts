export type GuideKey = "walkthrough" | "automation" | "manual" | "launch";
export type FeatureKey =
  | "storefront"
  | "chat"
  | "operations"
  | "automation"
  | "reports"
  | "billing";

export type TourDraft = {
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

export type FaqDraft = {
  question: string;
  answer: string;
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
  tenantSlug?: string;
  nextSteps: string[];
};

export type FormState = {
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
    confirmPassword: string;
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
