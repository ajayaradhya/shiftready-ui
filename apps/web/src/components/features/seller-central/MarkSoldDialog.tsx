"use client";

import { useState } from "react";
import { Check, X, DollarSign } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { formatAUD } from "@myrio/core";
import { markItemSold } from "@myrio/api";
import type { InventoryItem } from "@myrio/types";
import { toast } from "sonner";

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "bank", label: "Bank transfer" },
  { value: "payid", label: "PayID" },
  { value: "other", label: "Other" },
];

interface MarkSoldDialogProps {
  eventId: string;
  bundleId: string;
  item: InventoryItem;
  onClose: () => void;
}

export function MarkSoldDialog({ eventId, bundleId, item, onClose }: MarkSoldDialogProps) {
  const qc = useQueryClient();

  const defaultPrice = item.actual_listing_price ?? item.predicted_listing_price ?? 0;
  const [finalPrice, setFinalPrice] = useState(String(defaultPrice));
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [buyerLabel, setBuyerLabel] = useState("");
  const [notes, setNotes] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      markItemSold(eventId, bundleId, item.id, {
        final_price: parseFloat(finalPrice) || null,
        buyer_label: buyerLabel.trim() || null,
        payment_method: paymentMethod || null,
        notes: notes.trim() || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      toast.success(`"${item.name}" marked as sold`);
      onClose();
    },
    onError: (err: Error) => toast.error(err.message || "Failed to mark sold"),
  });

  const fmt = (v: number) => formatAUD(v);

  const parsed = parseFloat(finalPrice);
  const diff = !isNaN(parsed) ? parsed - defaultPrice : 0;
  const diffSign = diff >= 0 ? "+" : "";
  const diffColor = diff > 0 ? "var(--moss-600)" : diff < 0 ? "var(--rust-500)" : "var(--ink-400)";

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(20,17,13,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={mutation.isPending ? undefined : onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)",
          padding: "28px 32px", maxWidth: 420, width: "92%",
          fontFamily: "var(--sr-font-sans)", boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div>
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink-800)" }}>
              Mark as sold
            </div>
            <div style={{ fontSize: 12, color: "var(--sr-text-muted)", marginTop: 2 }}>
              {item.name}
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            style={{
              border: "none", background: "none", cursor: "pointer",
              color: "var(--sr-text-muted)", width: 28, height: 28,
              display: "grid", placeItems: "center", borderRadius: "var(--sr-radius-sm)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-200)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Final price */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Final sale price</label>
          <div
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "1px solid var(--sr-border-default)", borderRadius: "var(--sr-radius-sm)",
              background: "var(--cream-50)", padding: "8px 12px",
            }}
          >
            <DollarSign size={14} style={{ color: "var(--sr-text-muted)", flexShrink: 0 }} />
            <input
              type="number"
              min={0}
              step={1}
              value={finalPrice}
              onChange={(e) => setFinalPrice(e.target.value)}
              style={{
                flex: 1, border: "none", background: "transparent",
                fontSize: 18, fontWeight: 700, color: "var(--clay-700)",
                outline: "none", fontFeatureSettings: '"tnum"',
                fontFamily: "var(--sr-font-sans)",
              }}
            />
            {diff !== 0 && !isNaN(parsed) && (
              <span style={{ fontSize: 11, fontWeight: 600, color: diffColor, flexShrink: 0 }}>
                {diffSign}{fmt(Math.abs(diff))}
              </span>
            )}
          </div>
          <div style={{ fontSize: 11, color: "var(--sr-text-muted)", marginTop: 4 }}>
            Listed at {fmt(defaultPrice)}
          </div>
        </div>

        {/* Payment method */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Payment method</label>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PAYMENT_METHODS.map((m) => (
              <button
                key={m.value}
                onClick={() => setPaymentMethod(m.value)}
                style={{
                  padding: "5px 12px", borderRadius: "var(--sr-radius-sm)",
                  border: `1px solid ${paymentMethod === m.value ? "var(--clay-400)" : "var(--sr-border-subtle)"}`,
                  background: paymentMethod === m.value ? "var(--clay-100)" : "transparent",
                  color: paymentMethod === m.value ? "var(--clay-700)" : "var(--sr-text-secondary)",
                  fontSize: 12, fontWeight: paymentMethod === m.value ? 600 : 400,
                  cursor: "pointer", transition: "all 100ms",
                }}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>

        {/* Buyer label (optional) */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Buyer name <span style={{ color: "var(--sr-text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input
            value={buyerLabel}
            onChange={(e) => setBuyerLabel(e.target.value)}
            placeholder="e.g. Sarah from Surry Hills"
            maxLength={100}
            style={inputStyle}
          />
        </div>

        {/* Notes (optional) */}
        <div style={{ marginBottom: 22 }}>
          <label style={labelStyle}>Notes <span style={{ color: "var(--sr-text-muted)", fontWeight: 400 }}>(optional)</span></label>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Pickup arranged Saturday morning"
            maxLength={300}
            style={inputStyle}
          />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            style={{
              padding: "8px 16px", borderRadius: "var(--sr-radius-sm)",
              border: "1px solid var(--sr-border-subtle)", background: "transparent",
              fontSize: 13, cursor: mutation.isPending ? "default" : "pointer",
              color: "var(--sr-text-primary)", opacity: mutation.isPending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            style={{
              padding: "8px 20px", borderRadius: "var(--sr-radius-sm)",
              border: "none",
              background: mutation.isPending ? "var(--moss-300)" : "var(--moss-600)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: mutation.isPending ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = "var(--moss-700)"; }}
            onMouseLeave={(e) => { if (!mutation.isPending) (e.currentTarget as HTMLElement).style.background = "var(--moss-600)"; }}
          >
            {mutation.isPending ? "Saving…" : <><Check size={13} /> Confirm sold</>}
          </button>
        </div>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "var(--sr-font-mono)",
  fontSize: 9,
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  color: "var(--sr-text-muted)",
  marginBottom: 6,
  fontWeight: 600,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 10px",
  borderRadius: "var(--sr-radius-sm)",
  border: "1px solid var(--sr-border-subtle)",
  background: "var(--cream-50)",
  fontSize: 13,
  color: "var(--sr-text-primary)",
  fontFamily: "var(--sr-font-sans)",
  outline: "none",
  boxSizing: "border-box",
};
