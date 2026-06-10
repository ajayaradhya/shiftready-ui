import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@myrio/api";
import type { Message, MessageContext } from "@myrio/types";
import { Alert } from "react-native";

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
          if (firstPage.messages.some((m) => m.id === msg.id)) return old;
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
    onError: (err: Error) => Alert.alert("Error", err.message || "Failed to send message"),
  });
}
