// src/hooks/use-inventory.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSummary, getStatus } from "@/lib/api";
import { SaleSummary } from "@/lib/types";
import { useEffect } from "react";

export function useInventory(eventId: string) {
  const queryClient = useQueryClient();

  const { data: statusData } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    refetchInterval: (query) => 
      ["processing", "pricing_in_progress"].includes(query.state.data?.status) ? 2000 : false,
  });

  const { data: summary, isLoading, refetch, isFetching } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId,
    // FIX 2: Stop the "Tab-Switch" refetch burn
    refetchOnWindowFocus: false, 
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  useEffect(() => {
    if (statusData?.status === "ready_for_review") {
      refetch();
    }
  }, [statusData?.status, refetch]);

  // FIX 1: Seamless Loading Logic
  // Keep the "Pricing" state active if:
  // 1. Backend says it's pricing
  // 2. OR Status just finished, and we are currently fetching the new summary
  const isPricing = statusData?.status === "pricing_in_progress" || 
                    (statusData?.status === "ready_for_review" && isFetching);

  return {
    summary,
    status: statusData?.status,
    isProcessing: statusData?.status === "processing",
    isPricing, 
    isSyncing: isFetching, // General syncing indicator
    isLoading: isLoading && !summary,
    refetchSummary: refetch
  };
}