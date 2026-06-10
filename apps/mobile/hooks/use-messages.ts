import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { getMessages } from "@myrio/api";
import type { Message } from "@myrio/types";
import { useAuth } from "@/contexts/auth-context";

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
  };
}
