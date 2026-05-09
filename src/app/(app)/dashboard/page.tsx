"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  ArrowRight,
  ShoppingBag,
} from "lucide-react";
import { useSalesList } from "@/hooks/use-sales";
import type { SaleListing, SaleStatus } from "@/lib/types";

const STATUS_LABELS: Record<SaleStatus, string> = {
  pending_upload: "Pending Upload",
  processing: "Processing",
  ready_for_review: "Ready for Review",
  pricing_in_progress: "Pricing",
  live: "Live",
  partially_sold: "Partially Sold",
  expired: "Expired",
  failed: "Failed",
  archived: "Archived",
};

const STATUS_COLORS: Record<SaleStatus, string> = {
  pending_upload: "text-outline bg-outline/10",
  processing: "text-primary bg-primary/10",
  ready_for_review: "text-yellow-400 bg-yellow-400/10",
  pricing_in_progress: "text-primary bg-primary/10",
  live: "text-tertiary bg-tertiary/10",
  partially_sold: "text-tertiary bg-tertiary/10",
  expired: "text-outline bg-outline/10",
  failed: "text-error bg-error/10",
  archived: "text-outline bg-outline/10",
};

function SaleCard({ sale }: { sale: SaleListing }) {
  const router = useRouter();
  const isLive = sale.status === "live" || sale.status === "partially_sold";

  return (
    <div className="group flex items-center justify-between gap-6 px-6 py-5 rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 transition-all">
      <div className="flex items-start gap-5 min-w-0">
        {/* Status dot */}
        <div className="mt-1 w-2 h-2 rounded-full shrink-0 bg-current"
          style={{ color: isLive ? "var(--color-tertiary)" : "var(--color-outline)" }}
        />

        <div className="min-w-0">
          <div className="flex items-center gap-3 mb-1.5">
            <span className={`text-[10px] uppercase tracking-widest font-black px-2 py-0.5 rounded-full ${STATUS_COLORS[sale.status]}`}>
              {STATUS_LABELS[sale.status]}
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs text-outline">
            {sale.suburb && (
              <span className="flex items-center gap-1">
                <MapPin size={11} />
                {sale.suburb}{sale.state ? `, ${sale.state}` : ""}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar size={11} />
              {new Date(sale.createdAt).toLocaleDateString("en-AU", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-on-surface-variant">
            <span className="flex items-center gap-1">
              <Package size={11} className="text-outline" />
              {sale.itemCount} {sale.itemCount === 1 ? "item" : "items"}
            </span>
            {sale.totalValue > 0 && (
              <span className="flex items-center gap-1">
                <DollarSign size={11} className="text-outline" />
                {sale.totalValue.toLocaleString("en-AU", {
                  style: "currency",
                  currency: "AUD",
                  maximumFractionDigits: 0,
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isLive && (
          <Link
            href={`/marketplace/${sale.id}`}
            className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-tertiary hover:text-tertiary/80 transition-colors px-3 py-1.5 rounded-lg border border-tertiary/20 hover:border-tertiary/40"
          >
            <ShoppingBag size={12} />
            Marketplace
          </Link>
        )}
        <button
          onClick={() => router.push(`/inventory/${sale.id}`)}
          className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-black text-primary hover:text-primary/80 transition-colors px-3 py-1.5 rounded-lg border border-primary/20 hover:border-primary/40"
        >
          Inventory
          <ArrowRight size={12} />
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { data: sales, isLoading, error } = useSalesList();

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <h1 className="text-2xl font-bold text-on-surface tracking-tight">My Sales</h1>
          <p className="text-sm text-outline mt-1">
            Manage your relocation sales from start to live.
          </p>
        </div>
        <Link
          href="/create"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
        >
          <Plus size={14} />
          New Sale
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-6 py-5 text-sm text-error">
          Failed to load sales. Please refresh.
        </div>
      )}

      {sales && sales.length === 0 && (
        <div className="text-center py-24">
          <Package size={40} className="mx-auto text-outline mb-4 opacity-40" />
          <p className="text-sm text-outline uppercase tracking-widest font-black mb-6">
            No sales yet
          </p>
          <Link
            href="/create"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} />
            Start your first sale
          </Link>
        </div>
      )}

      {sales && sales.length > 0 && (
        <div className="grid gap-4">
          {sales.map((sale) => (
            <SaleCard key={sale.id} sale={sale} />
          ))}
        </div>
      )}
    </div>
  );
}
