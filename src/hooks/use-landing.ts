"use client";

import { useState, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { searchMarketplace, getActiveSales } from "@/lib/api";

export function useLanding() {
  const [searchInput, setSearchInput] = useState("");
  const [suburb, setSuburb] = useState("");
  const [committed, setCommitted] = useState<{ q: string; suburb: string }>({ q: "", suburb: "" });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const commit = useCallback((q: string, s: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setCommitted({ q, suburb: s }), 400);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchInput(value);
    commit(value, suburb);
  }, [suburb, commit]);

  const handleSuburbChange = useCallback((value: string) => {
    setSuburb(value);
    commit(searchInput, value);
  }, [searchInput, commit]);

  const itemsQuery = useQuery({
    queryKey: ["landing-items", committed.q, committed.suburb],
    queryFn: () => searchMarketplace(committed.q || undefined, committed.suburb || undefined),
    staleTime: 60_000,
  });

  const salesQuery = useQuery({
    queryKey: ["landing-sales"],
    queryFn: getActiveSales,
    staleTime: 60_000,
  });

  return {
    searchInput,
    suburb,
    handleSearchChange,
    handleSuburbChange,
    items: itemsQuery.data?.items ?? [],
    itemCount: itemsQuery.data?.count ?? 0,
    itemsLoading: itemsQuery.isLoading,
    itemsError: itemsQuery.isError,
    sales: salesQuery.data ?? [],
    salesLoading: salesQuery.isLoading,
  };
}
