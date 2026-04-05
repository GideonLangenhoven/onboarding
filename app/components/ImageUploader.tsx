"use client";

import { useState, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];
const ACCEPTED_EXTENSIONS = ".jpg,.jpeg,.png,.webp,.svg";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const BUCKET = "onboarding-assets";

function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  placeholder?: string;
};

export default function ImageUploader({
  value,
  onChange,
  label,
  placeholder = "https://...",
}: Props) {
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
        setError("File type not accepted. Use JPG, PNG, WebP, or SVG.");
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setError(`File too large (${formatBytes(file.size)}). Maximum is 5 MB.`);
        return;
      }

      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Supabase is not configured. Paste a URL instead.");
        return;
      }

      setUploading(true);
      setProgress(10);

      const timestamp = Date.now();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${timestamp}_${safeName}`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        setUploading(false);
        setProgress(0);
        if (uploadError.message?.includes("Bucket not found")) {
          setError(
            `Storage bucket "${BUCKET}" does not exist. Ask your admin to create it, or paste a URL instead.`
          );
        } else {
          setError(`Upload failed: ${uploadError.message}`);
        }
        return;
      }

      setProgress(80);

      const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

      setProgress(100);
      setUploading(false);

      if (urlData?.publicUrl) {
        onChange(urlData.publicUrl);
      } else {
        setError("Upload succeeded but could not get the public URL.");
      }
    },
    [onChange]
  );

  function handleDrop(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
    const file = event.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  function handleDragOver(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(true);
  }

  function handleDragLeave(event: React.DragEvent) {
    event.preventDefault();
    setDragOver(false);
  }

  function handleInputChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) handleFile(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleRemove() {
    onChange("");
    setError("");
    setProgress(0);
  }

  const hasPreview =
    value &&
    (value.startsWith("http://") ||
      value.startsWith("https://") ||
      value.startsWith("data:"));

  const isSvgUrl = value?.endsWith(".svg");

  return (
    <div className="image-uploader">
      {label && <span className="image-uploader-label">{label}</span>}

      <div className="image-uploader-tabs">
        <button
          type="button"
          className={mode === "upload" ? "image-tab active" : "image-tab"}
          onClick={() => setMode("upload")}
        >
          Upload image
        </button>
        <button
          type="button"
          className={mode === "url" ? "image-tab active" : "image-tab"}
          onClick={() => setMode("url")}
        >
          Paste URL
        </button>
      </div>

      {mode === "upload" ? (
        <div
          className={`image-dropzone${dragOver ? " dragover" : ""}${uploading ? " uploading" : ""}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPTED_EXTENSIONS}
            onChange={handleInputChange}
            className="image-file-input"
            tabIndex={-1}
          />

          {uploading ? (
            <div className="image-upload-progress">
              <div className="image-progress-bar">
                <div
                  className="image-progress-fill"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="image-progress-text">Uploading... {progress}%</span>
            </div>
          ) : (
            <div className="image-dropzone-content">
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span>Click or drag an image here</span>
              <span className="image-dropzone-hint">
                JPG, PNG, WebP, or SVG -- max 5 MB
              </span>
            </div>
          )}
        </div>
      ) : (
        <input
          type="url"
          value={value}
          onChange={(event) => {
            setError("");
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          className="image-url-input"
        />
      )}

      {error && <p className="image-uploader-error">{error}</p>}

      {hasPreview && (
        <div className="image-preview-row">
          <div className="image-preview-thumb">
            {isSvgUrl ? (
              <object
                data={value}
                type="image/svg+xml"
                className="image-preview-img"
                aria-label="Preview"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={value} alt="Preview" className="image-preview-img" />
            )}
          </div>
          <button
            type="button"
            className="ghost-button"
            onClick={handleRemove}
          >
            Remove
          </button>
        </div>
      )}
    </div>
  );
}
