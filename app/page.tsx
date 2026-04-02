"use client";

import { useState } from "react";
import type { FormState, SubmitResult } from "./components/onboarding/types";
import { INITIAL_STATE } from "./components/onboarding/constants";
import { HeroPanel } from "./components/onboarding/HeroPanel";
import { PresentationPanel } from "./components/onboarding/PresentationPanel";
import { GuidePanel } from "./components/onboarding/GuidePanel";
import { SuccessPanel } from "./components/onboarding/SuccessPanel";
import { OnboardingForm } from "./components/onboarding/OnboardingForm";

export default function HomePage() {
  const [form, setForm] = useState<FormState>(INITIAL_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitError("");
    setSubmitResult(null);

    try {
      const response = await fetch("/api/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const payload = (await response.json()) as SubmitResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error || "Failed to submit onboarding.");
      }

      setSubmitResult(payload);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to submit onboarding.");
    }

    setSubmitting(false);
  }

  return (
    <main className="shell">
      <HeroPanel form={form} />
      <PresentationPanel />
      <GuidePanel />

      {submitResult ? (
        <SuccessPanel form={form} submitResult={submitResult} />
      ) : null}

      <OnboardingForm
        form={form}
        setForm={setForm}
        submitting={submitting}
        submitError={submitError}
        onSubmit={handleSubmit}
      />
    </main>
  );
}
