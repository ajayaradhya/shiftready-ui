"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMarketplace } from "@/lib/api";
import type { MarketplaceSearchResult } from "@/lib/types";
import type { CategoryFilter, ConditionFilter, PriceRangeKey, SortKey } from "@/lib/marketplace-filters";
import { priceRangeToParams } from "@/lib/marketplace-filters";

interface CommittedFilters {
  q: string;
  suburb: string;
  category: CategoryFilter | null;
  condition: ConditionFilter | null;
  priceRange: PriceRangeKey | null;
  sort: SortKey;
}

export function useLanding(initialItems?: MarketplaceSearchResult, initialFetchedAt?: number) {
  const [searchInput, setSearchInput] = useState("");
  const [suburb, setSuburb] = useState("");
  const [category, setCategory] = useState<CategoryFilter | null>(null);
  const [condition, setCondition] = useState<ConditionFilter | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRangeKey | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const [committed, setCommitted] = useState<CommittedFilters>({
    q: "", suburb: "", category: null, condition: null, priceRange: null, sort: "newest",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: CommittedFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCommitted(next), 350);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    commit({ q: value, suburb, category, condition, priceRange, sort });
  }, [suburb, category, condition, priceRange, sort, commit]);

  const handleSuburbChange = useCallback((value: string) => {
    setSuburb(value);
    commit({ q: searchInput, suburb: value, category, condition, priceRange, sort });
  }, [searchInput, category, condition, priceRange, sort, commit]);

  const handleCategoryChange = useCallback((value: CategoryFilter | null) => {
    setCategory(value);
    commit({ q: searchInput, suburb, category: value, condition, priceRange, sort });
  }, [searchInput, suburb, condition, priceRange, sort, commit]);

  const handleConditionChange = useCallback((value: ConditionFilter | null) => {
    setCondition(value);
    commit({ q: searchInput, suburb, category, condition: value, priceRange, sort });
  }, [searchInput, suburb, category, priceRange, sort, commit]);

  const handlePriceRangeChange = useCallback((value: PriceRangeKey | null) => {
    setPriceRange(value);
    commit({ q: searchInput, suburb, category, condition, priceRange: value, sort });
  }, [searchInput, suburb, category, condition, sort, commit]);

  const handleSortChange = useCallback((value: SortKey | null) => {
    const next = value ?? "newest";
    setSort(next);
    commit({ q: searchInput, suburb, category, condition, priceRange, sort: next });
  }, [searchInput, suburb, category, condition, priceRange, commit]);

  const { min: minPrice, max: maxPrice } = committed.priceRange
    ? priceRangeToParams(committed.priceRange)
    : {};

  const isDefaultState =
    !committed.q && !committed.category && !committed.condition &&
    !committed.priceRange && committed.sort === "newest";

  const itemsQuery = useQuery({
    queryKey: [
      "landing-items",
      committed.q, committed.suburb, committed.category,
      committed.condition, committed.priceRange, committed.sort,
    ],
    queryFn: () => searchMarketplace({
      q: committed.q || undefined,
      suburb: committed.suburb || undefined,
      category: committed.category || undefined,
      condition: committed.condition || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      sort: committed.sort,
    }),
    staleTime: 60_000,
    initialData: isDefaultState && !committed.suburb && initialItems ? initialItems : undefined,
    initialDataUpdatedAt: isDefaultState && !committed.suburb && initialItems ? initialFetchedAt : undefined,
  });

  return {
    searchInput,
    suburb,
    category,
    condition,
    priceRange,
    sort,
    committed,
    isDefaultState,
    handleSearchChange,
    handleSuburbChange,
    handleCategoryChange,
    handleConditionChange,
    handlePriceRangeChange,
    handleSortChange,
    items: itemsQuery.data?.items ?? [],
    itemCount: itemsQuery.data?.count ?? 0,
    itemsLoading: itemsQuery.isLoading,
    itemsError: itemsQuery.isError,
  };
}
