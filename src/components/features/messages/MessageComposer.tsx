"use client";

import { useState, useRef } from "react";
import { Send } from "lucide-react";

interface MessageComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function MessageComposer({ onSend, disabled, placeholder }: MessageComposerProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: 8,
        padding: "12px 16px",
        borderTop: "1px solid var(--sr-border-subtle)",
        background: "var(--sr-bg-card)",
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? "Type a message…"}
        disabled={disabled}
        rows={1}
        maxLength={2000}
        style={{
          flex: 1,
          resize: "none",
          border: "1px solid var(--sr-border-subtle)",
          borderRadius: 20,
          padding: "9px 14px",
          fontSize: 14,
          fontFamily: "var(--sr-font-sans)",
          color: "var(--sr-text-primary)",
          background: "var(--cream-50)",
          outline: "none",
          overflowY: "hidden",
          maxHeight: 120,
          lineHeight: 1.4,
        }}
      />
      <button
        onClick={submit}
        disabled={!text.trim() || disabled}
        aria-label="Send message"
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: text.trim() && !disabled ? "var(--clay-500)" : "var(--cream-200)",
          color: text.trim() && !disabled ? "#fff" : "var(--ink-300)",
          display: "grid",
          placeItems: "center",
          cursor: text.trim() && !disabled ? "pointer" : "default",
          flexShrink: 0,
          transition: "background 140ms",
        }}
      >
        <Send size={16} strokeWidth={1.5} />
      </button>
    </div>
  );
}
