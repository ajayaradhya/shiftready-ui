"use client";

import { Heart } from "lucide-react";

export default function SavedPage() {
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
        Saved
      </h1>
      <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 40 }}>
        Your watchlisted sales and saved items.
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
          <Heart size={24} color="var(--clay-500)" strokeWidth={1.5} />
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
            Coming soon · Phase D
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
            Save items &amp; watchlist sales
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 320 }}>
            Heart items or whole sales to keep track of them here.
          </p>
        </div>
      </div>
    </div>
  );
}
