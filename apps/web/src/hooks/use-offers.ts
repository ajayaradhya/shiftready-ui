"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendOffer, acceptOffer, counterOffer, withdrawOffer } from "@myrio/api";
import type { Message } from "@myrio/types";
import { toast } from "sonner";

function appendMessage(qc: ReturnType<typeof useQueryClient>, convId: string, msg: Message) {
  qc.setQueryData(
    ["messages", convId],
    (old: { pages: { messages: Message[] }[]; pageParams: unknown[] } | undefined) => {
      if (!old) return old;
      const firstPage = old.pages[0];
      const already = firstPage.messages.some((m) => m.id === msg.id);
      if (already) return old;
      return {
        ...old,
        pages: [
          { ...firstPage, messages: [...firstPage.messages, msg] },
          ...old.pages.slice(1),
        ],
      };
    }
  );
  qc.invalidateQueries({ queryKey: ["conversations"] });
}

export function useSendOffer(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ amount, parentOfferId }: { amount: number; parentOfferId?: string | null }) =>
      sendOffer(convId, amount, parentOfferId),
    onSuccess: (msg) => appendMessage(qc, convId, msg),
    onError: (err: Error) => toast.error(err.message || "Failed to send offer"),
  });
}

export function useAcceptOffer(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) => acceptOffer(convId, offerId),
    onSuccess: (msg) => appendMessage(qc, convId, msg),
    onError: (err: Error) => toast.error(err.message || "Failed to accept offer"),
  });
}

export function useCounterOffer(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId, amount }: { offerId: string; amount: number }) =>
      counterOffer(convId, offerId, amount),
    onSuccess: (msg) => appendMessage(qc, convId, msg),
    onError: (err: Error) => toast.error(err.message || "Failed to send counter offer"),
  });
}

export function useWithdrawOffer(convId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ offerId }: { offerId: string }) => withdrawOffer(convId, offerId),
    onSuccess: (msg) => appendMessage(qc, convId, msg),
    onError: (err: Error) => toast.error(err.message || "Failed to withdraw offer"),
  });
}
