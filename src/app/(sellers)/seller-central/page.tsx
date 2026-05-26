"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Plus, Camera } from "lucide-react";
import { useSalesList } from "@/hooks/use-sales";
import { SaleRow } from "@/components/features/seller-central/sale-row";
import type { SaleStatus } from "@/lib/types";

const LIVE_STATUSES: SaleStatus[] = ["live", "partially_sold"];

export default function SellerCentralPage() {
  const { data: sales, isLoading, error } = useSalesList();

  useEffect(() => { document.title = "My Sales — ShiftReady"; }, []);

  const totalItems = sales?.reduce((s, a) => s + a.itemCount, 0) ?? 0;
  const totalValue = sales?.reduce((s, a) => s + a.totalValue, 0) ?? 0;
  const liveItems = sales?.filter((s) => LIVE_STATUSES.includes(s.status)).reduce((s, a) => s + a.itemCount, 0) ?? 0;
  const activeValue = sales?.filter((s) => LIVE_STATUSES.includes(s.status)).reduce((s, a) => s + a.totalValue, 0) ?? 0;

  return (
    <div style={{ maxWidth: 920, margin: "0 auto", padding: "40px 40px 60px", fontFamily: "var(--sr-font-sans)" }}>
      {/* Page head */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 32, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>
            My <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>Sales</em>
          </h1>
          <p style={{ color: "var(--sr-text-muted)", fontSize: 14, margin: 0 }}>
            Point your camera, tap to capture - we handle the rest.
          </p>
        </div>
        <Link
          href="/seller-central/capture"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "10px 18px",
            borderRadius: "var(--sr-radius-md)",
            background: "var(--clay-500)",
            color: "var(--cream-50)",
            fontFamily: "var(--sr-font-sans)",
            fontSize: 13,
            fontWeight: 600,
            textDecoration: "none",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-500)"; }}
        >
          <Plus size={14} strokeWidth={2} />
          New sale
        </Link>
      </div>

      {/* Stats cards */}
      {sales && sales.length > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 14,
            marginBottom: 36,
          }}
        >
          {[
            { label: "Total sales",      value: String(sales.length),                            delta: "Across all time" },
            { label: "Items listed",    value: String(totalItems),                              delta: liveItems > 0 ? `↑ ${liveItems} live now` : "No items live", up: liveItems > 0 },
            { label: "Total value",     value: `$${(totalValue / 1000).toFixed(1)}k`,            delta: activeValue > 0 ? `↑ $${activeValue.toLocaleString()} active` : "No active sales", up: activeValue > 0 },
            { label: "Sold to date",    value: "$0",                                            delta: "Coming soon" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                background: "var(--sr-bg-card)",
                border: "1px solid var(--sr-border-subtle)",
                borderRadius: "var(--sr-radius-lg)",
                padding: "18px 20px",
              }}
            >
              <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)", marginBottom: 8 }}>
                {stat.label}
              </div>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 28, fontWeight: 500, letterSpacing: "-0.02em", color: "var(--ink-800)", lineHeight: 1 }}>
                {stat.label === "Total value" ? (
                  <em style={{ fontStyle: "italic", color: "var(--clay-600)", fontSize: 22 }}>{stat.value}</em>
                ) : stat.value}
              </div>
              <div style={{ fontSize: 12, color: stat.up ? "var(--moss-600)" : "var(--sr-text-muted)", marginTop: 4 }}>
                {stat.delta}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }} aria-busy="true" aria-label="Loading sales…">
          {[0, 1, 2].map((i) => (
            <div key={i} style={{ height: 80, borderRadius: "var(--sr-radius-lg)", background: "var(--cream-100)", animation: "pulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" style={{ borderRadius: "var(--sr-radius-lg)", border: "1px solid var(--rust-100)", background: "var(--rust-50)", padding: "16px 20px", fontSize: 14, color: "var(--rust-500)" }}>
          Failed to load sales. Please refresh.
        </div>
      )}

      {/* Empty state */}
      {sales && sales.length === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
            padding: "80px 40px",
            background: "var(--sr-bg-card)",
            border: "1px dashed var(--cream-400)",
            borderRadius: "var(--sr-radius-xl)",
          }}
        >
          <div style={{ width: 64, height: 64, borderRadius: 20, background: "var(--clay-50)", color: "var(--clay-500)", display: "grid", placeItems: "center", marginBottom: 20, boxShadow: "inset 0 0 0 1px var(--clay-100)" }}>
            <Camera size={28} strokeWidth={1.4} />
          </div>
          <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: "0 0 8px" }}>
            Ready to <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>list?</em>
          </h2>
          <p style={{ color: "var(--sr-text-secondary)", fontSize: 15, lineHeight: 1.55, maxWidth: 380, margin: "0 0 24px" }}>
            Point your camera at items around your home and tap to capture - AI extracts and prices everything in minutes.
          </p>
          <Link
            href="/seller-central/capture"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 7,
              padding: "12px 22px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--clay-500)",
              color: "var(--cream-50)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 14,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            <Camera size={14} strokeWidth={2} />
            Start your first sale
          </Link>
        </div>
      )}

      {/* Sales list */}
      {sales && sales.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sales.map((sale) => (
            <SaleRow key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
