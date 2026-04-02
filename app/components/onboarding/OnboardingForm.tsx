"use client";

import type { FormState, TourDraft, FaqDraft } from "./types";
import { DAY_OPTIONS, createTour, createFaq } from "./constants";
import { slugify, toNumber, buildFallbackSql, downloadSql } from "./utils";

export function OnboardingForm({
  form,
  setForm,
  submitting,
  submitError,
  onSubmit,
}: {
  form: FormState;
  setForm: React.Dispatch<React.SetStateAction<FormState>>;
  submitting: boolean;
  submitError: string;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
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

  return (
    <form className="onboarding-form" onSubmit={onSubmit}>
      <div className="form-grid">
        {/* 1. Business owner */}
        <section className="form-card">
          <div className="section-header compact">
            <p className="eyebrow">1. Business owner</p>
            <h2>Identity and access</h2>
          </div>
          <div className="field-grid">
            <label>
              Public business name
              <input
                value={form.business.businessName}
                onChange={(e) => updateBusinessName(e.target.value)}
                placeholder="e.g. Coastline Adventures"
                required
              />
            </label>
            <label>
              Your unique link (URL)
              <input
                value={form.business.tenantSlug}
                onChange={(e) => updateSection("business", "tenantSlug", slugify(e.target.value))}
                placeholder="e.g. coastline-adventures"
                required
              />
            </label>
            <label>
              Legal entity name
              <input
                value={form.business.legalName}
                onChange={(e) => updateSection("business", "legalName", e.target.value)}
                placeholder="Coastline Adventures (Pty) Ltd"
              />
            </label>
            <label>
              Industry
              <input
                value={form.business.industry}
                onChange={(e) => updateSection("business", "industry", e.target.value)}
                placeholder="Kayaking, diving, safari, tours"
              />
            </label>
            <label>
              Year established
              <input
                value={form.business.yearEstablished}
                onChange={(e) => updateSection("business", "yearEstablished", e.target.value)}
                placeholder="2018"
              />
            </label>
            <label>
              Primary contact
              <input
                value={form.business.ownerName}
                onChange={(e) => updateSection("business", "ownerName", e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </label>
            <label>
              Primary email
              <input
                type="email"
                value={form.business.ownerEmail}
                onChange={(e) => updateSection("business", "ownerEmail", e.target.value)}
                placeholder="jane@business.com"
                required
              />
            </label>
            <label>
              Primary phone
              <input
                value={form.business.ownerPhone}
                onChange={(e) => updateSection("business", "ownerPhone", e.target.value)}
                placeholder="+27 82 123 4567"
                required
              />
            </label>
            <label>
              Operator email
              <input
                type="email"
                value={form.business.operatorEmail}
                onChange={(e) => updateSection("business", "operatorEmail", e.target.value)}
                placeholder="ops@business.com"
              />
            </label>
            <label>
              Your admin password
              <input
                type="password"
                value={form.business.adminPassword}
                onChange={(e) => updateSection("business", "adminPassword", e.target.value)}
                placeholder="Choose your first secure password"
                required
              />
            </label>
            <label>
              Preferred web domain
              <input
                value={form.business.bookingDomain}
                onChange={(e) => updateSection("business", "bookingDomain", e.target.value)}
                placeholder="e.g. book.yourbusiness.com"
              />
            </label>
            <label className="full-span">
              Business tagline
              <input
                value={form.business.tagline}
                onChange={(e) => updateSection("business", "tagline", e.target.value)}
                placeholder="Ocean experiences with expert local guides"
              />
            </label>
          </div>
        </section>

        {/* 2. Branding */}
        <section className="form-card">
          <div className="section-header compact">
            <p className="eyebrow">2. Brand and website</p>
            <h2>Booking-site presentation</h2>
          </div>
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
                rows={3}
                placeholder="Short homepage intro that explains the signature experience."
              />
            </label>
            <label>
              Primary color
              <input
                value={form.branding.colorMain}
                onChange={(e) => updateSection("branding", "colorMain", e.target.value)}
              />
            </label>
            <label>
              Secondary color
              <input
                value={form.branding.colorSecondary}
                onChange={(e) => updateSection("branding", "colorSecondary", e.target.value)}
              />
            </label>
            <label>
              CTA color
              <input
                value={form.branding.colorCta}
                onChange={(e) => updateSection("branding", "colorCta", e.target.value)}
              />
            </label>
            <label>
              Background color
              <input
                value={form.branding.colorBg}
                onChange={(e) => updateSection("branding", "colorBg", e.target.value)}
              />
            </label>
            <label>
              Nav color
              <input
                value={form.branding.colorNav}
                onChange={(e) => updateSection("branding", "colorNav", e.target.value)}
              />
            </label>
            <label>
              Hover color
              <input
                value={form.branding.colorHover}
                onChange={(e) => updateSection("branding", "colorHover", e.target.value)}
              />
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
        </section>

        {/* 3. Operations */}
        <section className="form-card full-width">
          <div className="section-header compact">
            <p className="eyebrow">3. Operational setup</p>
            <h2>Meeting point, support, and client instructions</h2>
          </div>
          <div className="field-grid">
            <label>
              Timezone
              <input
                value={form.operations.timezone}
                onChange={(e) => updateSection("operations", "timezone", e.target.value)}
                placeholder="Africa/Johannesburg"
              />
            </label>
            <label>
              City
              <input
                value={form.operations.city}
                onChange={(e) => updateSection("operations", "city", e.target.value)}
                placeholder="Cape Town"
              />
            </label>
            <label>
              WhatsApp phone
              <input
                value={form.operations.whatsappPhone}
                onChange={(e) => updateSection("operations", "whatsappPhone", e.target.value)}
                placeholder="+27 21 123 4567"
              />
            </label>
            <label>
              Office hours
              <input
                value={form.operations.officeHours}
                onChange={(e) => updateSection("operations", "officeHours", e.target.value)}
                placeholder="08:00-17:00"
              />
            </label>
            <label>
              Review URL
              <input
                type="url"
                value={form.operations.reviewUrl}
                onChange={(e) => updateSection("operations", "reviewUrl", e.target.value)}
                placeholder="https://g.page/..."
              />
            </label>
            <label>
              Arrive early (minutes)
              <input
                value={form.operations.arriveEarlyMinutes}
                onChange={(e) => updateSection("operations", "arriveEarlyMinutes", e.target.value)}
                placeholder="15"
              />
            </label>
            <label className="full-span">
              Meeting point
              <textarea
                value={form.operations.meetingPoint}
                onChange={(e) => updateSection("operations", "meetingPoint", e.target.value)}
                rows={3}
                placeholder="180 Beach Rd, Three Anchor Bay, Cape Town"
                required
              />
            </label>
            <label className="full-span">
              Google Maps URL
              <input
                type="url"
                value={form.operations.googleMapsUrl}
                onChange={(e) => updateSection("operations", "googleMapsUrl", e.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </label>
            <label>
              Parking info
              <textarea
                value={form.operations.parkingInfo}
                onChange={(e) => updateSection("operations", "parkingInfo", e.target.value)}
                rows={4}
                placeholder="Street parking, paid parking, shuttle notes"
              />
            </label>
            <label>
              Facilities
              <textarea
                value={form.operations.facilities}
                onChange={(e) => updateSection("operations", "facilities", e.target.value)}
                rows={4}
                placeholder="Toilets, lockers, changing rooms"
              />
            </label>
            <label>
              What to bring
              <textarea
                value={form.operations.whatToBring}
                onChange={(e) => updateSection("operations", "whatToBring", e.target.value)}
                rows={4}
                placeholder="Sunscreen, hat, towel, water"
                required
              />
            </label>
            <label>
              What to wear
              <textarea
                value={form.operations.whatToWear}
                onChange={(e) => updateSection("operations", "whatToWear", e.target.value)}
                rows={4}
                placeholder="Comfortable clothes you do not mind getting wet"
                required
              />
            </label>
            <label className="full-span">
              Safety info
              <textarea
                value={form.operations.safetyInfo}
                onChange={(e) => updateSection("operations", "safetyInfo", e.target.value)}
                rows={5}
                placeholder="Guides, safety gear, age limits, restrictions"
                required
              />
            </label>
          </div>
        </section>

        {/* 4. Tours */}
        <section className="form-card full-width">
          <div className="section-header compact">
            <p className="eyebrow">4. Tour catalogue</p>
            <h2>Activities, pricing, and slot generation</h2>
          </div>
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
                      rows={4}
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
                      rows={3}
                      placeholder="Guide, equipment, briefing, snacks"
                    />
                  </label>
                  <label>
                    Exclusions
                    <textarea
                      value={tour.exclusions}
                      onChange={(e) => updateTour(index, "exclusions", e.target.value)}
                      rows={3}
                      placeholder="Transport, drinks, wetsuit rental"
                    />
                  </label>
                  <label>
                    Restrictions
                    <textarea
                      value={tour.restrictions}
                      onChange={(e) => updateTour(index, "restrictions", e.target.value)}
                      rows={3}
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
        </section>

        {/* 5. Policies */}
        <section className="form-card">
          <div className="section-header compact">
            <p className="eyebrow">5. Policies</p>
            <h2>Discount and cancellation logic</h2>
          </div>
          <div className="field-grid">
            <label>
              Free cancel hours before
              <input
                value={form.policies.freeCancelHoursBefore}
                onChange={(e) => updateSection("policies", "freeCancelHoursBefore", e.target.value)}
              />
            </label>
            <label>
              No refund within hours
              <input
                value={form.policies.noRefundWithinHours}
                onChange={(e) => updateSection("policies", "noRefundWithinHours", e.target.value)}
              />
            </label>
            <label>
              Partial refund window
              <input
                value={form.policies.partialRefundHoursBefore}
                onChange={(e) => updateSection("policies", "partialRefundHoursBefore", e.target.value)}
              />
            </label>
            <label>
              Partial refund percent
              <input
                value={form.policies.partialRefundPercent}
                onChange={(e) => updateSection("policies", "partialRefundPercent", e.target.value)}
              />
            </label>
            <label>
              Reschedule allowed before
              <input
                value={form.policies.rescheduleAllowedHoursBefore}
                onChange={(e) => updateSection("policies", "rescheduleAllowedHoursBefore", e.target.value)}
              />
            </label>
            <label>
              Group discount minimum qty
              <input
                value={form.policies.groupDiscountMinQty}
                onChange={(e) => updateSection("policies", "groupDiscountMinQty", e.target.value)}
              />
            </label>
            <label>
              Group discount percent
              <input
                value={form.policies.groupDiscountPercent}
                onChange={(e) => updateSection("policies", "groupDiscountPercent", e.target.value)}
              />
            </label>
            <label>
              Loyalty threshold
              <input
                value={form.policies.loyaltyBookingsThreshold}
                onChange={(e) => updateSection("policies", "loyaltyBookingsThreshold", e.target.value)}
              />
            </label>
            <label>
              Loyalty discount percent
              <input
                value={form.policies.loyaltyDiscountPercent}
                onChange={(e) => updateSection("policies", "loyaltyDiscountPercent", e.target.value)}
              />
            </label>
            <label>
              Loyalty period days
              <input
                value={form.policies.loyaltyPeriodDays}
                onChange={(e) => updateSection("policies", "loyaltyPeriodDays", e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* 6. SOPs */}
        <section className="form-card full-width">
          <div className="section-header compact">
            <p className="eyebrow">6. How you run your business</p>
            <h2>Standard Operating Procedures (SOPs)</h2>
          </div>
          <div className="field-grid">
            <label>
              Weather cancellation SOP
              <textarea
                value={form.sops.weatherCancellation}
                onChange={(e) => updateSection("sops", "weatherCancellation", e.target.value)}
                rows={5}
                placeholder="Wind thresholds, cancellation authority, client comms timing, refund or reschedule rule."
                required
              />
            </label>
            <label>
              Emergency response SOP
              <textarea
                value={form.sops.emergencyResponse}
                onChange={(e) => updateSection("sops", "emergencyResponse", e.target.value)}
                rows={5}
                placeholder="Emergency contacts, escalation steps, medical protocol, evacuation notes."
                required
              />
            </label>
            <label>
              Pre-trip briefing SOP
              <textarea
                value={form.sops.preTripBriefing}
                onChange={(e) => updateSection("sops", "preTripBriefing", e.target.value)}
                rows={5}
                placeholder="Safety script, waiver reminder, gear fit, route explanation."
              />
            </label>
            <label>
              Check-in flow SOP
              <textarea
                value={form.sops.checkInFlow}
                onChange={(e) => updateSection("sops", "checkInFlow", e.target.value)}
                rows={5}
                placeholder="Arrival handling, waiver checks, payment check, attendance marking."
              />
            </label>
            <label>
              Guide operations SOP
              <textarea
                value={form.sops.guideOperations}
                onChange={(e) => updateSection("sops", "guideOperations", e.target.value)}
                rows={5}
                placeholder="Guide roster expectations, handoff, route changes, communication rules."
              />
            </label>
            <label>
              Equipment handling SOP
              <textarea
                value={form.sops.equipmentHandling}
                onChange={(e) => updateSection("sops", "equipmentHandling", e.target.value)}
                rows={5}
                placeholder="Gear issue, maintenance, wash-down, storage, damage reporting."
              />
            </label>
            <label>
              Incident reporting SOP
              <textarea
                value={form.sops.incidentReporting}
                onChange={(e) => updateSection("sops", "incidentReporting", e.target.value)}
                rows={5}
                placeholder="Near misses, injuries, customer complaints, who logs what and when."
              />
            </label>
            <label>
              Refund and escalation SOP
              <textarea
                value={form.sops.refundEscalation}
                onChange={(e) => updateSection("sops", "refundEscalation", e.target.value)}
                rows={5}
                placeholder="When staff may refund, when to escalate, expected response times."
              />
            </label>
          </div>
        </section>

        {/* 7. Automations */}
        <section className="form-card">
          <div className="section-header compact">
            <p className="eyebrow">7. Your Virtual Host</p>
            <h2>AI tone and automatic messages</h2>
          </div>
          <div className="field-grid">
            <label className="full-span">
              AI persona
              <textarea
                value={form.automations.aiPersona}
                onChange={(e) => updateSection("automations", "aiPersona", e.target.value)}
                rows={5}
                placeholder="Friendly, operational, concise."
              />
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.automations.reminderEnabled}
                onChange={(e) => updateSection("automations", "reminderEnabled", e.target.checked)}
              />
              Enable day-before reminders
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.automations.reviewRequestEnabled}
                onChange={(e) => updateSection("automations", "reviewRequestEnabled", e.target.checked)}
              />
              Enable post-trip review requests
            </label>
            <label className="checkbox-field">
              <input
                type="checkbox"
                checked={form.automations.reengagementEnabled}
                onChange={(e) => updateSection("automations", "reengagementEnabled", e.target.checked)}
              />
              Enable re-engagement campaigns
            </label>
            <label className="full-span">
              Automation notes
              <textarea
                value={form.automations.notes}
                onChange={(e) => updateSection("automations", "notes", e.target.value)}
                rows={4}
                placeholder="Anything special about support tone, upsells, reminders, or follow-up rules."
              />
            </label>
          </div>
        </section>

        {/* 8. FAQs */}
        <section className="form-card full-width">
          <div className="section-header compact">
            <p className="eyebrow">8. Common Questions</p>
            <h2>Teach your AI virtual host how to answer guests</h2>
          </div>
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
                      rows={4}
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
        </section>

        {/* 9. Landing Page & Integration */}
        <section className="form-card">
          <div className="section-header compact">
            <p className="eyebrow">9. Landing Page & Integration</p>
            <h2>Your website and payment setup</h2>
          </div>
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

          <div className="field-grid" style={{ marginTop: "1.25rem" }}>
            <label className="full-span">
              WhatsApp Access Token
              <input
                type="password"
                value={form.secrets.waAccessToken}
                onChange={(e) => updateSection("secrets", "waAccessToken", e.target.value)}
                placeholder="Don't have this yet? No problem — we'll help you set it up"
              />
            </label>
            <label className="full-span">
              Yoco Secret Key
              <input
                type="password"
                value={form.secrets.yocoSecretKey}
                onChange={(e) => updateSection("secrets", "yocoSecretKey", e.target.value)}
                placeholder="Don't have this yet? No problem — we'll help you set it up"
              />
            </label>
          </div>
          <p style={{ marginTop: "1rem", fontSize: "0.82rem", color: "var(--muted)", lineHeight: 1.6 }}>
            Don&apos;t worry if you don&apos;t have these yet — your BookingTours team will walk you through connecting WhatsApp and payments after setup.
          </p>
        </section>

        {/* Submit */}
        <section className="form-card" style={{ textAlign: "center" }}>
          <div className="submit-box">
            <p>
              When you click the button below, we&apos;ll create your booking website, admin dashboard, and AI assistant automatically. You&apos;ll receive login details by email.
            </p>
            <button type="submit" className="primary-button" disabled={submitting}>
              {submitting ? "Setting up your business..." : "Launch My Business →"}
            </button>
            {submitError ? <p className="error-text">{submitError}</p> : null}
          </div>
        </section>
      </div>
    </form>
  );
}
