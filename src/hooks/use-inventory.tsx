// src/hooks/use-inventory.ts
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSummary, getStatus } from "@/lib/api";
import { SaleSummary } from "@/lib/types";
import { useEffect } from "react";

export function useInventory(eventId: string) {
  const queryClient = useQueryClient();

  // 1. Monitor AI Status
  const { data: statusData } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      // Continue polling if AI is working
      return ["processing", "pricing_in_progress"].includes(s) ? 3000 : false;
    },
  });

  // 2. Fetch/Cache Summary
  const { data: summary, isLoading, refetch } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId,
  });

  // CRITICAL: When status flips from 'pricing_in_progress' to 'ready_for_review', 
  // we must refresh the summary to see the new AI prices.
  useEffect(() => {
    if (statusData?.status === "ready_for_review") {
      refetch();
    }
  }, [statusData?.status, refetch]);

  const isProcessing = statusData?.status === "processing";
  const isPricing = statusData?.status === "pricing_in_progress";

  return {
    summary,
    status: statusData?.status,
    isProcessing,
    isPricing,
    isLoading: isLoading && !summary,
    refetchSummary: refetch
  };
}