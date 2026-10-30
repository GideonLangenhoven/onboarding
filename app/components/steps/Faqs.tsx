"use client";

import { useEffect } from "react";
import { TextArea } from "../Field";
import type { Faq, StepContext } from "../../lib/onboarding";

const SUGGESTIONS = [
  "What happens if the weather is bad?",
  "Do I need any experience?",
  "Is there parking?",
  "Can children come along?",
  "Is there a minimum age?",
];

export function readFaqs(raw: string | undefined): Faq[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as Faq[]) : [];
  } catch {
    return [];
  }
}

const persona = (businessName: string) =>
  `You are the friendly assistant for ${businessName}. Be warm and brief. Never promise a refund, always check the cancellation policy. If someone is upset or asks about anything you are unsure of, hand them over to a person.`;

export function Assistant({ values, set, businessName }: StepContext) {
  const faqs = readFaqs(values.faq_json);

  // Same reasoning as the refund defaults: a sensible persona beats none.
  // Mount only, so clearing the box to retype it does not refill it.
  useEffect(() => {
    if (!values.ai_system_prompt) set({ ai_system_prompt: persona(businessName) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function write(next: Faq[]) {
    set({ faq_json: JSON.stringify(next) });
  }

  const unused = SUGGESTIONS.filter((s) => !faqs.some((f) => f.question === s));

  return (
    <div className="space-y-6">
      <div>
        <p className="field">Questions guests always ask</p>
        <p className="hint mb-3">Two or three is a great start. Tap one to add it.</p>
        {unused.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {unused.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                className="btn-small"
                onClick={() => write([...faqs, { question: suggestion, answer: "" }])}
              >
                + {suggestion}
              </button>
            ))}
          </div>
        )}

        <ul className="space-y-3">
          {faqs.map((faq, index) => (
            <li key={index} className="rounded-xl border border-line p-3.5">
              <div className="flex items-start gap-2">
                <input
                  aria-label={`Question ${index + 1}`}
                  className="input border-transparent px-0 py-1 font-medium shadow-none hover:border-transparent focus:border-transparent focus:ring-0"
                  placeholder="Type the question"
                  value={faq.question}
                  onChange={(e) =>
                    write(faqs.map((f, i) => (i === index ? { ...f, question: e.target.value } : f)))
                  }
                />
                <button
                  type="button"
                  className="mt-1 shrink-0 text-sm text-muted hover:text-danger"
                  aria-label={`Remove question ${index + 1}`}
                  onClick={() => write(faqs.filter((_, i) => i !== index))}
                >
                  Remove
                </button>
              </div>
              <textarea
                aria-label={`Answer to question ${index + 1}`}
                rows={2}
                className="input mt-2"
                placeholder="Your answer"
                value={faq.answer}
                onChange={(e) =>
                  write(faqs.map((f, i) => (i === index ? { ...f, answer: e.target.value } : f)))
                }
              />
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn-ghost mt-3"
          onClick={() => write([...faqs, { question: "", answer: "" }])}
        >
          + Add your own question
        </button>
      </div>

      <details className="group rounded-xl border border-line">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm">
          <span>
            <span className="font-medium">How your assistant sounds</span>
            <span className="hint ml-2">Warm and brief, hands tricky chats to you</span>
          </span>
          <span className="text-muted transition group-open:rotate-180" aria-hidden="true">⌄</span>
        </summary>
        <div className="border-t border-line p-4">
          <TextArea
            id="ai_system_prompt"
            label="Instructions for your assistant"
            hint="Plain words are fine. Mention your tone, anything it must never promise, and when to hand over to you."
            rows={5}
            value={values.ai_system_prompt || ""}
            onChange={(e) => set({ ai_system_prompt: e.target.value })}
          />
        </div>
      </details>
    </div>
  );
}
