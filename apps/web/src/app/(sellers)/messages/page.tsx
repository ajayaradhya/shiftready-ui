"use client";

import { useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { ConversationList } from "@/components/features/messages/ConversationList";

export default function InboxPage() {
  useEffect(() => { document.title = "Messages - Myrio"; }, []);
  return (
    <div style={{ height: "calc(100dvh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Sidebar — full width on mobile, 320px on desktop */}
      <div
        className="flex-1 md:flex-none"
        style={{
          width: "100%",
          maxWidth: "100%",
          borderRight: "1px solid var(--sr-border-subtle)",
          flexShrink: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--sr-bg-app)",
        }}
      >
        <ConversationList basePath="/messages" contextLabel="Seller" />
      </div>

      {/* Empty state — desktop only */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
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
