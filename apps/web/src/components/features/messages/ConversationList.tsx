"use client";

import { useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useConversations } from "@/hooks/use-conversations";
import type { ConversationSummary } from "@shiftready/types";

function formatRelative(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  if (diffD < 7) return d.toLocaleDateString([], { weekday: "short" });
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
        alignItems: "flex-start",
        gap: 11,
        padding: "12px 14px",
        textDecoration: "none",
        background: active
          ? "var(--clay-50)"
          : hasUnread
          ? "var(--clay-50)"
          : "transparent",
        borderBottom: "1px solid var(--cream-200)",
        position: "relative",
        transition: "background 100ms",
      }}
      onMouseEnter={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background = "var(--cream-50)";
      }}
      onMouseLeave={(e) => {
        if (!active)
          (e.currentTarget as HTMLElement).style.background =
            hasUnread ? "var(--clay-50)" : "transparent";
      }}
    >
      {/* Active / unread left rail */}
      {(active || hasUnread) && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 3,
            background: active ? "var(--clay-500)" : "var(--clay-300)",
            borderRadius: "0 2px 2px 0",
          }}
        />
      )}

      {/* Avatar */}
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--clay-300), var(--clay-600))",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "var(--sr-font-serif)",
          flexShrink: 0,
        }}
      >
        {avatarInitial(conv.otherUsername)}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            marginBottom: 1,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: hasUnread ? 700 : 500,
              color: hasUnread ? "var(--ink-800)" : "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            @{conv.otherUsername ?? conv.otherUserId ?? "Unknown"}
          </span>
          <span
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              color: "var(--sr-text-muted)",
              flexShrink: 0,
            }}
          >
            {formatRelative(conv.lastMessageAt)}
          </span>
        </div>

        <div
          style={{
            fontSize: 12,
            color: hasUnread ? "var(--sr-text-secondary)" : "var(--sr-text-muted)",
            fontWeight: hasUnread ? 500 : 400,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            fontFamily: "var(--sr-font-sans)",
            lineHeight: 1.4,
          }}
        >
          {conv.lastMessage ?? "No messages yet"}
        </div>

        {/* Deal-active chip */}
        {(conv.dealStatus === "agreed" || conv.activeOfferId) && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              marginTop: 4,
              padding: "1px 7px",
              borderRadius: 9999,
              background: conv.dealStatus === "agreed" ? "var(--moss-50)" : "var(--honey-50)",
              color: conv.dealStatus === "agreed" ? "var(--moss-700)" : "var(--honey-700, #92400e)",
              border: `1px solid ${conv.dealStatus === "agreed" ? "var(--moss-200)" : "var(--honey-200, #fde68a)"}`,
              fontSize: 9.5,
              fontWeight: 600,
              fontFamily: "var(--sr-font-mono)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.06em",
            }}
          >
            {conv.dealStatus === "agreed" ? "Deal agreed" : "Offer active"}
          </span>
        )}
      </div>

      {/* Unread dot */}
      {hasUnread && (
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--clay-500)",
            flexShrink: 0,
            marginTop: 6,
          }}
        />
      )}
    </Link>
  );
}

export function ConversationList({
  activeId,
  basePath = "/messages",
  contextLabel,
}: {
  activeId?: string;
  basePath?: string;
  contextLabel?: string;
}) {
  const { data: convs, isLoading, error } = useConversations();
  const [search, setSearch] = useState("");
  const [focused, setFocused] = useState(false);

  const totalUnread = convs?.reduce((n, c) => n + c.unreadCount, 0) ?? 0;

  const filtered = convs?.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (c.otherUsername ?? "").toLowerCase().includes(q) ||
      (c.lastMessage ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "18px 16px 12px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 11,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 19,
                fontWeight: 500,
                letterSpacing: "-0.015em",
                color: "var(--ink-800)",
              }}
            >
              Messages
            </span>
            {contextLabel && (
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--sr-font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--clay-600)",
                  background: "var(--clay-50)",
                  border: "1px solid var(--clay-200)",
                  borderRadius: "var(--sr-radius-sm)",
                  padding: "2px 7px",
                }}
              >
                {contextLabel}
              </span>
            )}
          </div>
          {totalUnread > 0 && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minWidth: 18,
                height: 18,
                padding: "0 5px",
                background: "var(--clay-500)",
                color: "#fff",
                borderRadius: 9999,
                fontSize: 10,
                fontWeight: 700,
                fontFamily: "var(--sr-font-sans)",
              }}
            >
              {totalUnread}
            </span>
          )}
        </div>

        {/* Search */}
        <div style={{ position: "relative" }}>
          <Search
            size={12}
            strokeWidth={1.75}
            style={{
              position: "absolute",
              left: 9,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--sr-text-muted)",
              pointerEvents: "none",
            }}
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search conversationsâ€¦"
            style={{
              width: "100%",
              height: 32,
              paddingLeft: 30,
              paddingRight: 10,
              background: "var(--cream-100)",
              border: `1px solid ${focused ? "var(--clay-400)" : "var(--sr-border-subtle)"}`,
              borderRadius: 9999,
              fontSize: 12,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>
      </div>

      {/* List body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {isLoading && (
          <div
            style={{
              padding: 24,
              color: "var(--sr-text-muted)",
              fontSize: 13,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Loadingâ€¦
          </div>
        )}

        {error && (
          <div
            style={{
              padding: 24,
              color: "var(--rust-500, #e05252)",
              fontSize: 13,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Failed to load conversations
          </div>
        )}

        {!isLoading && !error && !filtered?.length && (
          <div
            style={{
              padding: 32,
              textAlign: "center",
              color: "var(--sr-text-muted)",
              fontSize: 13,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            {search ? "No results" : "No conversations yet."}
          </div>
        )}

        {filtered?.map((c) => (
          <ConvRow key={c.id} conv={c} active={c.id === activeId} basePath={basePath} />
        ))}
      </div>
    </div>
  );
}
