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
  AlertTriangle,
  Ruler,
  Layers,
  Wrench,
  AlertCircle,
  Clock,
} from "lucide-react";
import { getPublicItem, getPublicSale, startConversation, saveItem, unsaveItem, setPin } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import type { PublicItemImage } from "@/lib/types";

function fmt(n: number) {
  return n.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function daysUntil(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - now.getTime()) / 86_400_000);
}

function Gallery({ images, name }: { images: PublicItemImage[]; name: string | null }) {
  const validImages = images.filter((img) => img.url);
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset if images change
  useEffect(() => setActiveIdx(0), [images]);

  const active = validImages[activeIdx] ?? null;

  return (
    <div>
      {/* Main image */}
      <div
        style={{
          aspectRatio: "1",
          borderRadius: "var(--sr-radius-xl)",
          overflow: "hidden",
          background: "var(--cream-100)",
          position: "relative",
        }}
      >
        {active?.url ? (
          <Image
            src={active.url}
            alt={name ?? "Item"}
            fill
            style={{ objectFit: "cover" }}
            sizes="(max-width: 640px) 100vw, 50vw"
            priority
          />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "grid", placeItems: "center" }}>
            <Package size={48} color="var(--ink-300)" strokeWidth={1.5} />
          </div>
        )}

        {/* Image count badge */}
        {validImages.length > 1 && (
          <span
            style={{
              position: "absolute",
              bottom: 10,
              right: 10,
              fontFamily: "var(--sr-font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontWeight: 700,
              color: "#fff",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(6px)",
              padding: "3px 8px",
              borderRadius: "var(--sr-radius-sm)",
            }}
          >
            {activeIdx + 1} / {validImages.length}
          </span>
        )}
      </div>

      {/* Thumbnail strip */}
      {validImages.length > 1 && (
        <div
          style={{
            display: "flex",
            gap: 8,
            marginTop: 10,
            overflowX: "auto",
            paddingBottom: 2,
          }}
        >
          {validImages.map((img, i) => (
            <button
              key={i}
              onClick={() => setActiveIdx(i)}
              style={{
                flexShrink: 0,
                width: 60,
                height: 60,
                borderRadius: "var(--sr-radius-md)",
                overflow: "hidden",
                border: i === activeIdx ? "2px solid var(--clay-500)" : "2px solid transparent",
                background: "var(--cream-100)",
                cursor: "pointer",
                padding: 0,
                position: "relative",
                opacity: i === activeIdx ? 1 : 0.65,
                transition: "opacity 120ms, border-color 120ms",
              }}
            >
              {img.thumb_url || img.url ? (
                <Image
                  src={img.thumb_url ?? img.url!}
                  alt={`Photo ${i + 1}`}
                  fill
                  style={{ objectFit: "cover" }}
                  sizes="60px"
                />
              ) : (
                <Package size={20} color="var(--ink-300)" strokeWidth={1.5} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: "available" | "reserved" | "sold" }) {
  if (status === "available") return null;

  const config =
    status === "sold"
      ? { label: "Sold", bg: "var(--ink-100)", color: "var(--ink-600)", icon: AlertCircle }
      : { label: "Reserved", bg: "var(--honey-50)", color: "var(--honey-700)", icon: AlertTriangle };

  const Icon = config.icon;

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        fontFamily: "var(--sr-font-mono)",
        fontSize: 10,
        textTransform: "uppercase",
        letterSpacing: "0.14em",
        fontWeight: 700,
        color: config.color,
        background: config.bg,
        padding: "5px 10px",
        borderRadius: "var(--sr-radius-full)",
      }}
    >
      <Icon size={11} strokeWidth={2} />
      {config.label}
    </span>
  );
}

function UrgencyBanner({ moveOutDate }: { moveOutDate: string | null }) {
  const days = daysUntil(moveOutDate);
  if (days === null || days > 14) return null;

  const isPast = days < 0;
  const isToday = days === 0;

  let label: string;
  if (isPast) label = "Move already happened — pick up ASAP";
  else if (isToday) label = "Moving out today";
  else if (days === 1) label = "Moving out tomorrow";
  else label = `Moving out in ${days} days`;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: "var(--sr-radius-lg)",
        background: days <= 3 ? "var(--clay-50)" : "var(--cream-100)",
        border: `1px solid ${days <= 3 ? "var(--clay-200)" : "var(--sr-border-subtle)"}`,
      }}
    >
      <Clock size={13} color={days <= 3 ? "var(--clay-600)" : "var(--ink-400)"} strokeWidth={2} />
      <span
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.12em",
          fontWeight: 700,
          color: days <= 3 ? "var(--clay-700)" : "var(--ink-500)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ItemDetailContent({
  eventId,
  itemId,
}: {
  eventId: string;
  itemId: string;
}) {
  const searchParams = useSearchParams();
  const queryBundleId = searchParams.get("bundle") ?? "";
  const { user } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [messaging, setMessaging] = useState(false);
  const [saved, setSaved] = useState(false);
  const [savePending, setSavePending] = useState(false);

  // Deep-link / refresh without ?bundle= — resolve the bundle from the sale so
  // shareable links and back/refresh work without the query param.
  const {
    data: saleForResolve,
    isLoading: resolveLoading,
    isFetched: resolveFetched,
  } = useQuery({
    queryKey: ["resolve-bundle", eventId, itemId],
    queryFn: () => getPublicSale(eventId),
    enabled: !queryBundleId,
    staleTime: 60_000,
    retry: false,
  });
  const resolvedBundleId =
    saleForResolve?.bundles.find((b) => b.items.some((i) => i.id === itemId))?.id ?? "";
  const bundleId = queryBundleId || resolvedBundleId;
  const resolving = !queryBundleId && !resolvedBundleId && resolveLoading;
  const resolveFailed = !queryBundleId && resolveFetched && !resolvedBundleId;

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

  const isSeller = !!user && !!item?.seller_id && user.uid === item.seller_id;

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

  const isSold = item?.sale_status === "sold";
  const isReserved = item?.sale_status === "reserved";
  const unavailable = isSold || isReserved;

  // Spec pills: only non-empty values
  const specs = item
    ? [
        item.dimensions ? { icon: Ruler, label: item.dimensions } : null,
        item.material ? { icon: Layers, label: item.material } : null,
        item.disassembly_required ? { icon: Wrench, label: "Disassembly required" } : null,
        item.is_fragile ? { icon: AlertTriangle, label: "Handle with care" } : null,
      ].filter(Boolean)
    : [];

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

      {/* Resolving bundle from deep-link */}
      {resolving && (
        <div
          style={{
            height: 300,
            display: "grid",
            placeItems: "center",
            color: "var(--ink-400)",
            fontFamily: "var(--sr-font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
          }}
        >
          Loading item…
        </div>
      )}

      {/* Item genuinely not found in this sale */}
      {resolveFailed && (
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
            Item no longer available
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
          {/* Gallery column */}
          <Gallery images={item.images ?? []} name={item.name} />

          {/* Details column */}
          <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Status badge + urgency */}
            {item.sale_status && item.sale_status !== "available" && (
              <StatusBadge status={item.sale_status} />
            )}

            <UrgencyBanner moveOutDate={item.move_out_date} />

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
                opacity: unavailable ? 0.5 : 1,
              }}
            >
              {item.name ?? "Item"}
            </h1>

            {/* Price */}
            <div
              style={{ display: "flex", alignItems: "flex-end", gap: 10, opacity: unavailable ? 0.5 : 1 }}
            >
              <span
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 32,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                  textDecoration: isSold ? "line-through" : "none",
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
                  Pickup in {item.suburb.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())}
                </span>
              )}
            </div>

            {/* Physical specs */}
            {specs.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 6,
                }}
              >
                {specs.map((spec, i) => {
                  if (!spec) return null;
                  const Icon = spec.icon;
                  return (
                    <span
                      key={i}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 5,
                        fontFamily: "var(--sr-font-mono)",
                        fontSize: 9,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: "var(--ink-500)",
                        background: "var(--sr-bg-paper)",
                        padding: "4px 9px",
                        borderRadius: "var(--sr-radius-full)",
                        border: "1px solid var(--sr-border-subtle)",
                      }}
                    >
                      <Icon size={10} strokeWidth={1.8} />
                      {spec.label}
                    </span>
                  );
                })}
              </div>
            )}

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
              {isSold ? (
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 16px",
                    borderRadius: "var(--sr-radius-lg)",
                    background: "var(--cream-100)",
                    border: "1px solid var(--sr-border-subtle)",
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    color: "var(--ink-400)",
                  }}
                >
                  <AlertCircle size={15} strokeWidth={1.5} />
                  This item has been sold
                </div>
              ) : isSeller ? (
                <Link
                  href={`/seller-central/inventory/${eventId}?title=${encodeURIComponent(item?.sale_title || "Moving Sale")}`}
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    padding: "13px 16px",
                    borderRadius: "var(--sr-radius-lg)",
                    background: "var(--cream-100)",
                    color: "var(--ink-600)",
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    border: "1px solid var(--sr-border-subtle)",
                    textDecoration: "none",
                    boxSizing: "border-box",
                  }}
                >
                  ✓ Your listing — Manage in Seller Central →
                </Link>
              ) : (
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
                    background: isReserved ? "var(--honey-100)" : "var(--clay-500)",
                    color: isReserved ? "var(--honey-800)" : "#fff",
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 14,
                    fontWeight: 600,
                    border: isReserved ? "1px solid var(--honey-200)" : "none",
                    cursor: messaging ? "default" : "pointer",
                    opacity: messaging ? 0.7 : 1,
                    transition: "opacity 140ms, background 140ms",
                  }}
                  onMouseEnter={(e) => {
                    if (!messaging && !isReserved)
                      e.currentTarget.style.background = "var(--clay-600)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isReserved)
                      e.currentTarget.style.background = "var(--clay-500)";
                  }}
                >
                  <MessageSquare size={15} strokeWidth={1.5} />
                  {messaging
                    ? "Opening…"
                    : isReserved
                    ? "Message seller — may still be available"
                    : "Express Interest"}
                </button>
              )}
              {!isSeller && (
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
              )}
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
                {item.sale_title ? `← ${item.sale_title}` : "← View full sale"}
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

export default function ItemDetailClient({
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
