"use client";

import { useState } from "react";
import { Sofa, UtensilsCrossed, Bed, Package, Pencil, Trash2, Plus } from "lucide-react";
import type { RoomBundle } from "@/lib/types";

const PALETTES = [
  {
    bg: "var(--clay-100)", icon: "var(--clay-700)", border: "var(--clay-400)",
    tagBg: "var(--clay-50)", tagBorder: "var(--clay-100)", tagColor: "var(--clay-700)",
    bar: "var(--clay-500)", dotColor: "var(--clay-600)",
  },
  {
    bg: "var(--honey-100)", icon: "var(--honey-700)", border: "var(--honey-400)",
    tagBg: "var(--honey-50)", tagBorder: "var(--honey-100)", tagColor: "var(--honey-700)",
    bar: "var(--honey-500)", dotColor: "var(--honey-600)",
  },
  {
    bg: "var(--moss-100)", icon: "var(--moss-700)", border: "var(--moss-400)",
    tagBg: "var(--moss-50)", tagBorder: "var(--moss-100)", tagColor: "var(--moss-700)",
    bar: "var(--moss-500)", dotColor: "var(--moss-600)",
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
  isLive?: boolean;
  onClick: () => void;
  onAddItem: () => void;
  onDelete: () => void;
  onRenameSubmit: (name: string) => void;
}

export function BundleCard({
  bundle, index, active, isLive,
  onClick, onAddItem, onDelete, onRenameSubmit,
}: BundleCardProps) {
  const p = PALETTES[index % PALETTES.length];
  const Icon = ICONS[index % ICONS.length];
  const conf = Math.round(avgConfidence(bundle) * 100);
  const preview = bundle.items.slice(0, 3).map((i) => i.name);
  const extra = bundle.items.length > 3 ? bundle.items.length - 3 : 0;
  const [headerHover, setHeaderHover] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameVal, setRenameVal] = useState(bundle.name);

  function submitRename() {
    const trimmed = renameVal.trim();
    if (trimmed && trimmed !== bundle.name) onRenameSubmit(trimmed);
    setIsRenaming(false);
  }

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
        display: "flex",
        flexDirection: "column",
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
      {/* Room header h=80 */}
      <div
        style={{ height: 80, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", background: p.bg }}
        onMouseEnter={() => setHeaderHover(true)}
        onMouseLeave={() => setHeaderHover(false)}
      >
        <Icon size={26} strokeWidth={1.4} style={{ color: p.icon, transition: "transform 220ms ease", transform: active ? "scale(1.1)" : undefined }} />
        {/* Item count — top right */}
        <span style={{
          position: "absolute", top: 10, right: 12,
          fontFamily: "var(--sr-font-mono)", fontSize: 10.5, fontWeight: 500,
          color: p.icon, background: "rgba(255,255,255,0.72)", padding: "2px 7px",
          borderRadius: "var(--sr-radius-full)", backdropFilter: "blur(6px)", letterSpacing: "0.04em",
        }}>
          {bundle.items.length}
        </span>
        {/* Hover controls — top left (rename + delete) */}
        {!isLive && headerHover && (
          <div
            style={{ position: "absolute", top: 8, left: 10, display: "flex", gap: 4 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={(e) => { e.stopPropagation(); setRenameVal(bundle.name); setIsRenaming(true); }}
              style={{ width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", backdropFilter: "blur(4px)" }}
            >
              <Pencil size={12} color={p.icon} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              style={{ width: 26, height: 26, borderRadius: 6, display: "grid", placeItems: "center", background: "rgba(255,255,255,0.85)", border: "none", cursor: "pointer", backdropFilter: "blur(4px)" }}
            >
              <Trash2 size={12} color="var(--rust-500)" />
            </button>
          </div>
        )}
      </div>

      {/* Card body */}
      <div style={{ padding: "14px 18px 0", flex: 1 }}>
        {/* Bundle name — inline rename on dbl-click */}
        {isRenaming ? (
          <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: 4 }}>
            <input
              value={renameVal}
              onChange={(e) => setRenameVal(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitRename();
                if (e.key === "Escape") setIsRenaming(false);
              }}
              onBlur={submitRename}
              autoFocus
              maxLength={80}
              style={{
                fontFamily: "var(--sr-font-serif)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em",
                color: "var(--ink-800)", background: "transparent", border: "none",
                borderBottom: `2px solid ${p.border}`, outline: "none", width: "100%",
              }}
            />
          </div>
        ) : (
          <div
            style={{ fontFamily: "var(--sr-font-serif)", fontSize: 20, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: "0 0 4px" }}
            onDoubleClick={(e) => { if (!isLive) { e.stopPropagation(); setRenameVal(bundle.name); setIsRenaming(true); } }}
            title={isLive ? undefined : "Double-click to rename"}
          >
            {bundle.name}
          </div>
        )}

        <div style={{ fontSize: 13, color: "var(--sr-text-muted)", marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
          <strong style={{ color: "var(--sr-text-primary)", fontWeight: 600 }}>
            ${bundle.suggestedPrice.toLocaleString()}
          </strong>
          listing value
        </div>

        {/* Item preview tags */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 12 }}>
          {preview.map((name) => (
            <span key={name} style={{
              padding: "3px 8px", fontSize: 11.5,
              background: active ? p.tagBg : "var(--cream-100)",
              border: `1px solid ${active ? p.tagBorder : "var(--cream-300)"}`,
              borderRadius: "var(--sr-radius-sm)",
              color: active ? p.tagColor : "var(--sr-text-secondary)",
              transition: "background 220ms, border-color 220ms, color 220ms",
              whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 110,
            }}>
              {name}
            </span>
          ))}
          {extra > 0 && (
            <span style={{ padding: "3px 8px", fontSize: 11.5, background: "var(--cream-100)", border: "1px solid var(--cream-300)", borderRadius: "var(--sr-radius-sm)", color: "var(--sr-text-muted)" }}>
              +{extra}
            </span>
          )}
        </div>

        {/* Confidence bar */}
        {conf > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 3, background: "var(--cream-300)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${conf}%`, borderRadius: 2, background: active ? p.bar : "var(--ink-200)", transition: "background 220ms" }} />
            </div>
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, color: "var(--sr-text-muted)", flexShrink: 0 }}>
              {conf}% match
            </span>
          </div>
        )}
      </div>

      {/* Footer: Add item (left) + Viewing pill (right, active only) */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 14px", marginTop: 12,
          borderTop: "1px solid var(--sr-border-subtle)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={(e) => { e.stopPropagation(); onAddItem(); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, fontWeight: 500,
            color: "var(--sr-text-secondary)", background: "none", border: "none", cursor: "pointer", padding: 0,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--clay-700)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--sr-text-secondary)"; }}
        >
          <Plus size={12} />
          Add item
        </button>
        {active && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--sr-font-mono)", fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.12em", color: p.dotColor }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: p.bar, flexShrink: 0, animation: "badge-pulse 1.6s infinite" }} />
            Viewing
          </div>
        )}
      </div>
    </div>
  );
}
