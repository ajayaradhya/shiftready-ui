import Image from "next/image";
import { Tag, Percent } from "lucide-react";
import type { PublicBundle, PublicBundleItem } from "@myrio/types";
import { formatAUD } from "@myrio/core";

function BundleItemRow({ item }: { item: PublicBundleItem }) {
  const isSold = item.sale_status === "sold";
  const isReserved = item.sale_status === "reserved";
  const unavailable = isSold || isReserved;

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-outline-variant/10 last:border-0 ${unavailable ? "opacity-50" : ""}`}>
      {item.image_url ? (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-surface-container-high">
          <Image src={item.image_url} alt={item.name ?? "Item"} fill style={{ objectFit: "cover" }} sizes="40px" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-lg bg-surface-container-high shrink-0" />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium truncate ${unavailable ? "line-through text-outline" : "text-on-surface"}`}>
          {item.name ?? "Item"}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.brand && (
            <span className="text-[10px] text-outline uppercase tracking-widest">
              {item.brand}
            </span>
          )}
          {item.condition && !unavailable && (
            <span className="text-[10px] text-outline/70 bg-surface-container-high px-1.5 py-0.5 rounded uppercase tracking-widest">
              {item.condition}
            </span>
          )}
          {isSold && (
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-outline/10 text-outline">
              Sold
            </span>
          )}
          {isReserved && (
            <span className="text-[10px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-outline/10 text-outline">
              Reserved
            </span>
          )}
        </div>
      </div>
      <span className={`text-sm font-semibold shrink-0 ${unavailable ? "text-outline line-through" : "text-on-surface"}`}>
        {item.price > 0 ? formatAUD(item.price) : "-"}
      </span>
    </div>
  );
}

export function BundleCard({ bundle }: { bundle: PublicBundle }) {
  const availableItems = bundle.items.filter((i) => i.sale_status !== "sold" && i.sale_status !== "reserved");
  const savings = bundle.itemTotal - bundle.bundlePrice;
  const hasBundleDiscount = savings > 0 && bundle.itemTotal > 0;
  const totalCount = bundle.items.length;
  const availableCount = availableItems.length;

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container overflow-hidden">
      <div className="flex items-start justify-between gap-4 px-6 py-4 bg-surface-container-high border-b border-outline-variant/10">
        <div className="flex items-center gap-2.5">
          <Tag size={14} className="text-outline shrink-0" />
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">
            {bundle.name ?? "Bundle"}
          </h2>
          <span className="text-[10px] text-outline uppercase tracking-widest">
            {availableCount < totalCount
              ? `${availableCount} of ${totalCount} available`
              : `${totalCount} ${totalCount === 1 ? "item" : "items"}`}
          </span>
        </div>

        {hasBundleDiscount && (
          <div className="flex items-center gap-1.5 bg-tertiary/10 text-tertiary px-2.5 py-1 rounded-full">
            <Percent size={10} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Bundle deal
            </span>
          </div>
        )}
      </div>

      <div className="px-6">
        {bundle.items.map((item) => (
          <BundleItemRow key={item.id} item={item} />
        ))}
      </div>

      {bundle.items.length > 0 && (
        <div className="px-6 py-4 bg-surface-container-lowest/50 border-t border-outline-variant/10">
          {hasBundleDiscount ? (
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-outline font-black mb-1">
                  Individual total
                </p>
                <p className="text-sm text-outline line-through">
                  {formatAUD(bundle.itemTotal)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-tertiary font-black mb-1">
                  Buy the room - save {formatAUD(savings)}
                </p>
                <p className="text-xl font-black text-tertiary">
                  {formatAUD(bundle.bundlePrice)}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-outline font-black">
                Total
              </p>
              <p className="text-lg font-black text-on-surface">
                {formatAUD(bundle.itemTotal)}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
