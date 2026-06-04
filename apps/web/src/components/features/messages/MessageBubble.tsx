import type { Message } from "@shiftready/types";
import { SaleContextChip } from "./SaleContextChip";
import { formatTimeAU } from "@shiftready/core";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showSender?: boolean;
  senderUsername?: string | null;
}

function avatarInitial(username: string | null | undefined) {
  return (username ?? "?").slice(0, 1).toUpperCase();
}

export function MessageBubble({ message, isOwn, showSender, senderUsername }: MessageBubbleProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: isOwn ? "flex-end" : "flex-start",
        marginBottom: 4,
      }}
    >
      {message.context && <SaleContextChip context={message.context} />}

      {/* Sender row for non-own messages */}
      {!isOwn && showSender && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 5,
            fontFamily: "var(--sr-font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            color: "var(--sr-text-muted)",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--clay-300), var(--clay-600))",
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 8,
              fontWeight: 700,
              fontFamily: "var(--sr-font-sans)",
              flexShrink: 0,
            }}
          >
            {avatarInitial(senderUsername)}
          </div>
          {senderUsername ?? "User"}
        </div>
      )}

      <div
        style={{
          maxWidth: "66%",
          padding: "9px 14px",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isOwn ? "var(--clay-500)" : "var(--sr-bg-card)",
          color: isOwn ? "#fff" : "var(--sr-text-primary)",
          border: isOwn ? "none" : "1px solid var(--sr-border-subtle)",
          fontSize: 14,
          lineHeight: 1.48,
          fontFamily: "var(--sr-font-sans)",
          wordBreak: "break-word",
        }}
      >
        {message.text}
      </div>

      <span
        style={{
          fontSize: 10,
          color: "var(--sr-text-muted)",
          marginTop: 3,
          fontFamily: "var(--sr-font-mono)",
          alignSelf: isOwn ? "flex-end" : "flex-start",
        }}
      >
        {formatTimeAU(message.createdAt)}
      </span>
    </div>
  );
}
