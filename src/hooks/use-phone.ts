"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revealPhone, sharePhone, updateMyPhone } from "@/lib/api";

export function useRevealPhone(convId: string) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const mutation = useMutation({
    mutationFn: () => revealPhone(convId),
    onSuccess: (data) => {
      setPhone(data.phoneE164);
      setIsRevealed(true);
    },
  });

  return {
    phone,
    isRevealed,
    reveal: () => mutation.mutate(),
    isPending: mutation.isPending,
    error: mutation.error instanceof Error ? mutation.error.message : null,
  };
}

export function useSharePhone(convId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => sharePhone(convId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateMyPhone() {
  return useMutation({
    mutationFn: ({ phoneE164, shareOptIn }: { phoneE164: string; shareOptIn: boolean }) =>
      updateMyPhone(phoneE164, shareOptIn),
  });
}
