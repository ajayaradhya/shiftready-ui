"use client";

import { useRef, useState } from "react";
import { MoreHorizontal, Sparkles, Pencil, Trash2, ArrowRightLeft, Copy, ChevronDown, X, Check, ShoppingBag, EyeOff, RotateCcw, Unlock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { InventoryItem, RoomBundle, ItemCategory, SaleSummary, SaleStatus } from "@/lib/types";
import { patchItem, deleteItem, moveItem, createItemFull, repriceItem, withdrawItem, relistItem, releaseItemReservation } from "@/lib/api";
import { MarkSoldDialog } from "./MarkSoldDialog";
import { ItemPhotoStrip } from "./item-photo-strip";
import { toast } from "sonner";

interface ItemCardV3Props {
  eventId: string;
  bundleId: string;
  item: InventoryItem;
  allBundles?: RoomBundle[];
  bundleIndex?: number;
  saleStatus?: SaleStatus;
}

const BUNDLE_PALETTES = [
  { dot: "var(--clay-500)", bg: "var(--clay-50)", border: "var(--clay-200)" },
  { dot: "var(--honey-500)", bg: "var(--honey-50)", border: "var(--honey-200)" },
  { dot: "var(--moss-500)", bg: "var(--moss-50)", border: "var(--moss-200)" },
];

const CONDITIONS = ["Like New", "Excellent", "Good", "Fair", "Poor"];

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "decor", label: "Decor" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = {
  furniture: "Furniture",
  appliance: "Appliance",
  decor: "Decor",
  electronics: "Electronics",
  other: "Other",
};

export function ItemCardV3({ eventId, bundleId, item, allBundles = [], bundleIndex = 0, saleStatus }: ItemCardV3Props) {
  const qc = useQueryClient();

  const [reasoningOpen, setReasoningOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [movePanelOpen, setMovePanelOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Inline name edit
  const [nameEditing, setNameEditing] = useState(false);
  const [nameVal, setNameVal] = useState(item.name);

  // Inline attrs (live save on blur)
  const [brand, setBrand] = useState(item.brand ?? "");
  const [condition, setCondition] = useState(item.condition ?? "Good");
  const [year, setYear] = useState(
    String(item.actual_year_of_purchase ?? item.predicted_year_of_purchase ?? "")
  );
  const [category, setCategory] = useState<string>(item.category ?? "");
  const [retailVal, setRetailVal] = useState(
    String(item.actual_original_price ?? item.predicted_original_price ?? "")
  );
  const [listingVal, setListingVal] = useState(
    String(item.actual_listing_price ?? item.predicted_listing_price ?? "")
  );

  const [pricingStale, setPricingStale] = useState(false);

  const PRICING_FIELDS = new Set<keyof InventoryItem>(["name", "brand", "condition", "actual_year_of_purchase", "actual_original_price"]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["summary", eventId] });

  const patchMutation = useMutation({
    mutationFn: (updates: Partial<InventoryItem>) => patchItem(eventId, bundleId, item.id, updates),
    onSuccess: (_data, updates) => {
      invalidate();
      if (Object.keys(updates).some((k) => PRICING_FIELDS.has(k as keyof InventoryItem))) {
        setPricingStale(true);
      }
    },
  });

  const [showMarkSold, setShowMarkSold] = useState(false);

  const itemSaleStatus = item.sale_status ?? "available";
  const isSold = itemSaleStatus === "sold";
  const isReserved = itemSaleStatus === "reserved";
  const isWithdrawn = itemSaleStatus === "withdrawn";
  const isActive = saleStatus === "live" || saleStatus === "partially_sold";
  const canMarkSold = isActive && (itemSaleStatus === "available" || itemSaleStatus === "reserved");
  const canWithdraw = isActive && (itemSaleStatus === "available" || itemSaleStatus === "reserved");
  const canRelist = isActive && isWithdrawn;
  const canRelease = isActive && isReserved;

  const withdrawMutation = useMutation({
    mutationFn: () => withdrawItem(eventId, bundleId, item.id),
    onSuccess: () => { invalidate(); toast.success(`"${item.name}" withdrawn`); },
    onError: (err: Error) => toast.error(err.message || "Withdraw failed"),
  });

  const relistMutation = useMutation({
    mutationFn: () => relistItem(eventId, bundleId, item.id),
    onSuccess: () => { invalidate(); toast.success(`"${item.name}" relisted`); },
    onError: (err: Error) => toast.error(err.message || "Relist failed"),
  });

  const releaseMutation = useMutation({
    mutationFn: () => releaseItemReservation(eventId, bundleId, item.id),
    onSuccess: () => { invalidate(); toast.success("Reservation released"); },
    onError: (err: Error) => toast.error(err.message || "Release failed"),
  });

  const [pendingReprice, setPendingReprice] = useState<{
    predicted_listing_price: number;
    actual_listing_price: number;
    pricing_reasoning: string;
  } | null>(null);

  // Step 1: fetch AI suggestion - no DB write
  const repriceMutation = useMutation({
    mutationFn: () => repriceItem(eventId, bundleId, item.id),
    onSuccess: (data) => setPendingReprice(data),
    onError: (err: Error) => toast.error(err.message || "Re-pricing failed"),
  });

  // Step 2: user accepted - persist via PATCH
  const acceptRepriceMutation = useMutation({
    mutationFn: (data: NonNullable<typeof pendingReprice>) =>
      patchItem(eventId, bundleId, item.id, {
        predicted_listing_price: data.predicted_listing_price,
        actual_listing_price: data.actual_listing_price,
        pricing_reasoning: data.pricing_reasoning,
      }),
    onSuccess: (_res, data) => {
      setListingVal(String(data.actual_listing_price));
      qc.setQueryData<SaleSummary>(["summary", eventId], (old) => {
        if (!old) return old;
        return {
          ...old,
          bundles: old.bundles.map((b) =>
            b.id !== bundleId ? b : {
              ...b,
              items: b.items.map((it) =>
                it.id !== item.id ? it : {
                  ...it,
                  predicted_listing_price: data.predicted_listing_price,
                  actual_listing_price: data.actual_listing_price,
                  pricing_reasoning: data.pricing_reasoning,
                }
              ),
            }
          ),
        };
      });
      invalidate();
      setPricingStale(false);
      setPendingReprice(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to save price"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(eventId, bundleId, item.id),
    onSuccess: invalidate,
  });

  const moveMutation = useMutation({
    mutationFn: (toBundleId: string) => moveItem(eventId, bundleId, item.id, toBundleId),
    onSuccess: () => { invalidate(); setMovePanelOpen(false); },
  });

  const duplicateMutation = useMutation({
    mutationFn: () =>
      createItemFull(eventId, bundleId, {
        name: `${item.name} (copy)`,
        brand: item.brand ?? "Unknown",
        condition: item.condition ?? "Good",
        actual_listing_price: item.actual_listing_price ?? item.predicted_listing_price ?? 0,
        actual_original_price: item.actual_original_price ?? item.predicted_original_price ?? 0,
        actual_year_of_purchase: item.actual_year_of_purchase ?? item.predicted_year_of_purchase,
        dimensions: item.dimensions,
        material: item.material,
        is_fragile: item.is_fragile ?? false,
        disassembly_required: item.disassembly_required ?? false,
        description: item.description,
        category: item.category,
        quantity: item.quantity,
      }),
    onSuccess: () => { invalidate(); toast.success("Item duplicated"); },
    onError: () => toast.error("Duplicate failed"),
  });

  const conf = item.confidence ?? 0;
  const confPct = Math.round(conf * 100);
  const isHighConf = conf >= 0.85;
  const isMedConf = conf >= 0.7 && conf < 0.85;
  const isWarn = conf < 0.7;

  const retail = item.actual_original_price ?? item.predicted_original_price;
  const listing = item.actual_listing_price ?? item.predicted_listing_price;

  const frameImg = item.images?.find((i) => i.source === "frame_extract") ?? null;
  const otherBundles = allBundles.filter((b) => b.id !== bundleId);

  function saveField(field: keyof InventoryItem, value: unknown, original: unknown) {
    if (value !== original && !(value === "" && !original)) {
      patchMutation.mutate({ [field]: value || null } as Partial<InventoryItem>);
    }
  }

  function saveName() {
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== item.name) {
      patchMutation.mutate({ name: trimmed });
    } else {
      setNameVal(item.name);
    }
    setNameEditing(false);
  }

  const dimmed = deleteMutation.isPending || moveMutation.isPending;
  const greyed = isSold || isWithdrawn;

  return (
    <>
      <div
        style={{
          background: isWarn && !greyed ? "#FFFEF5" : "var(--sr-bg-card)",
          border: `1px solid ${isWarn && !greyed ? "var(--honey-200)" : "var(--sr-border-subtle)"}`,
          borderRadius: "var(--sr-radius-lg)",
          overflow: "hidden",
          transition: "border-color 160ms, box-shadow 160ms",
          fontFamily: "var(--sr-font-sans)",
          opacity: dimmed ? 0.5 : greyed ? 0.6 : 1,
          filter: greyed ? "saturate(0.4)" : "none",
          position: "relative",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = isWarn ? "var(--honey-300)" : "var(--sr-border-default)";
          (e.currentTarget as HTMLElement).style.boxShadow = "var(--sr-shadow-sm)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.borderColor = isWarn ? "var(--honey-200)" : "var(--sr-border-subtle)";
          (e.currentTarget as HTMLElement).style.boxShadow = "";
        }}
      >
        {/* ── Capture bar ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "10px 14px",
            background: "var(--cream-50)",
            borderBottom: "1px solid var(--sr-border-subtle)",
          }}
        >
          {/* Frame thumb */}
          {frameImg?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={frameImg.url}
              alt=""
              style={{ width: 44, height: 33, borderRadius: 4, objectFit: "cover", flexShrink: 0, border: "1px solid var(--sr-border-subtle)" }}
            />
          ) : (
            <div
              style={{
                width: 44, height: 33, borderRadius: 4, flexShrink: 0,
                background: "var(--cream-200)", border: "1px solid var(--cream-300)",
                display: "grid", placeItems: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--ink-300)" strokeWidth="1.5">
                <rect x="3" y="7" width="18" height="14" rx="2" />
                <circle cx="12" cy="14" r="3" />
                <path d="M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2" />
              </svg>
            </div>
          )}

          {/* Conf pill */}
          <span
            style={{
              padding: "2px 7px",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 9.5,
              fontWeight: 500,
              textTransform: "uppercase" as const,
              letterSpacing: "0.1em",
              background: isHighConf ? "var(--moss-50)" : isMedConf ? "var(--honey-50)" : "var(--rust-50)",
              color: isHighConf ? "var(--moss-700)" : isMedConf ? "var(--honey-700)" : "var(--rust-500)",
              border: `1px solid ${isHighConf ? "var(--moss-100)" : isMedConf ? "var(--honey-100)" : "var(--rust-100)"}`,
            }}
          >
            {confPct}% match
          </span>

          <div style={{ flex: 1 }} />

          {/* Sale status badge */}
          {itemSaleStatus !== "available" && (
            <span
              style={{
                padding: "2px 8px",
                borderRadius: "var(--sr-radius-sm)",
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9.5,
                fontWeight: 600,
                textTransform: "uppercase" as const,
                letterSpacing: "0.1em",
                ...(isSold
                  ? { background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)" }
                  : isReserved
                  ? { background: "var(--honey-50)", color: "var(--honey-700)", border: "1px solid var(--honey-100)" }
                  : { background: "var(--cream-200)", color: "var(--ink-500)", border: "1px solid var(--cream-300)" }),
              }}
            >
              {isSold ? "Sold" : isReserved ? "Reserved" : "Withdrawn"}
            </span>
          )}

          {/* ··· menu */}
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              aria-label="Item options"
              onClick={() => setMenuOpen((o) => !o)}
              style={{
                color: "var(--sr-text-muted)", cursor: "pointer",
                width: 26, height: 26, display: "grid", placeItems: "center",
                border: "1px solid transparent", borderRadius: "var(--sr-radius-sm)",
                background: "transparent", transition: "background 80ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-200)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <>
                <div style={{ position: "fixed", inset: 0, zIndex: 49 }} onClick={() => setMenuOpen(false)} />
                <div
                  style={{
                    position: "absolute", right: 0, top: 30, zIndex: 50,
                    background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)",
                    borderRadius: "var(--sr-radius-md)", boxShadow: "var(--sr-shadow-md)",
                    minWidth: 168, padding: "4px 0",
                  }}
                >
                  {canMarkSold && (
                    <DropMenuItem icon={<ShoppingBag size={12} />} label="Mark as sold" onClick={() => { setShowMarkSold(true); setMenuOpen(false); }} />
                  )}
                  {canRelease && (
                    <DropMenuItem icon={<Unlock size={12} />} label="Release reservation" onClick={() => { releaseMutation.mutate(); setMenuOpen(false); }} />
                  )}
                  {canRelist && (
                    <DropMenuItem icon={<RotateCcw size={12} />} label="Relist item" onClick={() => { relistMutation.mutate(); setMenuOpen(false); }} />
                  )}
                  {(canMarkSold || canRelease || canRelist) && (
                    <div style={{ borderTop: "1px solid var(--sr-border-subtle)", margin: "4px 0" }} />
                  )}
                  {!isSold && !isWithdrawn && (
                    <>
                      <DropMenuItem icon={<Pencil size={12} />} label="Edit details" onClick={() => { setShowEditModal(true); setMenuOpen(false); }} />
                      <DropMenuItem icon={<Copy size={12} />} label="Duplicate" onClick={() => { duplicateMutation.mutate(); setMenuOpen(false); }} />
                    </>
                  )}
                  {canWithdraw && (
                    <>
                      <div style={{ borderTop: "1px solid var(--sr-border-subtle)", margin: "4px 0" }} />
                      <DropMenuItem icon={<EyeOff size={12} />} label="Withdraw item" onClick={() => { withdrawMutation.mutate(); setMenuOpen(false); }} danger />
                    </>
                  )}
                  {!canMarkSold && !canRelease && !canRelist && !canWithdraw && (
                    <>
                      <DropMenuItem icon={<Pencil size={12} />} label="Edit details" onClick={() => { setShowEditModal(true); setMenuOpen(false); }} />
                      <DropMenuItem icon={<Copy size={12} />} label="Duplicate" onClick={() => { duplicateMutation.mutate(); setMenuOpen(false); }} />
                      <div style={{ borderTop: "1px solid var(--sr-border-subtle)", margin: "4px 0" }} />
                    </>
                  )}
                  <DropMenuItem icon={<Trash2 size={12} />} label="Delete item" onClick={() => { setShowDeleteConfirm(true); setMenuOpen(false); }} danger />
                </div>
              </>
            )}
          </div>
        </div>

        {/* ── Photo strip ── */}
        <ItemPhotoStrip
          noBleed
          eventId={eventId}
          bundleId={bundleId}
          itemId={item.id}
          images={item.images ?? []}
        />

        {/* ── Body ── */}
        <div style={{ padding: "14px 18px 16px" }}>
          {/* Name row */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 10 }}>
            {nameEditing ? (
              <input
                autoFocus
                value={nameVal}
                onChange={(e) => setNameVal(e.target.value)}
                onBlur={saveName}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") { setNameVal(item.name); setNameEditing(false); } }}
                maxLength={120}
                style={{
                  flex: 1, fontFamily: "var(--sr-font-serif)", fontSize: 14.5, fontWeight: 500,
                  letterSpacing: "-0.01em", color: "var(--ink-800)", background: "transparent",
                  border: "none", borderBottom: "2px solid var(--clay-300)", outline: "none",
                  lineHeight: 1.3, padding: "0 0 2px",
                }}
              />
            ) : (
              <span
                style={{
                  flex: 1, fontFamily: "var(--sr-font-serif)", fontSize: 14.5, fontWeight: 500,
                  letterSpacing: "-0.01em", color: "var(--ink-800)", lineHeight: 1.3, cursor: "text",
                }}
                onDoubleClick={() => setNameEditing(true)}
                title="Double-click to rename"
              >
                {item.name}
              </span>
            )}

            {/* Category pill */}
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                patchMutation.mutate({ category: (e.target.value as ItemCategory) || null });
              }}
              style={{
                fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase" as const,
                letterSpacing: "0.08em", padding: "2px 6px", borderRadius: "var(--sr-radius-sm)",
                border: "1px solid var(--cream-300)", background: "var(--cream-100)",
                color: "var(--ink-500)", cursor: "pointer", flexShrink: 0, outline: "none",
                appearance: "none" as const, WebkitAppearance: "none" as const,
              }}
            >
              <option value="">Category</option>
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          {/* Chips row */}
          {(item.is_fragile || item.disassembly_required || (item.quantity && item.quantity > 1)) && (
            <div style={{ display: "flex", gap: 5, marginBottom: 10, flexWrap: "wrap" }}>
              {item.is_fragile && (
                <span style={{ padding: "2px 7px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.08em", background: "var(--rust-50)", border: "1px solid var(--rust-100)", color: "var(--rust-500)" }}>
                  Fragile
                </span>
              )}
              {item.disassembly_required && (
                <span style={{ padding: "2px 7px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.08em", background: "var(--honey-50)", border: "1px solid var(--honey-100)", color: "var(--honey-700)" }}>
                  Disassembly req.
                </span>
              )}
              {item.quantity && item.quantity > 1 && (
                <span style={{ padding: "2px 7px", borderRadius: "var(--sr-radius-sm)", fontSize: 10, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase" as const, letterSpacing: "0.08em", background: "var(--cream-100)", border: "1px solid var(--cream-300)", color: "var(--ink-500)" }}>
                  Qty: {item.quantity}
                </span>
              )}
            </div>
          )}

          {/* Description block */}
          <button
            onClick={() => setShowEditModal(true)}
            style={{
              width: "100%", textAlign: "left", background: "var(--cream-50)",
              border: "1.5px dashed var(--cream-400)", borderRadius: "var(--sr-radius-md)",
              padding: "9px 12px", marginBottom: 12, cursor: "pointer",
              transition: "border-color 120ms, background 120ms",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-200)"; (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--cream-400)"; (e.currentTarget as HTMLElement).style.background = "var(--cream-50)"; }}
          >
            {item.description ? (
              <span style={{ fontSize: 12, color: "var(--sr-text-secondary)", lineHeight: 1.5 }}>
                {item.description}
              </span>
            ) : (
              <span style={{ fontSize: 12, color: "var(--sr-text-muted)", fontStyle: "italic" }}>
                Add a description buyers will see…
              </span>
            )}
          </button>

          {/* 2×2 attrs grid */}
          <div
            style={{
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1,
              marginBottom: 14, background: "var(--sr-border-subtle)",
              border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-md)", overflow: "hidden",
            }}
          >
            <AttrCell label="Brand">
              <input
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                onBlur={() => saveField("brand", brand, item.brand ?? "")}
                placeholder="Unknown"
                style={attrInputStyle}
              />
            </AttrCell>
            <AttrCell label="Condition">
              <select
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                onBlur={() => saveField("condition", condition, item.condition ?? "Good")}
                style={attrInputStyle}
              >
                {CONDITIONS.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </AttrCell>
            <AttrCell label="Year">
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(e.target.value)}
                onBlur={() => {
                  const y = parseInt(year, 10);
                  const original = item.actual_year_of_purchase ?? item.predicted_year_of_purchase;
                  if (!isNaN(y) && y !== original) {
                    patchMutation.mutate({ actual_year_of_purchase: y });
                  }
                }}
                placeholder="Year"
                min={1900}
                max={new Date().getFullYear()}
                style={attrInputStyle}
              />
            </AttrCell>
            <AttrCell label="Category">
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  patchMutation.mutate({ category: (e.target.value as ItemCategory) || null });
                }}
                style={attrInputStyle}
              >
                <option value="">- select -</option>
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </AttrCell>
          </div>

          {/* Pricing stale banner */}
          {pricingStale && (
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 8, padding: "7px 10px", marginBottom: 10,
                background: "var(--honey-50)", border: "1px solid var(--honey-200)",
                borderRadius: "var(--sr-radius-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--honey-700)", flex: 1 }}>
                Item details changed - listing price may be outdated.
              </span>
              <button
                onClick={() => repriceMutation.mutate()}
                disabled={repriceMutation.isPending}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  padding: "4px 10px", borderRadius: "var(--sr-radius-sm)",
                  border: "1px solid var(--honey-300)", background: repriceMutation.isPending ? "var(--honey-100)" : "var(--honey-500)",
                  color: repriceMutation.isPending ? "var(--honey-600)" : "#fff",
                  fontSize: 11.5, fontWeight: 600, cursor: repriceMutation.isPending ? "default" : "pointer",
                  transition: "background 100ms",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => { if (!repriceMutation.isPending) (e.currentTarget as HTMLElement).style.background = "var(--honey-600)"; }}
                onMouseLeave={(e) => { if (!repriceMutation.isPending) (e.currentTarget as HTMLElement).style.background = "var(--honey-500)"; }}
              >
                <Sparkles size={10} />
                {repriceMutation.isPending ? "Pricing…" : "Re-price"}
              </button>
            </div>
          )}

          {/* Pricing row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", borderTop: "1px solid var(--sr-border-subtle)", paddingTop: 12, marginBottom: 12 }}>
            <div style={{ paddingRight: 14 }}>
              <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "var(--sr-text-muted)", display: "block", marginBottom: 4 }}>
                Original Retail
              </span>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 12, color: "var(--sr-text-muted)", fontWeight: 500 }}>$</span>
                <input
                  type="number"
                  min={0}
                  value={retailVal}
                  onChange={(e) => setRetailVal(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(retailVal);
                    const original = item.actual_original_price ?? item.predicted_original_price;
                    if (!isNaN(v) && v >= 0 && v !== original) {
                      patchMutation.mutate({ actual_original_price: v });
                    } else if (retailVal === "" && original != null) {
                      patchMutation.mutate({ actual_original_price: 0 });
                    }
                  }}
                  placeholder="-"
                  style={{ ...attrInputStyle, fontSize: 17, fontWeight: 600, color: "var(--sr-text-primary)", width: "100%", padding: "2px 4px" }}
                />
              </div>
            </div>
            <div style={{ paddingLeft: 14, borderLeft: "1px solid var(--sr-border-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "var(--clay-600)" }}>
                  Listing Value
                </span>
                {item.pricing_reasoning && (
                  <button
                    onClick={() => setReasoningOpen((o) => !o)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10,
                      color: reasoningOpen ? "var(--clay-600)" : "var(--clay-400)", cursor: "pointer",
                      border: "none", background: "none", padding: 0, transition: "color 120ms",
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--clay-600)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = reasoningOpen ? "var(--clay-600)" : "var(--clay-400)"; }}
                  >
                    <Sparkles size={9} />
                    AI
                  </button>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                <span style={{ fontSize: 14, color: "var(--clay-500)", fontWeight: 600 }}>$</span>
                <input
                  type="number"
                  min={0}
                  value={listingVal}
                  onChange={(e) => setListingVal(e.target.value)}
                  onBlur={() => {
                    const v = parseFloat(listingVal);
                    const original = item.actual_listing_price ?? item.predicted_listing_price;
                    if (!isNaN(v) && v >= 0 && v !== original) {
                      patchMutation.mutate({ actual_listing_price: v });
                    } else if (listingVal === "" && original != null) {
                      patchMutation.mutate({ actual_listing_price: 0 });
                    }
                  }}
                  placeholder="-"
                  style={{ ...attrInputStyle, fontSize: 22, fontWeight: 700, color: "var(--clay-600)", letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"', width: "100%", padding: "2px 4px" }}
                />
              </div>
            </div>
          </div>

          {/* AI reasoning */}
          {reasoningOpen && item.pricing_reasoning && (
            <div
              style={{
                marginBottom: 12, padding: "10px 12px",
                background: "linear-gradient(135deg, var(--clay-50), var(--cream-50))",
                border: "1px solid var(--clay-100)", borderRadius: "var(--sr-radius-md)",
                display: "flex", gap: 8, alignItems: "flex-start", animation: "fadeSlide 200ms ease",
              }}
            >
              <Sparkles size={11} style={{ color: "var(--clay-500)", flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: 11.5, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
                {item.pricing_reasoning}
              </p>
            </div>
          )}

          {/* Sold info banner */}
          {isSold && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 10px", marginBottom: 10,
                background: "var(--moss-50)", border: "1px solid var(--moss-100)",
                borderRadius: "var(--sr-radius-sm)",
              }}
            >
              <Check size={11} style={{ color: "var(--moss-600)", flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: "var(--moss-700)" }}>
                Sold
                {item.final_price != null && ` · $${item.final_price.toLocaleString()}`}
                {item.buyer_label && ` to ${item.buyer_label}`}
                {item.sold_payment_method && ` · ${item.sold_payment_method}`}
              </span>
            </div>
          )}

          {/* Reserved info banner */}
          {isReserved && (
            <div
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "7px 10px", marginBottom: 10,
                background: "var(--honey-50)", border: "1px solid var(--honey-100)",
                borderRadius: "var(--sr-radius-sm)",
              }}
            >
              <span style={{ fontSize: 11.5, color: "var(--honey-700)" }}>
                Reserved - use &ldquo;Mark as sold&rdquo; once pickup is done
              </span>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              display: "flex", alignItems: "center", gap: 2,
              paddingTop: 10, borderTop: "1px solid var(--sr-border-subtle)",
            }}
          >
            {canMarkSold && (
              <FooterBtn
                label="Mark sold"
                icon={<ShoppingBag size={11} />}
                onClick={() => setShowMarkSold(true)}
              />
            )}
            {canRelist && (
              <FooterBtn
                label="Relist"
                icon={<RotateCcw size={11} />}
                onClick={() => relistMutation.mutate()}
                loading={relistMutation.isPending}
              />
            )}
            {!isSold && !isWithdrawn && (
              <>
                <FooterBtn
                  label="Move"
                  icon={<ArrowRightLeft size={11} />}
                  suffix={<ChevronDown size={10} style={{ transition: "transform 120ms", transform: movePanelOpen ? "rotate(180deg)" : "none" }} />}
                  onClick={() => setMovePanelOpen((o) => !o)}
                  active={movePanelOpen}
                />
                <FooterBtn
                  label="Details"
                  icon={<Pencil size={11} />}
                  onClick={() => setShowEditModal(true)}
                />
                <FooterBtn
                  label="Duplicate"
                  icon={<Copy size={11} />}
                  onClick={() => duplicateMutation.mutate()}
                  loading={duplicateMutation.isPending}
                />
              </>
            )}
            <div style={{ flex: 1 }} />
            <FooterBtn
              label="Delete"
              icon={<Trash2 size={11} />}
              onClick={() => setShowDeleteConfirm(true)}
              danger
            />
          </div>

          {/* Move panel (inline expansion) */}
          {movePanelOpen && otherBundles.length > 0 && (
            <div
              style={{
                marginTop: 8, background: "var(--cream-50)",
                border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-md)",
                padding: "6px 0", animation: "fadeSlide 180ms ease",
              }}
            >
              {otherBundles.map((b, i) => {
                const pal = BUNDLE_PALETTES[i % BUNDLE_PALETTES.length];
                return (
                  <button
                    key={b.id}
                    onClick={() => moveMutation.mutate(b.id)}
                    disabled={moveMutation.isPending}
                    style={{
                      display: "flex", alignItems: "center", gap: 8,
                      width: "100%", padding: "8px 14px",
                      background: "none", border: "none", cursor: moveMutation.isPending ? "default" : "pointer",
                      fontSize: 13, color: "var(--sr-text-primary)", textAlign: "left",
                      transition: "background 80ms",
                    }}
                    onMouseEnter={(e) => { if (!moveMutation.isPending) (e.currentTarget as HTMLElement).style.background = pal.bg; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
                  >
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: pal.dot, flexShrink: 0 }} />
                    <span style={{ flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{b.name}</span>
                    <span style={{ fontSize: 11, color: "var(--sr-text-muted)" }}>{b.items.length} items</span>
                  </button>
                );
              })}
            </div>
          )}
          {movePanelOpen && otherBundles.length === 0 && (
            <div style={{ marginTop: 8, padding: "10px 14px", fontSize: 12, color: "var(--sr-text-muted)", fontStyle: "italic", textAlign: "center" }}>
              No other bundles to move to
            </div>
          )}
        </div>
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

      {/* Mark sold dialog */}
      {showMarkSold && (
        <MarkSoldDialog
          eventId={eventId}
          bundleId={bundleId}
          item={item}
          onClose={() => setShowMarkSold(false)}
        />
      )}

      {/* Re-price confirm dialog */}
      {pendingReprice && (
        <RepriceSuggestDialog
          itemName={item.name}
          oldPrice={item.actual_listing_price ?? item.predicted_listing_price ?? 0}
          newPrice={pendingReprice.actual_listing_price}
          reasoning={pendingReprice.pricing_reasoning}
          saving={acceptRepriceMutation.isPending}
          onAccept={() => acceptRepriceMutation.mutate(pendingReprice)}
          onReject={() => setPendingReprice(null)}
        />
      )}
    </>
  );
}

// ── Sub-components ────────────────────────────────────────────

function AttrCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, padding: "8px 11px", background: "var(--cream-50)" }}>
      <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 8.5, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
        {label}
      </span>
      {children}
    </div>
  );
}

const attrInputStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 500, color: "var(--sr-text-primary)",
  background: "transparent", border: "none", outline: "none",
  padding: 0, width: "100%", fontFamily: "var(--sr-font-sans)",
};

function FooterBtn({
  label, icon, onClick, danger, active, suffix, loading,
}: {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  suffix?: React.ReactNode;
  loading?: boolean;
}) {
  const baseColor = danger ? "var(--rust-500)" : "var(--sr-text-muted)";
  const hoverBg = danger ? "var(--rust-50)" : "var(--cream-100)";
  const activeBg = "var(--cream-200)";

  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: "inline-flex", alignItems: "center", gap: 4,
        padding: "5px 8px", borderRadius: "var(--sr-radius-sm)",
        border: "none", background: active ? activeBg : "transparent",
        color: danger ? "var(--rust-400)" : (active ? "var(--ink-600)" : "var(--sr-text-muted)"),
        fontSize: 11.5, fontWeight: 500, cursor: loading ? "default" : "pointer",
        transition: "background 80ms, color 80ms", opacity: loading ? 0.5 : 1,
        fontFamily: "var(--sr-font-sans)",
      }}
      onMouseEnter={(e) => { if (!loading) { (e.currentTarget as HTMLElement).style.background = active ? activeBg : hoverBg; (e.currentTarget as HTMLElement).style.color = danger ? "var(--rust-500)" : "var(--ink-700)"; } }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = active ? activeBg : "transparent"; (e.currentTarget as HTMLElement).style.color = danger ? "var(--rust-400)" : (active ? "var(--ink-600)" : baseColor); }}
    >
      {icon}
      {label}
      {suffix}
    </button>
  );
}

function DropMenuItem({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 8,
        width: "100%", padding: "8px 14px", background: "none", border: "none",
        fontSize: 13, color: danger ? "var(--rust-500)" : "var(--sr-text-primary)",
        cursor: "pointer", textAlign: "left", transition: "background 80ms",
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

const CATEGORY_OPTIONS: { value: ItemCategory; label: string }[] = [
  { value: "furniture", label: "Furniture" },
  { value: "appliance", label: "Appliance" },
  { value: "decor", label: "Decor" },
  { value: "electronics", label: "Electronics" },
  { value: "other", label: "Other" },
];

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
            Edit - <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>{item.name}</em>
          </div>
          <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--sr-text-muted)", width: 28, height: 28, display: "grid", placeItems: "center", borderRadius: "var(--sr-radius-sm)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-200)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "none"; }}
          >
            <X size={15} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <ModalField label="Description">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder="Add a description buyers will see…"
              style={modalInputStyle}
            />
            <div style={{ fontSize: 10, color: "var(--sr-text-muted)", textAlign: "right", marginTop: 2 }}>{description.length}/500</div>
          </ModalField>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ModalField label="Category">
              <select value={category} onChange={(e) => setCategory(e.target.value as ItemCategory)} style={modalInputStyle}>
                <option value="">- select -</option>
                {CATEGORY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </ModalField>
            <ModalField label="Quantity">
              <input type="number" min={1} max={99} value={quantity} onChange={(e) => setQuantity(e.target.value)} style={modalInputStyle} />
            </ModalField>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <ModalField label="Dimensions">
              <input value={dimensions} onChange={(e) => setDimensions(e.target.value)} placeholder="e.g. 180×90×75cm" style={modalInputStyle} />
            </ModalField>
            <ModalField label="Material">
              <input value={material} onChange={(e) => setMaterial(e.target.value)} placeholder="e.g. Solid oak" style={modalInputStyle} />
            </ModalField>
          </div>

          <div style={{ display: "flex", gap: 20 }}>
            <ModalCheckbox label="Fragile" checked={isFragile} onChange={setIsFragile} />
            <ModalCheckbox label="Disassembly required" checked={disassembly} onChange={setDisassembly} />
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
            style={{ padding: "8px 20px", borderRadius: "var(--sr-radius-sm)", border: "none", background: "var(--clay-600)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-700)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
          >
            <Check size={13} /> Save changes
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.14em", color: "var(--sr-text-muted)" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

function ModalCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 13, color: "var(--sr-text-primary)", cursor: "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} style={{ width: 14, height: 14, accentColor: "var(--clay-500)" }} />
      {label}
    </label>
  );
}

const modalInputStyle: React.CSSProperties = {
  width: "100%", padding: "8px 10px", borderRadius: "var(--sr-radius-sm)",
  border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)",
  fontSize: 13, color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-sans)",
  outline: "none", boxSizing: "border-box",
};

function RepriceSuggestDialog({
  itemName, oldPrice, newPrice, reasoning, saving, onAccept, onReject,
}: {
  itemName: string;
  oldPrice: number;
  newPrice: number;
  reasoning: string;
  saving: boolean;
  onAccept: () => void;
  onReject: () => void;
}) {
  const fmt = (v: number) =>
    v.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });

  const diff = newPrice - oldPrice;
  const diffSign = diff >= 0 ? "+" : "";
  const diffColor = diff > 0 ? "var(--moss-600)" : diff < 0 ? "var(--rust-500)" : "var(--ink-400)";

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,17,13,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={saving ? undefined : onReject}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)",
          padding: "28px 32px", maxWidth: 400, width: "92%",
          fontFamily: "var(--sr-font-sans)", boxShadow: "0 8px 32px rgba(0,0,0,0.14)",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <Sparkles size={14} style={{ color: "var(--clay-500)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink-800)" }}>
            AI pricing suggestion
          </span>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--sr-text-muted)", margin: "0 0 20px", lineHeight: 1.4 }}>
          For <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>{itemName}</em>
        </p>

        {/* Price comparison */}
        <div
          style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 16px", marginBottom: 16,
            background: "var(--cream-50)", border: "1px solid var(--cream-300)",
            borderRadius: "var(--sr-radius-md)",
          }}
        >
          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--sr-text-muted)", marginBottom: 4 }}>Current</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: "var(--ink-500)", letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>{fmt(oldPrice)}</div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 2 }}>
            <div style={{ height: 1, width: "100%", background: "var(--cream-300)" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: diffColor, fontFeatureSettings: '"tnum"' }}>
              {diffSign}{fmt(Math.abs(diff))}
            </span>
          </div>

          <div style={{ textAlign: "center" as const }}>
            <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const, letterSpacing: "0.12em", color: "var(--clay-600)", marginBottom: 4 }}>AI Suggested</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: "var(--clay-600)", letterSpacing: "-0.02em", fontFeatureSettings: '"tnum"' }}>{fmt(newPrice)}</div>
          </div>
        </div>

        {/* Reasoning */}
        <div
          style={{
            padding: "10px 12px", marginBottom: 22,
            background: "linear-gradient(135deg, var(--clay-50), var(--cream-50))",
            border: "1px solid var(--clay-100)", borderRadius: "var(--sr-radius-md)",
            display: "flex", gap: 8, alignItems: "flex-start",
          }}
        >
          <Sparkles size={10} style={{ color: "var(--clay-400)", flexShrink: 0, marginTop: 2 }} />
          <p style={{ fontSize: 11.5, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: 0, fontStyle: "italic" }}>
            {reasoning}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            onClick={onReject}
            disabled={saving}
            style={{
              padding: "8px 16px", borderRadius: "var(--sr-radius-sm)",
              border: "1px solid var(--sr-border-subtle)", background: "transparent",
              fontSize: 13, cursor: saving ? "default" : "pointer",
              color: "var(--sr-text-primary)", opacity: saving ? 0.5 : 1,
            }}
          >
            Keep current
          </button>
          <button
            onClick={onAccept}
            disabled={saving}
            style={{
              padding: "8px 20px", borderRadius: "var(--sr-radius-sm)",
              border: "none", background: saving ? "var(--clay-300)" : "var(--clay-600)",
              color: "#fff", fontSize: 13, fontWeight: 600,
              cursor: saving ? "default" : "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "background 100ms",
            }}
            onMouseEnter={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = "var(--clay-700)"; }}
            onMouseLeave={(e) => { if (!saving) (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
          >
            {saving ? "Saving…" : <><Check size={13} /> Accept price</>}
          </button>
        </div>
      </div>
    </div>
  );
}
