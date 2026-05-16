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

function avatarInitial(username: string | null | undefined) {
  return (username ?? "?").slice(0, 1).toUpperCase();
}

function ConvRow({
  conv,
  active,
  basePath,
}: {
  conv: ConversationSummary;
  active: boolean;
  basePath: string;
}) {
  const hasUnread = conv.unreadCount > 0;

  return (
    <Link
      href={`${basePath}/${conv.id}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 16px",
        textDecoration: "none",
        background: active
          ? "var(--clay-50)"
          : hasUnread
          ? "var(--clay-50)"
          : "transparent",
        borderLeft: active ? "3px solid var(--clay-500)" : "3px solid transparent",
        transition: "background 120ms",
      }}
      onMouseEnter={(e) => {
        if (!active) (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background =
            hasUnread ? "var(--clay-50)" : "transparent";
      }}
    >
      {/* Gradient avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--clay-300), var(--clay-500))",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 15,
          fontWeight: 700,
          fontFamily: "var(--sr-font-serif)",
          flexShrink: 0,
        }}
      >
        {avatarInitial(conv.otherUsername)}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 4 }}>
          <span
            style={{
              fontSize: 13,
              fontWeight: hasUnread ? 700 : 500,
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
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <span
              style={{
                fontSize: 10,
                color: "var(--sr-text-muted)",
                fontFamily: "var(--sr-font-mono)",
              }}
            >
              {formatRelative(conv.lastMessageAt)}
            </span>
            {/* Red unread dot */}
            {hasUnread && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--rust-500, #e05252)",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        </div>
        <div style={{ marginTop: 2 }}>
          <span
            style={{
              fontSize: 12,
              color: hasUnread ? "var(--sr-text-primary)" : "var(--sr-text-muted)",
              fontWeight: hasUnread ? 500 : 400,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              display: "block",
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            {conv.lastMessage ?? "No messages yet"}
          </span>
        </div>
      </div>
    </Link>
  );
}

export function ConversationList({
  activeId,
  basePath = "/messages",
}: {
  activeId?: string;
  basePath?: string;
}) {
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
        <ConvRow key={c.id} conv={c} active={c.id === activeId} basePath={basePath} />
      ))}
    </div>
  );
}
