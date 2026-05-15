"use client";

import { Trash2, Plus, PackageCheck, Loader2 } from "lucide-react";
import type { CapturedItem } from "@/lib/capture/capture-types";

interface Props {
  items: CapturedItem[];
  isUploading: boolean;
  uploadError: string | null;
  onRemove: (label: string) => void;
  onProcess: () => void;
  onBack: () => void;
}

export function ItemReviewScreen({
  items,
  isUploading,
  uploadError,
  onRemove,
  onProcess,
  onBack,
}: Props) {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 64px)",
        background: "var(--sr-bg-app)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px 16px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--clay-50)",
              border: "1px solid var(--clay-100)",
              display: "grid",
              placeItems: "center",
              color: "var(--clay-600)",
              flexShrink: 0,
            }}
          >
            <PackageCheck size={20} strokeWidth={1.5} />
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
              Review items
            </div>
            <div
              style={{
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                color: "var(--sr-text-secondary)",
                marginTop: 2,
              }}
            >
              {items.length === 0
                ? "No items added yet"
                : `${items.length} item${items.length !== 1 ? "s" : ""} to list`}
            </div>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--sr-bg-card)",
                border: "1px dashed var(--sr-border-subtle)",
                display: "grid",
                placeItems: "center",
                color: "var(--sr-text-muted)",
              }}
            >
              <Plus size={24} strokeWidth={1.5} />
            </div>
            <div style={{ fontFamily: "var(--sr-font-sans)", fontSize: 14, color: "var(--sr-text-muted)" }}>
              Go back and point at items to add them
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
              gap: 12,
            }}
          >
            {items.map((item) => (
              <div
                key={item.label}
                style={{
                  position: "relative",
                  borderRadius: 14,
                  overflow: "hidden",
                  border: "1px solid var(--sr-border-subtle)",
                  background: "var(--sr-bg-card)",
                }}
              >
                {item.frameSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.frameSrc}
                    alt={item.label}
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: "100%",
                      aspectRatio: "4/3",
                      background: "var(--sr-bg-app)",
                      display: "grid",
                      placeItems: "center",
                      color: "var(--sr-text-muted)",
                    }}
                  >
                    <PackageCheck size={28} strokeWidth={1} />
                  </div>
                )}

                <div style={{ padding: "8px 10px 10px" }}>
                  <div
                    style={{
                      fontFamily: "var(--sr-font-sans)",
                      fontSize: 13,
                      fontWeight: 600,
                      color: "var(--ink-800)",
                      textTransform: "capitalize",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {item.label}
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemove(item.label)}
                  disabled={isUploading}
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    border: "none",
                    background: "rgba(0,0,0,0.55)",
                    backdropFilter: "blur(4px)",
                    display: "grid",
                    placeItems: "center",
                    cursor: isUploading ? "not-allowed" : "pointer",
                    color: "#fff",
                    opacity: isUploading ? 0.5 : 1,
                  }}
                  aria-label={`Remove ${item.label}`}
                >
                  <Trash2 size={13} strokeWidth={2} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 16px 32px",
          background: "var(--sr-bg-card)",
          borderTop: "1px solid var(--sr-border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {uploadError && (
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
            {uploadError}
          </div>
        )}

        <button
          onClick={onProcess}
          disabled={items.length === 0 || isUploading}
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
            background: items.length === 0 || isUploading ? "var(--clay-200)" : "var(--clay-600)",
            color: items.length === 0 || isUploading ? "var(--clay-400)" : "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--sr-font-sans)",
            cursor: items.length === 0 || isUploading ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            transition: "background 120ms",
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <PackageCheck size={18} strokeWidth={2} />
              Process {items.length} item{items.length !== 1 ? "s" : ""}
            </>
          )}
        </button>

        {!isUploading && (
          <button
            onClick={onBack}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "10px 24px",
              borderRadius: "var(--sr-radius-lg)",
              border: "1px solid var(--sr-border-subtle)",
              background: "transparent",
              color: "var(--sr-text-secondary)",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "var(--sr-font-sans)",
              cursor: "pointer",
            }}
          >
            Back to capture
          </button>
        )}
      </div>
    </div>
  );
}
