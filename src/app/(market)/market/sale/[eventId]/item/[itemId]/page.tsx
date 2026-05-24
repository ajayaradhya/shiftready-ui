"use client";

import { Suspense, use, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronLeft,
  Package,
  Heart,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Lock,
} from "lucide-react";
import { getPublicItem, startConversation, saveItem, unsaveItem, setPin } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";

function fmt(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function ItemDetailContent({
  eventId,
  itemId,
}: {
  eventId: string;
  itemId: string;
}) {
  const searchParams = useSearchParams();
  const bundleId = searchParams.get("bundle") ?? "";
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [messaging, setMessaging] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  const {
    data: item,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["public-item", eventId, bundleId, itemId],
    queryFn: () => getPublicItem(eventId, bundleId, itemId),
    enabled: !!bundleId,
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    if (item && item.is_saved != null) setSaved(item.is_saved);
  }, [item?.is_saved]);

  const handleToggleSave = async () => {
    if (!user) {
      router.push(`/login?next=/market/sale/${eventId}/item/${itemId}?bundle=${bundleId}`);
      return;
    }
    const newSaved = !saved;
    setSaved(newSaved);
    setSavePending(true);
    try {
      if (newSaved) {
        await saveItem(eventId, bundleId, itemId);
      } else {
        await unsaveItem(eventId, bundleId, itemId);
      }
      qc.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSaved(!newSaved);
    } finally {
      setSavePending(false);
    }
  };

  const handleInterest = async () => {
    if (!user) {
      router.push(
        `/login?next=/market/sale/${eventId}/item/${itemId}?bundle=${bundleId}`
      );
      return;
    }
    if (!item?.seller_id) return;
    setMessaging(true);
    try {
      const res = await startConversation(item.seller_id, undefined, {
        saleEventId: eventId,
        bundleId: bundleId || null,
        itemId,
      });
      setPin(res.conversationId, {
        kind: "item",
        saleEventId: eventId,
        bundleId: bundleId || null,
        itemId,
      }).catch(() => {});
      router.push(`/market/messages/${res.conversationId}`);
    } finally {
      setMessaging(false);
    }
  };

  const discountPct =
    item?.original_price && item.price && item.original_price > item.price
      ? Math.round((1 - item.price / item.original_price) * 100)
      : null;

  return (
    <div style={{ padding: "32px 24px 80px", maxWidth: 900, margin: "0 auto" }}>
      <Link
        href={`/market/sale/${eventId}`}
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
        Back to sale
      </Link>

      {/* Missing bundle ID */}
      {!bundleId && (
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
              marginBottom: 12,
            }}
          >
            Item not accessible directly
          </p>
          <Link
            href={`/market/sale/${eventId}`}
            style={{
              fontSize: 13,
              color: "var(--clay-600)",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            ← Browse this sale
          </Link>
        </div>
      )}

      {/* Loading skeleton */}
      {isLoading && bundleId && (
        <div
          className="market-item-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            alignItems: "start",
          }}
        >
          <div
            style={{
              aspectRatio: "1",
              borderRadius: "var(--sr-radius-xl)",
              background: "var(--cream-100)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {[28, 20, 16, 40, 80].map((h, i) => (
              <div
                key={i}
                style={{
                  height: h,
                  borderRadius: "var(--sr-radius-md)",
                  background: "var(--cream-100)",
                  animation: "pulse 1.5s ease-in-out infinite",
                  width: i === 0 ? "70%" : "100%",
                }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Error */}
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
            Item not found
          </p>
          <Link
            href={`/market/sale/${eventId}`}
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
            Back to sale
          </Link>
        </div>
      )}

      {/* Item content */}
      {item && (
        <div
          className="market-item-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 36,
            alignItems: "start",
          }}
        >
          {/* Gallery */}
          <div>
            <div
              style={{
                aspectRatio: "1",
                borderRadius: "var(--sr-radius-xl)",
                overflow: "hidden",
                background: "var(--cream-100)",
                position: "relative",
              }}
            >
              {item.image_url ? (
                <Image
                  src={item.image_url}
                  alt={item.name ?? "Item"}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="(max-width: 640px) 100vw, 50vw"
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <Package size={48} color="var(--ink-300)" strokeWidth={1.5} />
                </div>
              )}
            </div>
          </div>

          {/* Details */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Brand + condition + year */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              {item.brand && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
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
                    letterSpacing: "0.12em",
                    fontWeight: 700,
                    color: "var(--clay-600)",
                    background: "var(--clay-50)",
                    padding: "3px 8px",
                    borderRadius: "var(--sr-radius-sm)",
                  }}
                >
                  {item.condition}
                </span>
              )}
              {item.year && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--ink-400)",
                    background: "var(--cream-100)",
                    padding: "3px 8px",
                    borderRadius: "var(--sr-radius-sm)",
                  }}
                >
                  {item.year}
                </span>
              )}
            </div>

            {/* Name */}
            <h1
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 28,
                fontWeight: 500,
                color: "var(--sr-text-primary)",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {item.name ?? "Item"}
            </h1>

            {/* Price */}
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: 10 }}
            >
              <span
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 32,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                }}
              >
                {item.price != null ? fmt(item.price) : "POA"}
              </span>
              {item.original_price != null && item.original_price > 0 && (
                <>
                  <span
                    style={{
                      fontFamily: "var(--sr-font-sans)",
                      fontSize: 14,
                      color: "var(--ink-400)",
                      textDecoration: "line-through",
                      marginBottom: 4,
                    }}
                  >
                    {fmt(item.original_price)}
                  </span>
                  {discountPct && discountPct > 0 && (
                    <span
                      style={{
                        fontFamily: "var(--sr-font-mono)",
                        fontSize: 10,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        fontWeight: 700,
                        color: "var(--moss-600)",
                        background: "var(--moss-50)",
                        padding: "3px 8px",
                        borderRadius: "var(--sr-radius-sm)",
                        marginBottom: 4,
                      }}
                    >
                      {discountPct}% off
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Trust pills */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  color: "var(--moss-700)",
                  background: "var(--moss-50)",
                  padding: "5px 10px",
                  borderRadius: "var(--sr-radius-full)",
                  border: "1px solid var(--moss-100)",
                }}
              >
                <ShieldCheck size={11} />
                Buyer protection
              </span>
              {item.suburb && (
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--ink-500)",
                    background: "var(--cream-100)",
                    padding: "5px 10px",
                    borderRadius: "var(--sr-radius-full)",
                    border: "1px solid var(--sr-border-subtle)",
                  }}
                >
                  <MapPin size={11} />
                  Pickup in {item.suburb}
                </span>
              )}
            </div>

            {/* Bundle context */}
            {item.bundle_name && (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: "var(--sr-radius-lg)",
                  background: "var(--sr-bg-paper)",
                  border: "1px solid var(--sr-border-subtle)",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    color: "var(--ink-400)",
                    marginBottom: 4,
                  }}
                >
                  Part of
                </p>
                <Link
                  href={`/market/sale/${eventId}`}
                  style={{
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--clay-600)",
                    textDecoration: "none",
                  }}
                >
                  {item.bundle_name} →
                </Link>
                <p
                  style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 2 }}
                >
                  Buy the full room bundle and save
                </p>
              </div>
            )}

            {/* AI Pricing Intelligence */}
            {user ? (
              item.pricing_reasoning ? (
                <div
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--sr-radius-lg)",
                    background: "var(--honey-50)",
                    border: "1px solid var(--honey-100)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "var(--honey-700)",
                      fontWeight: 700,
                      marginBottom: 6,
                    }}
                  >
                    AI Pricing Intelligence
                  </p>
                  <p
                    style={{ fontSize: 12, color: "var(--ink-600)", lineHeight: 1.5 }}
                  >
                    {item.pricing_reasoning}
                  </p>
                </div>
              ) : null
            ) : (
              <div
                style={{
                  padding: "14px 16px",
                  borderRadius: "var(--sr-radius-lg)",
                  background: "var(--cream-100)",
                  border: "1px solid var(--sr-border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Lock
                  size={14}
                  color="var(--ink-400)"
                  style={{ flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 9,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "var(--ink-400)",
                      fontWeight: 700,
                      marginBottom: 3,
                    }}
                  >
                    AI Pricing Intelligence
                  </p>
                  <p style={{ fontSize: 11, color: "var(--ink-400)" }}>
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
                    to see market analysis
                  </p>
                </div>
              </div>
            )}

            {/* CTAs */}
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={handleInterest}
                disabled={messaging}
                style={{
                  flex: 1,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "13px 16px",
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
                {messaging ? "Opening…" : "Express Interest"}
              </button>
              <button
                onClick={handleToggleSave}
                disabled={savePending}
                aria-label={saved ? "Saved" : "Save item"}
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: "var(--sr-radius-lg)",
                  background: saved ? "var(--clay-50)" : "var(--sr-bg-paper)",
                  border: `1px solid ${
                    saved ? "var(--clay-200)" : "var(--sr-border-subtle)"
                  }`,
                  display: "grid",
                  placeItems: "center",
                  cursor: savePending ? "default" : "pointer",
                  opacity: savePending ? 0.6 : 1,
                  transition: "all 140ms",
                  flexShrink: 0,
                }}
              >
                <Heart
                  size={18}
                  color={saved ? "var(--clay-500)" : "var(--ink-400)"}
                  fill={saved ? "var(--clay-500)" : "none"}
                  strokeWidth={1.5}
                />
              </button>
            </div>

            {/* Seller strip */}
            <div
              style={{
                paddingTop: 16,
                borderTop: "1px solid var(--sr-border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Link
                href={`/market/sale/${eventId}`}
                style={{
                  fontSize: 12,
                  color: "var(--clay-600)",
                  textDecoration: "none",
                  fontFamily: "var(--sr-font-sans)",
                  fontWeight: 500,
                }}
              >
                ← View full sale
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media (max-width: 640px) {
          .market-item-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

export default function ItemDetailPage({
  params,
}: {
  params: Promise<{ eventId: string; itemId: string }>;
}) {
  const { eventId, itemId } = use(params);

  return (
    <Suspense
      fallback={
        <div
          style={{ padding: "32px 24px", maxWidth: 900, margin: "0 auto" }}
        >
          <div
            style={{
              height: 400,
              borderRadius: "var(--sr-radius-xl)",
              background: "var(--cream-100)",
              animation: "pulse 1.5s ease-in-out infinite",
            }}
          />
        </div>
      }
    >
      <ItemDetailContent eventId={eventId} itemId={itemId} />
    </Suspense>
  );
}
