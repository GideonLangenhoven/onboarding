"use client";

import { useState, useRef, useEffect } from "react";
import type { FormState, TourDraft, FaqDraft } from "./types";
import { DAY_OPTIONS, createTour, createFaq } from "./constants";
import { slugify, toNumber, buildFallbackSql, downloadSql } from "./utils";

const WIZARD_STEPS = [
  { label: "Business", eyebrow: "1. Business owner", title: "Identity and access" },
  { label: "Brand", eyebrow: "2. Brand and website", title: "Booking-site presentation" },
  { label: "Operations", eyebrow: "3. Operational setup", title: "Meeting point, support, and client instructions" },
  { label: "Tours", eyebrow: "4. Tour catalogue", title: "Activities, pricing, and slot generation" },
  { label: "Policies", eyebrow: "5. Policies", title: "Discount and cancellation logic" },
  { label: "SOPs", eyebrow: "6. How you run your business", title: "Standard Operating Procedures" },
  { label: "AI Host", eyebrow: "7. Your Virtual Host", title: "AI tone and automatic messages" },
  { label: "FAQs", eyebrow: "8. Common Questions", title: "Teach your AI virtual host how to answer guests" },
  { label: "Payments & Chat", eyebrow: "9. Payments & WhatsApp", title: "Connect Yoco and WhatsApp Business API" },
  { label: "Launch", eyebrow: "10. Review", title: "Launch your business" },
];

export function OnboardingForm({
  form,
  setForm,
  submitting,
  submitError,
  onSubmit,
  onBack,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  submitting: boolean;
  submitError: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onBack?: () => void;
}) {
  const extraPages = Math.max(0, Number(form.billing.pagesRequested || "1") - 1);
  const landingBuildPrice = 3500 + extraPages * 1500;
  const migrationSql = buildFallbackSql(form);

  function updateBusinessName(value: string) {
    setForm((current) => {
      const previousSlug = slugify(current.business.tenantSlug);
      const previousNameSlug = slugify(current.business.businessName);
      const nextSlug =
        !current.business.tenantSlug.trim() || previousSlug === previousNameSlug
          ? slugify(value)
          : current.business.tenantSlug;

      return {
        ...current,
        business: {
          ...current.business,
          businessName: value,
          tenantSlug: nextSlug,
        },
      };
    });
  }

  function updateSection<K extends keyof FormState>(
    section: K,
    key: keyof FormState[K],
    value: string | boolean,
  ) {
    setForm((current) => ({
      ...current,
      [section]: {
        ...current[section],
        [key]: value,
      },
    }));
  }

  function updateTour(index: number, key: keyof TourDraft, value: string | number[]) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = { ...tours[index], [key]: value };
      return { ...current, tours };
    });
  }

  function updateFaq(index: number, key: keyof FaqDraft, value: string) {
    setForm((current) => {
      const faqs = [...current.faqs];
      faqs[index] = { ...faqs[index], [key]: value };
      return { ...current, faqs };
    });
  }

  function addTour() {
    setForm((current) => ({ ...current, tours: [...current.tours, createTour()] }));
  }

  function removeTour(index: number) {
    setForm((current) => ({
      ...current,
      tours: current.tours.filter((_, i) => i !== index),
    }));
  }

  function addTimeSlot(index: number) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = { ...tours[index], slotTimes: [...tours[index].slotTimes, ""] };
      return { ...current, tours };
    });
  }

  function removeTimeSlot(index: number, timeIndex: number) {
    setForm((current) => {
      const tours = [...current.tours];
      tours[index] = {
        ...tours[index],
        slotTimes: tours[index].slotTimes.filter((_, i) => i !== timeIndex),
      };
      return { ...current, tours };
    });
  }

  function updateTimeSlot(index: number, timeIndex: number, value: string) {
    setForm((current) => {
      const tours = [...current.tours];
      const nextTimes = [...tours[index].slotTimes];
      nextTimes[timeIndex] = value;
      tours[index] = { ...tours[index], slotTimes: nextTimes };
      return { ...current, tours };
    });
  }

  function toggleOperatingDay(index: number, day: number) {
    setForm((current) => {
      const tours = [...current.tours];
      const hasDay = tours[index].operatingDays.includes(day);
      tours[index] = {
        ...tours[index],
        operatingDays: hasDay
          ? tours[index].operatingDays.filter((v) => v !== day)
          : [...tours[index].operatingDays, day].sort(),
      };
      return { ...current, tours };
    });
  }

  function addFaq() {
    setForm((current) => ({ ...current, faqs: [...current.faqs, createFaq()] }));
  }

  function removeFaq(index: number) {
    setForm((current) => ({
      ...current,
      faqs: current.faqs.filter((_, i) => i !== index),
    }));
  }

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<"next" | "back">("next");
  const [animating, setAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  function goTo(next: number) {
    if (animating || next === step) return;
    setDirection(next > step ? "next" : "back");
    setAnimating(true);
    setTimeout(() => {
      setStep(next);
      setAnimating(false);
      contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  }

  const isLast = step === WIZARD_STEPS.length - 1;

  return (
    <form className="onboarding-form" onSubmit={onSubmit} ref={contentRef}>
      {/* ── Step content ── */}
      <div className={`wizard-panel ${animating ? (direction === "next" ? "slide-out-left" : "slide-out-right") : "slide-in"}`}>
        <div className="section-header compact" style={{ textAlign: "center", marginBottom: "0.75rem" }}>
          <p className="eyebrow">{WIZARD_STEPS[step].eyebrow}</p>
          <h2>{WIZARD_STEPS[step].title}</h2>
        </div>

      {step === 0 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label>
              Public business name
              <span className="field-hint">The name guests will see on your booking site</span>
              <input value={form.business.businessName} onChange={(e) => updateBusinessName(e.target.value)} placeholder="e.g. Coastline Adventures" required />
            </label>
            <label>
              Your unique link (URL)
              <span className="field-hint">Your subdomain at bookingtours.co.za</span>
              <input value={form.business.tenantSlug} onChange={(e) => updateSection("business", "tenantSlug", slugify(e.target.value))} placeholder="e.g. coastline-adventures" required />
            </label>
            <label>
              Legal entity name
              <span className="field-hint">Registered company name for invoices and terms</span>
              <input value={form.business.legalName} onChange={(e) => updateSection("business", "legalName", e.target.value)} placeholder="Coastline Adventures (Pty) Ltd" />
            </label>
            <label>
              Industry
              <span className="field-hint">Helps us tailor your booking site and AI assistant</span>
              <input value={form.business.industry} onChange={(e) => updateSection("business", "industry", e.target.value)} placeholder="Kayaking, diving, safari, tours" />
            </label>
            <label>
              Year established
              <span className="field-hint">Displayed on your booking site to build trust</span>
              <input value={form.business.yearEstablished} onChange={(e) => updateSection("business", "yearEstablished", e.target.value)} placeholder="2018" />
            </label>
            <label>
              Primary contact
              <span className="field-hint">Main person who manages bookings</span>
              <input value={form.business.ownerName} onChange={(e) => updateSection("business", "ownerName", e.target.value)} placeholder="Jane Smith" required />
            </label>
            <label>
              Primary email
              <span className="field-hint">Used to log in to your admin dashboard</span>
              <input type="email" value={form.business.ownerEmail} onChange={(e) => updateSection("business", "ownerEmail", e.target.value)} placeholder="jane@business.com" required />
            </label>
            <label>
              Primary phone
              <span className="field-hint">For account recovery and urgent notifications</span>
              <input value={form.business.ownerPhone} onChange={(e) => updateSection("business", "ownerPhone", e.target.value)} placeholder="+27 82 123 4567" required />
            </label>
            <label>
              Operator email
              <span className="field-hint">Daily operations contact, if different from above</span>
              <input type="email" value={form.business.operatorEmail} onChange={(e) => updateSection("business", "operatorEmail", e.target.value)} placeholder="ops@business.com" />
            </label>
            <label>
              Your admin password
              <span className="field-hint">You will use this to log in to your dashboard</span>
              <input type="password" value={form.business.adminPassword} onChange={(e) => updateSection("business", "adminPassword", e.target.value)} placeholder="Choose your first secure password" required />
            </label>
            <label>
              Confirm password
              <span className="field-hint">Type it again to make sure there are no typos</span>
              <input type="password" value={form.business.confirmPassword} onChange={(e) => updateSection("business", "confirmPassword", e.target.value)} placeholder="Type your password again to confirm" required />
              {form.business.confirmPassword && form.business.adminPassword !== form.business.confirmPassword && (
                <span style={{ color: "#c0392b", fontSize: "0.8rem", marginTop: 4, display: "block" }}>Passwords do not match</span>
              )}
            </label>
            <label>
              Preferred web domain
              <span className="field-hint">Custom domain if you have one, otherwise we assign one</span>
              <input value={form.business.bookingDomain} onChange={(e) => updateSection("business", "bookingDomain", e.target.value)} placeholder="e.g. book.yourbusiness.com" />
            </label>
            <label className="full-span">
              Business tagline
              <span className="field-hint">Short motto shown on your booking site hero section</span>
              <input value={form.business.tagline} onChange={(e) => updateSection("business", "tagline", e.target.value)} placeholder="Ocean experiences with expert local guides" />
            </label>
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label>
              Logo URL
              <input
                type="url"
                value={form.branding.logoUrl}
                onChange={(e) => updateSection("branding", "logoUrl", e.target.value)}
                placeholder="https://..."
              />
            </label>
            <label>
              Hero eyebrow
              <input
                value={form.branding.heroEyebrow}
                onChange={(e) => updateSection("branding", "heroEyebrow", e.target.value)}
                placeholder="Cape Town adventure tours"
              />
            </label>
            <label>
              Hero title
              <input
                value={form.branding.heroTitle}
                onChange={(e) => updateSection("branding", "heroTitle", e.target.value)}
                placeholder="Find your next ocean adventure"
                required
              />
            </label>
            <label className="full-span">
              Hero subtitle
              <textarea
                value={form.branding.heroSubtitle}
                onChange={(e) => updateSection("branding", "heroSubtitle", e.target.value)}
                rows={2}
                placeholder="Short homepage intro that explains the signature experience."
              />
            </label>
            <label>
              Primary color
              <span className="field-hint">Main brand colour used for headings and accents</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorMain} onChange={(e) => updateSection("branding", "colorMain", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorMain} onChange={(e) => updateSection("branding", "colorMain", e.target.value)} placeholder="#185f75" />
              </div>
            </label>
            <label>
              Secondary color
              <span className="field-hint">Darker accent for footers, text overlays and contrast areas</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorSecondary} onChange={(e) => updateSection("branding", "colorSecondary", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorSecondary} onChange={(e) => updateSection("branding", "colorSecondary", e.target.value)} placeholder="#132833" />
              </div>
            </label>
            <label>
              CTA color
              <span className="field-hint">Buttons and links that encourage guests to take action</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorCta} onChange={(e) => updateSection("branding", "colorCta", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorCta} onChange={(e) => updateSection("branding", "colorCta", e.target.value)} placeholder="#ca6c2f" />
              </div>
            </label>
            <label>
              Background color
              <span className="field-hint">Page background behind your content sections</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorBg} onChange={(e) => updateSection("branding", "colorBg", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorBg} onChange={(e) => updateSection("branding", "colorBg", e.target.value)} placeholder="#f5efe4" />
              </div>
            </label>
            <label>
              Nav color
              <span className="field-hint">Top navigation bar background on your booking site</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorNav} onChange={(e) => updateSection("branding", "colorNav", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorNav} onChange={(e) => updateSection("branding", "colorNav", e.target.value)} placeholder="#fffaf2" />
              </div>
            </label>
            <label>
              Hover color
              <span className="field-hint">Highlight when guests hover over buttons or links</span>
              <div className="color-field">
                <input type="color" value={form.branding.colorHover} onChange={(e) => updateSection("branding", "colorHover", e.target.value)} className="color-swatch" />
                <input value={form.branding.colorHover} onChange={(e) => updateSection("branding", "colorHover", e.target.value)} placeholder="#ffd9bf" />
              </div>
            </label>
            <label className="full-span">
              Chat avatar URL
              <input
                value={form.branding.chatbotAvatar}
                onChange={(e) => updateSection("branding", "chatbotAvatar", e.target.value)}
                placeholder="https://..."
              />
            </label>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label>
              Timezone
              <span className="field-hint">Used for booking times and reminders</span>
              <input value={form.operations.timezone} onChange={(e) => updateSection("operations", "timezone", e.target.value)} placeholder="Africa/Johannesburg" />
            </label>
            <label>
              City
              <span className="field-hint">Where your business operates</span>
              <input value={form.operations.city} onChange={(e) => updateSection("operations", "city", e.target.value)} placeholder="Cape Town" />
            </label>
            <label>
              WhatsApp phone
              <span className="field-hint">Guests can reach you here via WhatsApp</span>
              <input value={form.operations.whatsappPhone} onChange={(e) => updateSection("operations", "whatsappPhone", e.target.value)} placeholder="+27 21 123 4567" />
            </label>
            <label>
              Office hours
              <span className="field-hint">When your team is available for enquiries</span>
              <input value={form.operations.officeHours} onChange={(e) => updateSection("operations", "officeHours", e.target.value)} placeholder="08:00-17:00" />
            </label>
            <label>
              Review URL
              <span className="field-hint">Google or TripAdvisor link for post-trip reviews</span>
              <input type="url" value={form.operations.reviewUrl} onChange={(e) => updateSection("operations", "reviewUrl", e.target.value)} placeholder="https://g.page/..." />
            </label>
            <label>
              Arrive early (minutes)
              <span className="field-hint">How early guests should arrive before departure</span>
              <input value={form.operations.arriveEarlyMinutes} onChange={(e) => updateSection("operations", "arriveEarlyMinutes", e.target.value)} placeholder="15" />
            </label>
            <label className="full-span">
              Meeting point
              <span className="field-hint">Full address shown to guests in their booking confirmation</span>
              <textarea value={form.operations.meetingPoint} onChange={(e) => updateSection("operations", "meetingPoint", e.target.value)} rows={2} placeholder="180 Beach Rd, Three Anchor Bay, Cape Town" required />
            </label>
            <label className="full-span">
              Google Maps URL
              <span className="field-hint">Direct link so guests can navigate to you</span>
              <input type="url" value={form.operations.googleMapsUrl} onChange={(e) => updateSection("operations", "googleMapsUrl", e.target.value)} placeholder="https://maps.google.com/..." />
            </label>
            <label>
              Parking info
              <span className="field-hint">Parking options near your meeting point</span>
              <textarea value={form.operations.parkingInfo} onChange={(e) => updateSection("operations", "parkingInfo", e.target.value)} rows={2} placeholder="Street parking, paid parking, shuttle notes" />
            </label>
            <label>
              Facilities
              <span className="field-hint">On-site amenities guests can use</span>
              <textarea value={form.operations.facilities} onChange={(e) => updateSection("operations", "facilities", e.target.value)} rows={2} placeholder="Toilets, lockers, changing rooms" />
            </label>
            <label>
              What to bring
              <span className="field-hint">Included in the booking reminder to guests</span>
              <textarea value={form.operations.whatToBring} onChange={(e) => updateSection("operations", "whatToBring", e.target.value)} rows={2} placeholder="Sunscreen, hat, towel, water" required />
            </label>
            <label>
              What to wear
              <span className="field-hint">Clothing advice sent with the booking confirmation</span>
              <textarea value={form.operations.whatToWear} onChange={(e) => updateSection("operations", "whatToWear", e.target.value)} rows={2} placeholder="Comfortable clothes you do not mind getting wet" required />
            </label>
            <label className="full-span">
              Safety info
              <span className="field-hint">Shown on your booking page and used by the AI chatbot</span>
              <textarea value={form.operations.safetyInfo} onChange={(e) => updateSection("operations", "safetyInfo", e.target.value)} rows={2} placeholder="Guides, safety gear, age limits, restrictions" required />
            </label>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="wizard-step-content">
          <div className="stack">
            {form.tours.map((tour, index) => (
              <article className="tour-card" key={`${tour.name}-${index}`}>
                <div className="tour-card-header">
                  <div>
                    <p className="tour-index">Tour {index + 1}</p>
                    <h3>{tour.name || "Untitled tour"}</h3>
                  </div>
                  {form.tours.length > 1 ? (
                    <button type="button" className="ghost-button" onClick={() => removeTour(index)}>
                      Remove
                    </button>
                  ) : null}
                </div>
                <div className="field-grid">
                  <label>
                    Tour name
                    <input
                      value={tour.name}
                      onChange={(e) => updateTour(index, "name", e.target.value)}
                      placeholder="Morning Sea Kayak"
                      required
                    />
                  </label>
                  <label>
                    Image URL
                    <input
                      value={tour.imageUrl}
                      onChange={(e) => updateTour(index, "imageUrl", e.target.value)}
                      placeholder="https://..."
                    />
                  </label>
                  <label>
                    Duration (minutes)
                    <input
                      value={tour.durationMinutes}
                      onChange={(e) => updateTour(index, "durationMinutes", e.target.value)}
                      placeholder="90"
                    />
                  </label>
                  <label>
                    Base price
                    <input
                      value={tour.basePrice}
                      onChange={(e) => updateTour(index, "basePrice", e.target.value)}
                      placeholder="600"
                      required
                    />
                  </label>
                  <label>
                    Peak price
                    <input
                      value={tour.peakPrice}
                      onChange={(e) => updateTour(index, "peakPrice", e.target.value)}
                      placeholder="750"
                    />
                  </label>
                  <label>
                    Default capacity
                    <input
                      value={tour.defaultCapacity}
                      onChange={(e) => updateTour(index, "defaultCapacity", e.target.value)}
                      placeholder="24"
                    />
                  </label>
                  <label className="full-span">
                    Description
                    <textarea
                      value={tour.description}
                      onChange={(e) => updateTour(index, "description", e.target.value)}
                      rows={2}
                      placeholder="Guided experience summary for clients and staff."
                    />
                  </label>
                  <label>
                    Slot start date
                    <input
                      type="date"
                      value={tour.slotStartDate}
                      onChange={(e) => updateTour(index, "slotStartDate", e.target.value)}
                    />
                  </label>
                  <label>
                    Slot end date
                    <input
                      type="date"
                      value={tour.slotEndDate}
                      onChange={(e) => updateTour(index, "slotEndDate", e.target.value)}
                    />
                  </label>
                  <label className="full-span">
                    Inclusions
                    <textarea
                      value={tour.inclusions}
                      onChange={(e) => updateTour(index, "inclusions", e.target.value)}
                      rows={2}
                      placeholder="Guide, equipment, briefing, snacks"
                    />
                  </label>
                  <label>
                    Exclusions
                    <textarea
                      value={tour.exclusions}
                      onChange={(e) => updateTour(index, "exclusions", e.target.value)}
                      rows={2}
                      placeholder="Transport, drinks, wetsuit rental"
                    />
                  </label>
                  <label>
                    Restrictions
                    <textarea
                      value={tour.restrictions}
                      onChange={(e) => updateTour(index, "restrictions", e.target.value)}
                      rows={2}
                      placeholder="Age, weight, health, experience"
                    />
                  </label>
                </div>
                <div className="subsection">
                  <div className="subsection-header">
                    <h4>Operating days</h4>
                    <span>Used for initial slot generation</span>
                  </div>
                  <div className="day-toggle-row">
                    {DAY_OPTIONS.map((day) => {
                      const active = tour.operatingDays.includes(day.value);
                      return (
                        <button
                          key={day.value}
                          type="button"
                          className={active ? "day-toggle active" : "day-toggle"}
                          onClick={() => toggleOperatingDay(index, day.value)}
                        >
                          {day.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="subsection">
                  <div className="subsection-header">
                    <h4>Departure times</h4>
                    <button type="button" className="ghost-button" onClick={() => addTimeSlot(index)}>
                      Add time
                    </button>
                  </div>
                  <div className="time-grid">
                    {tour.slotTimes.map((slotTime, timeIndex) => (
                      <div key={`${index}-${timeIndex}`} className="time-row">
                        <input
                          type="time"
                          value={slotTime}
                          onChange={(e) => updateTimeSlot(index, timeIndex, e.target.value)}
                        />
                        {tour.slotTimes.length > 1 ? (
                          <button
                            type="button"
                            className="ghost-button"
                            onClick={() => removeTimeSlot(index, timeIndex)}
                          >
                            Remove
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
          <button type="button" className="primary-button secondary" onClick={addTour}>
            Add another tour
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label>
              Free cancel hours before
              <span className="field-hint">Hours before departure when guests can cancel for free</span>
              <input value={form.policies.freeCancelHoursBefore} onChange={(e) => updateSection("policies", "freeCancelHoursBefore", e.target.value)} />
            </label>
            <label>
              No refund within hours
              <span className="field-hint">Inside this window, no refund is given</span>
              <input value={form.policies.noRefundWithinHours} onChange={(e) => updateSection("policies", "noRefundWithinHours", e.target.value)} />
            </label>
            <label>
              Partial refund window
              <span className="field-hint">Hours before departure for a partial refund</span>
              <input value={form.policies.partialRefundHoursBefore} onChange={(e) => updateSection("policies", "partialRefundHoursBefore", e.target.value)} />
            </label>
            <label>
              Partial refund percent
              <span className="field-hint">Percentage refunded during the partial window</span>
              <input value={form.policies.partialRefundPercent} onChange={(e) => updateSection("policies", "partialRefundPercent", e.target.value)} />
            </label>
            <label>
              Reschedule allowed before
              <span className="field-hint">Hours before departure when rescheduling is allowed</span>
              <input value={form.policies.rescheduleAllowedHoursBefore} onChange={(e) => updateSection("policies", "rescheduleAllowedHoursBefore", e.target.value)} />
            </label>
            <label>
              Group discount minimum qty
              <span className="field-hint">Minimum guests in one booking to trigger group pricing</span>
              <input value={form.policies.groupDiscountMinQty} onChange={(e) => updateSection("policies", "groupDiscountMinQty", e.target.value)} />
            </label>
            <label>
              Group discount percent
              <span className="field-hint">Discount applied when the group minimum is met</span>
              <input value={form.policies.groupDiscountPercent} onChange={(e) => updateSection("policies", "groupDiscountPercent", e.target.value)} />
            </label>
            <label>
              Loyalty threshold
              <span className="field-hint">Number of bookings before loyalty discount kicks in</span>
              <input value={form.policies.loyaltyBookingsThreshold} onChange={(e) => updateSection("policies", "loyaltyBookingsThreshold", e.target.value)} />
            </label>
            <label>
              Loyalty discount percent
              <span className="field-hint">Discount for returning guests who reach the threshold</span>
              <input value={form.policies.loyaltyDiscountPercent} onChange={(e) => updateSection("policies", "loyaltyDiscountPercent", e.target.value)} />
            </label>
            <label>
              Loyalty period days
              <span className="field-hint">How long loyalty status lasts before it resets</span>
              <input value={form.policies.loyaltyPeriodDays} onChange={(e) => updateSection("policies", "loyaltyPeriodDays", e.target.value)} />
            </label>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label>
              Weather cancellation SOP
              <span className="field-hint">When and how you cancel due to weather</span>
              <textarea value={form.sops.weatherCancellation} onChange={(e) => updateSection("sops", "weatherCancellation", e.target.value)} rows={2} placeholder="Wind thresholds, cancellation authority, client comms timing, refund or reschedule rule." required />
            </label>
            <label>
              Emergency response SOP
              <span className="field-hint">Steps your team follows in an emergency</span>
              <textarea value={form.sops.emergencyResponse} onChange={(e) => updateSection("sops", "emergencyResponse", e.target.value)} rows={2} placeholder="Emergency contacts, escalation steps, medical protocol, evacuation notes." required />
            </label>
            <label>
              Pre-trip briefing SOP
              <span className="field-hint">What guides cover before each departure</span>
              <textarea value={form.sops.preTripBriefing} onChange={(e) => updateSection("sops", "preTripBriefing", e.target.value)} rows={2} placeholder="Safety script, waiver reminder, gear fit, route explanation." />
            </label>
            <label>
              Check-in flow SOP
              <span className="field-hint">How guests are received on arrival</span>
              <textarea value={form.sops.checkInFlow} onChange={(e) => updateSection("sops", "checkInFlow", e.target.value)} rows={2} placeholder="Arrival handling, waiver checks, payment check, attendance marking." />
            </label>
            <label>
              Guide operations SOP
              <span className="field-hint">Daily expectations and handoff rules for guides</span>
              <textarea value={form.sops.guideOperations} onChange={(e) => updateSection("sops", "guideOperations", e.target.value)} rows={2} placeholder="Guide roster expectations, handoff, route changes, communication rules." />
            </label>
            <label>
              Equipment handling SOP
              <span className="field-hint">How gear is issued, cleaned and stored</span>
              <textarea value={form.sops.equipmentHandling} onChange={(e) => updateSection("sops", "equipmentHandling", e.target.value)} rows={2} placeholder="Gear issue, maintenance, wash-down, storage, damage reporting." />
            </label>
            <label>
              Incident reporting SOP
              <span className="field-hint">What gets reported, by whom, and when</span>
              <textarea value={form.sops.incidentReporting} onChange={(e) => updateSection("sops", "incidentReporting", e.target.value)} rows={2} placeholder="Near misses, injuries, customer complaints, who logs what and when." />
            </label>
            <label>
              Refund and escalation SOP
              <span className="field-hint">Who can approve refunds and when to escalate</span>
              <textarea value={form.sops.refundEscalation} onChange={(e) => updateSection("sops", "refundEscalation", e.target.value)} rows={2} placeholder="When staff may refund, when to escalate, expected response times." />
            </label>
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="wizard-step-content">
          <div className="field-grid">
            <label className="full-span">
              AI persona
              <span className="field-hint">Describe the tone and personality of your chatbot — it will use this when talking to guests</span>
              <textarea value={form.automations.aiPersona} onChange={(e) => updateSection("automations", "aiPersona", e.target.value)} rows={2} placeholder="Friendly, operational, concise." />
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.automations.reminderEnabled} onChange={(e) => updateSection("automations", "reminderEnabled", e.target.checked)} />
              Enable day-before reminders
              <span className="field-hint">WhatsApp message sent to guests the day before their trip</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.automations.reviewRequestEnabled} onChange={(e) => updateSection("automations", "reviewRequestEnabled", e.target.checked)} />
              Enable post-trip review requests
              <span className="field-hint">Automatically ask guests to leave a Google review after their trip</span>
            </label>
            <label className="checkbox-field">
              <input type="checkbox" checked={form.automations.reengagementEnabled} onChange={(e) => updateSection("automations", "reengagementEnabled", e.target.checked)} />
              Enable re-engagement campaigns
              <span className="field-hint">Reach out to past guests with special offers to bring them back</span>
            </label>
            <label className="full-span">
              Automation notes
              <span className="field-hint">Any special rules for how automated messages should behave</span>
              <textarea value={form.automations.notes} onChange={(e) => updateSection("automations", "notes", e.target.value)} rows={2} placeholder="Anything special about support tone, upsells, reminders, or follow-up rules." />
            </label>
          </div>
        </div>
      )}

      {step === 7 && (
        <div className="wizard-step-content">
          <div className="stack">
            {form.faqs.map((faq, index) => (
              <div key={`${faq.question}-${index}`} className="faq-card">
                <div className="field-grid">
                  <label>
                    Question
                    <input
                      value={faq.question}
                      onChange={(e) => updateFaq(index, "question", e.target.value)}
                      placeholder="What should guests bring?"
                    />
                  </label>
                  <label className="full-span">
                    Answer
                    <textarea
                      value={faq.answer}
                      onChange={(e) => updateFaq(index, "answer", e.target.value)}
                      rows={2}
                      placeholder="Write the approved business answer for this FAQ."
                    />
                  </label>
                </div>
                {form.faqs.length > 1 ? (
                  <button type="button" className="ghost-button" onClick={() => removeFaq(index)}>
                    Remove FAQ
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <button type="button" className="primary-button secondary" onClick={addFaq}>
            Add FAQ item
          </button>
        </div>
      )}

      {step === 8 && (
        <div className="wizard-step-content">
          <div className="stack">
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.billing.landingPageRequested}
                onChange={(e) => updateSection("billing", "landingPageRequested", e.target.checked)}
              />
              I&apos;d like a professional landing page for my business
            </label>
            {form.billing.landingPageRequested && (
              <p style={{ fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.6, padding: "0 0.5rem" }}>
                We&apos;ll create a polished landing page using your branding, tours, and content from this form. You can choose from 4 premium templates. Your BookingTours team will set it up and connect it to your custom domain.
              </p>
            )}
          </div>

          <p style={{ marginTop: "1.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
            To accept card payments and send WhatsApp reminders, we need two sets of keys. If you don&apos;t have them yet, expand the guide under each one — it walks you through getting them in about 10 minutes.
          </p>

          {/* ─────────────────── Yoco (Payments) ─────────────────── */}
          <section style={{ marginTop: "1.5rem", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>💳 Yoco — card payments</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              Yoco processes credit/debit card bookings. You need an approved Yoco Online Payments account.
            </p>

            <div className="field-grid">
              <label className="full-span">
                Yoco Secret Key
                <span className="field-hint">Starts with <code>sk_live_</code> (or <code>sk_test_</code> for testing)</span>
                <input type="password" autoComplete="off" value={form.secrets.yocoSecretKey} onChange={(e) => updateSection("secrets", "yocoSecretKey", e.target.value)} placeholder="sk_live_..." />
              </label>
              <label className="full-span">
                Yoco Webhook Signing Secret
                <span className="field-hint">Starts with <code>whsec_</code>. Proves that a webhook really came from Yoco.</span>
                <input type="password" autoComplete="off" value={form.secrets.yocoWebhookSecret} onChange={(e) => updateSection("secrets", "yocoWebhookSecret", e.target.value)} placeholder="whsec_..." />
              </label>
            </div>

            <details style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "white", border: "1px solid rgba(0,0,0,0.08)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>How to get your Yoco keys (≈ 5 minutes once your Yoco account is approved)</summary>
              <ol style={{ margin: "0.75rem 0 0.25rem 1.25rem", padding: 0, fontSize: "0.85rem", lineHeight: 1.75 }}>
                <li>
                  <strong>Open Yoco Portal</strong> — <a href="https://portal.yoco.com" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>portal.yoco.com ↗</a>
                </li>
                <li>
                  If you don&apos;t have a Yoco Online Payments account yet, <a href="https://online.yoco.com/signup/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>sign up here ↗</a>. Approval takes 1–2 business days and needs your SA business registration docs + ID.
                </li>
                <li>Inside the Yoco portal, go to <strong>Settings → Developer Tools</strong> (or directly <a href="https://portal.yoco.com/developers/api-keys" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>to your API keys ↗</a>).</li>
                <li>Under <strong>Secret keys → Live mode</strong>, click <em>Reveal</em> and copy the key. It starts with <code>sk_live_</code>. Paste it into the first field above.</li>
                <li>Still in Developer Tools, go to <strong>Webhooks → Add webhook</strong>.</li>
                <li>
                  Webhook URL — paste this exactly:
                  <pre style={{ marginTop: "0.25rem", padding: "0.4rem 0.6rem", background: "rgba(0,0,0,0.05)", borderRadius: "6px", fontSize: "0.78rem", overflowX: "auto" }}>https://ukdsrndqhsatjkmxijuj.supabase.co/functions/v1/yoco-webhook</pre>
                </li>
                <li>Events to subscribe: <code>payment.succeeded</code>, <code>payment.failed</code>, <code>refund.succeeded</code>.</li>
                <li>After creating the webhook, Yoco shows a <strong>Signing secret</strong> starting with <code>whsec_</code>. Copy it into the second field above.</li>
                <li>Save this step. Live bookings won&apos;t charge cards until both keys are filled in.</li>
              </ol>
              <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                Want more detail? Yoco&apos;s full developer docs: <a href="https://developer.yoco.com/online/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>developer.yoco.com ↗</a>
              </p>
            </details>
          </section>

          {/* ─────────────────── WhatsApp Business ─────────────────── */}
          <section style={{ marginTop: "1.25rem", padding: "1.25rem", borderRadius: "14px", border: "1px solid rgba(0,0,0,0.08)", background: "rgba(0,0,0,0.02)" }}>
            <h3 style={{ margin: "0 0 0.25rem", fontSize: "1.05rem" }}>💬 WhatsApp Business API</h3>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: "var(--muted)" }}>
              WhatsApp is how guests chat with your AI host and receive reminders. You need a Meta Business account and a dedicated WhatsApp-capable phone number.
            </p>

            <div className="field-grid">
              <label className="full-span">
                WhatsApp Access Token
                <span className="field-hint">A long token that starts with <code>EAA...</code>. Set it to &quot;never expires&quot; when generating.</span>
                <input type="password" autoComplete="off" value={form.secrets.waAccessToken} onChange={(e) => updateSection("secrets", "waAccessToken", e.target.value)} placeholder="EAA..." />
              </label>
              <label className="full-span">
                WhatsApp Phone Number ID
                <span className="field-hint">The 15-digit number shown on your WhatsApp Accounts → API Setup page. Not your phone number.</span>
                <input type="text" autoComplete="off" value={form.secrets.waPhoneId} onChange={(e) => updateSection("secrets", "waPhoneId", e.target.value)} placeholder="123456789012345" />
              </label>
            </div>

            <details style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "white", border: "1px solid rgba(0,0,0,0.08)" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600, fontSize: "0.9rem" }}>How to get your WhatsApp credentials (≈ 15 minutes the first time)</summary>
              <ol style={{ margin: "0.75rem 0 0.25rem 1.25rem", padding: 0, fontSize: "0.85rem", lineHeight: 1.75 }}>
                <li>
                  <strong>Open Meta Business Manager</strong> — <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>business.facebook.com ↗</a>. Sign in with the Facebook account that owns your business page, or create a new Meta Business account.
                </li>
                <li>Click the <strong>gear icon (Business Settings)</strong> in the top-right.</li>
                <li>In the left sidebar, go to <strong>Accounts → WhatsApp Accounts → Add</strong>. Follow the flow to create a WhatsApp Business Account.</li>
                <li>Inside that WABA, go to <strong>Phone numbers → Add phone number</strong>. Important: this number must NOT already be registered on regular WhatsApp. Verify it via SMS or call.</li>
                <li>Go to <strong>Business Settings → Users → System Users → Add</strong>. Create a system user with role <em>Employee</em> and give it <em>Admin</em> permissions.</li>
                <li>Click your new system user → <strong>Add Assets → WhatsApp Accounts</strong>. Select your WABA and tick <em>Full control</em>.</li>
                <li>
                  Click <strong>Generate token</strong>. Select:
                  <ul style={{ margin: "0.25rem 0 0.25rem 1.25rem" }}>
                    <li>Token expiration: <strong>Never</strong></li>
                    <li>Scopes: tick <code>whatsapp_business_messaging</code> and <code>whatsapp_business_management</code></li>
                  </ul>
                </li>
                <li>Copy the long token (starts with <code>EAA...</code>) into the Access Token field above.</li>
                <li>
                  Now go to <strong>WhatsApp Accounts → (your WABA) → API Setup</strong> (or directly: <a href="https://developers.facebook.com/apps/" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>developers.facebook.com/apps ↗</a>). Under <strong>Send and receive messages</strong>, you&apos;ll see a <em>Phone number ID</em> — a 15-digit number. Copy it into the Phone Number ID field above.
                </li>
                <li>
                  Configure the webhook so we receive incoming messages:
                  <ul style={{ margin: "0.25rem 0 0.25rem 1.25rem" }}>
                    <li>Webhook URL: <code style={{ fontSize: "0.75rem" }}>https://ukdsrndqhsatjkmxijuj.supabase.co/functions/v1/wa-webhook</code></li>
                    <li>Verify token: anything — just share it with your BookingTours onboarding team after setup.</li>
                    <li>Subscribe to fields: <code>messages</code>.</li>
                  </ul>
                </li>
              </ol>
              <p style={{ marginTop: "0.75rem", fontSize: "0.8rem", color: "var(--muted)" }}>
                Meta&apos;s official walkthrough: <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent, #0c8a59)", fontWeight: 600 }}>developers.facebook.com/docs/whatsapp/cloud-api/get-started ↗</a>
              </p>
            </details>
          </section>

          <p style={{ marginTop: "1.25rem", padding: "0.75rem 1rem", borderRadius: "10px", background: "rgba(12, 138, 89, 0.08)", fontSize: "0.85rem", lineHeight: 1.6 }}>
            <strong>Don&apos;t have these yet?</strong> Leave the fields blank. Your BookingTours team will reach out to help, and you can paste the keys in later via <em>Settings → Credentials</em> once you log in.
          </p>
        </div>
      )}

      {step === 9 && (
        <div className="wizard-step-content" style={{ textAlign: "center" }}>
          {/* Honeypot — hidden from humans, visible to bots */}
          <div style={{ position: "absolute", left: "-9999px", opacity: 0, height: 0, overflow: "hidden" }} aria-hidden="true">
            <label>
              Leave this empty
              <input type="text" name="website_url" tabIndex={-1} autoComplete="off" />
            </label>
          </div>
          <div className="submit-box">
            <p>
              When you click the button below, we&apos;ll create your booking website, admin dashboard, and AI assistant automatically.
            </p>
            <button type="submit" className="primary-button" disabled={submitting || (!!form.business.confirmPassword && form.business.adminPassword !== form.business.confirmPassword)}>
              {submitting ? "Setting up your business..." : "Launch My Business →"}
            </button>
            {submitError ? <p className="error-text">{submitError}</p> : null}
          </div>
        </div>
      )}

      </div>{/* end wizard-panel */}

      {/* ── Wizard navigation ── */}
      <div className="wizard-nav">
        {step === 0 && onBack ? (
          <button type="button" className="wizard-btn back" onClick={onBack}>
            ← Back
          </button>
        ) : step > 0 ? (
          <button type="button" className="wizard-btn back" onClick={() => goTo(step - 1)}>
            ← Back
          </button>
        ) : <span />}
        {!isLast ? (
          <button type="button" className="wizard-btn next" onClick={() => goTo(step + 1)}>
            Next →
          </button>
        ) : <span />}
      </div>
    </form>
  );
}
