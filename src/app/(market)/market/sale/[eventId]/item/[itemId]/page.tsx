"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, Package } from "lucide-react";

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; itemId: string }>;
}) {
  const { eventId, itemId } = use(params);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 800, margin: "0 auto" }}>
      <Link
        href={`/market/sale/${eventId}`}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: "var(--ink-400)",
          textDecoration: "none",
          marginBottom: 32,
        }}
      >
        <ChevronLeft size={14} />
        Back to sale
      </Link>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 32px",
          borderRadius: "var(--sr-radius-xl)",
          background: "var(--sr-bg-card)",
          border: "1px solid var(--sr-border-subtle)",
          textAlign: "center",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-50)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Package size={24} color="var(--clay-500)" strokeWidth={1.5} />
        </div>
        <div>
          <p
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--ink-400)",
              marginBottom: 8,
            }}
          >
            Coming soon
          </p>
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--sr-text-primary)",
              marginBottom: 8,
            }}
          >
            Item Detail
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 320 }}>
            Gallery, specs, AI pricing intelligence, and Express Interest CTA coming in Phase B.
          </p>
          <p
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              color: "var(--ink-300)",
              marginTop: 16,
            }}
          >
            item/{itemId}
          </p>
        </div>
      </div>
    </div>
  );
}
