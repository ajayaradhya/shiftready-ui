"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Tag } from "lucide-react";
import type { MarketplaceItem } from "@/lib/types";
import { formatAUD } from "@/lib/format";

export function MarketplaceItemCard({ item }: { item: MarketplaceItem }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/sale/${item.eventId}`)}
      className="group text-left rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container-high transition-all overflow-hidden flex flex-col"
    >
      {item.image_url ? (
        <div className="relative w-full aspect-[4/3] bg-surface-container-high">
          <Image src={item.image_url} alt={item.name} fill style={{ objectFit: "cover" }} sizes="260px" />
        </div>
      ) : (
        <div className="w-full aspect-[4/3] bg-surface-container-high" />
      )}

      <div className="p-5 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
            <p className="text-xs text-outline mt-0.5">{item.brand}</p>
          </div>
          {item.price != null && (
            <span className="shrink-0 text-sm font-black text-tertiary">
              {formatAUD(item.price)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] uppercase tracking-widest font-black text-outline bg-surface-container-high px-2 py-0.5 rounded-full">
            {item.condition}
          </span>
          {item.bundleName && (
            <span className="text-[10px] uppercase tracking-widest text-outline/70 flex items-center gap-1">
              <Tag size={9} />
              {item.bundleName}
            </span>
          )}
        </div>

        <p className="text-[10px] uppercase tracking-widest text-primary group-hover:underline mt-auto">
          View sale →
        </p>
      </div>
    </button>
  );
}
