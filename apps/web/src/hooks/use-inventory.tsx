"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getSummary, getStatus } from "@myrio/api";
import { SaleSummary } from "@myrio/types";
import { useEffect, useRef, useCallback } from "react";
import { useWebSocket, type WsMessage } from "./use-websocket";
import { useAuth } from "@/contexts/auth-context";
import { FALLBACK_POLLING_MS } from "@myrio/core";

export function useInventory(eventId: string) {
  const { idToken } = useAuth();
  const queryClient = useQueryClient();
  const authReady = !!idToken;

  // Ref tracks previous status purely for transition detection inside useEffect.
  // Never read during render - that would violate React 19 ref rules.
  const lastStatus = useRef<string | null | undefined>(null);

  // 1. WEBSOCKET STATUS STREAM
  // Receives real-time STATUS_UPDATE frames from the backend pipeline notifier.
  const handleWsMessage = useCallback(
    (msg: WsMessage) => {
      // Pipeline messages carry `status` but no `type`.
      // Event messages (ITEM_UPDATED, BUNDLE_UPDATED, etc.) carry `type` but no `status`.
      if (msg.status) {
        queryClient.setQueryData(["status", eventId], { status: msg.status });
      }
    },
    [eventId, queryClient]
  );

  const { isConnected } = useWebSocket(eventId, idToken, handleWsMessage);

  // 2. STATUS QUERY
  // Fetches the authoritative status on mount and falls back to polling when the
  // WebSocket is disconnected (e.g. network drop, backend restart).
  const { data: statusData, error: statusError } = useQuery({
    queryKey: ["status", eventId],
    queryFn: () => getStatus(eventId),
    enabled: !!eventId && authReady,
    refetchInterval: (query) => {
      if (isConnected) return false; // WS delivers updates; no polling needed
      const s = query.state.data?.status ?? "idle";
      return ["processing", "pricing_in_progress"].includes(s)
        ? FALLBACK_POLLING_MS
        : false;
    },
  });

  const currentStatus = statusData?.status;

  // 3. SUMMARY DATA
  // Fetches the full hierarchical inventory (Bundles → Items).
  const isPipelineActive =
    currentStatus === "processing" || currentStatus === "pricing_in_progress";

  const {
    data: summary,
    isLoading,
    refetch,
    isFetching,
  } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId),
    enabled: !!eventId && authReady,
    refetchOnWindowFocus: false,
    staleTime: 1000 * 60 * 5,
    // Poll summary while pipeline is active so prices appear as soon as the
    // backend finishes, even if the WS transition is missed.
    refetchInterval: isPipelineActive ? 3_000 : false,
  });

  // AUTOMATIC SYNC LOGIC
  // Triggers a full inventory refetch the moment Gemini finishes its analysis.
  useEffect(() => {
    const isTransitioningFromBusyToReady =
      (lastStatus.current === "processing" ||
        lastStatus.current === "pricing_in_progress") &&
      (currentStatus === "ready_for_review" ||
        currentStatus === "live" ||
        currentStatus === "failed");

    if (isTransitioningFromBusyToReady) {
      refetch();
    }

    lastStatus.current = currentStatus;
  }, [currentStatus, refetch]);

  const isPricing = currentStatus === "pricing_in_progress";
  const isProcessing = currentStatus === "processing";

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
    isSoldOut:
      currentStatus === "partially_sold" &&
      summary?.bundles?.every((b) => b.items.length === 0),
  };
}
