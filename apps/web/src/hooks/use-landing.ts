"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMarketplace } from "@shiftready/api";
import type { MarketplaceSearchResult } from "@shiftready/types";
import type { CategoryFilter, ConditionFilter, PriceRangeKey, SortKey } from "@shiftready/core";
import { priceRangeToParams } from "@shiftready/core";

interface CommittedFilters {
  q: string;
  suburb: string;
  postcode: string;
  category: CategoryFilter | null;
  condition: ConditionFilter | null;
  priceRange: PriceRangeKey | null;
  sort: SortKey;
}

export interface LocationValue {
  suburb: string;
  postcode: string;
}

export function useLanding(initialItems?: MarketplaceSearchResult, initialFetchedAt?: number) {
  const [searchInput, setSearchInput] = useState("");
  const [suburb, setSuburb] = useState("");
  const [postcode, setPostcode] = useState("");
  const [category, setCategory] = useState<CategoryFilter | null>(null);
  const [condition, setCondition] = useState<ConditionFilter | null>(null);
  const [priceRange, setPriceRange] = useState<PriceRangeKey | null>(null);
  const [sort, setSort] = useState<SortKey>("newest");

  const [committed, setCommitted] = useState<CommittedFilters>({
    q: "", suburb: "", postcode: "", category: null, condition: null, priceRange: null, sort: "newest",
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((next: CommittedFilters) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCommitted(next), 350);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    commit({ q: value, suburb, postcode, category, condition, priceRange, sort });
  }, [suburb, postcode, category, condition, priceRange, sort, commit]);

  const handleLocationChange = useCallback((loc: LocationValue) => {
    setSuburb(loc.suburb);
    setPostcode(loc.postcode);
    commit({ q: searchInput, suburb: loc.suburb, postcode: loc.postcode, category, condition, priceRange, sort });
  }, [searchInput, category, condition, priceRange, sort, commit]);

  const handleCategoryChange = useCallback((value: CategoryFilter | null) => {
    setCategory(value);
    commit({ q: searchInput, suburb, postcode, category: value, condition, priceRange, sort });
  }, [searchInput, suburb, postcode, condition, priceRange, sort, commit]);

  const handleConditionChange = useCallback((value: ConditionFilter | null) => {
    setCondition(value);
    commit({ q: searchInput, suburb, postcode, category, condition: value, priceRange, sort });
  }, [searchInput, suburb, postcode, category, priceRange, sort, commit]);

  const handlePriceRangeChange = useCallback((value: PriceRangeKey | null) => {
    setPriceRange(value);
    commit({ q: searchInput, suburb, postcode, category, condition, priceRange: value, sort });
  }, [searchInput, suburb, postcode, category, condition, sort, commit]);

  const handleSortChange = useCallback((value: SortKey | null) => {
    const next = value ?? "newest";
    setSort(next);
    commit({ q: searchInput, suburb, postcode, category, condition, priceRange, sort: next });
  }, [searchInput, suburb, postcode, category, condition, priceRange, commit]);

  const { min: minPrice, max: maxPrice } = committed.priceRange
    ? priceRangeToParams(committed.priceRange)
    : {};

  const isDefaultState =
    !committed.q && !committed.category && !committed.condition &&
    !committed.priceRange && committed.sort === "newest";

  const itemsQuery = useQuery({
    queryKey: [
      "landing-items",
      committed.q, committed.postcode, committed.category,
      committed.condition, committed.priceRange, committed.sort,
    ],
    queryFn: () => searchMarketplace({
      q: committed.q || undefined,
      postcode: committed.postcode || undefined,
      category: committed.category || undefined,
      condition: committed.condition || undefined,
      min_price: minPrice,
      max_price: maxPrice,
      sort: committed.sort,
    }),
    staleTime: 60_000,
    initialData: isDefaultState && !committed.postcode && initialItems ? initialItems : undefined,
    initialDataUpdatedAt: isDefaultState && !committed.postcode && initialItems ? initialFetchedAt : undefined,
  });

  return {
    searchInput,
    suburb,
    postcode,
    category,
    condition,
    priceRange,
    sort,
    committed,
    isDefaultState,
    handleSearchChange,
    handleLocationChange,
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
