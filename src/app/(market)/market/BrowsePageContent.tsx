"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Bell, Package } from "lucide-react";
import { toast } from "sonner";
import type { ActiveSaleSummary, LandingData } from "@/lib/types";
import { formatAUD } from "@/lib/format";
import { useLanding } from "@/hooks/use-landing";
import { searchMarketplace, getActiveSales } from "@/lib/api";
import { FilterChip } from "@/components/features/marketplace/FilterChip";
import { SuburbChip } from "@/components/features/marketplace/SuburbChip";
import { ConveyorBelt, ConveyorBeltSkeleton } from "@/components/features/marketplace/displays/conveyor-belt";
import { PolaroidPile, PolaroidPileSkeleton } from "@/components/features/marketplace/displays/polaroid-pile";
import { ReceiptRoll, ReceiptRollSkeleton } from "@/components/features/marketplace/displays/receipt-roll";
import {
  CATEGORY_OPTIONS,
  CONDITION_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SORT_OPTIONS,
} from "@/lib/marketplace-filters";
import s from "../../landing.module.css";

type Variant = "default" | "tinted" | "moss" | "honey" | "ink";
const VARIANTS: Variant[] = ["tinted", "moss", "honey", "ink", "default"];
function variantForIndex(i: number): Variant { return VARIANTS[i % VARIANTS.length]; }

function PhDiv({ variant }: { variant: Variant }) {
  const cls = [
    s.ph,
    variant === "tinted" ? s.phTinted
      : variant === "moss" ? s.phMoss
      : variant === "honey" ? s.phHoney
      : variant === "ink" ? s.phInk
      : "",
  ].filter(Boolean).join(" ");
  return <div className={cls} />;
}

function MiniAvatar({ text, variant }: { text: string; variant: Variant }) {
  const cls = [
    s.miniAvatar,
    variant === "moss" ? s.miniAvatarMoss
      : variant === "honey" ? s.miniAvatarHoney
      : variant === "ink" ? s.miniAvatarInk
      : "",
  ].filter(Boolean).join(" ");
  return <div className={cls}>{text.slice(0, 2).toUpperCase()}</div>;
}

function fmt(price: number | null): string {
  return formatAUD(price);
}

function SaleSkeleton() {
  return (
    <div className={s.sale} style={{ cursor: "default" }}>
      <div className={s.saleMedia}>
        <div style={{ width: "100%", height: "100%", background: "var(--cream-200)" }} />
      </div>
      <div className={s.saleBody}>
        <div style={{ height: 14, background: "var(--cream-200)", borderRadius: 4, width: "70%" }} />
        <div style={{ height: 12, background: "var(--cream-200)", borderRadius: 4, width: "90%", marginTop: 4 }} />
      </div>
    </div>
  );
}

function SaleImageCollage({ images, variant }: { images: string[]; variant: Variant }) {
  if (images.length === 0) return <PhDiv variant={variant} />;

  if (images.length === 1) {
    return <Image src={images[0]} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" />;
  }

  if (images.length === 2) {
    return (
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: "100%", height: "100%" }}>
        {images.slice(0, 2).map((src, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 50vw, 16vw" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, width: "100%", height: "100%" }}>
      <div style={{ position: "relative", overflow: "hidden", gridRow: "1 / 3" }}>
        <Image src={images[0]} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 50vw, 16vw" />
      </div>
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 2, height: "100%" }}>
        {images.slice(1, 3).map((src, i) => (
          <div key={i} style={{ position: "relative", overflow: "hidden" }}>
            <Image src={src} alt="" fill style={{ objectFit: "cover" }} sizes="(max-width: 640px) 25vw, 8vw" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SaleCard({ sale, index }: { sale: ActiveSaleSummary; index: number }) {
  const v = variantForIndex(index);
  const title = sale.title || (sale.suburb
    ? `${sale.suburb} moving sale`
    : "Moving sale");
  const images = sale.cover_image_url
    ? [sale.cover_image_url]
    : (sale.preview_images ?? []);
  return (
    <Link href={`/market/sale/${sale.eventId}`} style={{ textDecoration: "none" }}>
      <article className={s.sale}>
        <div className={s.saleMedia}>
          <SaleImageCollage images={images} variant={v} />
          <span className={s.saleBadge}>
            <span className={`${s.badge} ${s.badgeLive}`}>Live</span>
          </span>
          <span className={s.saleCount}>{sale.itemCount} items</span>
        </div>
        <div className={s.saleBody}>
          <div className={s.saleTitle}>{title}</div>
          <div className={s.saleMeta}>
            {sale.itemCount} items
            {sale.minPrice != null ? ` · from ${fmt(sale.minPrice)}` : ""}
            {sale.state ? ` · ${sale.state}` : ""}
          </div>
          <div className={s.saleFoot}>
            <div className={s.saleSeller}>
              <MiniAvatar text={sale.suburb ?? sale.eventId} variant={v} />
              {sale.suburb ?? "Moving sale"}
            </div>
            <span className={s.saleCta}>Browse →</span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  const handleNotify = () => {
    const key = "sr_notify_subscribed";
    if (localStorage.getItem(key)) {
      toast("You're already on the list - we'll let you know when new sales go live.");
    } else {
      localStorage.setItem(key, "1");
      toast.success("You're in! We'll notify you when new sales go live in your area.");
    }
  };

  return (
    <div style={{
      textAlign: "center",
      padding: "72px 24px",
      background: "var(--cream-50)",
      border: "1px dashed var(--cream-400)",
      borderRadius: "var(--sr-radius-lg)",
    }}>
      <Package size={40} style={{ margin: "0 auto 16px", color: "var(--ink-300)" }} />
      <p style={{ fontSize: 14, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-400)" }}>
        Belt is empty
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-300)", marginTop: 8 }}>
        {hasSearch ? "Nothing matches those filters. Try widening the search or clearing the suburb." : "No items on the belt yet - new sales go live regularly."}
      </p>
      {!hasSearch && (
        <button
          onClick={handleNotify}
          style={{
            marginTop: 20,
            display: "inline-flex",
            alignItems: "center",
            gap: 7,
            padding: "9px 18px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--sr-border-default)",
            background: "var(--sr-bg-card)",
            fontSize: 13,
            fontWeight: 500,
            color: "var(--ink-600)",
            fontFamily: "var(--sr-font-sans)",
            cursor: "pointer",
            transition: "background 120ms",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--sr-bg-card)"; }}
        >
          <Bell size={14} strokeWidth={1.5} />
          Notify me when items land
        </button>
      )}
    </div>
  );
}

function useInViewOnce(rootMargin = "200px") {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node;
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const obs = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setVisible(true); obs.disconnect(); }
    }, { rootMargin });
    obs.observe(el);
    return () => obs.disconnect();
  }, [visible, rootMargin]);
  return { setRef, visible };
}

function BrowsePageInner({ initialLanding, fetchedAt }: { initialLanding: LandingData | null; fetchedAt: number }) {
  useEffect(() => { document.title = "Browse - ShiftReady"; }, []);
  const searchParams = useSearchParams();
  const [heroDismissed, setHeroDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sr_seller_hero_dismissed") === "1";
  });

  const initialItems = initialLanding
    ? { items: initialLanding.items, count: initialLanding.items.length, is_authenticated: false }
    : undefined;

  const {
    searchInput, suburb, postcode, category, condition, priceRange, sort,
    isDefaultState,
    handleSearchChange, handleLocationChange,
    handleCategoryChange, handleConditionChange,
    handlePriceRangeChange, handleSortChange,
    items, itemCount, itemsLoading, itemsError,
  } = useLanding(initialItems, fetchedAt);

  useEffect(() => {
    const q = searchParams.get("q") ?? "";
    handleSearchChange(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const { setRef: setPolaroidRef, visible: polaroidVisible } = useInViewOnce("400px");
  const { setRef: setReceiptRef, visible: receiptVisible } = useInViewOnce("400px");
  const { setRef: setSalesRef, visible: salesVisible } = useInViewOnce("400px");

  // Reuse belt data for polaroid when default state + no location. Otherwise fetch.
  const useItemsForNewest = isDefaultState && !postcode;
  const newestQuery = useQuery({
    queryKey: ["market-newest", postcode],
    queryFn: () => searchMarketplace({ postcode: postcode || undefined, sort: "newest" }),
    staleTime: 60_000,
    enabled: !useItemsForNewest && polaroidVisible,
    initialData: !useItemsForNewest && initialLanding
      ? { items: initialLanding.items, count: initialLanding.items.length, is_authenticated: false }
      : undefined,
    initialDataUpdatedAt: !useItemsForNewest && initialLanding ? fetchedAt : undefined,
  });
  const newestItems = useItemsForNewest
    ? items
    : (newestQuery.data?.items ?? []);
  const newestLoading = useItemsForNewest ? itemsLoading : newestQuery.isLoading;

  const cheapestQuery = useQuery({
    queryKey: ["market-cheapest", postcode],
    queryFn: () => searchMarketplace({ postcode: postcode || undefined, sort: "price_asc" }),
    staleTime: 60_000,
    enabled: receiptVisible,
    initialData: initialLanding
      ? { items: initialLanding.cheapest, count: initialLanding.cheapest.length, is_authenticated: false }
      : undefined,
    initialDataUpdatedAt: initialLanding ? fetchedAt : undefined,
  });

  const salesQuery = useQuery({
    queryKey: ["landing-sales"],
    queryFn: getActiveSales,
    staleTime: 60_000,
    enabled: salesVisible,
    initialData: initialLanding?.active_sales,
    initialDataUpdatedAt: initialLanding ? fetchedAt : undefined,
  });

  const hasSearch = !!(searchInput || postcode || category || condition || priceRange);
  const locationLabel = suburb || (postcode ? postcode : "");

  return (
    <div className={s.landing}>
      <main className={s.container}>

        {/* ── SELLER HERO ── */}
        {!heroDismissed && (
          <section className={s.sellerHero} aria-label="Sell with ShiftReady">
            <button className={s.sellerHeroClose} aria-label="Dismiss" onClick={() => { setHeroDismissed(true); localStorage.setItem("sr_seller_hero_dismissed", "1"); }}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
            <div className={s.sellerHeroInner}>
              <div>
                <div className={s.sellerHeroEyebrow}>For sellers · AI walkthrough</div>
                <h1 className={s.sellerHeroTitle}>Moving house? Turn your stuff into <em>cash</em>.</h1>
                <p className={s.sellerHeroSub}>Film a walkthrough - AI extracts and prices everything in minutes. List a whole sale in the time it takes to make a coffee.</p>
              </div>
              <div className={s.sellerHeroActions}>
                <Link href="/seller-central/capture" className={`${s.btn} ${s.btnPrimary}`}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="3" /><path d="M2 6V5a1 1 0 0 1 1-1h1l1-1h6l1 1h1a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5" />
                  </svg>
                  Start Live Capture
                </Link>
                <Link className={`${s.btn} ${s.btnLink}`} href="/seller-central">View My Sales →</Link>
              </div>
            </div>
          </section>
        )}

        {/* ── FILTER BAR ── */}
        <div className={s.filterBar}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <SuburbChip value={{ suburb, postcode }} onChange={handleLocationChange} />
          </div>

          <div className={s.chips}>
            <FilterChip
              label="Category"
              options={CATEGORY_OPTIONS}
              value={category}
              onChange={handleCategoryChange}
            />
            <FilterChip
              label="Price"
              options={PRICE_RANGE_OPTIONS}
              value={priceRange}
              onChange={handlePriceRangeChange}
            />
            <FilterChip
              label="Condition"
              options={CONDITION_OPTIONS}
              value={condition}
              onChange={handleConditionChange}
            />
            <FilterChip
              label="Sort"
              options={SORT_OPTIONS}
              value={sort}
              onChange={handleSortChange}
              prefixLabel
            />
          </div>
        </div>

        {/* ── 01 · CONVEYOR BELT (primary browse, respects all filters) ── */}
        <section>
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>
                {hasSearch ? <>What matches <em>your filters</em></> : <>Everything <em>on the belt</em></>}
              </h2>
              <div className={s.sectionMeta}>
                {itemsLoading
                  ? "Loading…"
                  : `${itemCount} item${itemCount !== 1 ? "s" : ""} rolling past${locationLabel ? ` in ${locationLabel}` : ""}`}
              </div>
            </div>
            <span className={s.sectionView} />
          </div>

          {itemsError ? (
            <div style={{ padding: "24px", color: "var(--rust-500)", fontSize: 14, textAlign: "center" }}>
              Failed to load items. Is the backend running?
            </div>
          ) : itemsLoading ? (
            <ConveyorBeltSkeleton />
          ) : items.length === 0 ? (
            <EmptyState hasSearch={hasSearch} />
          ) : (
            <ConveyorBelt items={items} />
          )}
        </section>

        {/* ── 02 · POLAROID PILE (newest, suburb-aware) ── */}
        {(newestLoading || newestItems.length > 0) && (
          <section style={{ marginTop: 56 }} ref={setPolaroidRef as React.RefCallback<HTMLElement>}>
            <div className={s.sectionHead}>
              <div>
                <h2 className={s.sectionTitle}>
                  Fresh from someone&apos;s <em>home</em>
                </h2>
                <div className={s.sectionMeta}>
                  {newestLoading
                    ? "Loading…"
                    : `Just listed${locationLabel ? ` near ${locationLabel}` : ""} · ${newestItems.length} total`}
                </div>
              </div>
              <span className={s.sectionView} />
            </div>

            {newestLoading ? <PolaroidPileSkeleton /> : <PolaroidPile items={newestItems} />}
          </section>
        )}

        {/* ── 03 · RECEIPT ROLL (cheapest, suburb-aware) ── */}
        {(cheapestQuery.isLoading || (cheapestQuery.data?.items?.length ?? 0) > 0) && (
          <section style={{ marginTop: 56 }} ref={setReceiptRef as React.RefCallback<HTMLElement>}>
            <div className={s.sectionHead}>
              <div>
                <h2 className={s.sectionTitle}>
                  Today&apos;s <em>best prices</em>
                </h2>
                <div className={s.sectionMeta}>
                  Cheapest 14 items{locationLabel ? ` in ${locationLabel}` : " right now"} · cash, transfer or pick-up
                </div>
              </div>
              <span className={s.sectionView} />
            </div>

            {cheapestQuery.isLoading
              ? <ReceiptRollSkeleton />
              : <ReceiptRoll items={cheapestQuery.data!.items} suburb={locationLabel || null} />
            }
          </section>
        )}

        {/* ── ACTIVE SALES NEARBY ── */}
        <section className={s.salesScrollWrap} ref={setSalesRef as React.RefCallback<HTMLElement>}>
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>Moving sales <em>live now</em></h2>
              <div className={s.sectionMeta}>
                {salesQuery.isLoading ? "Loading…" : `${(salesQuery.data ?? []).length} active sale${(salesQuery.data ?? []).length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <span className={s.sectionView} />
          </div>

          <div className={s.salesScroll}>
            {salesQuery.isLoading
              ? Array.from({ length: 4 }).map((_, i) => <SaleSkeleton key={i} />)
              : (salesQuery.data ?? []).length === 0
              ? (
                <div style={{ color: "var(--ink-400)", fontSize: 14, padding: "32px 0" }}>
                  No live sales right now, check back soon.
                </div>
              )
              : (salesQuery.data ?? []).map((sale, i) => (
                  <SaleCard key={sale.eventId} sale={sale} index={i} />
                ))
            }
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <div className={s.footerBand}>
        <footer className={s.footer}>
          <div className={s.footerBrand}>
            <Image src="/logo-mark.svg" alt="ShiftReady" width={24} height={24} />
            ShiftReady
          </div>
          <div className={s.footerLinks}>
            <Link href="#">About</Link>
            <Link href="#">How it works</Link>
            <Link href="#">Contact</Link>
          </div>
          <div>© 2026 ShiftReady · Made in Australia</div>
        </footer>
      </div>
    </div>
  );
}

export function BrowsePageContent({ initialLanding, fetchedAt }: { initialLanding: LandingData | null; fetchedAt: number }) {
  return (
    <Suspense fallback={null}>
      <BrowsePageInner initialLanding={initialLanding} fetchedAt={fetchedAt} />
    </Suspense>
  );
}
