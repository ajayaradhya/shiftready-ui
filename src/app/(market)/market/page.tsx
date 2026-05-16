"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Package, Search as SearchIcon, MapPin } from "lucide-react";
import type { MarketplaceItem } from "@/lib/types";
import type { ActiveSaleSummary } from "@/lib/types";
import { useLanding } from "@/hooks/use-landing";
import s from "../../landing.module.css";

const SYDNEY_SUBURBS = [
  "Bondi", "Bondi Junction", "Coogee", "Darlinghurst", "Glebe", "Newtown",
  "Paddington", "Potts Point", "Pyrmont", "Redfern", "Rozelle",
  "Surry Hills", "Waterloo", "Woolloomooloo", "Zetland",
];

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

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 5 3 3 3-3" />
    </svg>
  );
}

function ConditionBadge({ condition }: { condition: string }) {
  return <span className={s.badgeCondition}>{condition}</span>;
}

function fmt(price: number | null): string {
  if (price == null) return "POA";
  return `$${price % 1 === 0 ? price : price.toFixed(2)}`;
}

function ItemSkeleton() {
  return (
    <div className={s.item} style={{ cursor: "default" }}>
      <div className={s.itemMedia}>
        <div style={{ width: "100%", height: "100%", background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      <div className={s.itemBody}>
        <div style={{ height: 14, background: "var(--cream-200)", borderRadius: 4, width: "80%" }} />
        <div style={{ height: 12, background: "var(--cream-200)", borderRadius: 4, width: "50%" }} />
      </div>
    </div>
  );
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

function ItemCard({ item, index, isFav, onToggleFav }: {
  item: MarketplaceItem;
  index: number;
  isFav: boolean;
  onToggleFav: (id: string, e: React.MouseEvent) => void;
}) {
  const v = variantForIndex(index);
  return (
    <Link href={`/market/sale/${item.eventId}`} style={{ textDecoration: "none" }}>
      <article className={s.item}>
        <div className={s.itemMedia}>
          {item.image_url ? (
            <Image src={item.image_url} alt={item.name} fill style={{ objectFit: "cover" }} sizes="220px" />
          ) : (
            <PhDiv variant={v} />
          )}
          <span className={s.itemPrice}>{fmt(item.price)}</span>
          <button
            className={`${s.itemFav} ${isFav ? s.itemFavActive : ""}`}
            aria-label={isFav ? "Saved" : "Save"}
            onClick={(e) => onToggleFav(item.id, e)}
          >
            <svg width="16" height="16" viewBox="0 0 16 16"
              fill={isFav ? "currentColor" : "none"}
              stroke={isFav ? "none" : "currentColor"}
              strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 13.5s-5-3.2-5-7a3 3 0 0 1 5-2.2A3 3 0 0 1 13 6.5c0 3.8-5 7-5 7Z" />
            </svg>
          </button>
        </div>
        <div className={s.itemBody}>
          <div className={s.itemName}>{item.name}</div>
          <div className={s.itemRow}>
            <ConditionBadge condition={item.condition} />
            {item.brand && item.brand !== "Generic" && (
              <span style={{ fontSize: 12, color: "var(--ink-400)" }}>{item.brand}</span>
            )}
          </div>
          {item.bundleName && (
            <div className={s.itemSeller}>
              <MiniAvatar text={item.eventId} variant={v} />
              <span>from <span className={s.itemSellerName}>{item.bundleName}</span> moving sale</span>
            </div>
          )}
        </div>
      </article>
    </Link>
  );
}

function SaleCard({ sale, index }: { sale: ActiveSaleSummary; index: number }) {
  const v = variantForIndex(index);
  const title = sale.suburb
    ? `${sale.suburb} moving sale`
    : "Moving sale";
  return (
    <Link href={`/market/sale/${sale.eventId}`} style={{ textDecoration: "none" }}>
      <article className={s.sale}>
        <div className={s.saleMedia}>
          <PhDiv variant={v} />
          <span className={s.saleBadge}>
            <span className={`${s.badge} ${s.badgeLive}`}>Live</span>
          </span>
          <span className={s.saleCount}>{sale.itemCount} items</span>
          <span className={s.salePlay}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor"><path d="M5 3.5v9l8-4.5z" /></svg>
          </span>
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

function EmptyItems({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "64px 0" }}>
      <Package size={40} style={{ margin: "0 auto 16px", color: "var(--ink-300)" }} />
      <p style={{ fontSize: 14, fontFamily: "var(--sr-font-mono)", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--ink-400)" }}>
        No items found
      </p>
      <p style={{ fontSize: 13, color: "var(--ink-300)", marginTop: 8 }}>
        {hasSearch ? "Try a different search or suburb." : "Check back soon — new sales added regularly."}
      </p>
    </div>
  );
}

export default function BrowsePage() {
  const [heroDismissed, setHeroDismissed] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const {
    searchInput, suburb,
    handleSearchChange, handleSuburbChange,
    items, itemCount, itemsLoading, itemsError,
    sales, salesLoading,
  } = useLanding();

  const toggleFav = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const hasSearch = !!(searchInput || suburb);

  return (
    <div className={s.landing}>
      <main className={s.container}>

        {/* ── SELLER HERO ── */}
        {!heroDismissed && (
          <section className={s.sellerHero} aria-label="Sell with ShiftReady">
            <button className={s.sellerHeroClose} aria-label="Dismiss" onClick={() => setHeroDismissed(true)}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round">
                <path d="m4 4 8 8M12 4l-8 8" />
              </svg>
            </button>
            <div className={s.sellerHeroInner}>
              <div>
                <div className={s.sellerHeroEyebrow}>For sellers · AI walkthrough</div>
                <h1 className={s.sellerHeroTitle}>Moving house? Turn your stuff into <em>cash</em>.</h1>
                <p className={s.sellerHeroSub}>Film a walkthrough — AI extracts and prices everything in minutes. List a whole sale in the time it takes to make a coffee.</p>
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div className={s.search} style={{ width: 260 }}>
              <SearchIcon size={15} className={s.searchIcon} />
              <input
                className={s.searchInput}
                type="text"
                placeholder="Search items, brands…"
                value={searchInput}
                onChange={e => handleSearchChange(e.target.value)}
              />
            </div>

            <div style={{ width: 1, height: 20, background: "var(--sr-border-subtle)", flexShrink: 0 }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "var(--sr-text-primary)" }}>
              <span className={s.locationPin}>
                <MapPin size={14} color="var(--clay-600)" />
              </span>
              <span className={s.locationLabel}>Suburb:</span>
              <select
                value={suburb}
                onChange={e => handleSuburbChange(e.target.value)}
                style={{
                  border: "none",
                  background: "transparent",
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                <option value="">All Sydney</option>
                {SYDNEY_SUBURBS.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={s.chips}>
            <button className={s.chip}>Category <span className={s.chipCaret}><ChevronDown /></span></button>
            <button className={s.chip}>Price <span className={s.chipCaret}><ChevronDown /></span></button>
            <button className={s.chip}>Condition <span className={s.chipCaret}><ChevronDown /></span></button>
            <button className={`${s.chip} ${s.chipSort}`}>
              <span className={s.chipSortLabel}>Sort:</span> Newest <span className={s.chipCaret}><ChevronDown /></span>
            </button>
          </div>
        </div>

        {/* ── ITEMS GRID ── */}
        <section>
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>
                {hasSearch ? "Search results" : <>Items <em>available now</em></>}
              </h2>
              <div className={s.sectionMeta}>
                {itemsLoading ? "Loading…" : `${itemCount} item${itemCount !== 1 ? "s" : ""} available`}
              </div>
            </div>
            <span className={s.sectionView} />
          </div>

          {itemsError && (
            <div style={{ padding: "24px", color: "var(--rust-500)", fontSize: 14, textAlign: "center" }}>
              Failed to load items. Is the backend running?
            </div>
          )}

          <div className={s.itemsGrid}>
            {itemsLoading
              ? Array.from({ length: 8 }).map((_, i) => <ItemSkeleton key={i} />)
              : items.length === 0
              ? <EmptyItems hasSearch={hasSearch} />
              : items.slice(0, 8).map((item, i) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    index={i}
                    isFav={favorites.has(item.id)}
                    onToggleFav={toggleFav}
                  />
                ))
            }
          </div>
        </section>

        {/* ── ACTIVE SALES NEARBY ── */}
        <section className={s.salesScrollWrap}>
          <div className={s.sectionHead}>
            <div>
              <h2 className={s.sectionTitle}>Moving sales <em>live now</em></h2>
              <div className={s.sectionMeta}>
                {salesLoading ? "Loading…" : `${sales.length} active sale${sales.length !== 1 ? "s" : ""}`}
              </div>
            </div>
            <span className={s.sectionView} />
          </div>

          <div className={s.salesScroll}>
            {salesLoading
              ? Array.from({ length: 4 }).map((_, i) => <SaleSkeleton key={i} />)
              : sales.length === 0
              ? (
                <div style={{ color: "var(--ink-400)", fontSize: 14, padding: "32px 0" }}>
                  No live sales right now — check back soon.
                </div>
              )
              : sales.map((sale, i) => (
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
