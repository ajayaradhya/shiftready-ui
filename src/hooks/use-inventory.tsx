// src/hooks/use-inventory.ts
import { useQuery } from "@tanstack/react-query";
import { getSummary, getStatus } from "@/lib/api";
import { SaleSummary } from "@/lib/types";

export function useInventory(eventId: string) {
  // 1. Status Polling (Keeps running until AI is finished)
  const { data: statusData } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    refetchInterval: (query) => 
      ["ready_for_review", "live", "failed"].includes(query.state.data?.status) ? false : 3000,
  });

  // 2. Summary Data (Fetches immediately to get Video and Metadata)
  const { data: summary, isLoading, refetch: refetchSummary } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId, // Fetch as soon as we have an ID
  });

  // Derived States
  const currentStatus = statusData?.status || summary?.status || "unknown";
  const isProcessing = ["processing", "pricing_in_progress"].includes(currentStatus);
  
  return {
    summary,
    status: currentStatus,
    isProcessing,
    isLoading: isLoading && !summary, // Only "loading" if we have zero data
    refetchSummary
  };
}