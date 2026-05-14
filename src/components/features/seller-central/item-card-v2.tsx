"use client";

import { useState } from "react";
import { Play, MoreHorizontal, Sparkles } from "lucide-react";
import type { InventoryItem } from "@/lib/types";
import { ItemPhotoStrip } from "./item-photo-strip";

interface ItemCardV2Props {
  eventId: string;
  bundleId: string;
  item: InventoryItem;
  onSeek?: (ts: number) => void;
}

export function ItemCardV2({ eventId, bundleId, item, onSeek }: ItemCardV2Props) {
  const [reasoningOpen, setReasoningOpen] = useState(false);

  const conf = item.confidence ?? 0;
  const confPct = Math.round(conf * 100);
  const isHighConf = conf >= 0.85;
  const isMedConf = conf >= 0.7 && conf < 0.85;

  const retail = item.actual_original_price ?? item.predicted_original_price;
  const listing = item.actual_listing_price ?? item.predicted_listing_price;
  const year = item.actual_year_of_purchase ?? item.predicted_year_of_purchase;

  return (
    <div
      style={{
        background: conf < 0.7 ? "#FFFDF8" : "var(--sr-bg-card)",
        border: `1px solid ${conf < 0.7 ? "var(--honey-100)" : "var(--sr-border-subtle)"}`,
        borderRadius: "var(--sr-radius-lg)",
        padding: "20px 22px",
        transition: "border-color 160ms, box-shadow 160ms",
        fontFamily: "var(--sr-font-sans)",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = conf < 0.7 ? "var(--honey-200)" : "var(--sr-border-default)";
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--sr-shadow-sm)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = conf < 0.7 ? "var(--honey-100)" : "var(--sr-border-subtle)";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Photo strip */}
      <ItemPhotoStrip
        eventId={eventId}
        bundleId={bundleId}
        itemId={item.id}
        images={item.images ?? []}
      />

      {/* Top row: flags + menu */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {/* Confidence badge */}
          <span
            style={{
              padding: "3px 8px",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              background: isHighConf ? "var(--moss-50)" : isMedConf ? "var(--honey-50)" : "var(--rust-50)",
              color: isHighConf ? "var(--moss-700)" : isMedConf ? "var(--honey-700)" : "var(--rust-500)",
              border: `1px solid ${isHighConf ? "var(--moss-100)" : isMedConf ? "var(--honey-100)" : "var(--rust-100)"}`,
            }}
          >
            {confPct}% match
          </span>
          {/* Seek button */}
          {item.timestamp_label && (
            <button
              onClick={() => onSeek?.(item.video_timestamp)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "3px 8px",
                borderRadius: "var(--sr-radius-sm)",
                background: "var(--cream-50)",
                border: "1px solid var(--sr-border-subtle)",
                fontFamily: "var(--sr-font-mono)",
                fontSize: 10,
                color: "var(--sr-text-muted)",
                cursor: "pointer",
                transition: "all 120ms",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-300)";
                (e.currentTarget as HTMLElement).style.color = "var(--clay-600)";
                (e.currentTarget as HTMLElement).style.background = "var(--clay-50)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-subtle)";
                (e.currentTarget as HTMLElement).style.color = "var(--sr-text-muted)";
                (e.currentTarget as HTMLElement).style.background = "var(--cream-50)";
              }}
            >
              <Play size={8} fill="currentColor" />
              {item.timestamp_label}
            </button>
          )}
        </div>
        <button
          aria-label="Item options"
          style={{ color: "var(--sr-text-muted)", cursor: "pointer", width: 22, height: 22, display: "grid", placeItems: "center", border: "none", background: "transparent" }}
        >
          <MoreHorizontal size={14} />
        </button>
      </div>

      {/* Name */}
      <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)", marginBottom: 10, lineHeight: 1.25 }}>
        {item.name}
      </div>

      {/* Attributes: Brand · Condition · Year */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 1,
          marginBottom: 14,
          background: "var(--sr-border-subtle)",
          border: "1px solid var(--sr-border-subtle)",
          borderRadius: "var(--sr-radius-md)",
          overflow: "hidden",
        }}
      >
        {[
          { label: "Brand", value: item.brand },
          { label: "Condition", value: item.condition },
          { label: "Year purchased", value: year?.toString() ?? "—" },
        ].map((attr) => (
          <div key={attr.label} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "9px 12px", background: "var(--cream-50)" }}>
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
              {attr.label}
            </span>
            <span style={{ fontSize: 13, color: "var(--sr-text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {attr.value || "—"}
            </span>
          </div>
        ))}
      </div>

      {/* Pricing */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--sr-border-subtle)", paddingTop: 12 }}>
        {/* Original retail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 16 }}>
          <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
            Original Retail
          </span>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontWeight: 500 }}>$</span>
            <span style={{ fontSize: 18, fontWeight: 600, color: "var(--sr-text-primary)" }}>
              {retail?.toLocaleString() ?? "—"}
            </span>
          </div>
        </div>

        {/* Listing value */}
        <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16, borderLeft: "1px solid var(--sr-border-subtle)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--clay-600)" }}>
              Listing Value
            </span>
            {item.pricing_reasoning && (
              <button
                onClick={() => setReasoningOpen((o) => !o)}
                style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--clay-500)", cursor: "pointer", border: "none", background: "none", padding: 0, transition: "opacity 120ms" }}
              >
                <Sparkles size={10} />
                AI
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
            <span style={{ fontSize: 15, color: "var(--clay-500)", fontWeight: 600 }}>$</span>
            <span style={{ fontSize: 24, fontWeight: 700, color: "var(--clay-600)", letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>
              {listing?.toLocaleString() ?? "—"}
            </span>
          </div>
        </div>
      </div>

      {/* AI reasoning */}
      {reasoningOpen && item.pricing_reasoning && (
        <div
          style={{
            marginTop: 12,
            padding: "12px 14px",
            background: "linear-gradient(135deg, var(--clay-50), var(--cream-50))",
            border: "1px solid var(--clay-100)",
            borderRadius: "var(--sr-radius-md)",
            display: "flex",
            gap: 9,
            alignItems: "flex-start",
            animation: "fadeSlide 200ms ease",
          }}
        >
          <Sparkles size={12} style={{ color: "var(--clay-500)", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 12, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
            {item.pricing_reasoning}
          </p>
        </div>
      )}
    </div>
  );
}
