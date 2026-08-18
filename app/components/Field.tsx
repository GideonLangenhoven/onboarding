"use client";

import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type Common = { id: string; label: string; hint?: string };

export function TextField({
  id,
  label,
  hint,
  ...rest
}: Common & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="field" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="input" aria-describedby={hint ? `${id}-hint` : undefined} {...rest} />
      {hint && (
        <p className="hint mt-1.5" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

export function TextArea({
  id,
  label,
  hint,
  rows = 4,
  ...rest
}: Common & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="field" htmlFor={id}>
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        className="input"
        aria-describedby={hint ? `${id}-hint` : undefined}
        {...rest}
      />
      {hint && (
        <p className="hint mt-1.5" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}
