"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getNotifications,
  getNotifUnreadCount,
  markNotifRead,
  markAllNotifsRead,
} from "@/lib/api";
import { useAuth } from "./use-auth";

export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
    staleTime: 60_000,
  });
}

export function useNotifUnreadCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["notif-unread-count"],
    queryFn: getNotifUnreadCount,
    enabled: !!user,
    staleTime: 30_000,
  });
}

export function useMarkNotifRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markNotifRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-unread-count"] });
    },
  });
}

export function useMarkAllNotifsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: markAllNotifsRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["notifications"] });
      qc.invalidateQueries({ queryKey: ["notif-unread-count"] });
    },
  });
}
