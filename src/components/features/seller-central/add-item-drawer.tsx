"use client";

import { useEffect, useState } from "react";
import { X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ItemCategory, RoomBundle } from "@/lib/types";
import { createItemFull } from "@/lib/api";
import { toast } from "sonner";

interface AddItemDrawerProps {
  eventId: string;
  bundles: RoomBundle[];
  defaultBundleId: string;
  open: boolean;
  onClose: () => void;
}

const CONDITIONS = ["Like New", "Excellent", "Good", "Fair", "Poor"];

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "decor", label: "Decor" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

export function AddItemDrawer({ eventId, bundles, defaultBundleId, open, onClose }: AddItemDrawerProps) {
  const qc = useQueryClient();

  const [bundleId, setBundleId] = useState(defaultBundleId);
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [condition, setCondition] = useState("Good");
  const [year, setYear] = useState("");
  const [category, setCategory] = useState<ItemCategory | "">("");
  const [retail, setRetail] = useState("");
  const [listing, setListing] = useState("");
  const [description, setDescription] = useState("");
  const [isFragile, setIsFragile] = useState(false);
  const [disassembly, setDisassembly] = useState(false);

  useEffect(() => {
    if (open) setBundleId(defaultBundleId);
  }, [open, defaultBundleId]);

  // Trap focus and Esc key
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const addMutation = useMutation({
    mutationFn: () =>
      createItemFull(eventId, bundleId, {
        name: name.trim(),
        brand: brand.trim() || "Unknown",
        condition: condition || "Good",
        actual_original_price: retail ? parseFloat(retail) : 0,
        actual_listing_price: listing ? parseFloat(listing) : 0,
        actual_year_of_purchase: year ? parseInt(year, 10) : undefined,
        category: category || null,
        description: description.trim() || null,
        is_fragile: isFragile,
        disassembly_required: disassembly,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      toast.success("Item added");
      resetForm();
      onClose();
    },
    onError: () => toast.error("Failed to add item"),
  });

  function resetForm() {
    setName(""); setBrand(""); setCondition("Good"); setYear("");
    setCategory(""); setRetail(""); setListing("");
    setDescription(""); setIsFragile(false); setDisassembly(false);
  }

  const canSubmit = name.trim().length > 0;

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        style={{ position: "fixed", inset: 0, zIndex: 299, background: "rgba(20,17,13,0.4)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 300,
          width: 400, maxWidth: "100vw",
          background: "#FFFDF8",
          borderLeft: "1px solid var(--sr-border-subtle)",
          display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 32px rgba(20,17,13,0.12)",
          animation: "slideInRight 220ms ease",
          fontFamily: "var(--sr-font-sans)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "18px 24px", borderBottom: "1px solid var(--sr-border-subtle)",
          }}
        >
          <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)" }}>
            Add <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>item</em>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, borderRadius: "var(--sr-radius-sm)", border: "none",
              background: "transparent", display: "grid", placeItems: "center", cursor: "pointer",
              color: "var(--sr-text-muted)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-200)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Bundle select */}
          <DrawerField label="Bundle" required>
            <select
              value={bundleId}
              onChange={(e) => setBundleId(e.target.value)}
              style={inputStyle}
            >
              {bundles.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </DrawerField>

          {/* Name */}
          <DrawerField label="Item name" required>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. IKEA Kallax shelving unit"
              maxLength={120}
              style={inputStyle}
            />
          </DrawerField>

          {/* Brand + Condition */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DrawerField label="Brand">
              <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Unknown" style={inputStyle} />
            </DrawerField>
            <DrawerField label="Condition">
              <select value={condition} onChange={(e) => setCondition(e.target.value)} style={inputStyle}>
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </DrawerField>
          </div>

          {/* Year + Category */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DrawerField label="Year purchased">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder={String(new Date().getFullYear())}
                min={1900}
                max={new Date().getFullYear()}
                style={inputStyle}
              />
            </DrawerField>
            <DrawerField label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)} style={inputStyle}>
                <option value="">— select —</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </DrawerField>
          </div>

          {/* Retail + Listing */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <DrawerField label="Original retail ($)">
              <input
                type="number"
                value={retail}
                onChange={(e) => setRetail(e.target.value)}
                placeholder="0"
                min={0}
                style={inputStyle}
              />
            </DrawerField>
            <DrawerField label="Listing price ($)">
              <input
                type="number"
                value={listing}
                onChange={(e) => setListing(e.target.value)}
                placeholder="0"
                min={0}
                style={inputStyle}
              />
            </DrawerField>
          </div>

          {/* Description */}
          <DrawerField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a description buyers will see…"
              style={{ ...inputStyle, resize: "vertical" }}
            />
            <div style={{ fontSize: 10, color: "var(--sr-text-muted)", textAlign: "right", marginTop: 2 }}>{description.length}/500</div>
          </DrawerField>

          {/* Fragile + Disassembly */}
          <div style={{ display: "flex", gap: 20 }}>
            <DrawerCheckbox label="Fragile" checked={isFragile} onChange={setIsFragile} />
            <DrawerCheckbox label="Disassembly required" checked={disassembly} onChange={setDisassembly} />
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "16px 24px",
            borderTop: "1px solid var(--sr-border-subtle)",
            display: "flex", gap: 8, justifyContent: "flex-end",
            background: "var(--cream-50)",
          }}
        >
          <button
            onClick={onClose}
            style={{
              padding: "9px 18px", borderRadius: "var(--sr-radius-sm)",
              border: "1px solid var(--sr-border-subtle)", background: "transparent",
              fontSize: 13, cursor: "pointer", color: "var(--sr-text-primary)",
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => addMutation.mutate()}
            disabled={!canSubmit || addMutation.isPending}
            style={{
              padding: "9px 20px", borderRadius: "var(--sr-radius-sm)", border: "none",
              background: canSubmit ? "var(--clay-600)" : "var(--cream-300)",
              color: canSubmit ? "#fff" : "var(--ink-400)",
              fontSize: 13, fontWeight: 600,
              cursor: (!canSubmit || addMutation.isPending) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 6, transition: "background 120ms",
            }}
            onMouseEnter={(e) => { if (canSubmit && !addMutation.isPending) (e.currentTarget as HTMLElement).style.background = "var(--clay-700)"; }}
            onMouseLeave={(e) => { if (canSubmit) (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
          >
            {addMutation.isPending ? (
              <span style={{ display: "inline-block", width: 13, height: 13, borderRadius: "50%", border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", animation: "spin 0.7s linear infinite" }} />
            ) : (
              <Check size={13} />
            )}
            Add item
          </button>
        </div>
      </div>
    </>
  );
}

function DrawerField({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
        {label}{required && <span style={{ color: "var(--clay-500)", marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function DrawerCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--sr-text-primary)", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--clay-500)" }} />
      {label}
    </label>
  );
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: "var(--sr-radius-sm)",
  border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)",
  fontSize: 13, color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-sans)",
  outline: "none", boxSizing: "border-box",
};
