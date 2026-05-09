"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Calendar,
  ChevronLeft,
  Package,
  Tag,
  Percent,
} from "lucide-react";
import { getPublicSale } from "@/lib/api";
import type { PublicBundle, PublicBundleItem } from "@/lib/types";

function formatAUD(amount: number) {
  return amount.toLocaleString("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  });
}

function BundleItemRow({ item }: { item: PublicBundleItem }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-outline-variant/10 last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-on-surface font-medium truncate">{item.name ?? "Item"}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {item.brand && (
            <span className="text-[10px] text-outline uppercase tracking-widest">{item.brand}</span>
          )}
          {item.condition && (
            <span className="text-[10px] text-outline/70 bg-surface-container-high px-1.5 py-0.5 rounded uppercase tracking-widest">
              {item.condition}
            </span>
          )}
        </div>
      </div>
      <span className="text-sm font-semibold text-on-surface shrink-0">
        {item.price > 0 ? formatAUD(item.price) : "—"}
      </span>
    </div>
  );
}

function BundleCard({ bundle }: { bundle: PublicBundle }) {
  const savings = bundle.itemTotal - bundle.bundlePrice;
  const hasBundleDiscount = savings > 0 && bundle.itemTotal > 0;

  return (
    <div className="rounded-2xl border border-outline-variant/15 bg-surface-container overflow-hidden">
      {/* Bundle header */}
      <div className="flex items-start justify-between gap-4 px-6 py-4 bg-surface-container-high border-b border-outline-variant/10">
        <div className="flex items-center gap-2.5">
          <Tag size={14} className="text-outline shrink-0" />
          <h2 className="text-sm font-black uppercase tracking-widest text-on-surface">
            {bundle.name ?? "Bundle"}
          </h2>
          <span className="text-[10px] text-outline uppercase tracking-widest">
            {bundle.items.length} {bundle.items.length === 1 ? "item" : "items"}
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

      {/* Items */}
      <div className="px-6">
        {bundle.items.map((item) => (
          <BundleItemRow key={item.id} item={item} />
        ))}
      </div>

      {/* Pricing footer */}
      {bundle.items.length > 0 && (
        <div className="px-6 py-4 bg-surface-container-lowest/50 border-t border-outline-variant/10">
          {hasBundleDiscount ? (
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-outline font-black mb-1">
                  Individual total
                </p>
                <p className="text-sm text-outline line-through">{formatAUD(bundle.itemTotal)}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-tertiary font-black mb-1">
                  Buy the room — save {formatAUD(savings)}
                </p>
                <p className="text-xl font-black text-tertiary">{formatAUD(bundle.bundlePrice)}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-widest text-outline font-black">Total</p>
              <p className="text-lg font-black text-on-surface">{formatAUD(bundle.itemTotal)}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = use(params);

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ["public-sale", eventId],
    queryFn: () => getPublicSale(eventId),
    staleTime: 60_000,
    retry: false,
  });

  return (
    <div className="px-8 py-10 max-w-3xl mx-auto">
      <Link
        href="/marketplace"
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-outline hover:text-primary transition-colors mb-8"
      >
        <ChevronLeft size={14} />
        Back to Marketplace
      </Link>

      {isLoading && (
        <div className="space-y-4">
          <div className="h-8 w-48 bg-surface-container-high rounded animate-pulse" />
          <div className="h-4 w-64 bg-surface-container rounded animate-pulse" />
          <div className="h-64 rounded-2xl bg-surface-container-high animate-pulse mt-6" />
        </div>
      )}

      {error && (
        <div className="text-center py-24">
          <Package size={40} className="mx-auto text-outline mb-4 opacity-40" />
          <p className="text-sm text-outline uppercase tracking-widest font-black mb-2">
            Sale not found
          </p>
          <p className="text-xs text-outline/60 mb-6">
            This sale may have ended or been removed.
          </p>
          <Link
            href="/marketplace"
            className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            Browse all sales →
          </Link>
        </div>
      )}

      {sale && (
        <>
          {/* Sale meta */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-3">
              Relocation Sale
            </h1>
            <div className="flex items-center gap-4 text-xs text-outline flex-wrap">
              {sale.suburb && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {sale.suburb}{sale.state ? `, ${sale.state}` : ""}
                </span>
              )}
              {sale.moveOutDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={12} />
                  Moving out by{" "}
                  {new Date(sale.moveOutDate).toLocaleDateString("en-AU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Bundle discount explainer */}
          {sale.bundles.some((b) => b.itemTotal > b.bundlePrice && b.itemTotal > 0) && (
            <div className="rounded-xl bg-tertiary/5 border border-tertiary/20 px-5 py-4 mb-6 flex items-start gap-3">
              <Percent size={16} className="text-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-tertiary mb-1">
                  Bundle deals available
                </p>
                <p className="text-xs text-outline/80">
                  Buy all items in a room bundle together and save 20% off the individual prices.
                  Great way to furnish a whole room in one go.
                </p>
              </div>
            </div>
          )}

          {/* Bundles */}
          {sale.bundles.length === 0 ? (
            <div className="text-center py-16">
              <Package size={32} className="mx-auto text-outline mb-3 opacity-40" />
              <p className="text-sm text-outline uppercase tracking-widest font-black">
                No items listed yet
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {sale.bundles.map((bundle) => (
                <BundleCard key={bundle.id} bundle={bundle} />
              ))}
            </div>
          )}

          {/* CTA note — contact handled offline */}
          {sale.bundles.length > 0 && (
            <p className="text-center text-xs text-outline/60 mt-8">
              Interested? Contact the seller through ShiftReady to arrange a pickup.
            </p>
          )}
        </>
      )}
    </div>
  );
}
