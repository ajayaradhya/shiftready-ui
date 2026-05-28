"use client";

import { useMemo } from "react";
import Link from "next/link";
import type { MarketplaceItem } from "@/lib/types";
import { formatAUD } from "@/lib/format";
import s from "./displays.module.css";

function BeltItem({ item }: { item: MarketplaceItem }) {
  return (
    <Link href={`/market/sale/${item.eventId}`} className={s.beltItem}>
      <div className={s.beltMedia}>
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} loading="lazy" />
        ) : null}
        <span className={s.beltPrice}>{formatAUD(item.price)}</span>
      </div>
      <div className={s.beltName}>{item.name}</div>
      <div className={s.beltMeta}>
        {item.brand && item.brand !== "Generic" ? `${item.brand} · ` : ""}
        {item.condition}
      </div>
    </Link>
  );
}

function ConveyorLane({
  items,
  label,
  variant,
}: {
  items: MarketplaceItem[];
  label: string;
  variant?: "reverse" | "slow";
}) {
  // duplicate for seamless loop; need enough to fill viewport
  const looped = items.length >= 4 ? [...items, ...items] : items;
  const cls = [
    s.beltLane,
    variant === "reverse" ? s.beltLaneReverse : "",
    variant === "slow" ? s.beltLaneSlow : "",
  ].filter(Boolean).join(" ");

  return (
    <div className={cls}>
      <span className={s.beltTag}>{label}</span>
      <div className={s.beltFadeL} />
      <div className={s.beltFadeR} />
      <div className={s.beltTrack}>
        {looped.map((it, i) => <BeltItem key={`${it.id}-${i}`} item={it} />)}
      </div>
    </div>
  );
}

export function ConveyorBelt({ items }: { items: MarketplaceItem[] }) {
  const { cheap, mid, premium } = useMemo(() => {
    const withPrice = items.filter(i => i.price != null) as (MarketplaceItem & { price: number })[];
    const noPrice = items.filter(i => i.price == null);
    return {
      cheap: withPrice.filter(i => i.price < 50),
      mid: withPrice.filter(i => i.price >= 50 && i.price < 200),
      premium: [...withPrice.filter(i => i.price >= 200), ...noPrice],
    };
  }, [items]);

  const lanes = [
    { items: cheap, label: "Under $50 · grab-and-go", variant: undefined },
    { items: mid, label: "$50 to $200 · everyday picks", variant: "reverse" as const },
    { items: premium, label: "$200+ · statement pieces", variant: "slow" as const },
  ].filter(l => l.items.length > 0);

  if (lanes.length === 0) return null;

  return (
    <div className={s.belt}>
      {lanes.map((lane, i) => (
        <ConveyorLane key={i} items={lane.items} label={lane.label} variant={lane.variant} />
      ))}
    </div>
  );
}

export function ConveyorBeltSkeleton() {
  return (
    <div className={s.belt} style={{ paddingTop: 26, paddingBottom: 26 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className={s.beltLane}>
          <div className={s.skel} style={{ width: "92%", height: 200, margin: "0 auto" }} />
        </div>
      ))}
    </div>
  );
}
