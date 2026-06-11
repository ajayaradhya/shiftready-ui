"use client";

import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Message } from "@myrio/types";

const WS_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080")
  .replace(/^http/, "ws");

const INITIAL_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

export function useMessagesWs(token: string | null, activeConvId?: string) {
  const qc = useQueryClient();

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(INITIAL_RECONNECT_MS);
  const mountedRef = useRef(false);
  const connectRef = useRef<() => void>(() => undefined);

  // Stable refs so closures always get latest values without re-connecting
  const qcRef = useRef(qc);
  useEffect(() => { qcRef.current = qc; }, [qc]);
  const activeConvIdRef = useRef(activeConvId);
  useEffect(() => { activeConvIdRef.current = activeConvId; }, [activeConvId]);

  useEffect(() => {
    if (!token) return;

    mountedRef.current = true;
    delayRef.current = INITIAL_RECONNECT_MS;

    function connect() {
      if (!mountedRef.current) return;

      const url = `${WS_BASE}/api/v1/messages/ws?token=${encodeURIComponent(token!)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      let pingInterval: ReturnType<typeof setInterval> | null = null;

      ws.onopen = () => {
        if (!mountedRef.current) { ws.close(); return; }
        delayRef.current = INITIAL_RECONNECT_MS;
        // Catch up on any events missed while disconnected
        qcRef.current.invalidateQueries({ queryKey: ["conversations"] });
        qcRef.current.invalidateQueries({ queryKey: ["unread-count"] });
        qcRef.current.invalidateQueries({ queryKey: ["notif-unread-count"] });
        pingInterval = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) ws.send("ping");
        }, 60_000);
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string);
          const convId: string = payload.conversationId;
          const activeId = activeConvIdRef.current;

          const appendMsg = (msg: Message) => {
            if (convId !== activeId || !msg) return;
            qcRef.current.setQueryData(
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

          if (
            payload.type === "message.new" ||
            payload.type === "conversation.pin_changed"
          ) {
            appendMsg(payload.message as Message);
            qcRef.current.invalidateQueries({ queryKey: ["conversations"] });
            qcRef.current.invalidateQueries({ queryKey: ["unread-count"] });
          } else if (payload.type === "conversation.deal_agreed") {
            if (payload.message) appendMsg(payload.message as Message);
            if (payload.dealMessage) appendMsg(payload.dealMessage as Message);
            qcRef.current.invalidateQueries({ queryKey: ["conversations"] });
            qcRef.current.invalidateQueries({ queryKey: ["unread-count"] });
          } else if (payload.type === "offer.updated") {
            if (convId === activeId) {
              qcRef.current.invalidateQueries({ queryKey: ["messages", convId] });
            }
            qcRef.current.invalidateQueries({ queryKey: ["conversations"] });
          } else if (payload.type === "notification.new") {
            qcRef.current.invalidateQueries({ queryKey: ["notifications"] });
            qcRef.current.invalidateQueries({ queryKey: ["notif-unread-count"] });
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (pingInterval) clearInterval(pingInterval);
        wsRef.current = null;
        if (!mountedRef.current) return;
        // Exponential backoff — doubles on each failure, capped at MAX_RECONNECT_MS
        retryRef.current = setTimeout(() => {
          delayRef.current = Math.min(delayRef.current * 2, MAX_RECONNECT_MS);
          connectRef.current();
        }, delayRef.current);
      };

      ws.onerror = () => { ws.close(); };
    }

    connectRef.current = connect;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [token]);
}
