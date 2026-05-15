"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Calendar, ChevronLeft, Package, Percent } from "lucide-react";
import { getPublicSale } from "@/lib/api";
import { BundleCard } from "@/components/features/marketplace/bundle-card";

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
        href="/"
        className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-outline hover:text-primary transition-colors mb-8"
      >
        <ChevronLeft size={14} />
        Back to Browse
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
            href="/"
            className="text-xs font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
          >
            Browse all sales →
          </Link>
        </div>
      )}

      {sale && (
        <>
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-on-surface tracking-tight mb-3">
              Relocation Sale
            </h1>
            <div className="flex items-center gap-4 text-xs text-outline flex-wrap">
              {sale.suburb && (
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {sale.suburb}
                  {sale.state ? `, ${sale.state}` : ""}
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

          {sale.bundles.some((b) => b.itemTotal > b.bundlePrice && b.itemTotal > 0) && (
            <div className="rounded-xl bg-tertiary/5 border border-tertiary/20 px-5 py-4 mb-6 flex items-start gap-3">
              <Percent size={16} className="text-tertiary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-tertiary mb-1">
                  Bundle deals available
                </p>
                <p className="text-xs text-outline/80">
                  Buy all items in a room bundle together and save 20% off the individual
                  prices. Great way to furnish a whole room in one go.
                </p>
              </div>
            </div>
          )}

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
