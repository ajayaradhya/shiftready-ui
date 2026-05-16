"use client";

import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/features/messages/ConversationList";

export default function InboxPage() {
  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid var(--sr-border-subtle)",
          flexShrink: 0,
          overflowY: "auto",
          background: "var(--sr-bg-app)",
        }}
      >
        <div
          style={{
            padding: "20px 16px 12px",
            borderBottom: "1px solid var(--sr-border-subtle)",
          }}
        >
          <h1
            style={{
              fontSize: 17,
              fontWeight: 700,
              fontFamily: "var(--sr-font-serif)",
              color: "var(--sr-text-primary)",
            }}
          >
            Messages
          </h1>
        </div>
        <ConversationList basePath="/messages" />
      </div>

      {/* Empty state when no conversation selected */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          color: "var(--sr-text-muted)",
          fontFamily: "var(--sr-font-sans)",
        }}
      >
        <MessageSquare size={40} strokeWidth={1} />
        <span style={{ fontSize: 14 }}>Select a conversation</span>
      </div>
    </div>
  );
}
