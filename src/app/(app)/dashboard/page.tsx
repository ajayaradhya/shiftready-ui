"use client";

import Link from "next/link";
import { Plus, Package } from "lucide-react";
import { useSalesList } from "@/hooks/use-sales";
import { SaleCard } from "@/components/features/dashboard/sale-card";

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
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          <Plus size={14} aria-hidden />
          New Sale
        </Link>
      </div>

      {isLoading && (
        <div className="grid gap-4" aria-busy="true" aria-label="Loading sales…">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="rounded-2xl border border-error/20 bg-error/5 px-6 py-5 text-sm text-error">
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
