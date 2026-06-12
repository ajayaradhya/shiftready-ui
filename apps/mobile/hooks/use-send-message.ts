import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sendMessage } from "@myrio/api";
import type { Message, MessageContext } from "@myrio/types";

type MessagesCache =
  | { pages: { messages: Message[] }[]; pageParams: unknown[] }
  | undefined;

/** Local-only message states layered on top of the server Message type. */
export type LocalMessage = Message & { _local?: "sending" | "failed" };

function appendToFirstPage(old: MessagesCache, msg: Message): MessagesCache {
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

function replaceMessage(old: MessagesCache, tempId: string, msg: LocalMessage): MessagesCache {
  if (!old) return old;
  return {
    ...old,
    pages: old.pages.map((p) => ({
      ...p,
      messages: p.messages.map((m) => (m.id === tempId ? msg : m)),
    })),
  };
}

export function useRemoveLocalMessage(convId: string) {
  const qc = useQueryClient();
  return (tempId: string) => {
    qc.setQueryData(["messages", convId], (old: MessagesCache) => {
      if (!old) return old;
      return {
        ...old,
        pages: old.pages.map((p) => ({
          ...p,
          messages: p.messages.filter((m) => m.id !== tempId),
        })),
      };
    });
  };
}

/**
 * Optimistic send: the bubble appears instantly with a "sending" marker,
 * flips to the server message on success, or to "failed" (tap to retry).
 */
export function useSendMessage(convId: string, myUid: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ text, context }: { text: string; context?: MessageContext; tempId?: string }) =>
      sendMessage(convId, text, context),
    onMutate: (vars) => {
      const tempId = vars.tempId ?? `local-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const optimistic: LocalMessage = {
        id: tempId,
        senderId: myUid,
        text: vars.text,
        createdAt: new Date().toISOString(),
        type: "text",
        _local: "sending",
      };
      qc.setQueryData(["messages", convId], (old: MessagesCache) => {
        // Retry path: the failed bubble is already in the cache.
        const exists = old?.pages.some((p) => p.messages.some((m) => m.id === tempId));
        if (exists) {
          return replaceMessage(old, tempId, optimistic);
        }
        return appendToFirstPage(old, optimistic);
      });
      return { tempId };
    },
    onSuccess: (msg: Message, _vars, ctx) => {
      qc.setQueryData(["messages", convId], (old: MessagesCache) =>
        replaceMessage(old, ctx.tempId, msg)
      );
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
    onError: (_err, vars, ctx) => {
      if (!ctx) return;
      qc.setQueryData(["messages", convId], (old: MessagesCache) =>
        replaceMessage(old, ctx.tempId, {
          id: ctx.tempId,
          senderId: myUid,
          text: vars.text,
          createdAt: new Date().toISOString(),
          type: "text",
          _local: "failed",
        })
      );
    },
  });
}
