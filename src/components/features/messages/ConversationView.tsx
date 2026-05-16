"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useSendMessage } from "@/hooks/use-send-message";
import { markConversationRead } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { BlockButton } from "./BlockButton";
import type { ConversationSummary } from "@/lib/types";

interface ConversationViewProps {
  convId: string;
  currentUserId: string;
  conversation: ConversationSummary;
  onRefresh: () => void;
}

export function ConversationView({
  convId,
  currentUserId,
  conversation,
  onRefresh,
}: ConversationViewProps) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(convId);
  const sendMutation = useSendMessage(convId);
  const bottomRef = useRef<HTMLDivElement>(null);

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  useEffect(() => {
    markConversationRead(convId).catch(() => {});
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const isBlocked = conversation.status === "blocked";
  const isBlocker = isBlocked; // simplified: if blocked, current user may be blocker — BlockButton handles real auth

  const handleSend = (text: string) => {
    sendMutation.mutate({ text });
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--sr-bg-card)",
          flexShrink: 0,
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* Gradient avatar */}
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--clay-300), var(--clay-500))",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 14,
              fontWeight: 700,
              fontFamily: "var(--sr-font-serif)",
              flexShrink: 0,
            }}
          >
            {(conversation.otherUsername ?? "?").slice(0, 1).toUpperCase()}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                  fontFamily: "var(--sr-font-sans)",
                }}
              >
                @{conversation.otherUsername ?? "Unknown"}
              </span>
              {/* Verified badge */}
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "var(--sr-font-mono)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--moss-700, #2d6a4f)",
                  background: "var(--moss-50, #e8f5ee)",
                  border: "1px solid var(--moss-200, #b7dfc8)",
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                Verified
              </span>
            </div>
            {isBlocked && (
              <div style={{ fontSize: 11, color: "var(--rust-500)", marginTop: 1 }}>
                Conversation blocked
              </div>
            )}
          </div>
        </div>
        <BlockButton
          convId={convId}
          isBlocked={isBlocked}
          isBlocker={isBlocker}
          onToggle={onRefresh}
        />
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            style={{
              alignSelf: "center",
              padding: "4px 12px",
              fontSize: 12,
              color: "var(--clay-600)",
              background: "transparent",
              border: "1px solid var(--sr-border-subtle)",
              borderRadius: 12,
              cursor: "pointer",
              marginBottom: 8,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Load older messages
          </button>
        )}

        {isLoading && (
          <div style={{ textAlign: "center", color: "var(--sr-text-muted)", fontSize: 13 }}>
            Loading…
          </div>
        )}

        {allMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.senderId === currentUserId}
          />
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        disabled={isBlocked || sendMutation.isPending}
        placeholder={isBlocked ? "Conversation blocked" : "Type a message…"}
      />
    </div>
  );
}
