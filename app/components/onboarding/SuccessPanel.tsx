"use client";

import type { FormState, SubmitResult } from "./types";
import { slugify, buildFallbackSql, downloadSql } from "./utils";

export function SuccessPanel({
  form,
  submitResult,
}: {
  form: FormState;
  submitResult: SubmitResult;
}) {
  const migrationSql = buildFallbackSql(form);

  return (
    <section className="success-panel">
      <div className="section-header">
        <p className="eyebrow">Onboarding Complete</p>
        <h2>Success! {submitResult.businessName} is now ready for launch.</h2>
        <p className="lede">
          We've successfully created your workspace. Below are your account details and the next steps to start welcoming guests.
        </p>
      </div>
      <div className="success-grid">
        <div className="success-card">
          <span className="metric-label">Account Link</span>
          <strong>{submitResult.tenantSlug || slugify(form.business.tenantSlug)}</strong>
        </div>
        <div className="success-card">
          <span className="metric-label">Activities Provisioned</span>
          <strong>{submitResult.toursCreated}</strong>
        </div>
        <div className="success-card">
          <span className="metric-label">Booking Slots Active</span>
          <strong>{submitResult.slotsCreated}</strong>
        </div>
        <div className="success-card">
          <span className="metric-label">Admin Login</span>
          <strong>Ready</strong>
        </div>
      </div>
      <div className="guide-card">
        <h3>Next actions</h3>
        <ul>
          {submitResult.nextSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ul>
      </div>

      {/* ── Credential wiring status ── */}
      {(submitResult.credentialsWired || submitResult.credentialWarnings?.length) && (
        <div className="guide-card">
          <h3>Integration status</h3>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            <li style={{ padding: "0.4rem 0", fontSize: "0.9rem" }}>
              <span style={{ marginRight: "0.5rem" }}>
                {submitResult.credentialsWired?.whatsapp ? "✅" : "⚪"}
              </span>
              <strong>WhatsApp Business:</strong>{" "}
              {submitResult.credentialsWired?.whatsapp
                ? "Wired live — AI host + reminders active on day 1."
                : "Not wired. Add your Access Token + Phone Number ID in Settings → Credentials to enable."}
            </li>
            <li style={{ padding: "0.4rem 0", fontSize: "0.9rem" }}>
              <span style={{ marginRight: "0.5rem" }}>
                {submitResult.credentialsWired?.yoco ? "✅" : "⚪"}
              </span>
              <strong>Yoco Payments:</strong>{" "}
              {submitResult.credentialsWired?.yoco
                ? "Wired live — card payments enabled on your booking site."
                : "Not wired. Add your Secret Key + Webhook Signing Secret in Settings → Credentials to enable."}
            </li>
          </ul>
          {submitResult.credentialWarnings && submitResult.credentialWarnings.length > 0 && (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem 1rem", borderRadius: "8px", background: "rgba(255, 170, 0, 0.08)", fontSize: "0.85rem" }}>
              <strong>Heads up:</strong>
              <ul style={{ margin: "0.4rem 0 0 1rem", padding: 0 }}>
                {submitResult.credentialWarnings.map((warning, i) => (
                  <li key={i} style={{ marginBottom: "0.25rem" }}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <div className="guide-card">
        <h3>Technical Reference (Internal)</h3>
        <p>
          In the unlikely event our automated setup system is interrupted, you can download this backup configuration. Our support team can use this to manually restore your account.
        </p>
        <div className="stack">
          <button
            type="button"
            className="primary-button secondary"
            onClick={() =>
              downloadSql(
                `${submitResult.tenantSlug || slugify(form.business.tenantSlug || form.business.businessName)}-onboarding-fallback.sql`,
                migrationSql,
              )
            }
          >
            Download migration SQL
          </button>
          <label className="full-span">
            SQL preview
            <textarea value={migrationSql} readOnly rows={16} />
          </label>
        </div>
      </div>
    </section>
  );
}
