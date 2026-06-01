"use client";

import { useState, useEffect, useCallback } from "react";
import { Trash2, Plus, PackageCheck, Loader2, AlertCircle, WifiOff, Copy, Wand2 } from "lucide-react";
import type { CapturedItem } from "@/lib/capture/capture-types";
import { suggestSaleTitle } from "@/lib/api";
import { formatAUD } from "@/lib/format";

interface Props {
  items: CapturedItem[];
  isUploading: boolean;
  uploadError: string | null;
  saleTitle: string;
  onSaleTitleChange: (v: string) => void;
  onRemove: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<CapturedItem>) => void;
  onDuplicate: (id: string) => void;
  onProcess: () => void;
  onBack: () => void;
  eventId?: string | null;
}

export function ItemReviewScreen({
  items,
  isUploading,
  uploadError,
  saleTitle,
  onSaleTitleChange,
  onRemove,
  onUpdateItem,
  onDuplicate,
  onProcess,
  onBack,
  eventId,
}: Props) {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );
  const [showNetworkConfirm, setShowNetworkConfirm] = useState(false);
  const [isSuggestingTitle, setIsSuggestingTitle] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const loadingCount = items.filter((i) => i.isLoading).length;
  const networkErrorCount = items.filter((i) => i.network_error && !i.isLoading).length;
  const identifiedCount = items.filter((i) => !i.isLoading && i.name).length;

  const canProcess = items.length > 0 && isOnline && !isUploading;

  const handleCreateSale = useCallback(() => {
    if (networkErrorCount > 0 && !showNetworkConfirm) {
      setShowNetworkConfirm(true);
      return;
    }
    setShowNetworkConfirm(false);
    onProcess();
  }, [networkErrorCount, showNetworkConfirm, onProcess]);

  const handleSuggestTitle = useCallback(async () => {
    if (!eventId || isSuggestingTitle) return;
    const names = items
      .filter((i) => i.name && i.name !== i.label)
      .map((i) => i.name as string);
    if (names.length === 0) return;
    setIsSuggestingTitle(true);
    try {
      const { title } = await suggestSaleTitle(eventId, names);
      if (title) onSaleTitleChange(title);
    } catch {
      // best-effort
    } finally {
      setIsSuggestingTitle(false);
    }
  }, [eventId, items, isSuggestingTitle, onSaleTitleChange]);

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 64px)",
        background: "var(--sr-bg-app)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "24px 20px 16px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "var(--clay-50)",
              border: "1px solid var(--clay-100)",
              display: "grid",
              placeItems: "center",
              color: "var(--clay-600)",
              flexShrink: 0,
            }}
          >
            <PackageCheck size={20} strokeWidth={1.5} />
          </div>
          <div>
            <div
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 20,
                fontWeight: 500,
                color: "var(--ink-800)",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
              }}
            >
              Review items
            </div>
            <div
              style={{
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                color: "var(--sr-text-secondary)",
                marginTop: 2,
              }}
            >
              {items.length === 0
                ? "No items captured"
                : loadingCount > 0
                ? `${identifiedCount} identified · ${loadingCount} still identifying…`
                : `${items.length} item${items.length !== 1 ? "s" : ""} captured`}
            </div>
          </div>
        </div>
      </div>

      {/* Items grid */}
      <div style={{ flex: 1, padding: 16, overflowY: "auto" }}>
        {items.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "48px 24px",
              gap: 12,
              textAlign: "center",
            }}
          >
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: "var(--sr-bg-card)",
                border: "1px dashed var(--sr-border-subtle)",
                display: "grid",
                placeItems: "center",
                color: "var(--sr-text-muted)",
              }}
            >
              <Plus size={24} strokeWidth={1.5} />
            </div>
            <div style={{ fontFamily: "var(--sr-font-sans)", fontSize: 14, color: "var(--sr-text-muted)" }}>
              Go back and tap items to add them
            </div>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: 10,
            }}
          >
            {items.map((item) => {
              const displayName = item.name
                ? item.name
                : item.label;
              const price =
                item.predicted_original_price && item.predicted_original_price > 0
                  ? `~${formatAUD(Math.round(item.predicted_original_price))}`
                  : null;

              return (
                <div
                  key={item.id}
                  style={{
                    position: "relative",
                    borderRadius: 14,
                    overflow: "hidden",
                    border: item.network_error
                      ? "1px solid var(--rust-200)"
                      : "1px solid var(--sr-border-subtle)",
                    background: "var(--sr-bg-card)",
                  }}
                >
                  {item.frameSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.frameSrc}
                      alt={displayName}
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        objectFit: "cover",
                        display: "block",
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: "100%",
                        aspectRatio: "4/3",
                        background: "var(--sr-bg-app)",
                        display: "grid",
                        placeItems: "center",
                        color: "var(--sr-text-muted)",
                      }}
                    >
                      <PackageCheck size={28} strokeWidth={1} />
                    </div>
                  )}

                  {/* Loading shimmer overlay */}
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
                      <Loader2 size={22} style={{ color: "var(--clay-400)" }} className="animate-spin" />
                    </div>
                  )}

                  <div style={{ padding: "8px 10px 10px" }}>
                    {/* Low-confidence amber dot */}
                    {item.confidence === "low" && !item.isLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#D97706", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontFamily: "var(--sr-font-sans)", color: "#D97706" }}>
                          Confirm name
                        </span>
                      </div>
                    )}

                    {/* Editable name */}
                    <input
                      type="text"
                      value={item.name ?? item.label}
                      onChange={(e) =>
                        onUpdateItem(item.id, { name: e.target.value, nameSource: "user" })
                      }
                      disabled={isUploading || item.isLoading}
                      placeholder="Name this item"
                      style={{
                        width: "100%",
                        background: "transparent",
                        border: "none",
                        outline: "none",
                        fontFamily: "var(--sr-font-sans)",
                        fontSize: 13,
                        fontWeight: 600,
                        color: item.isLoading ? "var(--sr-text-muted)" : "var(--ink-800)",
                        padding: 0,
                        cursor: isUploading || item.isLoading ? "not-allowed" : "text",
                        boxSizing: "border-box",
                      }}
                    />

                    {/* Status badges */}
                    {item.network_error && !item.isLoading && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <WifiOff size={10} style={{ color: "var(--rust-500)", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontFamily: "var(--sr-font-sans)", color: "var(--rust-500)" }}>
                          Network error
                        </span>
                      </div>
                    )}

                    {item.error && !item.isLoading && !item.network_error && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                        <AlertCircle size={10} style={{ color: "var(--rust-500)", flexShrink: 0 }} />
                        <span style={{ fontSize: 10, fontFamily: "var(--sr-font-sans)", color: "var(--rust-500)" }}>
                          Could not identify
                        </span>
                      </div>
                    )}

                    {(item.brand || price) && !item.isLoading && !item.error && !item.network_error && (
                      <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                        {item.brand && item.brand !== "Unknown" && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--sr-font-sans)",
                              fontWeight: 600,
                              padding: "2px 6px",
                              borderRadius: 100,
                              background: "var(--clay-50)",
                              color: "var(--clay-700)",
                              border: "1px solid var(--clay-100)",
                            }}
                          >
                            {item.brand}
                          </span>
                        )}
                        {price && (
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--sr-font-mono)",
                              fontWeight: 700,
                              padding: "2px 6px",
                              borderRadius: 100,
                              background: "var(--moss-50)",
                              color: "var(--moss-700)",
                              border: "1px solid var(--moss-100)",
                            }}
                          >
                            {price}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions overlay */}
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      display: "flex",
                      gap: 4,
                    }}
                  >
                    <button
                      onClick={() => onDuplicate(item.id)}
                      disabled={isUploading}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        display: "grid",
                        placeItems: "center",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        color: "rgba(255,255,255,0.80)",
                        opacity: isUploading ? 0.5 : 1,
                      }}
                      aria-label={`Duplicate ${displayName}`}
                      title="Duplicate"
                    >
                      <Copy size={12} strokeWidth={2} />
                    </button>
                    <button
                      onClick={() => onRemove(item.id)}
                      disabled={isUploading}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        border: "none",
                        background: "rgba(0,0,0,0.55)",
                        backdropFilter: "blur(4px)",
                        display: "grid",
                        placeItems: "center",
                        cursor: isUploading ? "not-allowed" : "pointer",
                        color: "#fff",
                        opacity: isUploading ? 0.5 : 1,
                      }}
                      aria-label={`Remove ${displayName}`}
                    >
                      <Trash2 size={13} strokeWidth={2} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          padding: "16px 16px",
          paddingBottom: "calc(16px + env(safe-area-inset-bottom, 0px))",
          background: "var(--sr-bg-card)",
          borderTop: "1px solid var(--sr-border-subtle)",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {/* Optional sale title */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label
              htmlFor="sale-title-input"
              style={{
                fontSize: 11,
                fontFamily: "var(--sr-font-mono)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--sr-text-muted)",
              }}
            >
              Sale name <span style={{ color: "var(--cream-400)", textTransform: "none", letterSpacing: 0, fontFamily: "var(--sr-font-sans)" }}>(optional)</span>
            </label>
            {eventId && identifiedCount > 0 && (
              <button
                onClick={handleSuggestTitle}
                disabled={isSuggestingTitle || isUploading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 11,
                  fontFamily: "var(--sr-font-sans)",
                  fontWeight: 600,
                  color: isSuggestingTitle ? "var(--sr-text-muted)" : "var(--clay-600)",
                  background: "none",
                  border: "none",
                  cursor: isSuggestingTitle || isUploading ? "not-allowed" : "pointer",
                  padding: 0,
                }}
              >
                {isSuggestingTitle ? (
                  <Loader2 size={10} strokeWidth={2} className="animate-spin" />
                ) : (
                  <Wand2 size={10} strokeWidth={2} />
                )}
                Suggest
              </button>
            )}
          </div>
          <input
            id="sale-title-input"
            type="text"
            value={saleTitle}
            onChange={(e) => onSaleTitleChange(e.target.value)}
            placeholder="e.g. Newtown 3BR Moving Sale"
            disabled={isUploading}
            style={{
              width: "100%",
              height: 42,
              padding: "0 12px",
              borderRadius: "var(--sr-radius-md)",
              border: "1px solid var(--sr-border-subtle)",
              background: "var(--sr-bg-app)",
              fontSize: 13,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
              outline: "none",
              boxSizing: "border-box",
              opacity: isUploading ? 0.5 : 1,
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "var(--clay-400)"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "var(--sr-border-subtle)"; }}
          />
        </div>

        {uploadError && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-100)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--rust-600)",
              lineHeight: 1.45,
            }}
          >
            {uploadError}
          </div>
        )}

        {!isOnline && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-100)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--rust-600)",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <WifiOff size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
            Connect to network to upload your sale.
          </div>
        )}

        {loadingCount > 0 && !isUploading && (
          <div
            style={{
              padding: "10px 14px",
              background: "rgba(181,96,74,0.10)",
              border: "1px solid rgba(181,96,74,0.25)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--clay-600)",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Loader2 size={14} strokeWidth={2} className="animate-spin" style={{ flexShrink: 0 }} />
            {loadingCount} item{loadingCount !== 1 ? "s" : ""} still being identified…
          </div>
        )}

        {networkErrorCount > 0 && !isUploading && !showNetworkConfirm && (
          <div
            style={{
              padding: "10px 14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-100)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--rust-600)",
              lineHeight: 1.45,
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <WifiOff size={14} strokeWidth={2} style={{ flexShrink: 0 }} />
            {networkErrorCount} item{networkErrorCount !== 1 ? "s" : ""} had network errors — they&apos;ll upload on create.
          </div>
        )}

        {showNetworkConfirm && (
          <div
            style={{
              padding: "14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-200)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: 13,
              color: "var(--rust-700)",
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 8 }}>
              {networkErrorCount} item{networkErrorCount !== 1 ? "s" : ""} couldn&apos;t upload
            </div>
            <div style={{ marginBottom: 12, color: "var(--rust-600)" }}>
              Create sale without them, or go back to retry the upload.
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => { setShowNetworkConfirm(false); onProcess(); }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--sr-radius-md)",
                  border: "none",
                  background: "var(--rust-600)",
                  color: "#fff",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "var(--sr-font-sans)",
                  cursor: "pointer",
                }}
              >
                Create anyway
              </button>
              <button
                onClick={() => setShowNetworkConfirm(false)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "var(--sr-radius-md)",
                  border: "1px solid var(--rust-200)",
                  background: "transparent",
                  color: "var(--rust-600)",
                  fontSize: 13,
                  fontWeight: 500,
                  fontFamily: "var(--sr-font-sans)",
                  cursor: "pointer",
                }}
              >
                Go back
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleCreateSale}
          disabled={!canProcess}
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            minHeight: 52,
            padding: "14px 24px",
            borderRadius: "var(--sr-radius-lg)",
            border: "none",
            background: !canProcess ? "var(--clay-200)" : "var(--clay-600)",
            color: !canProcess ? "var(--clay-400)" : "#fff",
            fontSize: 16,
            fontWeight: 700,
            fontFamily: "var(--sr-font-sans)",
            cursor: !canProcess ? "not-allowed" : "pointer",
            letterSpacing: "-0.01em",
            transition: "background 120ms",
          }}
        >
          {isUploading ? (
            <>
              <Loader2 size={18} strokeWidth={2} className="animate-spin" />
              Creating sale…
            </>
          ) : (
            <>
              <PackageCheck size={18} strokeWidth={2} />
              Create Sale{items.length > 0 ? ` — ${items.length} item${items.length !== 1 ? "s" : ""}` : ""}
            </>
          )}
        </button>

        {!isUploading && (
          <button
            onClick={onBack}
            style={{
              width: "100%",
              minHeight: 44,
              padding: "10px 24px",
              borderRadius: "var(--sr-radius-lg)",
              border: "1px solid var(--sr-border-subtle)",
              background: "transparent",
              color: "var(--sr-text-secondary)",
              fontSize: 15,
              fontWeight: 500,
              fontFamily: "var(--sr-font-sans)",
              cursor: "pointer",
            }}
          >
            Back to capture
          </button>
        )}
      </div>
    </div>
  );
}
