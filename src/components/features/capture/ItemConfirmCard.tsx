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
        bottom: 96,
        left: 16,
        right: 16,
        zIndex: 15,
        background: "var(--sr-bg-card)",
        borderRadius: 16,
        padding: "14px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        boxShadow: "0 8px 32px rgba(0,0,0,0.28)",
        border: "1px solid var(--sr-border-subtle)",
      }}
    >
      {/* Thumbnail */}
      {pending.frameSrc && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={pending.frameSrc}
          alt={pending.label}
          style={{
            width: 52,
            height: 52,
            borderRadius: 10,
            objectFit: "cover",
            flexShrink: 0,
            border: "1px solid var(--sr-border-subtle)",
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
            color: "var(--sr-text-muted)",
            marginBottom: 2,
          }}
        >
          Detected
        </div>
        <div
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 17,
            fontWeight: 500,
            color: "var(--ink-800)",
            textTransform: "capitalize",
            letterSpacing: "-0.01em",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {pending.label}
        </div>
      </div>

      {/* Skip */}
      <button
        onClick={onSkip}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid var(--sr-border-subtle)",
          background: "transparent",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "var(--sr-text-muted)",
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
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "var(--clay-600)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "#fff",
          flexShrink: 0,
        }}
        aria-label="Add item"
      >
        <Plus size={18} strokeWidth={2.5} />
      </button>
    </div>
  );
}
