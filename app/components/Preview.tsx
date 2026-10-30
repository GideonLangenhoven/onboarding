"use client";

import { duration, money, type TourDraft, type Values } from "../lib/onboarding";

export const DEFAULT_COLOURS = {
  color_main: "#125e40",
  color_secondary: "#d9822f",
  color_cta: "#125e40",
};

/** A miniature of the guest-facing booking site, built from the answers so far. */
export default function Preview({
  values,
  tours,
  bookingSiteUrl,
  businessName,
}: {
  values: Values;
  tours: TourDraft[];
  bookingSiteUrl: string;
  businessName: string;
}) {
  const main = values.color_main || DEFAULT_COLOURS.color_main;
  const cta = values.color_cta || DEFAULT_COLOURS.color_cta;
  const secondary = values.color_secondary || DEFAULT_COLOURS.color_secondary;
  const named = tours.filter((t) => t.name.trim()).slice(0, 3);
  const host = bookingSiteUrl.replace(/^https?:\/\//, "") || "your-site.booking.bookingtours.co.za";

  return (
    <figure aria-label="Live preview of your booking site" className="select-none">
      <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_48px_-24px_rgba(19,21,18,0.25)]">
        <div className="flex items-center gap-2 border-b border-line bg-bg px-3 py-2">
          <span className="flex gap-1" aria-hidden="true">
            <i className="h-2.5 w-2.5 rounded-full bg-ink/10" />
            <i className="h-2.5 w-2.5 rounded-full bg-ink/10" />
            <i className="h-2.5 w-2.5 rounded-full bg-ink/10" />
          </span>
          <span className="truncate rounded-md bg-white px-2 py-0.5 font-mono text-[11px] text-muted">
            {host}
          </span>
        </div>

        <div className="flex items-center gap-2 px-4 py-3" style={{ background: main }}>
          {/^(https?:|data:)/.test(values.logo_url || "") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={values.logo_url} alt="" className="h-7 w-7 rounded bg-white/90 object-contain p-0.5" />
          ) : (
            <span
              className="flex h-7 w-7 items-center justify-center rounded bg-white/20 text-xs font-bold text-white"
              aria-hidden="true"
            >
              {businessName.trim().charAt(0).toUpperCase() || "B"}
            </span>
          )}
          <span className="truncate text-sm font-semibold text-white">{businessName}</span>
        </div>

        <div className="px-5 py-6" style={{ background: `${main}0d` }}>
          {values.hero_eyebrow && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]" style={{ color: secondary }}>
              {values.hero_eyebrow}
            </p>
          )}
          <p className="mt-1 font-display text-xl font-semibold leading-tight text-ink">
            {values.hero_title || businessName}
          </p>
          <p className="mt-1.5 line-clamp-2 text-xs text-muted">
            {values.hero_subtitle || values.business_tagline || "Your one-line pitch goes here."}
          </p>
          <span
            className="mt-4 inline-block rounded-md px-3 py-1.5 text-xs font-semibold text-white"
            style={{ background: cta }}
          >
            Book now
          </span>
        </div>

        <div className="space-y-2 px-4 pb-4 pt-3">
          {(named.length ? named : [null, null]).map((tour, i) => (
            <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-line p-2.5">
              <div className="min-w-0">
                <p className={`truncate text-xs font-semibold ${tour ? "text-ink" : "text-ink/25"}`}>
                  {tour?.name || "Your tour"}
                </p>
                <p className="text-[11px] text-muted">
                  {tour ? duration(tour.duration_minutes) || " " : "Duration"}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold" style={{ color: tour ? main : undefined }}>
                {tour ? money(values.currency, tour.base_price_per_person) || "Price" : "Price"}
              </span>
            </div>
          ))}
          {values.meeting_point && (
            <p className="truncate pt-1 text-[11px] text-muted">Meet at {values.meeting_point}</p>
          )}
        </div>
      </div>
      <figcaption className="mt-3 text-center text-xs text-muted">Live preview. Updates as you type.</figcaption>
    </figure>
  );
}
