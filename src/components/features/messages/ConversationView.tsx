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
          padding: "14px 20px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--sr-bg-card)",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            @{conversation.otherUsername ?? "Unknown"}
          </div>
          {isBlocked && (
            <div style={{ fontSize: 11, color: "var(--rust-500)", marginTop: 2 }}>
              Conversation blocked
            </div>
          )}
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
