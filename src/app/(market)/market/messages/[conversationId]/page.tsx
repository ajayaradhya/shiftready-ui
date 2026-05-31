"use client";

import { use } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import { ConversationList } from "@/components/features/messages/ConversationList";
import { ConversationView } from "@/components/features/messages/ConversationView";
import { MessageSquare, LogIn } from "lucide-react";
import Link from "next/link";

export default function MarketConversationPage({
  params,
}: {
  params: Promise<{ conversationId: string }>;
}) {
  const { conversationId } = use(params);
  const { user, loading, idToken } = useAuth();
  const { data: convs, isLoading: convsLoading, refetch } = useConversations();

  useMessagesWs(idToken, conversationId);

  if (loading) {
    return (
      <div
        style={{
          height: "calc(100vh - 64px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div
        style={{
          height: "calc(100vh - 64px)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
          padding: "0 24px",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-50)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <MessageSquare size={24} color="var(--clay-500)" strokeWidth={1.5} />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 22,
              fontWeight: 500,
              color: "var(--sr-text-primary)",
              marginBottom: 8,
            }}
          >
            Sign in to view messages
          </p>
        </div>
        <Link
          href="/login"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 20px",
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--clay-500)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            fontFamily: "var(--sr-font-sans)",
            textDecoration: "none",
          }}
        >
          <LogIn size={15} strokeWidth={1.5} />
          Sign in
        </Link>
      </div>
    );
  }

  const conversation = convs?.find((c) => c.id === conversationId);

  return (
    <div style={{ height: "calc(100vh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Conv list panel - hidden on mobile */}
      <div
        className="hidden md:flex flex-col"
        style={{
          width: 320,
          flexShrink: 0,
          borderRight: "1px solid var(--sr-border-subtle)",
          overflow: "hidden",
          background: "var(--sr-bg-app)",
        }}
      >
        <ConversationList activeId={conversationId} basePath="/market/messages" />
      </div>

      {/* Chat pane */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {convsLoading ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
              Loading…
            </span>
          </div>
        ) : !conversation ? (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <MessageSquare size={36} color="var(--ink-200)" strokeWidth={1} />
            <span style={{ fontSize: 13, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
              Conversation not found
            </span>
          </div>
        ) : (
          <ConversationView
            convId={conversationId}
            currentUserId={user.uid}
            conversation={conversation}
            onRefresh={() => refetch()}
          />
        )}
      </div>
    </div>
  );
}
