"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useState } from "react";
import { checkUsernameAvailable, getMe, updateUsername } from "@shiftready/api";
import { useAuth } from "@/hooks/use-auth";

export function useUsername() {
  const queryClient = useQueryClient();
  const { idToken } = useAuth();

  const profileQuery = useQuery({
    queryKey: ["user-profile"],
    queryFn: getMe,
    staleTime: 5 * 60 * 1000,
    enabled: !!idToken,
  });

  const updateMutation = useMutation({
    mutationFn: (username: string) => updateUsername(username),
    onSuccess: (data) => {
      queryClient.setQueryData(["user-profile"], data);
    },
  });

  return {
    profile: profileQuery.data,
    isLoading: profileQuery.isLoading,
    update: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error?.message,
  };
}

export function useUsernameAvailability() {
  const [debouncedValue, setDebouncedValue] = useState("");
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const check = useCallback((value: string) => {
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedValue(value), 400);
    setTimer(t);
  }, [timer]);

  const availabilityQuery = useQuery({
    queryKey: ["username-available", debouncedValue],
    queryFn: () => checkUsernameAvailable(debouncedValue),
    enabled: debouncedValue.length >= 3,
    staleTime: 10_000,
  });

  return {
    check,
    available: availabilityQuery.data?.available,
    isChecking: availabilityQuery.isFetching,
  };
}
