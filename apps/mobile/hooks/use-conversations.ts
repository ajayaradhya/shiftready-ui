import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnreadCount, listConversations } from "@myrio/api";
import { useAuth } from "@/contexts/auth-context";

export function useConversations() {
  const { idToken } = useAuth();
  return useQuery({
    queryKey: ["conversations"],
    queryFn: listConversations,
    staleTime: 30_000,
    enabled: !!idToken,
  });
}

export function useUnreadCount() {
  const { idToken } = useAuth();
  return useQuery({
    queryKey: ["unread-count"],
    queryFn: getUnreadCount,
    refetchInterval: 30_000,
    staleTime: 15_000,
    refetchOnMount: false,
    placeholderData: { unreadCount: 0 },
    enabled: !!idToken,
  });
}

export function useInvalidateConversations() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ["conversations"] });
    qc.invalidateQueries({ queryKey: ["unread-count"] });
  };
}
