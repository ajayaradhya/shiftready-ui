"use client";

import { Plus, X } from "lucide-react";
import type { PendingDetection } from "@/lib/capture/capture-types";

interface Props {
  pending: PendingDetection;
  onAdd: (item: PendingDetection) => void;
  onSkip: () => void;
}

export function ItemConfirmCard({ pending, onAdd, onSkip }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: "calc(88px + env(safe-area-inset-bottom, 0px))",
        left: 12,
        right: 12,
        zIndex: 15,
        background: "rgba(14,12,10,0.92)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 18,
        padding: "14px 14px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.40)",
        border: "1px solid rgba(255,255,255,0.10)",
      }}
    >
      {/* Thumbnail */}
      {pending.frameSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pending.frameSrc}
          alt={pending.label}
          style={{
            width: 56,
            height: 56,
            borderRadius: 12,
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        />
      )}

      {/* Label */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "rgba(255,255,255,0.40)",
            marginBottom: 3,
          }}
        >
          Detected
        </div>
        <div
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 17,
            fontWeight: 500,
            color: "rgba(255,255,255,0.90)",
            textTransform: "capitalize",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {pending.label}
        </div>
        <div
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 12,
            color: "rgba(255,255,255,0.35)",
            marginTop: 2,
          }}
        >
          Add to bucket?
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.14)",
          background: "rgba(255,255,255,0.06)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "rgba(255,255,255,0.55)",
          flexShrink: 0,
        }}
        aria-label="Skip"
      >
        <X size={18} strokeWidth={2} />
      </button>

      {/* Add */}
      <button
        onClick={() => onAdd(pending)}
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          border: "none",
          background: "var(--clay-600)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "#fff",
          flexShrink: 0,
          boxShadow: "0 4px 16px rgba(181,96,74,0.35)",
        }}
        aria-label="Add item"
      >
        <Plus size={20} strokeWidth={2.5} />
      </button>
    </div>
  );
}
