"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@/lib/types";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
  .replace(/^http/, "ws");

export function useMessagesWs(token: string | null, activeConvId?: string) {
  const qc = useQueryClient();
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    const url = `${WS_BASE}/api/v1/messages/ws?token=${encodeURIComponent(token)}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);

        const appendMsg = (msg: Message, convId: string) => {
          if (convId === activeConvId && msg) {
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
          }
        };

        if (
          payload.type === "message.new" ||
          payload.type === "conversation.pin_changed"
        ) {
          const msg: Message = payload.message;
          const convId: string = payload.conversationId;
          appendMsg(msg, convId);
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["unread-count"] });
        } else if (payload.type === "conversation.deal_agreed") {
          const convId: string = payload.conversationId;
          if (payload.message) appendMsg(payload.message as Message, convId);
          if (payload.dealMessage) appendMsg(payload.dealMessage as Message, convId);
          qc.invalidateQueries({ queryKey: ["conversations"] });
          qc.invalidateQueries({ queryKey: ["unread-count"] });
        } else if (payload.type === "offer.updated") {
          // Refresh offer card states by invalidating messages
          const convId: string = payload.conversationId;
          if (convId === activeConvId) {
            qc.invalidateQueries({ queryKey: ["messages", convId] });
          }
          qc.invalidateQueries({ queryKey: ["conversations"] });
        }
      } catch {
        // ignore parse errors
      }
    };

    ws.onerror = () => {};

    const pingInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 60_000);

    return () => {
      clearInterval(pingInterval);
      ws.close();
      wsRef.current = null;
    };
  }, [token, activeConvId, qc]);
}
