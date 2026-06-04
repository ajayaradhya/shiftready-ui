"use client";

import { CheckCircle2 } from "lucide-react";
import type { CaptureToast } from "@/lib/capture/capture-types";

interface Props {
  toasts: CaptureToast[];
}

export function CaptureOverlay({ toasts }: Props) {
  return (
    <>
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
              {toast.displayLabel ? `${toast.displayLabel} ✓` : `Got ${toast.label} ✓`}
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
