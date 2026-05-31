"use client";

import { use, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import { ConversationList } from "@/components/features/messages/ConversationList";
import { ConversationView } from "@/components/features/messages/ConversationView";

export default function ThreadPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { user, idToken } = useAuth();
  const router = useRouter();
  const { data: convs, isLoading, refetch } = useConversations();

  useMessagesWs(idToken, conversationId);

  const conversation = convs?.find((c) => c.id === conversationId);

  if (isLoading) {
    return (
      <div style={{ height: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>Loading…</span>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div style={{ height: "calc(100vh - 64px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>Conversation not found.</span>
      </div>
    );
  }

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Sidebar */}
      <div
        className="hidden md:flex flex-col"
        style={{
          width: 320,
          borderRight: "1px solid var(--sr-border-subtle)",
          flexShrink: 0,
          overflow: "hidden",
          background: "var(--sr-bg-app)",
        }}
      >
        <ConversationList activeId={conversationId} basePath="/messages" />
      </div>

      {/* Thread */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {user && (
          <ConversationView
            convId={conversationId}
            currentUserId={user.uid}
            conversation={conversation}
            onRefresh={() => refetch()}
            saleBasePath="/seller-central/inventory"
          />
        )}
      </div>
    </div>
  );
}
