"use client";

import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, Package, Search } from "lucide-react";
import { formatAUD } from "@myrio/core";
import { getPublicSale } from "@myrio/api";
import type { PinRef } from "@myrio/types";

interface FocusPickerProps {
  saleEventId: string;
  onSelect: (pin: PinRef) => void;
  onClose: () => void;
}

const fmt = (n: number) => formatAUD(n);

export function FocusPicker({ saleEventId, onSelect, onClose }: FocusPickerProps) {
  const [query, setQuery] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);

  const { data: sale, isLoading } = useQuery({
    queryKey: ["public-sale", saleEventId],
    queryFn: () => getPublicSale(saleEventId),
    staleTime: 60_000,
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const q = query.toLowerCase();

  const saleName = sale?.title || (sale?.suburb ? `${sale.suburb} Moving Sale` : "This Sale");

  return (
    <div
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          background: "var(--sr-bg-card)",
          borderRadius: "var(--sr-radius-xl)",
          border: "1px solid var(--sr-border-subtle)",
          width: "100%",
          maxWidth: 440,
          maxHeight: "75vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxShadow: "var(--sr-shadow-lg, 0 20px 40px rgba(0,0,0,0.15))",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 18px 12px",
            borderBottom: "1px solid var(--sr-border-subtle)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div style={{ flex: 1 }}>
            <p
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 16,
                fontWeight: 500,
                color: "var(--sr-text-primary)",
                margin: 0,
              }}
            >
              Change focus
            </p>
            <p
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--sr-text-muted)",
                marginTop: 2,
              }}
            >
              Pin an item, bundle, or sale to this conversation
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--sr-radius-sm)",
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              color: "var(--sr-text-muted)",
            }}
          >
            <X size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--sr-border-subtle)" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "7px 10px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--cream-100)",
              border: "1px solid var(--sr-border-subtle)",
            }}
          >
            <Search size={13} strokeWidth={1.5} color="var(--sr-text-muted)" />
            <input
              type="text"
              placeholder="Search itemsâ€¦"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                color: "var(--sr-text-primary)",
                width: "100%",
              }}
            />
          </div>
        </div>

        {/* Options */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {isLoading && (
            <div style={{ padding: "32px", textAlign: "center", color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)", fontSize: 13 }}>
              Loadingâ€¦
            </div>
          )}

          {sale && (
            <>
              {/* Whole sale option */}
              {(!q || saleName.toLowerCase().includes(q)) && (
                <>
                  <div style={{ padding: "8px 14px 4px" }}>
                    <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sr-text-muted)" }}>
                      Sale
                    </span>
                  </div>
                  <button
                    onClick={() => onSelect({ kind: "sale", saleEventId })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      width: "100%",
                      padding: "10px 14px",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--cream-50)")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: "var(--sr-radius-md)", background: "var(--cream-200)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                      <Package size={14} strokeWidth={1.5} color="var(--ink-400)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {saleName}
                      </div>
                      <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sr-text-muted)", marginTop: 2 }}>
                        {sale.bundles.reduce((s, b) => s + b.items.length, 0)} items total
                      </div>
                    </div>
                  </button>
                </>
              )}

              {/* Bundles and items */}
              {sale.bundles.map((bundle) => {
                const bundleMatch = !q || bundle.name?.toLowerCase().includes(q);
                const matchingItems = bundle.items.filter(
                  (item) => !q || item.name?.toLowerCase().includes(q) || item.brand?.toLowerCase().includes(q)
                );

                if (!bundleMatch && matchingItems.length === 0) return null;

                return (
                  <div key={bundle.id}>
                    <div style={{ padding: "10px 14px 4px" }}>
                      <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--sr-text-muted)" }}>
                        {bundle.name ?? "Bundle"}
                      </span>
                    </div>

                    {/* Bundle row */}
                    {bundleMatch && (
                      <button
                        onClick={() => onSelect({ kind: "bundle", saleEventId, bundleId: bundle.id })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          padding: "8px 14px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--cream-50)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                      >
                        <div style={{ width: 36, height: 36, borderRadius: "var(--sr-radius-md)", background: "var(--cream-200)", display: "grid", placeItems: "center", flexShrink: 0 }}>
                          <Package size={14} strokeWidth={1.5} color="var(--ink-400)" />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {bundle.name ?? "Bundle"}
                          </div>
                          <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 9, color: "var(--sr-text-muted)", marginTop: 2 }}>
                            {bundle.items.length} items Â· {bundle.itemTotal > 0 ? fmt(bundle.itemTotal) : "POA"}
                          </div>
                        </div>
                      </button>
                    )}

                    {/* Item rows */}
                    {matchingItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onSelect({ kind: "item", saleEventId, bundleId: bundle.id, itemId: item.id })}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          padding: "8px 14px 8px 26px",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          textAlign: "left",
                        }}
                        onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--cream-50)")}
                        onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "none")}
                      >
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: "var(--sr-radius-sm)",
                            background: item.image_url ? undefined : "var(--cream-200)",
                            flexShrink: 0,
                            overflow: "hidden",
                            position: "relative",
                          }}
                        >
                          {!item.image_url && <Package size={12} strokeWidth={1.5} color="var(--ink-300)" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontFamily: "var(--sr-font-sans)", fontSize: 13, color: "var(--sr-text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {item.name ?? "Item"}
                          </div>
                          <div style={{ fontFamily: "var(--sr-font-sans)", fontSize: 11, color: "var(--clay-600)", fontWeight: 600 }}>
                            {item.price > 0 ? fmt(item.price) : "POA"}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                );
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
