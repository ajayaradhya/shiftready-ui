"use client";

import Link from "next/link";
import { useConversations } from "@/hooks/use-conversations";
import type { ConversationSummary } from "@/lib/types";

function formatRelative(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function ConvRow({ conv, active }: { conv: ConversationSummary; active: boolean }) {
  return (
    <Link
      href={`/messages/${conv.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        textDecoration: "none",
        background: active ? "var(--clay-50)" : "transparent",
        borderLeft: active ? "3px solid var(--clay-500)" : "3px solid transparent",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
      }}
      onMouseLeave={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "transparent";
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--clay-100)",
          color: "var(--clay-700)",
          display: "grid",
          placeItems: "center",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "var(--sr-font-serif)",
          flexShrink: 0,
        }}
      >
        {(conv.otherUsername ?? "?").slice(0, 1).toUpperCase()}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: conv.unreadCount > 0 ? 700 : 500,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: 140,
            }}
          >
            @{conv.otherUsername ?? conv.otherUserId ?? "Unknown"}
          </span>
          <span
            style={{
              fontSize: 10,
              color: "var(--sr-text-muted)",
              fontFamily: "var(--sr-font-mono)",
              flexShrink: 0,
            }}
          >
            {formatRelative(conv.lastMessageAt)}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
          <span
            style={{
              fontSize: 12,
              color: conv.unreadCount > 0 ? "var(--sr-text-primary)" : "var(--sr-text-muted)",
              fontWeight: conv.unreadCount > 0 ? 500 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            {conv.lastMessage ?? "No messages yet"}
          </span>
          {conv.unreadCount > 0 && (
            <span
              style={{
                background: "var(--clay-500)",
                color: "#fff",
                borderRadius: 10,
                padding: "1px 6px",
                fontSize: 10,
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ConversationList({ activeId }: { activeId?: string }) {
  const { data: convs, isLoading, error } = useConversations();

  if (isLoading) {
    return (
      <div style={{ padding: 24, color: "var(--sr-text-muted)", fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, color: "var(--rust-500)", fontSize: 13 }}>
        Failed to load conversations
      </div>
    );
  }

  if (!convs?.length) {
    return (
      <div
        style={{
          padding: 32,
          textAlign: "center",
          color: "var(--sr-text-muted)",
          fontSize: 13,
          fontFamily: "var(--sr-font-sans)",
        }}
      >
        No conversations yet.
      </div>
    );
  }

  return (
    <div>
      {convs.map((c) => (
        <ConvRow key={c.id} conv={c} active={c.id === activeId} />
      ))}
    </div>
  );
}
