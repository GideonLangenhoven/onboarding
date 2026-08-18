"use client";

import { useState, useRef, useCallback } from "react";
import { getSupabase } from "../lib/api";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.svg";
const MAX_SIZE_BYTES = 5 * 1024 * 1024;
const BUCKET = "onboarding-assets";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  value: string;
  onChange: (url: string) => void;
  label: string;
};

export default function ImageUploader({ value, onChange, label }: Props) {
  const [mode, setMode] = useState<"upload" | "url">(value ? "url" : "upload");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError("");

      if (!ACCEPTED_TYPES.includes(file.type)) {
        setError("That file type is not supported. Use JPG, PNG, WebP or SVG.");
        return;
      }
      if (file.size > MAX_SIZE_BYTES) {
        setError(`That file is ${formatBytes(file.size)}. The most we can take is 5 MB.`);
        return;
      }

      let storage;
      try {
        storage = getSupabase().storage.from(BUCKET);
      } catch (caught) {
        setError((caught as Error).message);
        return;
      }

      setUploading(true);
      setProgress(30);

      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${Date.now()}_${safeName}`;

      const { error: uploadError } = await storage.upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

      if (uploadError) {
        setUploading(false);
        setProgress(0);
        setError(
          uploadError.message?.includes("Bucket not found")
            ? "Image storage is not set up yet. Paste a link to your logo instead."
            : `Upload failed. ${uploadError.message}`,
        );
        return;
      }

      setProgress(100);
      setUploading(false);

      const { data } = storage.getPublicUrl(path);
      if (data?.publicUrl) onChange(data.publicUrl);
      else setError("The upload worked but we could not get a link. Please try again.");
    },
    [onChange],
  );

  const hasPreview = /^(https?:|data:)/.test(value || "");

  return (
    <div>
      <span className="field">{label}</span>

      <div className="mb-3 flex gap-2" role="tablist" aria-label="How to add an image">
        {(["upload", "url"] as const).map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={mode === option}
            className={
              mode === option
                ? "btn-small border-accent bg-accent text-white hover:bg-accent"
                : "btn-small"
            }
            onClick={() => setMode(option)}
          >
            {option === "upload" ? "Upload an image" : "Paste a link"}
          </button>
        ))}
      </div>

      {mode === "upload" ? (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileInputRef.current?.click()}
          onDrop={(event) => {
            event.preventDefault();
            setDragOver(false);
            const file = event.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
            ${dragOver ? "border-accent bg-accent/5" : "border-line bg-white/60 hover:bg-white"}`}
        >
          {uploading ? (
            <>
              <div className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-line">
                <div
                  className="h-full rounded-full bg-accent transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="hint">Uploading, {progress} percent</span>
            </>
          ) : (
            <>
              <span className="text-ink">Click here, or drag an image in</span>
              <span className="hint">JPG, PNG, WebP or SVG, up to 5 MB</span>
            </>
          )}
        </button>
      ) : (
        <input
          type="url"
          className="input"
          value={value}
          aria-label={label}
          placeholder="https://..."
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
        />
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_EXTENSIONS}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />

      {error && (
        <p className="mt-2 text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      {hasPreview && (
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl border border-line bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="Your logo" className="max-h-full max-w-full object-contain" />
          </span>
          <button
            type="button"
            className="btn-small"
            onClick={() => {
              onChange("");
              setError("");
              setProgress(0);
            }}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
