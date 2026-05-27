"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Package, X, Trash2, RotateCcw, Loader2, WifiOff, ChevronLeft, Pencil } from "lucide-react";
import type { CapturedItem } from "@/lib/capture/capture-types";

interface Props {
  items: CapturedItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onUpdateItem?: (id: string, updates: Partial<CapturedItem>) => void;
}

function formatPrice(price?: number): string | null {
  if (!price || price <= 0) return null;
  return `~$${Math.round(price).toLocaleString()}`;
}

// Half-sheet editor for a single item (G13)
function ItemEditSheet({
  item,
  onClose,
  onRemove,
  onRetry,
  onUpdateItem,
}: {
  item: CapturedItem;
  onClose: () => void;
  onRemove: () => void;
  onRetry: () => void;
  onUpdateItem?: (id: string, updates: Partial<CapturedItem>) => void;
}) {
  const [name, setName] = useState(item.name ?? item.label);
  const [brand, setBrand] = useState(item.brand ?? "");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTimeout(() => nameInputRef.current?.focus(), 120);
  }, []);

  const handleSave = useCallback(() => {
    if (!onUpdateItem) { onClose(); return; }
    const trimmedName = name.trim();
    const trimmedBrand = brand.trim();
    const updates: Partial<CapturedItem> = {};
    if (trimmedName && trimmedName !== item.name) {
      updates.name = trimmedName;
      updates.nameSource = "user";
    }
    if (trimmedBrand !== (item.brand ?? "")) {
      updates.brand = trimmedBrand || undefined;
    }
    if (Object.keys(updates).length > 0) onUpdateItem(item.id, updates);
    onClose();
  }, [name, brand, item, onUpdateItem, onClose]);

  const handleDelete = useCallback(() => {
    onRemove();
    onClose();
  }, [onRemove, onClose]);

  const displayName = item.isLoading ? "Identifying…" : (item.name ?? item.label);
  const price = formatPrice(item.predicted_original_price);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleSave(); }}
    >
      <div
        style={{
          background: "rgba(14, 12, 10, 0.97)",
          borderRadius: "20px 20px 0 0",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          paddingBottom: "calc(24px + env(safe-area-inset-bottom, 0px))",
          animation: "slideUp 220ms cubic-bezier(0.32,0.72,0,1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 8 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 16px 12px",
          }}
        >
          <button
            onClick={handleSave}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 14,
              padding: 0,
            }}
          >
            <ChevronLeft size={18} strokeWidth={2} />
            Back
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#B14F3B",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 14,
              fontWeight: 600,
              padding: 0,
            }}
          >
            <Trash2 size={15} strokeWidth={2} />
            Remove
          </button>
        </div>

        {/* Frame image */}
        <div style={{ padding: "0 16px 16px" }}>
          <div
            style={{
              width: "100%",
              aspectRatio: "4/3",
              borderRadius: 14,
              overflow: "hidden",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
              display: "grid",
              placeItems: "center",
              position: "relative",
            }}
          >
            {item.frameSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.frameSrc}
                alt={displayName}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <Package size={40} strokeWidth={1} style={{ color: "rgba(255,255,255,0.20)" }} />
            )}
            {item.isLoading && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(0,0,0,0.50)",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                <Loader2 size={28} style={{ color: "var(--clay-400)" }} className="animate-spin" />
              </div>
            )}
            {/* AI / confidence badge */}
            {!item.isLoading && item.nameSource === "ai" && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  left: 8,
                  background: item.confidence === "low" ? "rgba(217,119,6,0.85)" : "rgba(0,0,0,0.65)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 100,
                  padding: "3px 8px",
                  fontSize: 10,
                  fontFamily: "var(--sr-font-sans)",
                  fontWeight: 600,
                  color: item.confidence === "low" ? "#fff" : "rgba(255,255,255,0.70)",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase",
                }}
              >
                {item.confidence === "low" ? "Low confidence" : "AI guess"}
              </div>
            )}
            {price && !item.isLoading && (
              <div
                style={{
                  position: "absolute",
                  bottom: 8,
                  right: 8,
                  background: "rgba(107,138,78,0.85)",
                  backdropFilter: "blur(6px)",
                  borderRadius: 100,
                  padding: "3px 10px",
                  fontSize: 12,
                  fontFamily: "var(--sr-font-mono)",
                  fontWeight: 700,
                  color: "#fff",
                }}
              >
                {price}
              </div>
            )}
          </div>
        </div>

        {/* Fields */}
        <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Network error / retry */}
          {(item.network_error || item.error) && !item.isLoading && (
            <button
              onClick={() => { onRetry(); onClose(); }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                width: "100%",
                padding: "10px 16px",
                borderRadius: 10,
                border: "1px solid rgba(181,96,74,0.40)",
                background: "rgba(181,96,74,0.15)",
                cursor: "pointer",
                color: "#CC785C",
                fontFamily: "var(--sr-font-sans)",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <RotateCcw size={14} strokeWidth={2.5} />
              {item.network_error ? "Retry upload" : "Retry identify"}
            </button>
          )}

          {/* Name input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontFamily: "var(--sr-font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 6,
              }}
            >
              Item name
            </label>
            <input
              ref={nameInputRef}
              type="text"
              value={item.isLoading ? "" : name}
              onChange={(e) => setName(e.target.value)}
              disabled={item.isLoading}
              placeholder={item.isLoading ? "Identifying…" : "Name this item"}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              style={{
                width: "100%",
                height: 48,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.14)",
                background: "rgba(255,255,255,0.06)",
                fontSize: 16,
                fontWeight: 600,
                fontFamily: "var(--sr-font-sans)",
                color: item.isLoading ? "rgba(255,255,255,0.30)" : "rgba(255,255,255,0.90)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Brand input */}
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontFamily: "var(--sr-font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.35)",
                marginBottom: 6,
              }}
            >
              Brand <span style={{ textTransform: "none", letterSpacing: 0, fontFamily: "var(--sr-font-sans)" }}>(optional)</span>
            </label>
            <input
              type="text"
              value={item.isLoading ? "" : brand}
              onChange={(e) => setBrand(e.target.value)}
              disabled={item.isLoading}
              placeholder={item.isLoading ? "…" : "e.g. IKEA, Sony, Unknown"}
              onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
              style={{
                width: "100%",
                height: 44,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.10)",
                background: "rgba(255,255,255,0.04)",
                fontSize: 14,
                fontFamily: "var(--sr-font-sans)",
                color: item.isLoading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.70)",
                outline: "none",
                boxSizing: "border-box",
              }}
            />
          </div>

          {/* Save button */}
          <button
            onClick={handleSave}
            style={{
              width: "100%",
              height: 50,
              borderRadius: 14,
              border: "none",
              background: "var(--clay-600)",
              color: "#fff",
              fontSize: 16,
              fontWeight: 700,
              fontFamily: "var(--sr-font-sans)",
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// Grid cell for a single item in the bucket preview (G15)
function GridCell({
  item,
  onTap,
}: {
  item: CapturedItem;
  onTap: () => void;
}) {
  const displayName = item.name
    ? item.name
    : item.isLoading
    ? "Identifying…"
    : item.label;

  return (
    <button
      onClick={onTap}
      style={{
        position: "relative",
        borderRadius: 12,
        overflow: "hidden",
        border: item.network_error
          ? "1px solid rgba(177,79,59,0.55)"
          : item.confidence === "low"
          ? "1px solid rgba(217,119,6,0.40)"
          : "1px solid rgba(255,255,255,0.10)",
        background: "rgba(255,255,255,0.05)",
        cursor: "pointer",
        textAlign: "left",
        padding: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Photo */}
      <div style={{ position: "relative", width: "100%", aspectRatio: "1" }}>
        {item.frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.frameSrc}
            alt={displayName}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.04)",
            }}
          >
            <Package size={24} strokeWidth={1} style={{ color: "rgba(255,255,255,0.20)" }} />
          </div>
        )}
        {item.isLoading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.45)",
              display: "grid",
              placeItems: "center",
            }}
          >
            <Loader2 size={18} style={{ color: "var(--clay-400)" }} className="animate-spin" />
          </div>
        )}
        {/* Status dot */}
        {item.network_error && !item.isLoading && (
          <div
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#B14F3B",
              border: "1.5px solid rgba(14,12,10,0.80)",
            }}
          />
        )}
        {item.confidence === "low" && !item.isLoading && (
          <div
            style={{
              position: "absolute",
              top: 5,
              right: 5,
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#D97706",
              border: "1.5px solid rgba(14,12,10,0.80)",
            }}
          />
        )}
        {/* Edit icon hint */}
        <div
          style={{
            position: "absolute",
            bottom: 5,
            right: 5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "rgba(0,0,0,0.60)",
            backdropFilter: "blur(4px)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Pencil size={10} strokeWidth={2.5} style={{ color: "rgba(255,255,255,0.70)" }} />
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          padding: "6px 8px 8px",
          fontFamily: "var(--sr-font-sans)",
          fontSize: 11,
          fontWeight: 600,
          color: item.isLoading ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.80)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          lineHeight: 1.3,
        }}
      >
        {displayName}
      </div>
    </button>
  );
}

export function CaptureBucket({ items, onRemove, onRetry, onUpdateItem }: Props) {
  const [open, setOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CapturedItem | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(items.length);
  const loadingCount = items.filter((i) => i.isLoading).length;
  const networkErrorCount = items.filter((i) => i.network_error && !i.isLoading).length;

  // Auto-open on first item added
  useEffect(() => {
    if (prevCountRef.current === 0 && items.length === 1) {
      setOpen(true);
    }
    prevCountRef.current = items.length;
  }, [items.length]);

  // Keep editingItem in sync if the underlying item updates (e.g. Gemini returns)
  useEffect(() => {
    if (!editingItem) return;
    const updated = items.find((i) => i.id === editingItem.id);
    if (updated) setEditingItem(updated);
    else setEditingItem(null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items]);

  // Close panel on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const badge = (
    <button
      onClick={() => setOpen((v) => !v)}
      aria-label={`Capture bucket - ${items.length} items`}
      style={{
        position: "absolute",
        top: 12,
        right: 12,
        zIndex: 20,
        display: "flex",
        alignItems: "center",
        gap: 7,
        padding: "6px 12px 6px 10px",
        borderRadius: 100,
        background: items.length > 0 ? "rgba(181,96,74,0.88)" : "rgba(0,0,0,0.60)",
        backdropFilter: "blur(10px)",
        border: items.length > 0 ? "1px solid rgba(224,162,133,0.30)" : "1px solid rgba(255,255,255,0.12)",
        cursor: "pointer",
        transition: "background 150ms",
        boxShadow: items.length > 0 ? "0 4px 16px rgba(181,96,74,0.25)" : "none",
      }}
    >
      {loadingCount > 0 ? (
        <Loader2 size={14} strokeWidth={2.5} style={{ color: "#fff", flexShrink: 0 }} className="animate-spin" />
      ) : networkErrorCount > 0 ? (
        <WifiOff size={14} strokeWidth={2.5} style={{ color: "#fff", flexShrink: 0 }} />
      ) : (
        <Package size={14} strokeWidth={2.5} style={{ color: items.length > 0 ? "#fff" : "rgba(255,255,255,0.65)", flexShrink: 0 }} />
      )}
      <span
        style={{
          fontFamily: "var(--sr-font-sans)",
          fontSize: 13,
          fontWeight: 700,
          color: items.length > 0 ? "#fff" : "rgba(255,255,255,0.65)",
          letterSpacing: "-0.01em",
          lineHeight: 1,
        }}
      >
        {items.length}
      </span>
      {networkErrorCount > 0 && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#B14F3B",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );

  const panel = open && (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        pointerEvents: "none",
      }}
    >
      <div
        ref={panelRef}
        style={{
          pointerEvents: "auto",
          maxHeight: "68vh",
          display: "flex",
          flexDirection: "column",
          background: "rgba(12, 10, 8, 0.94)",
          backdropFilter: "blur(28px)",
          WebkitBackdropFilter: "blur(28px)",
          borderTop: "1px solid rgba(255,255,255,0.10)",
          borderRadius: "20px 20px 0 0",
          overflow: "hidden",
          animation: "slideUp 220ms cubic-bezier(0.32,0.72,0,1)",
        }}
      >
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10, paddingBottom: 4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.18)" }} />
        </div>

        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "8px 16px 12px",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: "rgba(181,96,74,0.20)",
                border: "1px solid rgba(181,96,74,0.30)",
                display: "grid",
                placeItems: "center",
              }}
            >
              <Package size={15} strokeWidth={2} style={{ color: "#CC785C" }} />
            </div>
            <div>
              <div
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 16,
                  fontWeight: 500,
                  color: "rgba(255,255,255,0.90)",
                  letterSpacing: "-0.01em",
                  lineHeight: 1.2,
                }}
              >
                Captured items
              </div>
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.40)",
                  marginTop: 1,
                }}
              >
                {items.length === 0
                  ? "Tap items to add them"
                  : `${items.length} item${items.length !== 1 ? "s" : ""}${loadingCount > 0 ? ` · ${loadingCount} identifying…` : ""}${networkErrorCount > 0 ? ` · ${networkErrorCount} need retry` : ""}`}
              </div>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.12)",
              background: "rgba(255,255,255,0.06)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.55)",
            }}
            aria-label="Close bucket"
          >
            <X size={15} strokeWidth={2} />
          </button>
        </div>

        {/* Photo grid (G15) */}
        <div style={{ flex: 1, overflowY: "auto", padding: items.length === 0 ? 0 : 12 }}>
          {items.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "40px 24px",
                gap: 10,
                textAlign: "center",
              }}
            >
              <Package size={32} strokeWidth={1} style={{ color: "rgba(255,255,255,0.15)" }} />
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.5,
                }}
              >
                Tap any item in view to add it to your sale
              </div>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {items.map((item) => (
                <GridCell
                  key={item.id}
                  item={item}
                  onTap={() => setEditingItem(item)}
                />
              ))}
            </div>
          )}
        </div>

        {/* iOS safe area */}
        <div style={{ height: "calc(16px + env(safe-area-inset-bottom, 0px))", flexShrink: 0 }} />
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );

  return (
    <>
      {badge}
      {panel}
      {editingItem && (
        <ItemEditSheet
          item={editingItem}
          onClose={() => setEditingItem(null)}
          onRemove={() => onRemove(editingItem.id)}
          onRetry={() => onRetry(editingItem.id)}
          onUpdateItem={onUpdateItem}
        />
      )}
    </>
  );
}
