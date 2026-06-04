"use client";

import { PackageCheck, Upload, X } from "lucide-react";
import type { UploadStatus } from "@/hooks/use-upload";

interface Props {
  itemCount: number;
  durationSeconds: number;
  uploadStatus: UploadStatus;
  uploadProgress: number;
  fileError: string | null;
  onUpload: () => void;
  onCancel: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export function FinalizeCaptureDialog({
  itemCount,
  durationSeconds,
  uploadStatus,
  uploadProgress,
  fileError,
  onUpload,
  onCancel,
}: Props) {
  const isUploading = uploadStatus === "uploading";

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(6px)",
          zIndex: 20,
        }}
      />

      {/* Sheet */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 21,
          background: "var(--sr-bg-card)",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: "24px 24px 40px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                background: "var(--clay-50)",
                border: "1px solid var(--clay-100)",
                display: "grid",
                placeItems: "center",
                color: "var(--clay-600)",
                flexShrink: 0,
              }}
            >
              <PackageCheck size={22} strokeWidth={1.5} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "var(--ink-800)",
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                }}
              >
                Capture complete
              </div>
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 13,
                  color: "var(--sr-text-secondary)",
                  marginTop: 2,
                }}
              >
                Ready to process
              </div>
            </div>
          </div>

          {!isUploading && (
            <button
              onClick={onCancel}
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                border: "1px solid var(--sr-border-subtle)",
                background: "transparent",
                display: "grid",
                placeItems: "center",
                cursor: "pointer",
                color: "var(--sr-text-muted)",
                flexShrink: 0,
              }}
            >
              <X size={16} strokeWidth={2} />
            </button>
          )}
        </div>

        {/* Stats */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {[
            { label: "Items detected", value: String(itemCount) },
            { label: "Duration", value: formatDuration(durationSeconds) },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                padding: "12px 16px",
                background: "var(--sr-bg-app)",
                border: "1px solid var(--sr-border-subtle)",
                borderRadius: "var(--sr-radius-md)",
              }}
            >
              <div
                style={{
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--sr-text-muted)",
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "var(--ink-800)",
                  letterSpacing: "-0.02em",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>

        {/* Upload progress */}
        {isUploading && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                color: "var(--sr-text-secondary)",
              }}
            >
              <span>Uploading recording…</span>
              <span style={{ fontFamily: "var(--sr-font-mono)", fontWeight: 600 }}>
                {uploadProgress}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                borderRadius: 2,
                background: "var(--sr-border-subtle)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${uploadProgress}%`,
                  background: "var(--clay-600)",
                  borderRadius: 2,
                  transition: "width 300ms ease-out",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {fileError && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-100)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--rust-600)",
              lineHeight: 1.45,
            }}
          >
            {fileError}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={onUpload}
          disabled={isUploading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            minHeight: 52,
            padding: "14px 24px",
            borderRadius: "var(--sr-radius-lg)",
            border: "none",
            background: isUploading ? "var(--clay-200)" : "var(--clay-600)",
            color: isUploading ? "var(--clay-400)" : "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--sr-font-sans)",
            cursor: isUploading ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            transition: "background 120ms",
          }}
        >
          <Upload size={18} strokeWidth={2} />
          {isUploading ? "Uploading…" : "Upload & Process"}
        </button>

        {!isUploading && (
          <p
            style={{
              margin: 0,
              textAlign: "center",
              fontSize: 12,
              color: "var(--sr-text-muted)",
              lineHeight: 1.45,
            }}
          >
            Your recording will be analyzed by AI to extract inventory items.
          </p>
        )}
      </div>
    </>
  );
}
