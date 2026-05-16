"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadCount, listConversations } from "@/lib/api";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useInvalidateConversations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["unread-count"] });
  };
}
