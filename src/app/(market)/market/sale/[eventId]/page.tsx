"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  MapPin,
  Calendar,
  Package,
  MessageSquare,
  Percent,
  ChevronDown,
  ChevronUp,
  Heart,
} from "lucide-react";
import { getPublicSale, startConversation, saveSale, unsaveSale, setPin } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { PublicBundle } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function daysAgo(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const days = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (days === 0) return "Listed today";
  if (days === 1) return "Listed 1 day ago";
  return `Listed ${days} days ago`;
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function roomEmoji(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("kitchen")) return "🍳";
  if (n.includes("bed") || n.includes("master")) return "🛏️";
  if (n.includes("bath")) return "🚿";
  if (n.includes("living") || n.includes("lounge")) return "🛋️";
  if (n.includes("office") || n.includes("study")) return "💻";
  if (n.includes("outdoor") || n.includes("garden")) return "🌿";
  if (n.includes("garage")) return "🚗";
  if (n.includes("dining")) return "🍽️";
  return "📦";
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        padding: "14px 16px",
        background: "var(--sr-bg-card)",
        borderRadius: "var(--sr-radius-lg)",
        border: "1px solid var(--sr-border-subtle)",
        textAlign: "center",
      }}
    >
      <div
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: 22,
          fontWeight: 500,
          color: "var(--sr-text-primary)",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 9,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          color: "var(--ink-400)",
          marginTop: 4,
        }}
      >
        {label}
      </div>
    </div>
  );
}

function BundleCard({ bundle, eventId }: { bundle: PublicBundle; eventId: string }) {
  const [expanded, setExpanded] = useState(true);
  const savings = bundle.itemTotal - bundle.bundlePrice;
  const hasDeal = savings > 0 && bundle.itemTotal > 0;

  return (
    <div
      style={{
        borderRadius: "var(--sr-radius-xl)",
        border: "1px solid var(--sr-border-subtle)",
        background: "var(--sr-bg-card)",
        overflow: "hidden",
      }}
    >
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "var(--sr-bg-paper)",
          border: "none",
          borderBottom: expanded ? "1px solid var(--sr-border-subtle)" : "none",
          cursor: "pointer",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: 18 }}>{roomEmoji(bundle.name ?? "")}</span>
        <span
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            fontWeight: 700,
            color: "var(--sr-text-primary)",
            flex: 1,
          }}
        >
          {bundle.name ?? "Bundle"}
        </span>
        <span
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.12em",
            color: "var(--ink-400)",
          }}
        >
          {bundle.items.length} {bundle.items.length === 1 ? "item" : "items"}
        </span>
        {hasDeal && (
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              background: "var(--moss-50)",
              color: "var(--moss-600)",
              padding: "3px 8px",
              borderRadius: "var(--sr-radius-full)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 700,
            }}
          >
            <Percent size={8} />
            Bundle deal
          </span>
        )}
        {expanded ? (
          <ChevronUp size={14} color="var(--ink-400)" />
        ) : (
          <ChevronDown size={14} color="var(--ink-400)" />
        )}
      </button>

      {expanded && (
        <div>
          {bundle.items.map((item) => (
            <Link
              key={item.id}
              href={`/market/sale/${eventId}/item/${item.id}?bundle=${bundle.id}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: "12px 20px",
                borderBottom: "1px solid var(--sr-border-subtle)",
                textDecoration: "none",
                background: "transparent",
                transition: "background 120ms",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "var(--cream-50)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {item.image_url ? (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--sr-radius-md)",
                    overflow: "hidden",
                    flexShrink: 0,
                    background: "var(--cream-100)",
                    position: "relative",
                  }}
                >
                  <Image
                    src={item.image_url}
                    alt={item.name ?? "Item"}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="44px"
                  />
                </div>
              ) : (
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "var(--sr-radius-md)",
                    background: "var(--cream-100)",
                    flexShrink: 0,
                  }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: "var(--sr-font-serif)",
                    fontSize: 14,
                    color: "var(--sr-text-primary)",
                    fontWeight: 500,
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {item.name ?? "Item"}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 3,
                    flexWrap: "wrap",
                  }}
                >
                  {item.brand && (
                    <span
                      style={{
                        fontFamily: "var(--sr-font-mono)",
                        fontSize: 10,
                        color: "var(--ink-400)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
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
                        color: "var(--clay-600)",
                        background: "var(--clay-50)",
                        padding: "1px 6px",
                        borderRadius: "var(--sr-radius-sm)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        fontWeight: 700,
                      }}
                    >
                      {item.condition}
                    </span>
                  )}
                </div>
              </div>
              <span
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                  flexShrink: 0,
                }}
              >
                {item.price > 0 ? fmt(item.price) : "POA"}
              </span>
            </Link>
          ))}

          <div
            style={{
              padding: "14px 20px",
              background: "var(--sr-bg-paper)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 16,
            }}
          >
            {hasDeal ? (
              <>
                <div>
                  <div
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--ink-400)",
                    }}
                  >
                    Individual total
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--sr-font-sans)",
                      fontSize: 13,
                      color: "var(--ink-400)",
                      textDecoration: "line-through",
                    }}
                  >
                    {fmt(bundle.itemTotal)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "var(--moss-600)",
                      fontWeight: 700,
                    }}
                  >
                    Bundle deal - save {fmt(savings)}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--sr-font-serif)",
                      fontSize: 20,
                      fontWeight: 600,
                      color: "var(--moss-600)",
                    }}
                  >
                    {fmt(bundle.bundlePrice)}
                  </div>
                </div>
              </>
            ) : (
              <>
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--ink-400)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "var(--sr-font-serif)",
                    fontSize: 20,
                    fontWeight: 600,
                    color: "var(--sr-text-primary)",
                  }}
                >
                  {fmt(bundle.itemTotal)}
                </span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [messaging, setMessaging] = useState(false);
  const [saved, setSaved] = useState<boolean | null>(null);
  const [savePending, setSavePending] = useState(false);

  const {
    data: sale,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-sale", eventId],
    queryFn: () => getPublicSale(eventId),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (sale && sale.is_saved != null) setSaved(sale.is_saved);
  }, [sale?.is_saved]);

  const handleToggleSave = async () => {
    if (!user) {
      router.push(`/login?next=/market/sale/${eventId}`);
      return;
    }
    const newSaved = !saved;
    setSaved(newSaved);
    setSavePending(true);
    try {
      if (newSaved) {
        await saveSale(eventId);
      } else {
        await unsaveSale(eventId);
      }
      qc.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSaved(!newSaved);
    } finally {
      setSavePending(false);
    }
  };

  const handleContact = async () => {
    if (!user) {
      router.push(`/login?next=/market/sale/${eventId}`);
      return;
    }
    if (!sale?.sellerId) return;
    setMessaging(true);
    try {
      const res = await startConversation(sale.sellerId, undefined, {
        saleEventId: eventId,
      });
      setPin(res.conversationId, { kind: "sale", saleEventId: eventId }).catch(() => {});
      router.push(`/market/messages/${res.conversationId}`);
    } finally {
      setMessaging(false);
    }
  };

  const totalItems =
    sale?.bundles.reduce((s, b) => s + b.items.length, 0) ?? 0;
  const totalValue =
    sale?.bundles.reduce((s, b) => s + b.itemTotal, 0) ?? 0;
  const rooms = sale?.bundles.length ?? 0;
  const daysLeft = daysUntil(sale?.moveOutDate ?? null);
  const urgencyColor =
    daysLeft == null
      ? "var(--ink-400)"
      : daysLeft <= 7
      ? "#C0392B"
      : daysLeft <= 14
      ? "#D35400"
      : "var(--moss-600)";
  const hasBundleDeals =
    sale?.bundles.some((b) => b.bundlePrice < b.itemTotal && b.itemTotal > 0) ??
    false;
  const isSeller = user?.uid === sale?.sellerId;

  return (
    <div style={{ padding: "32px 24px 80px", maxWidth: 1100, margin: "0 auto" }}>
      <Link
        href="/market"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.14em",
          fontWeight: 700,
          color: "var(--ink-400)",
          textDecoration: "none",
          marginBottom: 28,
        }}
      >
        <ChevronLeft size={13} />
        Browse
      </Link>

      {isLoading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {[240, 180, 160].map((h, i) => (
            <div
              key={i}
              style={{
                height: h,
                borderRadius: "var(--sr-radius-xl)",
                background: "var(--cream-100)",
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      )}

      {error && (
        <div style={{ textAlign: "center", padding: "80px 32px" }}>
          <Package
            size={40}
            style={{ margin: "0 auto 16px", color: "var(--ink-300)" }}
            strokeWidth={1.5}
          />
          <p
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--ink-400)",
              marginBottom: 8,
            }}
          >
            Sale not found
          </p>
          <p style={{ fontSize: 13, color: "var(--ink-300)", marginBottom: 20 }}>
            This sale may have ended or been removed.
          </p>
          <Link
            href="/market"
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--clay-600)",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Browse all sales →
          </Link>
        </div>
      )}

      {sale && (
        <>
          {/* Hero */}
          <div style={{ marginBottom: 24 }}>
            {/* Cover image */}
            {sale.cover_image_url && (
              <div
                style={{
                  width: "100%",
                  height: 220,
                  borderRadius: "var(--sr-radius-xl)",
                  overflow: "hidden",
                  marginBottom: 20,
                  background: "var(--cream-100)",
                }}
              >
                <Image
                  src={sale.cover_image_url}
                  alt="Sale cover"
                  width={900}
                  height={220}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  unoptimized
                />
              </div>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                  fontWeight: 700,
                  color: "#fff",
                  background: "var(--moss-500)",
                  padding: "3px 9px",
                  borderRadius: "var(--sr-radius-full)",
                }}
              >
                <span
                  style={{
                    width: 5,
                    height: 5,
                    borderRadius: "50%",
                    background: "#fff",
                    display: "inline-block",
                  }}
                />
                Live
              </span>
              {sale.publishedAt && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--ink-400)",
                  }}
                >
                  {daysAgo(sale.publishedAt)}
                </span>
              )}
              <button
                onClick={handleToggleSave}
                disabled={savePending}
                aria-label={saved ? "Unsave sale" : "Save sale"}
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "5px 12px",
                  borderRadius: "var(--sr-radius-full)",
                  border: `1px solid ${saved ? "var(--clay-200)" : "var(--sr-border-subtle)"}`,
                  background: saved ? "var(--clay-50)" : "var(--sr-bg-card)",
                  cursor: savePending ? "default" : "pointer",
                  opacity: savePending ? 0.6 : 1,
                  transition: "all 140ms",
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  fontWeight: 700,
                  color: saved ? "var(--clay-600)" : "var(--ink-400)",
                }}
              >
                <Heart
                  size={11}
                  fill={saved ? "var(--clay-500)" : "none"}
                  color={saved ? "var(--clay-500)" : "var(--ink-400)"}
                  strokeWidth={1.5}
                />
                {saved ? "Saved" : "Save"}
              </button>
            </div>
            <h1
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 32,
                fontWeight: 500,
                color: "var(--sr-text-primary)",
                margin: "0 0 10px",
              }}
            >
              {sale.title || (sale.suburb ? `${sale.suburb} Moving Sale` : "Moving Sale")}
            </h1>
            {sale.description && (
              <p
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 14,
                  color: "var(--ink-500)",
                  lineHeight: 1.6,
                  margin: "0 0 12px",
                  maxWidth: 640,
                }}
              >
                {sale.description}
              </p>
            )}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: 16,
                fontFamily: "var(--sr-font-sans)",
                fontSize: 13,
                color: "var(--ink-500)",
              }}
            >
              {(sale.suburb || sale.state) && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={13} color="var(--clay-500)" />
                  {[sale.suburb, sale.state].filter(Boolean).join(", ")}
                </span>
              )}
              {sale.moveOutDate && (
                <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={13} color="var(--clay-500)" />
                  Moving out by{" "}
                  {new Date(sale.moveOutDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Stats bar */}
          <div
            style={{
              display: "flex",
              gap: 10,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <StatBox label="Items" value={String(totalItems)} />
            <StatBox
              label="Est. value"
              value={totalValue > 0 ? fmt(totalValue) : "-"}
            />
            <StatBox label="Rooms" value={String(rooms)} />
            <StatBox
              label="Days to move"
              value={
                daysLeft != null
                  ? daysLeft <= 0
                    ? "Today!"
                    : `${daysLeft}d`
                  : "-"
              }
            />
          </div>

          {/* Bundle deals banner */}
          {hasBundleDeals && (
            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                padding: "14px 18px",
                borderRadius: "var(--sr-radius-lg)",
                background: "var(--moss-50)",
                border: "1px solid var(--moss-100)",
                marginBottom: 24,
              }}
            >
              <Percent
                size={15}
                color="var(--moss-600)"
                style={{ flexShrink: 0, marginTop: 1 }}
              />
              <div>
                <p
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    fontWeight: 700,
                    color: "var(--moss-600)",
                    marginBottom: 4,
                  }}
                >
                  Bundle deals available
                </p>
                <p style={{ fontSize: 13, color: "var(--ink-500)" }}>
                  Buy all items in a room bundle and save up to 20%. Perfect for
                  furnishing a whole room.
                </p>
              </div>
            </div>
          )}

          {/* 2-col layout */}
          <div
            className="market-sale-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 300px",
              gap: 24,
              alignItems: "start",
            }}
          >
            {/* Left: bundles */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {sale.bundles.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "64px 32px",
                    borderRadius: "var(--sr-radius-xl)",
                    background: "var(--sr-bg-card)",
                    border: "1px solid var(--sr-border-subtle)",
                  }}
                >
                  <Package
                    size={36}
                    style={{ margin: "0 auto 12px", color: "var(--ink-300)" }}
                    strokeWidth={1.5}
                  />
                  <p
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "var(--ink-400)",
                    }}
                  >
                    No items listed yet
                  </p>
                </div>
              ) : (
                sale.bundles.map((bundle) => (
                  <BundleCard key={bundle.id} bundle={bundle} eventId={eventId} />
                ))
              )}
            </div>

            {/* Right: sticky sidebar */}
            <div
              style={{
                position: "sticky",
                top: 80,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Seller card */}
              <div
                style={{
                  borderRadius: "var(--sr-radius-xl)",
                  border: "1px solid var(--sr-border-subtle)",
                  background: "var(--sr-bg-card)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    padding: "16px 18px",
                    borderBottom: "1px solid var(--sr-border-subtle)",
                    background: "var(--sr-bg-paper)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "var(--ink-400)",
                      marginBottom: 12,
                    }}
                  >
                    Seller
                  </p>
                  <div
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--sr-radius-full)",
                        background: "var(--clay-100)",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--sr-font-mono)",
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--clay-600)",
                        }}
                      >
                        {(sale.sellerUsername ?? "?")
                          .slice(0, 1)
                          .toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p
                        style={{
                          fontFamily: "var(--sr-font-sans)",
                          fontSize: 14,
                          fontWeight: 600,
                          color: "var(--sr-text-primary)",
                        }}
                      >
                        @{sale.sellerUsername ?? "seller"}
                      </p>
                      <p
                        style={{
                          fontFamily: "var(--sr-font-mono)",
                          fontSize: 9,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          color: "var(--moss-600)",
                          marginTop: 2,
                        }}
                      >
                        ✓ Verified seller
                      </p>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "14px 18px" }}>
                  {!isSeller && (
                    <button
                      onClick={handleContact}
                      disabled={messaging}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 8,
                        padding: "11px 16px",
                        borderRadius: "var(--sr-radius-lg)",
                        background: "var(--clay-500)",
                        color: "#fff",
                        fontFamily: "var(--sr-font-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        border: "none",
                        cursor: messaging ? "default" : "pointer",
                        opacity: messaging ? 0.7 : 1,
                        transition: "opacity 140ms, background 140ms",
                      }}
                      onMouseEnter={(e) => {
                        if (!messaging)
                          e.currentTarget.style.background = "var(--clay-600)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--clay-500)";
                      }}
                    >
                      <MessageSquare size={15} strokeWidth={1.5} />
                      {messaging
                        ? "Opening…"
                        : `Message @${sale.sellerUsername ?? "seller"}`}
                    </button>
                  )}
                  {!user && (
                    <p
                      style={{
                        fontSize: 11,
                        color: "var(--ink-400)",
                        textAlign: "center",
                        marginTop: 8,
                        fontFamily: "var(--sr-font-sans)",
                      }}
                    >
                      <Link
                        href="/login"
                        style={{
                          color: "var(--clay-600)",
                          fontWeight: 600,
                          textDecoration: "none",
                        }}
                      >
                        Sign in
                      </Link>{" "}
                      to message the seller
                    </p>
                  )}
                </div>
              </div>

              {/* Sale overview card */}
              <div
                style={{
                  borderRadius: "var(--sr-radius-xl)",
                  border: "1px solid var(--sr-border-subtle)",
                  background: "var(--sr-bg-card)",
                  padding: "16px 18px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "var(--ink-400)",
                    marginBottom: 14,
                  }}
                >
                  Sale overview
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {[
                    { label: "Items", value: String(totalItems) },
                    {
                      label: "Value",
                      value: totalValue > 0 ? fmt(totalValue) : "-",
                    },
                    { label: "Rooms", value: String(rooms) },
                    {
                      label: "Days left",
                      value:
                        daysLeft != null
                          ? daysLeft <= 0
                            ? "Today"
                            : `${daysLeft}d`
                          : "-",
                    },
                  ].map(({ label, value }) => (
                    <div
                      key={label}
                      style={{
                        padding: "10px 12px",
                        background: "var(--sr-bg-paper)",
                        borderRadius: "var(--sr-radius-md)",
                      }}
                    >
                      <div
                        style={{
                          fontFamily: "var(--sr-font-serif)",
                          fontSize: 18,
                          fontWeight: 500,
                          color: "var(--sr-text-primary)",
                        }}
                      >
                        {value}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--sr-font-mono)",
                          fontSize: 9,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "var(--ink-400)",
                          marginTop: 2,
                        }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>

                {daysLeft != null && (
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        marginBottom: 6,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "var(--sr-font-mono)",
                          fontSize: 9,
                          textTransform: "uppercase",
                          letterSpacing: "0.12em",
                          color: "var(--ink-400)",
                        }}
                      >
                        Urgency
                      </span>
                      <span
                        style={{
                          fontFamily: "var(--sr-font-mono)",
                          fontSize: 9,
                          fontWeight: 700,
                          color: urgencyColor,
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {daysLeft <= 0
                          ? "Moving today!"
                          : daysLeft <= 7
                          ? "Very urgent"
                          : daysLeft <= 14
                          ? "Urgent"
                          : "Relaxed"}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: "var(--sr-radius-full)",
                        background: "var(--cream-200)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.max(5, Math.min(100, 100 - (daysLeft / 30) * 100))}%`,
                          background: urgencyColor,
                          borderRadius: "var(--sr-radius-full)",
                          transition: "width 600ms ease",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        @media (max-width: 768px) {
          .market-sale-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
