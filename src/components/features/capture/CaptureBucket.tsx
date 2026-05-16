"use client";

import { useEffect, useRef, useState } from "react";
import { Package, X, Trash2, RotateCcw, Loader2, AlertCircle } from "lucide-react";
import type { CapturedItem } from "@/lib/capture/capture-types";

interface Props {
  items: CapturedItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

function formatPrice(price?: number): string | null {
  if (!price || price <= 0) return null;
  return `~$${Math.round(price).toLocaleString()}`;
}

function ItemRow({
  item,
  onRemove,
  onRetry,
}: {
  item: CapturedItem;
  onRemove: () => void;
  onRetry: () => void;
}) {
  const displayName = item.name
    ? item.name
    : item.isLoading
    ? "Identifying…"
    : item.error
    ? item.label.startsWith("unknown-")
      ? "Unknown item"
      : item.label
    : item.label.startsWith("unknown-")
    ? "Unknown item"
    : item.label;

  const price = formatPrice(item.predicted_original_price);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
      }}
    >
      {/* Thumbnail */}
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: 10,
          overflow: "hidden",
          flexShrink: 0,
          background: "rgba(255,255,255,0.06)",
          border: "1px solid rgba(255,255,255,0.10)",
          display: "grid",
          placeItems: "center",
        }}
      >
        {item.frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.frameSrc}
            alt={displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <Package size={20} style={{ color: "rgba(255,255,255,0.25)" }} />
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 14,
            fontWeight: 600,
            color: item.isLoading ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.90)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          {item.isLoading && (
            <Loader2 size={12} style={{ color: "var(--clay-400)", flexShrink: 0 }} className="animate-spin" />
          )}
          {item.error && !item.isLoading && (
            <AlertCircle size={12} style={{ color: "#B14F3B", flexShrink: 0 }} />
          )}
          {displayName}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 4, flexWrap: "wrap" }}>
          {item.brand && !item.isLoading && !item.error && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--sr-font-sans)",
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 100,
                background: "rgba(181,96,74,0.22)",
                color: "#E0A285",
                letterSpacing: "0.01em",
              }}
            >
              {item.brand}
            </span>
          )}
          {price && !item.isLoading && !item.error && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--sr-font-mono)",
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 100,
                background: "rgba(107,138,78,0.20)",
                color: "#85A85C",
                letterSpacing: "0.02em",
              }}
            >
              {price}
            </span>
          )}
          {item.error && !item.isLoading && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--sr-font-sans)",
                color: "rgba(255,255,255,0.35)",
              }}
            >
              Could not identify
            </span>
          )}
          {item.isLoading && (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--sr-font-sans)",
                color: "rgba(255,255,255,0.30)",
              }}
            >
              Asking Gemini…
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
        {item.error && !item.isLoading && (
          <button
            onClick={onRetry}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(181,96,74,0.40)",
              background: "rgba(181,96,74,0.15)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#CC785C",
            }}
            aria-label="Retry identification"
            title="Retry"
          >
            <RotateCcw size={13} strokeWidth={2.5} />
          </button>
        )}
        <button
          onClick={onRemove}
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            border: "1px solid rgba(255,255,255,0.10)",
            background: "rgba(177,79,59,0.12)",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "#C97060",
          }}
          aria-label="Remove item"
        >
          <Trash2 size={13} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

export function CaptureBucket({ items, onRemove, onRetry }: Props) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(items.length);
  const loadingCount = items.filter((i) => i.isLoading).length;
  const errorCount = items.filter((i) => i.error && !i.isLoading).length;

  // Auto-open on first item added
  useEffect(() => {
    if (prevCountRef.current === 0 && items.length === 1) {
      setOpen(true);
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Badge pill
  const badge = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label={`Capture bucket — ${items.length} items`}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 12px 6px 10px",
        borderRadius: 100,
        background: items.length > 0 ? "rgba(181,96,74,0.88)" : "rgba(0,0,0,0.60)",
        backdropFilter: "blur(10px)",
        border: items.length > 0 ? "1px solid rgba(224,162,133,0.30)" : "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        transition: "background 150ms",
        boxShadow: items.length > 0 ? "0 4px 16px rgba(181,96,74,0.25)" : "none",
      }}
    >
      {loadingCount > 0 ? (
        <Loader2 size={14} strokeWidth={2.5} style={{ color: "#fff", flexShrink: 0 }} className="animate-spin" />
      ) : (
        <Package size={14} strokeWidth={2.5} style={{ color: items.length > 0 ? "#fff" : "rgba(255,255,255,0.65)", flexShrink: 0 }} />
      )}
      <span
        style={{
          fontFamily: "var(--sr-font-sans)",
          fontSize: 13,
          fontWeight: 700,
          color: items.length > 0 ? "#fff" : "rgba(255,255,255,0.65)",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {items.length}
      </span>
      {errorCount > 0 && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#B14F3B",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );

  // Bottom sheet panel
  const panel = open && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      <div
        ref={panelRef}
        style={{
          pointerEvents: "auto",
          maxHeight: "68vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(12, 10, 8, 0.94)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          animation: "slideUp 220ms cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "rgba(181,96,74,0.20)",
                border: "1px solid rgba(181,96,74,0.30)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Package size={15} strokeWidth={2} style={{ color: "#CC785C" }} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.90)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                Captured items
              </div>
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.40)",
                  marginTop: 1,
                }}
              >
                {items.length === 0
                  ? "None yet — confirm items while capturing"
                  : `${items.length} item${items.length !== 1 ? "s" : ""}${loadingCount > 0 ? ` · ${loadingCount} identifying…` : ""}`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
            }}
            aria-label="Close bucket"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Item list */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                gap: 10,
                textAlign: "center",
              }}
            >
              <Package size={32} strokeWidth={1} style={{ color: "rgba(255,255,255,0.15)" }} />
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5,
                }}
              >
                Point at an item and tap the <strong style={{ color: "rgba(255,255,255,0.55)" }}>+</strong> button to add it here
              </div>
            </div>
          ) : (
            items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onRemove={() => onRemove(item.id)}
                onRetry={() => onRetry(item.id)}
              />
            ))
          )}
        </div>

        {/* iOS safe area */}
        <div style={{ height: "calc(16px + env(safe-area-inset-bottom, 0px))", flexShrink: 0 }} />
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {badge}
      {panel}
    </>
  );
}
