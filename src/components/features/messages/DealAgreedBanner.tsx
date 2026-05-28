"use client";

import { Check } from "lucide-react";
import { formatAUD } from "@/lib/format";

interface DealAgreedBannerProps {
  amount: number;
  otherUsername?: string | null;
  phoneRevealAvailable?: boolean;
}

export function DealAgreedBanner({ amount, otherUsername, phoneRevealAvailable }: DealAgreedBannerProps) {
  return (
    <div
      style={{
        margin: "12px 0",
        padding: "16px 20px",
        background: "var(--moss-50, #f0fdf4)",
        border: "1.5px solid var(--moss-200, #bbf7d0)",
        borderRadius: "var(--sr-radius-md)",
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        animation: "fadeUp 300ms ease-out",
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: "50%",
          background: "var(--moss-500, #22c55e)",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          flexShrink: 0,
        }}
      >
        <Check size={18} strokeWidth={2.5} />
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 17,
            fontWeight: 700,
            color: "var(--moss-800, #166534)",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
          }}
        >
          Deal agreed - {formatAUD(amount)}
        </div>
        <div
          style={{
            marginTop: 4,
            fontFamily: "var(--sr-font-sans)",
            fontSize: 12.5,
            color: "var(--moss-600, #16a34a)",
            lineHeight: 1.4,
          }}
        >
          {phoneRevealAvailable
            ? (otherUsername
                ? `@${otherUsername} has shared their number below.`
                : "Seller's number is available below.")
            : (otherUsername
                ? `Arrange pickup details with @${otherUsername} in chat.`
                : "Arrange pickup details in chat.")}
        </div>
      </div>
    </div>
  );
}
