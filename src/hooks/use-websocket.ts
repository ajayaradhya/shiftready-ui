"use client";

import { useEffect, useRef, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
// Convert http(s):// → ws(s):// for the WebSocket base URL
const WS_BASE = API_URL.replace(/^http/, "ws");

export interface WsMessage {
  type: string;
  status?: string;
  message?: string;
}

const INITIAL_RECONNECT_MS = 1_000;
const MAX_RECONNECT_MS = 30_000;

export function useWebSocket(
  eventId: string | null,
  token: string | null,
  onMessage: (msg: WsMessage) => void
): { isConnected: boolean } {
  const [isConnected, setIsConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayRef = useRef(INITIAL_RECONNECT_MS);
  const mountedRef = useRef(false);

  // Stable ref so the reconnect closure always calls the latest onMessage
  const onMsgRef = useRef(onMessage);
  useEffect(() => {
    onMsgRef.current = onMessage;
  }, [onMessage]);

  // connectRef holds the connect fn so ws.onclose can call it without a
  // circular useCallback dependency. Updated in the same effect as the connect
  // call so it's always current when onclose fires.
  const connectRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!eventId || !token) return;

    mountedRef.current = true;
    delayRef.current = INITIAL_RECONNECT_MS;

    function connect() {
      if (!mountedRef.current) return;

      const url = `${WS_BASE}/api/v1/sales/${eventId}/ws?token=${encodeURIComponent(token!)}`;
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!mountedRef.current) {
          ws.close();
          return;
        }
        setIsConnected(true);
        delayRef.current = INITIAL_RECONNECT_MS;
      };

      ws.onmessage = (event) => {
        try {
          onMsgRef.current(JSON.parse(event.data as string) as WsMessage);
        } catch {
          // ignore malformed frames
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        wsRef.current = null;
        if (!mountedRef.current) return;
        // Exponential backoff - doubles on each failure, capped at MAX_RECONNECT_MS
        retryRef.current = setTimeout(() => {
          delayRef.current = Math.min(delayRef.current * 2, MAX_RECONNECT_MS);
          connectRef.current();
        }, delayRef.current);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connectRef.current = connect;
    connect();

    return () => {
      mountedRef.current = false;
      if (retryRef.current) clearTimeout(retryRef.current);
      wsRef.current?.close();
    };
  }, [eventId, token]);

  return { isConnected };
}
