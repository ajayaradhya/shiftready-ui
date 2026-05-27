"use client";

import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/features/messages/ConversationList";

export default function InboxPage() {
  useEffect(() => { document.title = "Messages - ShiftReady"; }, []);
  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        style={{
          width: 320,
          borderRight: "1px solid var(--sr-border-subtle)",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--sr-bg-app)",
        }}
      >
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
