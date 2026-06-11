"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Heart, LogIn, ChevronRight, Package, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSaved, useInvalidateSaved } from "@/hooks/use-saved";
import { unsaveSale, unsaveItem } from "@myrio/api";
import type { SavedSale, SavedItem } from "@myrio/types";

function fmt(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function daysLeft(moveOutDate: string | null): number | null {
  if (!moveOutDate) return null;
  return Math.ceil((new Date(moveOutDate).getTime() - Date.now()) / 86400000);
}

function SaleSkeleton() {
  return (
    <div
      style={{
        height: 72,
        borderRadius: "var(--sr-radius-lg)",
        background: "var(--cream-100)",
        animation: "pulse 1.5s ease-in-out infinite",
      }}
    />
  );
}

function SavedSaleRow({ sale, onRemove }: { sale: SavedSale; onRemove: () => void }) {
  const days = daysLeft(sale.moveOutDate);
  const urgencyColor =
    days == null
      ? "var(--ink-400)"
      : days <= 7
      ? "#C0392B"
      : days <= 14
      ? "#D35400"
      : "var(--moss-600)";

  return (
    <Link
      href={`/market/sale/${sale.eventId}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 18px",
        borderRadius: "var(--sr-radius-lg)",
        background: "var(--sr-bg-card)",
        border: "1px solid var(--sr-border-subtle)",
        textDecoration: "none",
        transition: "border-color 120ms",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--clay-200)")}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--sr-border-subtle)")}
    >
      {/* Pulsing live dot */}
      <div style={{ position: "relative", width: 10, height: 10, flexShrink: 0 }}>
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--moss-500)",
            position: "absolute",
          }}
        />
        <div
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--moss-400)",
            position: "absolute",
            animation: "ping 1.5s ease-in-out infinite",
            opacity: 0.6,
          }}
        />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 15,
            fontWeight: 500,
            color: "var(--sr-text-primary)",
            marginBottom: 3,
          }}
        >
          {sale.suburb ? `${sale.suburb} Moving Sale` : "Moving Sale"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          {(sale.suburb || sale.state) && (
            <span
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--ink-400)",
              }}
            >
              {[sale.suburb, sale.state].filter(Boolean).join(", ")}
            </span>
          )}
          {days != null && (
            <span
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                fontWeight: 700,
                color: urgencyColor,
              }}
            >
              {days <= 0 ? "Moving today" : `${days}d left`}
            </span>
          )}
        </div>
      </div>

      {/* Remove heart */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onRemove();
        }}
        aria-label="Remove from saved"
        style={{
          width: 32,
          height: 32,
          borderRadius: "var(--sr-radius-md)",
          border: "none",
          background: "transparent",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "var(--ink-300)",
          flexShrink: 0,
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--clay-500)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-300)")}
      >
        <X size={14} strokeWidth={2} />
      </button>

      <ChevronRight size={14} color="var(--ink-300)" style={{ flexShrink: 0 }} />
    </Link>
  );
}

function SavedItemCard({
  item,
  onRemove,
}: {
  item: SavedItem;
  onRemove: () => void;
}) {
  return (
    <div
      style={{
        borderRadius: "var(--sr-radius-lg)",
        border: "1px solid var(--sr-border-subtle)",
        background: "var(--sr-bg-card)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Remove button */}
      <button
        onClick={onRemove}
        aria-label="Remove from saved"
        style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 28,
          height: 28,
          borderRadius: "var(--sr-radius-full)",
          border: "none",
          background: "rgba(255,255,255,0.9)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          zIndex: 1,
          color: "var(--ink-400)",
          transition: "color 120ms",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = "var(--clay-500)")}
        onMouseLeave={(e) => (e.currentTarget.style.color = "var(--ink-400)")}
      >
        <X size={13} strokeWidth={2} />
      </button>

      {/* Image */}
      <Link
        href={
          item.eventId && item.bundleId
            ? `/market/sale/${item.eventId}/item/${item.itemId}?bundle=${item.bundleId}`
            : "#"
        }
        style={{ textDecoration: "none", display: "block" }}
      >
        <div
          style={{
            aspectRatio: "1",
            background: "var(--cream-100)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {item.image_url ? (
            <Image
              src={item.image_url}
              alt={item.name ?? "Item"}
              fill
              style={{ objectFit: "cover" }}
              sizes="(max-width: 640px) 50vw, 200px"
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
              <Package size={28} color="var(--ink-300)" strokeWidth={1.5} />
            </div>
          )}
        </div>

        <div style={{ padding: "12px 14px" }}>
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--sr-text-primary)",
              marginBottom: 4,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {item.name ?? "Item"}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            {item.brand && (
              <span
                style={{
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--ink-400)",
                }}
              >
                {item.brand}
              </span>
            )}
            {item.condition && (
              <span
                style={{
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontWeight: 700,
                  color: "var(--clay-600)",
                  background: "var(--clay-50)",
                  padding: "1px 5px",
                  borderRadius: "var(--sr-radius-sm)",
                }}
              >
                {item.condition}
              </span>
            )}
          </div>
          {item.suburb && (
            <p
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--ink-300)",
                marginBottom: 6,
              }}
            >
              {item.suburb}
            </p>
          )}
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 16,
              fontWeight: 600,
              color: "var(--sr-text-primary)",
            }}
          >
            {item.price != null && item.price > 0 ? fmt(item.price) : "POA"}
          </p>
        </div>
      </Link>
    </div>
  );
}

export default function SavedPage() {
  const { user, loading: authLoading } = useAuth();
  const { data, isLoading, refetch } = useSaved();
  const invalidateSaved = useInvalidateSaved();
  const [removing, setRemoving] = useState<Set<string>>(new Set());
  useEffect(() => { document.title = "Saved - Myrio"; }, []);

  const handleRemoveSale = async (eventId: string) => {
    setRemoving((s) => new Set(s).add(eventId));
    try {
      await unsaveSale(eventId);
      await invalidateSaved();
    } finally {
      setRemoving((s) => {
        const next = new Set(s);
        next.delete(eventId);
        return next;
      });
    }
  };

  const handleRemoveItem = async (itemId: string, eventId: string, bundleId: string) => {
    const key = `item-${itemId}`;
    setRemoving((s) => new Set(s).add(key));
    try {
      await unsaveItem(eventId, bundleId, itemId);
      await invalidateSaved();
    } finally {
      setRemoving((s) => {
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    }
  };

  if (authLoading) {
    return (
      <div
        style={{
          height: "calc(100dvh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          height: "calc(100dvh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-50)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <Heart size={24} color="var(--clay-500)" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--sr-text-primary)",
              marginBottom: 8,
            }}
          >
            Sign in to view saved items
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 300 }}>
            Heart sales and items to save them here for later.
          </p>
        </div>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-500)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--sr-font-sans)",
            textDecoration: "none",
          }}
        >
          <LogIn size={15} strokeWidth={1.5} />
          Sign in
        </Link>
      </div>
    );
  }

  const savedSales = data?.saved_sales ?? [];
  const savedItems = data?.saved_items ?? [];
  const totalSaved = savedSales.length + savedItems.length;

  return (
    <div style={{ padding: "40px 32px 80px", maxWidth: 880, margin: "0 auto" }}>
      <div style={{ marginBottom: 36 }}>
        <h1
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 26,
            fontWeight: 500,
            color: "var(--sr-text-primary)",
            marginBottom: 4,
          }}
        >
          Saved
        </h1>
        <p style={{ fontSize: 13, color: "var(--ink-400)" }}>
          {totalSaved > 0
            ? `${totalSaved} saved ${totalSaved === 1 ? "item" : "items"}`
            : "Your watchlisted sales and saved items."}
        </p>
      </div>

      {/* Watchlisted Sales */}
      <section style={{ marginBottom: 44 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              color: "var(--sr-text-primary)",
              margin: 0,
            }}
          >
            Watchlisted Sales
          </h2>
          {savedSales.length > 0 && (
            <span
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--clay-600)",
                background: "var(--clay-50)",
                padding: "2px 7px",
                borderRadius: "var(--sr-radius-full)",
              }}
            >
              {savedSales.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <SaleSkeleton />
            <SaleSkeleton />
          </div>
        ) : savedSales.length === 0 ? (
          <div
            style={{
              padding: "40px 24px",
              borderRadius: "var(--sr-radius-xl)",
              background: "var(--sr-bg-card)",
              border: "1px solid var(--sr-border-subtle)",
              textAlign: "center",
            }}
          >
            <Heart
              size={28}
              color="var(--ink-200)"
              strokeWidth={1.5}
              style={{ margin: "0 auto 10px" }}
            />
            <p style={{ fontSize: 13, color: "var(--ink-400)" }}>
              No watchlisted sales yet.{" "}
              <Link
                href="/market"
                style={{ color: "var(--clay-600)", fontWeight: 600, textDecoration: "none" }}
              >
                Browse sales →
              </Link>
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {savedSales
              .filter((s) => !removing.has(s.eventId))
              .map((sale) => (
                <SavedSaleRow
                  key={sale.eventId}
                  sale={sale}
                  onRemove={() => handleRemoveSale(sale.eventId)}
                />
              ))}
          </div>
        )}
      </section>

      {/* Saved Items */}
      <section>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              fontWeight: 700,
              color: "var(--sr-text-primary)",
              margin: 0,
            }}
          >
            Saved Items
          </h2>
          {savedItems.length > 0 && (
            <span
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                fontWeight: 700,
                color: "var(--clay-600)",
                background: "var(--clay-50)",
                padding: "2px 7px",
                borderRadius: "var(--sr-radius-full)",
              }}
            >
              {savedItems.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 14,
            }}
          >
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                style={{
                  borderRadius: "var(--sr-radius-lg)",
                  background: "var(--cream-100)",
                  aspectRatio: "0.75",
                  animation: "pulse 1.5s ease-in-out infinite",
                }}
              />
            ))}
          </div>
        ) : savedItems.length === 0 ? (
          <div
            style={{
              padding: "40px 24px",
              borderRadius: "var(--sr-radius-xl)",
              background: "var(--sr-bg-card)",
              border: "1px solid var(--sr-border-subtle)",
              textAlign: "center",
            }}
          >
            <Package
              size={28}
              color="var(--ink-200)"
              strokeWidth={1.5}
              style={{ margin: "0 auto 10px" }}
            />
            <p style={{ fontSize: 13, color: "var(--ink-400)" }}>
              No saved items yet. Heart an item on any sale page.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
              gap: 14,
            }}
          >
            {savedItems
              .filter((item) => !removing.has(`item-${item.itemId}`))
              .map((item) => (
                <SavedItemCard
                  key={item.itemId}
                  item={item}
                  onRemove={() =>
                    handleRemoveItem(
                      item.itemId,
                      item.eventId ?? "",
                      item.bundleId ?? ""
                    )
                  }
                />
              ))}
          </div>
        )}
      </section>

      <style>{`
        @keyframes ping {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.8); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
