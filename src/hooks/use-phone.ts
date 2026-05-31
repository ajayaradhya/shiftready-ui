"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { revealPhone, sharePhone, updateMyPhone } from "@/lib/api";
import { toast } from "sonner";

export function useRevealPhone(convId: string) {
  const [phone, setPhone] = useState<string | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  const mutation = useMutation({
    mutationFn: () => revealPhone(convId),
    onSuccess: (data) => {
      setPhone(data.phoneE164);
      setIsRevealed(true);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to reveal phone number"),
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
    onError: (err: Error) => toast.error(err.message || "Failed to share phone number"),
  });
}

export function useUpdateMyPhone() {
  return useMutation({
    mutationFn: ({ phoneE164, shareOptIn }: { phoneE164: string; shareOptIn: boolean }) =>
      updateMyPhone(phoneE164, shareOptIn),
    onError: (err: Error) => toast.error(err.message || "Failed to update phone number"),
  });
}
