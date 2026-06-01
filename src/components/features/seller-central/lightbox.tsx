"use client";

import { useEffect, useState } from "react";
import { X, Star } from "lucide-react";
import type { InventoryImage } from "@/lib/types";
import { FocusTrap } from "@/components/ui/focus-trap";

interface LightboxProps {
  images: InventoryImage[];
  initialIdx: number;
  itemName?: string;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSetCover: (id: string) => Promise<void>;
  deletingId: string | null;
  coveringId: string | null;
}

function Spinner({ color = "var(--clay-500)" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block", width: 11, height: 11, borderRadius: "50%",
        border: "1.5px solid transparent", borderTopColor: color, borderRightColor: color,
        animation: "spin 0.7s linear infinite", flexShrink: 0,
      }}
    />
  );
}

export function Lightbox({
  images, initialIdx, itemName, onClose,
  onDelete, onSetCover, deletingId, coveringId,
}: LightboxProps) {
  const [idx, setIdx] = useState(Math.min(initialIdx, Math.max(0, images.length - 1)));
  const safeIdx = images.length === 0 ? 0 : Math.min(idx, images.length - 1);
  const current = images[safeIdx];
  const isBusy = !!(deletingId || coveringId);
  const titleId = "lightbox-title";

  function prev() { if (!isBusy) setIdx((i) => Math.max(0, i - 1)); }
  function next() { if (!isBusy) setIdx((i) => Math.min(images.length - 1, i + 1)); }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  });

  // Close when all images deleted
  useEffect(() => {
    if (images.length === 0) onClose();
  }, [images.length, onClose]);

  if (!current) return null;

  return (
    <FocusTrap onClose={onClose}>
    <div
      role="dialog"
      aria-modal
      aria-labelledby={titleId}
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(20,17,13,0.94)",
        zIndex: 1000, display: "flex", flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          height: 56, display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "0 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {itemName && (
            <span id={titleId} style={{ fontFamily: "var(--sr-font-serif)", fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 500 }}>
              {itemName}
            </span>
          )}
          {!itemName && <span id={titleId} className="sr-only">Image viewer</span>}
          <span
            aria-live="polite"
            aria-atomic
            style={{ fontFamily: "var(--sr-font-mono)", fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            <span className="sr-only">Image </span>{idx + 1} / {images.length}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!current.is_cover && (
            <button
              onClick={() => !isBusy && onSetCover(current.id)}
              disabled={isBusy}
              style={{
                padding: "5px 12px", borderRadius: "var(--sr-radius-sm)",
                border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
                color: "#fff", fontFamily: "var(--sr-font-sans)", fontSize: 12,
                cursor: isBusy ? "default" : "pointer", display: "flex", alignItems: "center",
                gap: 5, opacity: isBusy ? 0.5 : 1, transition: "background 80ms",
              }}
              onMouseEnter={(e) => { if (!isBusy) (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              {coveringId === current.id ? <Spinner /> : <Star size={11} strokeWidth={1.5} />}
              {coveringId === current.id ? "Setting…" : "Set as cover"}
            </button>
          )}
          <button
            onClick={() => {
              if (!isBusy) {
                onDelete(current.id);
                if (idx >= images.length - 1) setIdx(Math.max(0, idx - 1));
              }
            }}
            disabled={isBusy}
            style={{
              padding: "5px 12px", borderRadius: "var(--sr-radius-sm)",
              border: "1px solid rgba(200,80,60,0.35)", background: "transparent",
              color: "rgba(220,120,100,1)", fontFamily: "var(--sr-font-sans)", fontSize: 12,
              cursor: isBusy ? "default" : "pointer", display: "flex", alignItems: "center",
              gap: 5, opacity: isBusy ? 0.5 : 1, transition: "background 80ms",
            }}
            onMouseEnter={(e) => { if (!isBusy) (e.currentTarget as HTMLElement).style.background = "rgba(200,80,60,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            {deletingId === current.id ? <Spinner color="rgba(220,120,100,1)" /> : null}
            {deletingId === current.id ? "Removing…" : "Remove"}
          </button>
          <button
            onClick={onClose}
            aria-label="Close image viewer"
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.18)", background: "transparent",
              display: "grid", placeItems: "center", cursor: "pointer", color: "#fff",
              transition: "background 80ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Stage */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative", padding: "0 56px", minHeight: 0,
        }}
      >
        {idx > 0 && (
          <button
            onClick={prev}
            style={{ ...arrowBtnStyle, left: 8 }}
            aria-label="Previous image"
          >
            ‹
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={current.id}
          src={current.url ?? "/item-placeholder.svg"}
          alt=""
          style={{
            maxWidth: "100%", maxHeight: "calc(100dvh - 180px)", objectFit: "contain",
            borderRadius: "var(--sr-radius-lg)", boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
            animation: "fadeSlide 160ms ease",
          }}
        />
        {idx < images.length - 1 && (
          <button
            onClick={next}
            style={{ ...arrowBtnStyle, right: 8 }}
            aria-label="Next image"
          >
            ›
          </button>
        )}
      </div>

      {/* Thumb strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex", gap: 8, padding: "12px 20px",
          justifyContent: "center", overflowX: "auto", flexShrink: 0,
        }}
      >
        {images.map((img, i) => (
          <button
            key={img.id}
            onClick={() => setIdx(i)}
            aria-label={`View image ${i + 1}${i === idx ? " (current)" : ""}`}
            aria-pressed={i === idx}
            style={{
              padding: 0, background: "transparent", border: "none", cursor: "pointer",
              borderRadius: "var(--sr-radius-sm)", flexShrink: 0,
              outline: i === idx ? "2px solid var(--clay-400)" : "2px solid rgba(255,255,255,0.1)",
              outlineOffset: 0,
              transition: "opacity 120ms, outline-color 120ms",
              opacity: i === idx ? 1 : 0.5,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.url ?? "/item-placeholder.svg"}
              alt=""
              style={{
                width: 64, height: 64, objectFit: "cover",
                borderRadius: "var(--sr-radius-sm)", display: "block",
              }}
            />
          </button>
        ))}
      </div>
    </div>
    </FocusTrap>
  );
}

const arrowBtnStyle: React.CSSProperties = {
  position: "absolute", top: "50%", transform: "translateY(-50%)",
  width: 44, height: 44, borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.06)",
  color: "#fff", fontSize: 24, display: "grid", placeItems: "center",
  cursor: "pointer", transition: "background 80ms",
};
