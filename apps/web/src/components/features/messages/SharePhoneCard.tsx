"use client";

import { useState } from "react";
import { Phone, Check } from "lucide-react";
import { useUpdateMyPhone, useSharePhone } from "@/hooks/use-phone";

interface SharePhoneCardProps {
  convId: string;
  otherUsername?: string | null;
}

function formatE164(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("61") && digits.length === 11) return `+${digits}`;
  if (digits.startsWith("0") && digits.length === 10) return `+61${digits.slice(1)}`;
  if (digits.length === 9 && !digits.startsWith("0")) return `+61${digits}`;
  return raw.trim();
}

export function SharePhoneCard({ convId, otherUsername }: SharePhoneCardProps) {
  const [phone, setPhone] = useState("");
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const updatePhone = useUpdateMyPhone();
  const sharePhone = useSharePhone(convId);

  const isPending = updatePhone.isPending || sharePhone.isPending;

  const handleShare = async () => {
    setError(null);
    const e164 = formatE164(phone);
    if (!e164.match(/^\+\d{10,15}$/)) {
      setError("Enter a valid AU mobile number (e.g. 0412 345 678)");
      return;
    }
    try {
      await updatePhone.mutateAsync({ phoneE164: e164, shareOptIn: true });
      await sharePhone.mutateAsync();
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to share number");
    }
  };

  if (done) {
    return (
      <div
        style={{
          margin: "8px 0 12px",
          padding: "14px 18px",
          background: "var(--moss-50, #f0fdf4)",
          border: "1.5px solid var(--moss-200, #bbf7d0)",
          borderRadius: "var(--sr-radius-md)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "50%",
            background: "var(--moss-500, #22c55e)",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Check size={13} strokeWidth={2.5} />
        </div>
        <span
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 13,
            color: "var(--moss-700, #15803d)",
            fontWeight: 500,
          }}
        >
          Your number has been shared
          {otherUsername ? ` with @${otherUsername}` : ""}.
        </span>
      </div>
    );
  }

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
            background: "var(--honey-100, #fef3c7)",
            color: "var(--honey-700, #b45309)",
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
          Share your number for pickup
        </div>
      </div>

      <p
        style={{
          marginBottom: 12,
          fontSize: 12,
          color: "var(--sr-text-muted)",
          fontFamily: "var(--sr-font-sans)",
          lineHeight: 1.5,
        }}
      >
        {otherUsername
          ? `Let @${otherUsername} contact you directly to arrange a pickup time.`
          : "Let the buyer contact you directly to arrange a pickup time."}
      </p>

      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="0412 345 678"
          disabled={isPending}
          onKeyDown={(e) => e.key === "Enter" && handleShare()}
          style={{
            flex: 1,
            height: 36,
            padding: "0 12px",
            background: "var(--cream-50)",
            border: "1px solid var(--sr-border-subtle)",
            borderRadius: "var(--sr-radius-md)",
            fontSize: 13,
            color: "var(--sr-text-primary)",
            fontFamily: "var(--sr-font-sans)",
            outline: "none",
          }}
        />
        <button
          onClick={handleShare}
          disabled={isPending || !phone.trim()}
          style={{
            padding: "0 16px",
            height: 36,
            borderRadius: "var(--sr-radius-md)",
            border: "none",
            background: isPending || !phone.trim() ? "var(--cream-200)" : "var(--clay-500)",
            color: isPending || !phone.trim() ? "var(--sr-text-muted)" : "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--sr-font-sans)",
            cursor: isPending || !phone.trim() ? "default" : "pointer",
            transition: "background 120ms, color 120ms",
            whiteSpace: "nowrap",
          }}
        >
          {isPending ? "Sharing…" : "Share"}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginTop: 8,
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
    </div>
  );
}
