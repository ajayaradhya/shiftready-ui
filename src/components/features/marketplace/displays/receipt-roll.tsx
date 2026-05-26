"use client";

import Link from "next/link";
import type { MarketplaceItem } from "@/lib/types";
import s from "./displays.module.css";

function fmt(price: number | null): string {
  if (price == null) return "POA";
  return `$${price % 1 === 0 ? price : price.toFixed(2)}`;
}

function pseudoRandom(seed: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function ReceiptRoll({
  items,
  suburb,
  max = 14,
}: {
  items: MarketplaceItem[];
  suburb?: string | null;
  max?: number;
}) {
  const slice = items.slice(0, max);
  if (slice.length === 0) return null;

  const total = slice.reduce((sum, i) => sum + (i.price ?? 0), 0);
  const now = new Date();
  const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const txnId = String(pseudoRandom(slice.map(i => i.id).join(""), 0)).slice(0, 8).padStart(8, "0");
  const locationTag = suburb ? suburb.toUpperCase() : "ALL SUBURBS";

  return (
    <div className={s.receiptWrap}>
      <div className={s.receipt}>
        <div className={s.receiptTop} aria-hidden />

        <div className={s.receiptHead}>
          <div className={s.receiptLogo}>ShiftReady · Marketplace</div>
          <div className={s.receiptMeta}>
            {dateStr} · #{txnId} · {locationTag}
          </div>
        </div>

        <hr className={s.receiptRule} />
        <div className={s.receiptCols}>
          <span>Item</span>
          <span>Price</span>
        </div>

        {slice.map((it) => (
          <Link key={it.id} href={`/market/sale/${it.eventId}`} className={s.receiptLine}>
            <div className={s.receiptThumb}>
              {it.image_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={it.image_url} alt="" loading="lazy" />
              ) : null}
            </div>
            <div className={s.receiptBody}>
              <div className={s.receiptName}>{it.name}</div>
              <div className={s.receiptSub}>
                {it.brand && it.brand !== "Generic" ? `${it.brand} · ` : ""}
                {it.condition}
              </div>
            </div>
            <div className={s.receiptPrice}>{fmt(it.price)}</div>
          </Link>
        ))}

        <div className={s.receiptTotal}>
          <span>Cheapest {slice.length} total</span>
          <span>${total.toFixed(2)}</span>
        </div>

        <div className={s.receiptBarcode} aria-hidden />
        <div className={s.receiptFoot}>Cash, bank transfer or pick-up only</div>

        <div className={s.receiptBottom} aria-hidden />
      </div>
    </div>
  );
}

export function ReceiptRollSkeleton() {
  return (
    <div className={s.receiptWrap}>
      <div className={s.skel} style={{ width: 420, maxWidth: "100%", height: 560 }} />
    </div>
  );
}
