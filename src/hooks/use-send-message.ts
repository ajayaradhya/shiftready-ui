"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@/lib/api";
import type { Message, MessageContext } from "@/lib/types";

export function useSendMessage(convId: string) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ text, context }: { text: string; context?: MessageContext }) =>
      sendMessage(convId, text, context),
    onSuccess: (msg: Message) => {
      qc.setQueryData(
        ["messages", convId],
        (old: { pages: { messages: Message[] }[]; pageParams: unknown[] } | undefined) => {
          if (!old) return old;
          const firstPage = old.pages[0];
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
    },
  });
}
