"use client";

import Link from "next/link";
import Image from "next/image";
import type { MarketplaceItem } from "@shiftready/types";
import { formatAUD } from "@shiftready/core";
import s from "./displays.module.css";

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
          <div className={s.receiptLogo}>ShiftReady Â· Marketplace</div>
          <div className={s.receiptMeta}>
            {dateStr} Â· #{txnId} Â· {locationTag}
          </div>
        </div>

        <hr className={s.receiptRule} />
        <div className={s.receiptCols}>
          <span>Item</span>
          <span>Price</span>
        </div>

        {slice.map((it) => (
          <Link key={it.id} href={`/market/sale/${it.eventId}`} className={s.receiptLine}>
            <div className={s.receiptThumb} style={{ position: "relative" }}>
              {it.image_url ? (
                <Image src={it.image_url} alt="" fill style={{ objectFit: "cover" }} sizes="36px" />
              ) : null}
            </div>
            <div className={s.receiptBody}>
              <div className={s.receiptName}>{it.name}</div>
              <div className={s.receiptSub}>
                {it.brand && it.brand !== "Generic" ? `${it.brand} Â· ` : ""}
                {it.condition}
              </div>
            </div>
            <div className={s.receiptPrice}>{formatAUD(it.price)}</div>
          </Link>
        ))}

        <div className={s.receiptTotal}>
          <span>Cheapest {slice.length} total</span>
          <span>{formatAUD(total, true)}</span>
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
