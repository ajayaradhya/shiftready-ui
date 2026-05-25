"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Package, DollarSign, ArrowRight, ShoppingBag, MoreHorizontal, Archive, Pencil } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { SaleListing, SaleStatus } from "@/lib/types";

const STATUS_LABELS: Record<SaleStatus, string> = {
  pending_upload: "Pending Upload",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  pricing_in_progress: "Pricing in Progress",
  live: "Live",
  partially_sold: "Partially Sold",
  expired: "Expired",
  failed: "Failed",
  archived: "Archived",
};

const STATUS_BADGE: Record<SaleStatus, { bg: string; color: string; border: string }> = {
  live:              { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)"  },
  partially_sold:    { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)"  },
  ready_for_review:  { bg: "var(--honey-50)",  color: "var(--honey-700)", border: "var(--honey-100)" },
  pricing_in_progress:{ bg: "var(--clay-50)",  color: "var(--clay-700)",  border: "var(--clay-100)"  },
  processing:        { bg: "var(--clay-50)",   color: "var(--clay-700)",  border: "var(--clay-100)"  },
  pending_upload:    { bg: "var(--cream-200)", color: "var(--ink-500)",   border: "var(--cream-300)" },
  archived:          { bg: "var(--cream-200)", color: "var(--ink-500)",   border: "var(--cream-300)" },
  expired:           { bg: "var(--cream-200)", color: "var(--ink-500)",   border: "var(--cream-300)" },
  failed:            { bg: "var(--rust-50)",   color: "var(--rust-500)",  border: "var(--rust-100)"  },
};

const DOT_COLORS: Partial<Record<SaleStatus, string>> = {
  live:            "var(--moss-500)",
  partially_sold:  "var(--moss-500)",
  ready_for_review:"var(--honey-500)",
  pricing_in_progress:"var(--clay-400)",
  processing:      "var(--clay-400)",
  failed:          "var(--rust-500)",
};

interface SaleRowProps {
  sale: SaleListing;
}

export function SaleRow({ sale }: SaleRowProps) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const isLive = sale.status === "live" || sale.status === "partially_sold";
  const badge = STATUS_BADGE[sale.status] ?? STATUS_BADGE.archived;
  const dotColor = DOT_COLORS[sale.status] ?? "var(--ink-300)";
  const isLiveStatus = sale.status === "live" || sale.status === "partially_sold";
  const hasInventory = sale.status !== "pending_upload" && sale.status !== "processing";
  const previews = (sale.preview_images ?? []).slice(0, 4);

  const inventoryUrl = `/seller-central/inventory/${sale.id}?title=${encodeURIComponent(sale.title || [sale.suburb, sale.state].filter(Boolean).join(", "))}`;

  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  return (
    <div
      onClick={() => hasInventory && router.push(inventoryUrl)}
      style={{
        background: "var(--sr-bg-card)",
        border: "1px solid var(--sr-border-subtle)",
        borderRadius: "var(--sr-radius-lg)",
        padding: "16px 24px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        transition: "border-color 160ms, box-shadow 160ms",
        cursor: hasInventory ? "pointer" : "default",
      }}
      onMouseEnter={(e) => {
        if (hasInventory) {
          (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-default)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--sr-shadow-md)";
        }
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-subtle)";
        (e.currentTarget as HTMLElement).style.boxShadow = "";
      }}
    >
      {/* Status dot */}
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          flexShrink: 0,
          background: dotColor,
          animation: isLiveStatus ? "badge-pulse 1.8s infinite" : undefined,
        }}
      />

      {/* Image strip */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        {previews.length > 0 ? (
          previews.map((src, i) => (
            <div
              key={i}
              style={{
                width: 52,
                height: 52,
                borderRadius: "var(--sr-radius-sm)",
                overflow: "hidden",
                background: "var(--cream-100)",
                border: "1px solid var(--sr-border-subtle)",
                flexShrink: 0,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          ))
        ) : (
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: "var(--sr-radius-sm)",
              background: "var(--cream-100)",
              border: "1px solid var(--sr-border-subtle)",
              display: "grid",
              placeItems: "center",
              color: "var(--ink-300)",
              flexShrink: 0,
            }}
          >
            <Package size={20} strokeWidth={1.4} />
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)" }}>
            {sale.title || [sale.suburb, sale.state].filter(Boolean).join(", ") || "Untitled Sale"}
          </span>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              padding: "3px 9px",
              borderRadius: "var(--sr-radius-sm)",
              fontSize: 11.5,
              fontWeight: 500,
              border: `1px solid ${badge.border}`,
              background: badge.bg,
              color: badge.color,
            }}
          >
            {STATUS_LABELS[sale.status]}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, color: "var(--sr-text-muted)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Calendar size={11} />
            {new Date(sale.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
          </span>
          {sale.itemCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <Package size={11} />
              {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}
            </span>
          )}
          {sale.totalValue > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <DollarSign size={11} />
              {sale.totalValue.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {isLive && (
          <Link
            href={`/sale/${sale.id}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: "var(--sr-radius-sm)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid var(--moss-100)",
              background: "var(--moss-50)",
              color: "var(--moss-700)",
              textDecoration: "none",
              transition: "all 120ms",
            }}
          >
            <ShoppingBag size={12} />
            Marketplace
          </Link>
        )}
        {hasInventory && (
          <Link
            href={inventoryUrl}
            onClick={(e) => e.stopPropagation()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 13px",
              borderRadius: "var(--sr-radius-sm)",
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              border: "1px solid var(--clay-200)",
              background: "var(--clay-50)",
              color: "var(--clay-700)",
              textDecoration: "none",
              transition: "all 120ms",
            }}
          >
            Inventory <ArrowRight size={11} />
          </Link>
        )}

        {/* Kebab */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((o) => !o); }}
            style={{
              display: "grid",
              placeItems: "center",
              width: 30,
              height: 30,
              borderRadius: "var(--sr-radius-sm)",
              border: "1px solid var(--sr-border-subtle)",
              background: menuOpen ? "var(--cream-100)" : "transparent",
              color: "var(--ink-400)",
              cursor: "pointer",
              transition: "all 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; (e.currentTarget as HTMLElement).style.color = "var(--ink-700)"; }}
            onMouseLeave={(e) => { if (!menuOpen) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "var(--ink-400)"; } }}
          >
            <MoreHorizontal size={14} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "calc(100% + 4px)",
                zIndex: 50,
                minWidth: 160,
                background: "var(--sr-bg-card)",
                border: "1px solid var(--sr-border-subtle)",
                borderRadius: "var(--sr-radius-md)",
                boxShadow: "var(--sr-shadow-md)",
                overflow: "hidden",
              }}
            >
              {hasInventory && (
                <button
                  onClick={(e) => { e.stopPropagation(); setMenuOpen(false); router.push(inventoryUrl); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 9,
                    width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    fontSize: 13,
                    color: "var(--ink-700)",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Pencil size={13} strokeWidth={1.6} />
                  Edit inventory
                </button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); setMenuOpen(false); }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                  width: "100%",
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  fontSize: 13,
                  color: "var(--ink-400)",
                  cursor: "not-allowed",
                  textAlign: "left",
                  opacity: 0.5,
                }}
              >
                <Archive size={13} strokeWidth={1.6} />
                Archive
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
