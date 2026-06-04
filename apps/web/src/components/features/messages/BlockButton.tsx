"use client";

import { useState } from "react";
import { ShieldOff, ShieldCheck } from "lucide-react";
import { blockConversation, unblockConversation } from "@shiftready/api";

interface BlockButtonProps {
  convId: string;
  isBlocked: boolean;
  isBlocker: boolean;
  onToggle?: () => void;
}

export function BlockButton({ convId, isBlocked, isBlocker, onToggle }: BlockButtonProps) {
  const [loading, setLoading] = useState(false);

  const handle = async () => {
    setLoading(true);
    try {
      if (isBlocked && isBlocker) {
        await unblockConversation(convId);
      } else if (!isBlocked) {
        await blockConversation(convId);
      }
      onToggle?.();
    } finally {
      setLoading(false);
    }
  };

  if (isBlocked && !isBlocker) return null;

  return (
    <button
      onClick={handle}
      disabled={loading}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: "var(--sr-radius-md)",
        border: "1px solid var(--sr-border-subtle)",
        background: "transparent",
        fontSize: 12,
        fontFamily: "var(--sr-font-sans)",
        color: isBlocked ? "var(--ink-500)" : "var(--rust-500)",
        cursor: loading ? "default" : "pointer",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {isBlocked ? (
        <><ShieldCheck size={13} strokeWidth={1.5} /> Unblock</>
      ) : (
        <><ShieldOff size={13} strokeWidth={1.5} /> Block</>
      )}
    </button>
  );
}
