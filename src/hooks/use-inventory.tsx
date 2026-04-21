// src/hooks/use-inventory.ts
import { useQuery } from "@tanstack/react-query";
import { getSummary, getStatus } from "@/lib/api";
import { SaleSummary } from "@/lib/types";

export function useInventory(eventId: string) {
  // 1. Status Polling
  const { data: statusData } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    // Polling Logic: Continue as long as we are 'processing' OR 'pricing_in_progress'
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return ["ready_for_review", "live", "failed"].includes(status) ? false : 3000;
    },
  });

  // 2. Summary Fetching
  const { data: summary, isLoading, refetch } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId,
  });

  const isProcessing = statusData?.status === "processing";
  const isPricing = statusData?.status === "pricing_in_progress";

  return {
    summary,
    status: statusData?.status,
    isProcessing,
    isPricing, // Exposed specifically for the "Re-Analyse" overlay
    isLoading: isLoading && !summary,
    refetchSummary: refetch
  };
}