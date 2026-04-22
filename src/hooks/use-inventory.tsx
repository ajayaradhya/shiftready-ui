"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSummary, getStatus } from "@/lib/api";
import { SaleSummary } from "@/lib/types";
import { useEffect, useRef } from "react";

/**
 * HOOK: useInventory
 * Manages the lifecycle of a ShiftReady sale. 
 * Orchestrates background AI polling and data refetching.
 */
export function useInventory(eventId: string) {
  const queryClient = useQueryClient();
  
  // Ref to track the previous status to detect transitions (e.g., Processing -> Ready)
  // without triggering extra renders.
  const lastStatus = useRef<string | null | undefined>(null);

  // 1. STATUS POLLING
  // Monitors the AI pipeline (Walkthrough extraction or Gemini Pricing)
  const { data: statusData, error: statusError } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    enabled: !!eventId,
    refetchInterval: (query) => {
      const s = query.state.data?.status ?? "idle";
      // Polling is active only during AI-heavy workloads
      return ["processing", "pricing_in_progress"].includes(s) ? 1500 : false;
    },
  });

  const currentStatus = statusData?.status;

  // 2. SUMMARY DATA
  // Fetches the full hierarchical inventory (Bundles -> Items)
  const { 
    data: summary, 
    isLoading, 
    refetch, 
    isFetching 
  } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId,
    refetchOnWindowFocus: false, 
    staleTime: 1000 * 60 * 5, // 5 min cache for static inventory edits
  });

  /**
   * AUTOMATIC SYNC LOGIC
   * Triggers a full inventory refetch the moment Gemini finishes its analysis.
   */
  useEffect(() => {
    const isTransitioningFromBusyToReady = 
      (lastStatus.current === "processing" || lastStatus.current === "pricing_in_progress") &&
      (currentStatus === "ready_for_review" || currentStatus === "live" || currentStatus === "failed");

    if (isTransitioningFromBusyToReady) {
      refetch();
    }
    
    // Update ref for the next render cycle
    lastStatus.current = currentStatus;
  }, [currentStatus, refetch]);

  // Derived UI Flags - 2026 ShiftReady State Machine
  const isPricing = currentStatus === "pricing_in_progress" || 
                    (lastStatus.current === "pricing_in_progress" && isFetching);

  const isProcessing = currentStatus === "processing" || 
                       (lastStatus.current === "processing" && isFetching);

  return {
    // Data
    summary,
    status: currentStatus,
    error: statusError,
    
    // AI Pipeline Flags
    isProcessing,
    isPricing, 
    isFailed: currentStatus === "failed",
    
    // Global UI States
    isSyncing: isFetching, 
    isLoading: isLoading && !summary,
    refetchSummary: refetch,
    
    // Marketplace Flags
    isLive: currentStatus === "live" || currentStatus === "partially_sold",
    isDraft: currentStatus === "ready_for_review",
    isArchived: currentStatus === "archived",
    isSoldOut: currentStatus === "partially_sold" && summary?.bundles?.every(b => b.items.length === 0)
  };
}