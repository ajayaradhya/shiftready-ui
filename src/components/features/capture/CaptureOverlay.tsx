"use client";

import { CheckCircle2 } from "lucide-react";
import type { CaptureToast, CapturedItem } from "@/lib/capture/capture-types";

interface Props {
  detectedItems: CapturedItem[];
  toasts: CaptureToast[];
}

export function CaptureOverlay({ detectedItems, toasts }: Props) {
  return (
    <>
      {/* Top-left: item count chip */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 14px",
          borderRadius: 100,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255,255,255,0.12)",
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: detectedItems.length > 0 ? "var(--moss-500)" : "rgba(255,255,255,0.3)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "#fff",
            letterSpacing: "-0.01em",
          }}
        >
          {detectedItems.length === 0
            ? "Scanning…"
            : `${detectedItems.length} item${detectedItems.length === 1 ? "" : "s"} found`}
        </span>
      </div>

      {/* Toast stack (top-center, below header) */}
      <div
        style={{
          position: "absolute",
          top: 12,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          pointerEvents: "none",
          zIndex: 10,
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "8px 16px",
              borderRadius: 100,
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(12px)",
              border: "1px solid var(--moss-500)",
              animation: "fadeInUp 200ms ease-out",
              whiteSpace: "nowrap",
            }}
          >
            <CheckCircle2
              size={14}
              strokeWidth={2}
              style={{ color: "var(--moss-500)", flexShrink: 0 }}
            />
            <span
              style={{
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                fontWeight: 600,
                color: "#fff",
                textTransform: "capitalize",
              }}
            >
              Got {toast.label} ✓
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
