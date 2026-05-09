"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, Tag, Package } from "lucide-react";
import { searchMarketplace } from "@/lib/api";
import type { MarketplaceItem } from "@/lib/types";

const SYDNEY_SUBURBS = [
  "Waterloo", "Surry Hills", "Newtown", "Glebe", "Pyrmont",
  "Chippendale", "Redfern", "Alexandria", "Zetland", "Erskineville",
  "Marrickville", "Balmain", "Rozelle", "Leichhardt", "Annandale",
];

function ItemCard({ item }: { item: MarketplaceItem }) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/marketplace/${item.eventId}`)}
      className="group text-left rounded-2xl bg-surface-container border border-outline-variant/10 hover:border-outline-variant/30 hover:bg-surface-container-high transition-all p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-on-surface truncate">{item.name}</p>
          <p className="text-xs text-outline mt-0.5">{item.brand}</p>
        </div>
        {item.price != null && (
          <span className="shrink-0 text-sm font-black text-tertiary">
            ${item.price.toFixed(0)}
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
    </button>
  );
}

export default function MarketplacePage() {
  const [searchInput, setSearchInput] = useState("");
  const [suburb, setSuburb] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState<{ q: string; suburb: string }>({
    q: "",
    suburb: "",
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ["marketplace", submittedSearch.q, submittedSearch.suburb],
    queryFn: () => searchMarketplace(submittedSearch.q || undefined, submittedSearch.suburb || undefined),
    staleTime: 60_000,
  });

  const handleSearch = useCallback(() => {
    setSubmittedSearch({ q: searchInput, suburb });
  }, [searchInput, suburb]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") handleSearch();
    },
    [handleSearch]
  );

  return (
    <div className="px-8 py-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-on-surface tracking-tight">Marketplace</h1>
        <p className="text-sm text-outline mt-1">
          Browse furniture and household items from people relocating near you.
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-8 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <input
            type="text"
            placeholder="Search items…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full bg-surface-container border border-outline-variant/20 rounded-xl pl-9 pr-4 py-2.5 text-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary/40 transition-colors"
          />
        </div>

        <div className="relative">
          <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" />
          <select
            value={suburb}
            onChange={(e) => setSuburb(e.target.value)}
            className="appearance-none bg-surface-container border border-outline-variant/20 rounded-xl pl-9 pr-8 py-2.5 text-sm text-on-surface focus:outline-none focus:border-primary/40 transition-colors cursor-pointer"
          >
            <option value="">All suburbs</option>
            {SYDNEY_SUBURBS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={handleSearch}
          className="px-5 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-black uppercase tracking-widest hover:bg-primary/90 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Results */}
      {isLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-surface-container animate-pulse" />
          ))}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-error/20 bg-error/5 px-6 py-5 text-sm text-error">
          Failed to load marketplace. Please try again.
        </div>
      )}

      {data && data.items.length === 0 && (
        <div className="text-center py-24">
          <Package size={40} className="mx-auto text-outline mb-4 opacity-40" />
          <p className="text-sm text-outline uppercase tracking-widest font-black">
            No items found
          </p>
          <p className="text-xs text-outline/60 mt-2">
            {submittedSearch.q || submittedSearch.suburb
              ? "Try adjusting your search or suburb filter."
              : "Check back soon — new sales are added regularly."}
          </p>
        </div>
      )}

      {data && data.items.length > 0 && (
        <>
          <p className="text-xs text-outline uppercase tracking-widest font-black mb-4">
            {data.count} {data.count === 1 ? "item" : "items"} available
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {data.items.map((item) => (
              <ItemCard key={`${item.eventId}-${item.id}`} item={item} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
