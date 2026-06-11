"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Sparkles, Pencil, Trash2, ArrowRight, X, Check } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem, RoomBundle, ItemCategory } from "@myrio/types";
import { patchItem, deleteItem, moveItem } from "@myrio/api";
import { ItemPhotoStrip } from "./item-photo-strip";

interface ItemCardV2Props {
  eventId: string;
  bundleId: string;
  item: InventoryItem;
  allBundles?: RoomBundle[];
}

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "decor", label: "Decor" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

export function ItemCardV2({ eventId, bundleId, item, allBundles = [] }: ItemCardV2Props) {
  const qc = useQueryClient();
  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMoveDropdown, setShowMoveDropdown] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["summary", eventId] });

  const patchMutation = useMutation({
    mutationFn: (updates: Partial<InventoryItem>) => patchItem(eventId, bundleId, item.id, updates),
    onSuccess: invalidate,
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(eventId, bundleId, item.id),
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: (toBundleId: string) => moveItem(eventId, bundleId, item.id, toBundleId),
    onSuccess: invalidate,
  });

  const conf = item.confidence ?? 0;
  const confPct = Math.round(conf * 100);
  const isHighConf = conf >= 0.85;
  const isMedConf = conf >= 0.7 && conf < 0.85;

  const retail = item.actual_original_price ?? item.predicted_original_price;
  const listing = item.actual_listing_price ?? item.predicted_listing_price;
  const year = item.actual_year_of_purchase ?? item.predicted_year_of_purchase;

  const otherBundles = allBundles.filter((b) => b.id !== bundleId);

  function closeMenu() {
    setMenuOpen(false);
    setShowMoveDropdown(false);
  }

  return (
    <>
      <div
        style={{
          background: conf < 0.7 ? "#FFFDF8" : "var(--sr-bg-card)",
          border: `1px solid ${conf < 0.7 ? "var(--honey-100)" : "var(--sr-border-subtle)"}`,
          borderRadius: "var(--sr-radius-lg)",
          padding: "20px 22px",
          transition: "border-color 160ms, box-shadow 160ms",
          fontFamily: "var(--sr-font-sans)",
          position: "relative",
          opacity: deleteMutation.isPending || moveMutation.isPending ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = conf < 0.7 ? "var(--honey-200)" : "var(--sr-border-default)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--sr-shadow-sm)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = conf < 0.7 ? "var(--honey-100)" : "var(--sr-border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
        }}
      >
        {/* Photo strip */}
        <ItemPhotoStrip
          eventId={eventId}
          bundleId={bundleId}
          itemId={item.id}
          images={item.images ?? []}
        />

        {/* Top row: flags + menu */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            {/* Confidence badge */}
            <span
              style={{
                padding: "3px 8px",
                borderRadius: "var(--sr-radius-sm)",
                fontFamily: "var(--sr-font-mono)",
                fontSize: 10,
                fontWeight: 500,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                background: isHighConf ? "var(--moss-50)" : isMedConf ? "var(--honey-50)" : "var(--rust-50)",
                color: isHighConf ? "var(--moss-700)" : isMedConf ? "var(--honey-700)" : "var(--rust-500)",
                border: `1px solid ${isHighConf ? "var(--moss-100)" : isMedConf ? "var(--honey-100)" : "var(--rust-100)"}`,
              }}
            >
              {confPct}% match
            </span>
          </div>

          {/* MoreHorizontal menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              aria-label="Item options"
              onClick={() => { setMenuOpen((o) => !o); setShowMoveDropdown(false); }}
              style={{ color: "var(--sr-text-muted)", cursor: "pointer", width: 22, height: 22, display: "grid", placeItems: "center", border: "none", background: "transparent" }}
            >
              <MoreHorizontal size={14} />
            </button>

            {menuOpen && (
              <>
                {/* Backdrop */}
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={closeMenu} />
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: 26,
                    zIndex: 50,
                    background: "var(--sr-bg-card)",
                    border: "1px solid var(--sr-border-subtle)",
                    borderRadius: "var(--sr-radius-md)",
                    boxShadow: "var(--sr-shadow-md)",
                    minWidth: 160,
                    padding: "4px 0",
                    fontFamily: "var(--sr-font-sans)",
                  }}
                >
                  <MenuItem icon={<Pencil size={12} />} label="Edit details" onClick={() => { setShowEditModal(true); closeMenu(); }} />
                  {otherBundles.length > 0 && (
                    <div style={{ position: "relative" }}>
                      <MenuItem
                        icon={<ArrowRight size={12} />}
                        label="Move to room"
                        onClick={() => setShowMoveDropdown((o) => !o)}
                      />
                      {showMoveDropdown && (
                        <div
                          style={{
                            position: "absolute",
                            right: "100%",
                            top: 0,
                            marginRight: 4,
                            background: "var(--sr-bg-card)",
                            border: "1px solid var(--sr-border-subtle)",
                            borderRadius: "var(--sr-radius-md)",
                            boxShadow: "var(--sr-shadow-md)",
                            minWidth: 150,
                            padding: "4px 0",
                          }}
                        >
                          {otherBundles.map((b) => (
                            <button
                              key={b.id}
                              onClick={() => { moveMutation.mutate(b.id); closeMenu(); }}
                              style={{
                                display: "block",
                                width: "100%",
                                textAlign: "left",
                                padding: "8px 14px",
                                background: "none",
                                border: "none",
                                fontSize: 13,
                                color: "var(--sr-text-primary)",
                                cursor: "pointer",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                              }}
                              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
                              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                            >
                              {b.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div style={{ borderTop: "1px solid var(--sr-border-subtle)", margin: "4px 0" }} />
                  <MenuItem
                    icon={<Trash2 size={12} />}
                    label="Delete item"
                    onClick={() => { setShowDeleteConfirm(true); closeMenu(); }}
                    danger
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Name */}
        <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)", marginBottom: 10, lineHeight: 1.25 }}>
          {item.name}
        </div>

        {/* Description (if set) */}
        {item.description && (
          <p style={{ fontSize: 12, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: "0 0 10px", fontStyle: "italic" }}>
            {item.description}
          </p>
        )}

        {/* Attributes: Brand · Condition · Year */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 1,
            marginBottom: 14,
            background: "var(--sr-border-subtle)",
            border: "1px solid var(--sr-border-subtle)",
            borderRadius: "var(--sr-radius-md)",
            overflow: "hidden",
          }}
        >
          {[
            { label: "Brand", value: item.brand },
            { label: "Condition", value: item.condition },
            { label: "Year purchased", value: year?.toString() ?? "-" },
          ].map((attr) => (
            <div key={attr.label} style={{ display: "flex", flexDirection: "column", gap: 3, padding: "9px 12px", background: "var(--cream-50)" }}>
              <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
                {attr.label}
              </span>
              <span style={{ fontSize: 13, color: "var(--sr-text-primary)", fontWeight: 500, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {attr.value || "-"}
              </span>
            </div>
          ))}
        </div>

        {/* Category + quantity chips */}
        {(item.category || item.quantity) && (
          <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            {item.category && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", background: "var(--cream-100)", border: "1px solid var(--cream-300)", color: "var(--ink-500)" }}>
                {item.category}
              </span>
            )}
            {item.quantity && item.quantity > 1 && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", background: "var(--cream-100)", border: "1px solid var(--cream-300)", color: "var(--ink-500)" }}>
                Qty: {item.quantity}
              </span>
            )}
            {item.is_fragile && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", background: "var(--rust-50)", border: "1px solid var(--rust-100)", color: "var(--rust-500)" }}>
                Fragile
              </span>
            )}
            {item.disassembly_required && (
              <span style={{ padding: "2px 8px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.1em", background: "var(--honey-50)", border: "1px solid var(--honey-100)", color: "var(--honey-700)" }}>
                Disassembly req.
              </span>
            )}
          </div>
        )}

        {/* Pricing */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--sr-border-subtle)", paddingTop: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingRight: 16 }}>
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
              Original Retail
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontWeight: 500 }}>$</span>
              <span style={{ fontSize: 18, fontWeight: 600, color: "var(--sr-text-primary)" }}>
                {retail?.toLocaleString() ?? "-"}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 4, paddingLeft: 16, borderLeft: "1px solid var(--sr-border-subtle)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--clay-600)" }}>
                Listing Value
              </span>
              {item.pricing_reasoning && (
                <button
                  onClick={() => setReasoningOpen((o) => !o)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--clay-500)", cursor: "pointer", border: "none", background: "none", padding: 0, transition: "opacity 120ms" }}
                >
                  <Sparkles size={10} />
                  AI
                </button>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 15, color: "var(--clay-500)", fontWeight: 600 }}>$</span>
              <span style={{ fontSize: 24, fontWeight: 700, color: "var(--clay-600)", letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>
                {listing?.toLocaleString() ?? "-"}
              </span>
            </div>
          </div>
        </div>

        {/* AI reasoning */}
        {reasoningOpen && item.pricing_reasoning && (
          <div
            style={{
              marginTop: 12,
              padding: "12px 14px",
              background: "linear-gradient(135deg, var(--clay-50), var(--cream-50))",
              border: "1px solid var(--clay-100)",
              borderRadius: "var(--sr-radius-md)",
              display: "flex",
              gap: 9,
              alignItems: "flex-start",
              animation: "fadeSlide 200ms ease",
            }}
          >
            <Sparkles size={12} style={{ color: "var(--clay-500)", flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: 12, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
              {item.pricing_reasoning}
            </p>
          </div>
        )}
      </div>

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <DeleteConfirmDialog
          itemName={item.name}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={() => { deleteMutation.mutate(); setShowDeleteConfirm(false); }}
        />
      )}

      {/* Edit modal */}
      {showEditModal && (
        <ItemEditModal
          item={item}
          onClose={() => setShowEditModal(false)}
          onSave={(updates) => { patchMutation.mutate(updates); setShowEditModal(false); }}
        />
      )}
    </>
  );
}

function MenuItem({
  icon, label, onClick, danger,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "8px 14px",
        background: "none",
        border: "none",
        fontSize: 13,
        color: danger ? "var(--rust-500)" : "var(--sr-text-primary)",
        cursor: "pointer",
        textAlign: "left",
        transition: "background 80ms",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = danger ? "var(--rust-50)" : "var(--cream-100)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
    >
      {icon}
      {label}
    </button>
  );
}

function DeleteConfirmDialog({ itemName, onCancel, onConfirm }: { itemName: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,17,13,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)", padding: "28px 32px", maxWidth: 360, width: "90%", fontFamily: "var(--sr-font-sans)" }}
      >
        <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)", marginBottom: 8 }}>Delete item?</div>
        <p style={{ fontSize: 13, color: "var(--sr-text-secondary)", lineHeight: 1.5, margin: "0 0 22px" }}>
          &ldquo;{itemName}&rdquo; will be permanently removed from this sale.
        </p>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--sr-text-primary)" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--rust-200)", background: "var(--rust-500)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function ItemEditModal({ item, onClose, onSave }: { item: InventoryItem; onClose: () => void; onSave: (u: Partial<InventoryItem>) => void }) {
  const [description, setDescription] = useState(item.description ?? "");
  const [category, setCategory] = useState<ItemCategory | "">(item.category ?? "");
  const [quantity, setQuantity] = useState(String(item.quantity ?? 1));
  const [dimensions, setDimensions] = useState(item.dimensions ?? "");
  const [material, setMaterial] = useState(item.material ?? "");
  const [isFragile, setIsFragile] = useState(item.is_fragile ?? false);
  const [disassembly, setDisassembly] = useState(item.disassembly_required ?? false);

  function handleSave() {
    const updates: Partial<InventoryItem> = {};
    if (description !== (item.description ?? "")) updates.description = description || null;
    if (category !== (item.category ?? "")) updates.category = (category as ItemCategory) || null;
    const qty = parseInt(quantity, 10);
    if (!isNaN(qty) && qty > 0 && qty !== (item.quantity ?? 1)) updates.quantity = qty;
    if (dimensions !== (item.dimensions ?? "")) updates.dimensions = dimensions || null;
    if (material !== (item.material ?? "")) updates.material = material || null;
    if (isFragile !== (item.is_fragile ?? false)) updates.is_fragile = isFragile;
    if (disassembly !== (item.disassembly_required ?? false)) updates.disassembly_required = disassembly;
    onSave(updates);
  }

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,17,13,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)", padding: "28px 32px", maxWidth: 480, width: "95%", fontFamily: "var(--sr-font-sans)", maxHeight: "90vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)" }}>
            Edit - {item.name}
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--sr-text-muted)" }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Field label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a description buyers will see…"
              style={inputStyle}
            />
            <div style={{ fontSize: 10, color: "var(--sr-text-muted)", textAlign: "right", marginTop: 2 }}>{description.length}/500</div>
          </Field>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)} style={inputStyle}>
                <option value="">- select -</option>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                max={99}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <Field label="Dimensions">
              <input
                value={dimensions}
                onChange={(e) => setDimensions(e.target.value)}
                placeholder="e.g. 180×90×75cm"
                style={inputStyle}
              />
            </Field>
            <Field label="Material">
              <input
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                placeholder="e.g. Solid oak"
                style={inputStyle}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <Checkbox label="Fragile" checked={isFragile} onChange={setIsFragile} />
            <Checkbox label="Disassembly required" checked={disassembly} onChange={setDisassembly} />
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--sr-text-primary)" }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{ padding: "8px 20px", borderRadius: "var(--sr-radius-sm)", border: "none", background: "var(--clay-500)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
          >
            <Check size={13} /> Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Checkbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--sr-text-primary)", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--clay-500)" }} />
      {label}
    </label>
  );
}

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
