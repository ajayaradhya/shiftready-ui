import type { Message } from "@/lib/types";
import { SaleContextChip } from "./SaleContextChip";

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

function formatTime(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
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
      <div
        style={{
          maxWidth: "72%",
          padding: "9px 14px",
          borderRadius: isOwn ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
          background: isOwn ? "var(--clay-500)" : "var(--sr-bg-card)",
          color: isOwn ? "#fff" : "var(--sr-text-primary)",
          border: isOwn ? "none" : "1px solid var(--sr-border-subtle)",
          fontSize: 14,
          lineHeight: 1.45,
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
          marginTop: 2,
          fontFamily: "var(--sr-font-mono)",
        }}
      >
        {formatTime(message.createdAt)}
      </span>
    </div>
  );
}
