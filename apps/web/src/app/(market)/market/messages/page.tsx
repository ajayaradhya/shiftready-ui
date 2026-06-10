"use client";

import { useEffect } from "react";
import { MessageSquare, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";
import { ConversationList } from "@/components/features/messages/ConversationList";

export default function MarketMessagesPage() {
  const { user, loading } = useAuth();
  useEffect(() => { document.title = "Messages - Myrio"; }, []);

  if (loading) {
    return (
      <div
        style={{
          height: "calc(100dvh - 64px)",
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
          height: "calc(100dvh - 64px)",
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
          <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 300 }}>
            Message sellers, ask questions, and arrange pickups - all in one place.
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

  return (
    <div style={{ height: "calc(100dvh - 64px)", display: "flex", overflow: "hidden" }}>
      {/* Conv list panel — full width on mobile, 320px sidebar on desktop */}
      <div
        className="flex-1 md:flex-none"
        style={{
          width: "100%",
          maxWidth: "100%",
          flexShrink: 0,
          borderRight: "1px solid var(--sr-border-subtle)",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          background: "var(--sr-bg-app)",
        }}
      >
        <ConversationList basePath="/market/messages" contextLabel="Buyer" />
      </div>

      {/* Empty right pane — desktop only */}
      <div
        className="hidden md:flex"
        style={{
          flex: 1,
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
        }}
      >
        <MessageSquare size={36} color="var(--ink-200)" strokeWidth={1} />
        <span
          style={{
            fontSize: 13,
            color: "var(--sr-text-muted)",
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          Select a conversation
        </span>
      </div>
    </div>
  );
}
