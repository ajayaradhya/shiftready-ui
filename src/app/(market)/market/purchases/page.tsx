"use client";

import { useEffect } from "react";
import { ShoppingBag } from "lucide-react";

export default function PurchasesPage() {
  useEffect(() => { document.title = "Purchases - ShiftReady"; }, []);
  return (
    <div style={{ padding: "40px 32px", maxWidth: 800, margin: "0 auto" }}>
      <h1
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: 26,
          fontWeight: 500,
          color: "var(--sr-text-primary)",
          marginBottom: 4,
        }}
      >
        Purchases
      </h1>
      <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 40 }}>
        Items you&apos;ve expressed interest in or purchased.
      </p>

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
          <ShoppingBag size={24} color="var(--clay-500)" strokeWidth={1.5} />
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
            No purchases yet
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
            Track your purchases
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 320 }}>
            Interest expressed · Viewing scheduled · Purchase complete - all tracked here.
          </p>
        </div>
      </div>
    </div>
  );
}
