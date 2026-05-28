"use client";

import Link from "next/link";
import type { MarketplaceItem } from "@/lib/types";
import { formatAUD } from "@/lib/format";
import s from "./displays.module.css";

function pseudoRandom(seed: string, salt = 0): number {
  let h = salt;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function Polaroid({ item, index }: { item: MarketplaceItem; index: number }) {
  const r = pseudoRandom(item.id, 1) % 1000;
  const rotate = ((r % 100) / 100 - 0.5) * 8;
  const offsetY = (pseudoRandom(item.id, 2) % 18) - 9;
  const decor = pseudoRandom(item.id, 3) % 3;

  return (
    <Link
      href={`/market/sale/${item.eventId}`}
      className={s.polaroid}
      style={{ transform: `rotate(${rotate}deg) translateY(${offsetY}px)`, zIndex: index }}
    >
      {decor === 0 && <span className={s.pin} aria-hidden />}
      {decor === 1 && <span className={s.tape} aria-hidden />}
      <div className={s.polaroidMedia}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} loading="lazy" />
        ) : null}
        <span className={s.polaroidPrice}>{formatAUD(item.price)}</span>
      </div>
      <div className={s.polaroidCaption}>{item.name}</div>
    </Link>
  );
}

export function PolaroidPile({ items, max = 18 }: { items: MarketplaceItem[]; max?: number }) {
  const slice = items.slice(0, max);
  if (slice.length === 0) return null;
  return (
    <div className={s.pile}>
      <div className={s.pileInner}>
        {slice.map((it, i) => <Polaroid key={it.id} item={it} index={i} />)}
      </div>
    </div>
  );
}

export function PolaroidPileSkeleton() {
  return (
    <div className={s.pile}>
      <div className={s.pileInner}>
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={s.skel} style={{ aspectRatio: "1 / 1.3" }} />
        ))}
      </div>
    </div>
  );
}
