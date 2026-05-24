"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useRevealPhone } from "@/hooks/use-phone";

function formatAUPhone(e164: string): string {
  if (e164.startsWith("+61") && e164.length === 12) {
    const local = "0" + e164.slice(3);
    return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`;
  }
  return e164;
}

interface PhoneRevealCardProps {
  convId: string;
  otherUsername?: string | null;
}

export function PhoneRevealCard({ convId, otherUsername }: PhoneRevealCardProps) {
  const { phone, isRevealed, reveal, isPending, error } = useRevealPhone(convId);
  const [copied, setCopied] = useState(false);

  const handleReveal = () => {
    if (!isRevealed) reveal();
  };

  const handleCopy = async () => {
    if (!phone) return;
    await navigator.clipboard.writeText(phone);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      style={{
        margin: "8px 0 12px",
        padding: "16px 20px",
        background: "var(--sr-bg-card)",
        border: "1.5px solid var(--sr-border-subtle)",
        borderRadius: "var(--sr-radius-md)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: "50%",
            background: "var(--clay-100)",
            color: "var(--clay-700)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Phone size={14} strokeWidth={1.75} />
        </div>
        <div
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 13,
            fontWeight: 600,
            color: "var(--sr-text-primary)",
          }}
        >
          {otherUsername ? `@${otherUsername}'s number` : "Seller's number"}
        </div>
      </div>

      {/* Phone number (blurred until revealed) */}
      <div
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 22,
          fontWeight: 700,
          color: "var(--clay-700)",
          letterSpacing: "0.08em",
          marginBottom: 12,
          filter: isRevealed ? "none" : "blur(6px)",
          userSelect: isRevealed ? "text" : "none",
          transition: "filter 300ms ease",
        }}
      >
        {isRevealed && phone ? formatAUPhone(phone) : "0412 345 678"}
      </div>

      {error && (
        <div
          style={{
            marginBottom: 10,
            padding: "6px 10px",
            borderRadius: "var(--sr-radius-sm)",
            background: "var(--rust-50, #fff1f0)",
            color: "var(--rust-600, #dc2626)",
            fontSize: 12,
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          {error}
        </div>
      )}

      {!isRevealed ? (
        <button
          onClick={handleReveal}
          disabled={isPending}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--sr-border-subtle)",
            background: "var(--cream-50)",
            color: "var(--clay-700)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--sr-font-sans)",
            cursor: isPending ? "default" : "pointer",
            opacity: isPending ? 0.6 : 1,
            transition: "background 120ms, color 120ms",
          }}
          onMouseEnter={(e) => {
            if (!isPending) {
              (e.currentTarget as HTMLElement).style.background = "var(--clay-100)";
              (e.currentTarget as HTMLElement).style.color = "var(--clay-800)";
            }
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--cream-50)";
            (e.currentTarget as HTMLElement).style.color = "var(--clay-700)";
          }}
        >
          {isPending ? "Loading…" : "Tap to reveal"}
        </button>
      ) : (
        <button
          onClick={handleCopy}
          style={{
            padding: "8px 16px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--sr-border-subtle)",
            background: copied ? "var(--moss-50)" : "var(--cream-50)",
            color: copied ? "var(--moss-700)" : "var(--clay-700)",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--sr-font-sans)",
            cursor: "pointer",
            transition: "background 200ms, color 200ms",
          }}
        >
          {copied ? "✓ Copied" : "Copy number"}
        </button>
      )}

      <p
        style={{
          marginTop: 12,
          fontSize: 11.5,
          color: "var(--sr-text-muted)",
          fontFamily: "var(--sr-font-sans)",
          lineHeight: 1.5,
        }}
      >
        Contact {otherUsername ? `@${otherUsername}` : "the seller"} directly to arrange a pickup
        time. Keep communication safe where possible.
      </p>
    </div>
  );
}
