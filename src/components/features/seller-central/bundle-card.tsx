"use client";

import { Sofa, UtensilsCrossed, Bed, Package } from "lucide-react";
import type { RoomBundle } from "@/lib/types";

const PALETTES = [
  {
    bg: "var(--clay-100)",   icon: "var(--clay-700)",   border: "var(--clay-400)",
    tagBg: "var(--clay-50)", tagBorder: "var(--clay-100)", tagColor: "var(--clay-700)",
    bar: "var(--clay-500)",  viewing: "var(--clay-600)", viewingBg: "var(--clay-50)",
  },
  {
    bg: "var(--honey-100)",  icon: "var(--honey-700)",  border: "var(--honey-400)",
    tagBg: "var(--honey-50)",tagBorder:"var(--honey-100)",tagColor:"var(--honey-700)",
    bar: "var(--honey-500)", viewing: "var(--honey-600)",viewingBg:"var(--honey-50)",
  },
  {
    bg: "var(--moss-100)",   icon: "var(--moss-700)",   border: "var(--moss-400)",
    tagBg: "var(--moss-50)", tagBorder: "var(--moss-100)", tagColor: "var(--moss-700)",
    bar: "var(--moss-500)",  viewing: "var(--moss-600)", viewingBg: "var(--moss-50)",
  },
];

const ICONS = [Sofa, UtensilsCrossed, Bed, Package];

function avgConfidence(bundle: RoomBundle): number {
  if (!bundle.items.length) return 0;
  return bundle.items.reduce((s, i) => s + (i.confidence ?? 0), 0) / bundle.items.length;
}

interface BundleCardProps {
  bundle: RoomBundle;
  index: number;
  active: boolean;
  onClick: () => void;
}

export function BundleCard({ bundle, index, active, onClick }: BundleCardProps) {
  const p = PALETTES[index % PALETTES.length];
  const Icon = ICONS[index % ICONS.length];
  const conf = Math.round(avgConfidence(bundle) * 100);
  const preview = bundle.items.slice(0, 3).map((i) => i.name);
  const extra = bundle.items.length > 3 ? bundle.items.length - 3 : 0;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick()}
      aria-pressed={active}
      style={{
        background: "var(--sr-bg-card)",
        border: `1.5px solid ${active ? p.border : "var(--sr-border-subtle)"}`,
        borderRadius: "var(--sr-radius-lg)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "border-color 220ms ease, box-shadow 220ms ease, transform 180ms ease",
        transform: active ? "translateY(-2px)" : undefined,
        boxShadow: active ? "0 8px 24px rgba(74,37,25,0.12)" : undefined,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-default)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--sr-shadow-md)";
          (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
          (e.currentTarget as HTMLElement).style.transform = "";
        }
      }}
    >
      {/* Colored room header */}
      <div
        style={{
          height: 96,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          background: p.bg,
        }}
      >
        <Icon size={28} strokeWidth={1.4} style={{ color: p.icon, transition: "transform 220ms ease", transform: active ? "scale(1.1)" : undefined }} />
        <span
          style={{
            position: "absolute",
            top: 12,
            right: 14,
            fontFamily: "var(--sr-font-mono)",
            fontSize: 11,
            fontWeight: 500,
            color: p.icon,
            background: "rgba(255,255,255,0.72)",
            padding: "3px 8px",
            borderRadius: "var(--sr-radius-full)",
            backdropFilter: "blur(6px)",
            letterSpacing: "0.04em",
          }}
        >
          {bundle.items.length} items
        </span>
      </div>

      {/* Card body */}
      <div style={{ padding: "16px 20px 0" }}>
        <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 21, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: "0 0 4px" }}>
          {bundle.name}
        </div>
        <div style={{ fontSize: 13, color: "var(--sr-text-muted)", marginBottom: 13, display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ color: "var(--sr-text-primary)", fontWeight: 600 }}>
            ${bundle.suggestedPrice.toLocaleString()}
          </strong>
          listing value
        </div>

        {/* Item preview tags */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 14 }}>
          {preview.map((name) => (
            <span
              key={name}
              style={{
                padding: "3px 9px",
                fontSize: 11.5,
                background: active ? p.tagBg : "var(--cream-100)",
                border: `1px solid ${active ? p.tagBorder : "var(--cream-300)"}`,
                borderRadius: "var(--sr-radius-sm)",
                color: active ? p.tagColor : "var(--sr-text-secondary)",
                transition: "background 220ms, border-color 220ms, color 220ms",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                maxWidth: 120,
              }}
            >
              {name}
            </span>
          ))}
          {extra > 0 && (
            <span style={{ padding: "3px 9px", fontSize: 11.5, background: "var(--cream-100)", border: "1px solid var(--cream-300)", borderRadius: "var(--sr-radius-sm)", color: "var(--sr-text-muted)" }}>
              +{extra}
            </span>
          )}
        </div>

        {/* Confidence bar */}
        {conf > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 16 }}>
            <div style={{ flex: 1, height: 3, background: "var(--cream-300)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${conf}%`, borderRadius: 2, background: active ? p.bar : "var(--ink-200)", transition: "background 220ms" }} />
            </div>
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, color: "var(--sr-text-muted)", flexShrink: 0 }}>
              {conf}% avg match
            </span>
          </div>
        )}
      </div>

      {/* "Currently viewing" indicator */}
      <div
        style={{
          height: active ? 34 : 0,
          overflow: "hidden",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          borderTop: active ? `1px solid ${p.tagBorder}` : "none",
          fontFamily: "var(--sr-font-mono)",
          fontSize: 9.5,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: p.viewing,
          background: p.viewingBg,
          transition: "height 220ms ease",
        }}
      >
        {active && (
          <>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.bar, animation: "badge-pulse 1.6s infinite" }} />
            Currently viewing
          </>
        )}
      </div>
    </div>
  );
}
