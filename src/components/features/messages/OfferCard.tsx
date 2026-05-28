"use client";

import { useState } from "react";
import { Check, X, RotateCcw, Percent } from "lucide-react";
import type { OfferPayload } from "@/lib/types";
import { formatAUD } from "@/lib/format";

interface OfferCardProps {
  offer: OfferPayload;
  isOwn: boolean;
  onAccept?: (offerId: string) => void;
  onCounter?: (offerId: string, amount: number) => void;
  onWithdraw?: (offerId: string) => void;
  disabled?: boolean;
}

export function OfferCard({ offer, isOwn, onAccept, onCounter, onWithdraw, disabled }: OfferCardProps) {
  const [counterMode, setCounterMode] = useState(false);
  const [counterAmt, setCounterAmt] = useState("");
  const saves = offer.listPrice && offer.listPrice > offer.amount
    ? offer.listPrice - offer.amount
    : null;

  const isPending = offer.status === "pending";
  const isCountered = offer.status === "countered";
  const isAccepted = offer.status === "accepted";
  const isWithdrawn = offer.status === "withdrawn";

  let bg = "var(--clay-50)";
  let border = "var(--clay-200)";
  let amtColor = "var(--clay-800)";
  if (!isOwn && isPending) {
    bg = "var(--honey-50, #fffbeb)";
    border = "var(--honey-200, #fde68a)";
    amtColor = "var(--honey-700, #b45309)";
  }
  if (isAccepted) {
    bg = "var(--moss-50, #f0fdf4)";
    border = "var(--moss-200, #bbf7d0)";
    amtColor = "var(--moss-700, #15803d)";
  }

  const opacity = isCountered || isWithdrawn ? 0.55 : 1;

  const handleCounterSubmit = () => {
    const amt = parseFloat(counterAmt);
    if (!amt || amt <= 0) return;
    onCounter?.(offer.offerId, amt);
    setCounterMode(false);
    setCounterAmt("");
  };

  return (
    <div
      style={{
        display: "inline-flex",
        flexDirection: "column",
        gap: 10,
        background: bg,
        border: `1.5px solid ${border}`,
        borderRadius: "var(--sr-radius-md)",
        padding: "12px 16px",
        minWidth: 220,
        maxWidth: 280,
        opacity,
        transition: "opacity 200ms",
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--sr-font-mono)",
          fontSize: 9.5,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          color: isAccepted ? "var(--moss-600, #16a34a)" : "var(--sr-text-muted)",
        }}
      >
        {isAccepted ? (
          <><Check size={10} strokeWidth={2} /> Offer accepted</>
        ) : isCountered ? (
          <><RotateCcw size={10} strokeWidth={1.75} /> Countered</>
        ) : isWithdrawn ? (
          <><X size={10} strokeWidth={1.75} /> Withdrawn</>
        ) : (
          <><Percent size={10} strokeWidth={1.75} /> {isOwn ? "Your offer" : "Offer received"}</>
        )}
      </div>

      {/* Amount */}
      <div style={{ lineHeight: 1 }}>
        <span
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 30,
            fontWeight: 700,
            color: amtColor,
            letterSpacing: "-0.02em",
          }}
        >
          {formatAUD(offer.amount)}
        </span>
        {saves && (
          <div
            style={{
              marginTop: 3,
              fontFamily: "var(--sr-font-sans)",
              fontSize: 11.5,
              color: "var(--moss-600, #16a34a)",
            }}
          >
            Saves {formatAUD(saves)} off listing price
          </div>
        )}
      </div>

      {/* Status line */}
      {isOwn && isPending && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "var(--sr-font-sans)",
            fontSize: 11.5,
            color: "var(--sr-text-muted)",
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "var(--honey-400, #fbbf24)",
              animation: "pulse 1.5s ease-in-out infinite",
              flexShrink: 0,
              display: "inline-block",
            }}
          />
          Awaiting response…
        </div>
      )}

      {isOwn && isCountered && (
        <div
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 11.5,
            color: "var(--sr-text-muted)",
          }}
        >
          Counter offer sent ↓
        </div>
      )}

      {/* Recipient actions */}
      {!isOwn && isPending && !counterMode && (
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => onAccept?.(offer.offerId)}
            disabled={disabled}
            style={{
              flex: 1,
              height: 32,
              background: "var(--moss-500, #22c55e)",
              color: "#fff",
              border: "none",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12,
              fontWeight: 600,
              cursor: disabled ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 5,
              transition: "background 120ms",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            <Check size={12} strokeWidth={2} /> Accept
          </button>
          <button
            onClick={() => setCounterMode(true)}
            disabled={disabled}
            style={{
              flex: 1,
              height: 32,
              background: "transparent",
              color: "var(--sr-text-secondary)",
              border: "1.5px solid var(--sr-border-default)",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12,
              fontWeight: 500,
              cursor: disabled ? "default" : "pointer",
              transition: "border-color 120ms, color 120ms",
              opacity: disabled ? 0.5 : 1,
            }}
          >
            Counter
          </button>
        </div>
      )}

      {/* Counter input */}
      {!isOwn && isPending && counterMode && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--clay-700)", flexShrink: 0 }}>$</span>
          <input
            type="number"
            placeholder="Amount"
            value={counterAmt}
            onChange={(e) => setCounterAmt(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              height: 32,
              background: "#fff",
              border: "1.5px solid var(--clay-300)",
              borderRadius: "var(--sr-radius-sm)",
              padding: "0 8px",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 14,
              fontWeight: 700,
              color: "var(--clay-800)",
              outline: "none",
              minWidth: 60,
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCounterSubmit();
              if (e.key === "Escape") { setCounterMode(false); setCounterAmt(""); }
            }}
          />
          <button
            onClick={handleCounterSubmit}
            disabled={!counterAmt || parseFloat(counterAmt) <= 0}
            style={{
              height: 32,
              padding: "0 10px",
              background: parseFloat(counterAmt) > 0 ? "var(--clay-500)" : "var(--cream-200)",
              color: parseFloat(counterAmt) > 0 ? "#fff" : "var(--ink-300)",
              border: "none",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12,
              fontWeight: 600,
              cursor: parseFloat(counterAmt) > 0 ? "pointer" : "default",
              flexShrink: 0,
            }}
          >
            Send
          </button>
          <button
            onClick={() => { setCounterMode(false); setCounterAmt(""); }}
            style={{
              width: 28,
              height: 28,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--clay-400)",
              display: "grid",
              placeItems: "center",
              flexShrink: 0,
            }}
          >
            <X size={13} strokeWidth={1.75} />
          </button>
        </div>
      )}

      {/* Own offer withdraw */}
      {isOwn && isPending && onWithdraw && (
        <button
          onClick={() => onWithdraw(offer.offerId)}
          disabled={disabled}
          style={{
            alignSelf: "flex-start",
            background: "none",
            border: "none",
            padding: 0,
            fontFamily: "var(--sr-font-sans)",
            fontSize: 11,
            color: "var(--sr-text-muted)",
            cursor: "pointer",
            textDecoration: "underline",
            opacity: disabled ? 0.5 : 1,
          }}
        >
          Withdraw
        </button>
      )}
    </div>
  );
}
