"use client";

import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "@shiftready/api";
import type { Message } from "@shiftready/types";
import { useAuth } from "@/hooks/use-auth";

export function useMessages(convId: string) {
  const { idToken } = useAuth();
  return useInfiniteQuery({
    queryKey: ["messages", convId],
    queryFn: ({ pageParam }: { pageParam: string | undefined }) =>
      getMessages(convId, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => {
      const msgs = lastPage.messages;
      if (msgs.length < 50) return undefined;
      return msgs[0]?.id;
    },
    staleTime: 0,
    enabled: !!convId && !!idToken,
  });
}

export function useAppendMessage() {
  const qc = useQueryClient();
  return (convId: string, msg: Message) => {
    qc.setQueryData(
      ["messages", convId],
      (old: ReturnType<typeof useMessages>["data"]) => {
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
  };
}
