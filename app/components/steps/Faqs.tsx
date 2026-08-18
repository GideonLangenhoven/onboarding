"use client";

import { TextArea } from "../Field";
import type { Faq, StepContext } from "../../lib/onboarding";

const SUGGESTIONS = [
  "What happens if the weather is bad?",
  "Do I need any experience?",
  "Is there parking?",
  "Can children come along?",
];

function readFaqs(raw: string | undefined): Faq[] {
  try {
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? (parsed as Faq[]) : [];
  } catch {
    return [];
  }
}

export function Faqs({ values, set }: StepContext) {
  const faqs = readFaqs(values.faq_json);

  function write(next: Faq[]) {
    set({ faq_json: JSON.stringify(next) });
  }

  return (
    <div className="space-y-5">
      {faqs.length === 0 && (
        <p className="hint">
          Add the questions you answer over and over. Two or three is a good start.
        </p>
      )}

      <ul className="space-y-4">
        {faqs.map((faq, index) => (
          <li key={index} className="space-y-3 rounded-xl border border-line bg-white/70 p-4">
            <div>
              <label className="field" htmlFor={`faq-q-${index}`}>
                Question
              </label>
              <input
                id={`faq-q-${index}`}
                className="input"
                value={faq.question}
                onChange={(e) =>
                  write(faqs.map((f, i) => (i === index ? { ...f, question: e.target.value } : f)))
                }
              />
            </div>
            <div>
              <label className="field" htmlFor={`faq-a-${index}`}>
                Your answer
              </label>
              <textarea
                id={`faq-a-${index}`}
                rows={3}
                className="input"
                value={faq.answer}
                onChange={(e) =>
                  write(faqs.map((f, i) => (i === index ? { ...f, answer: e.target.value } : f)))
                }
              />
            </div>
            <button
              type="button"
              className="btn-small"
              onClick={() => write(faqs.filter((_, i) => i !== index))}
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="btn-ghost"
          onClick={() => write([...faqs, { question: "", answer: "" }])}
        >
          Add a question
        </button>
        {SUGGESTIONS.filter((s) => !faqs.some((f) => f.question === s)).map((suggestion) => (
          <button
            key={suggestion}
            type="button"
            className="btn-small"
            onClick={() => write([...faqs, { question: suggestion, answer: "" }])}
          >
            {suggestion}
          </button>
        ))}
      </div>
    </div>
  );
}

export function Persona({ values, set, businessName }: StepContext) {
  return (
    <div className="space-y-5">
      <TextArea
        id="ai_system_prompt"
        label="Tell your assistant how to behave"
        hint="Plain words are fine. Mention your tone, anything it must never promise, and who to hand over to."
        rows={7}
        value={values.ai_system_prompt || ""}
        placeholder={`You are the friendly assistant for ${businessName}. Be warm and brief. Never promise a refund, always check the cancellation policy. If someone is upset or asks about anything you are unsure of, hand them over to a person.`}
        onChange={(e) => set({ ai_system_prompt: e.target.value })}
      />
      <button
        type="button"
        className="btn-small"
        onClick={() =>
          set({
            ai_system_prompt: `You are the friendly assistant for ${businessName}. Be warm and brief. Never promise a refund, always check the cancellation policy. If someone is upset or asks about anything you are unsure of, hand them over to a person.`,
          })
        }
      >
        Use that wording
      </button>
    </div>
  );
}
