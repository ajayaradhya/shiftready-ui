"use client";

import { useState, useRef } from "react";
import { Send, Paperclip, Percent, X } from "lucide-react";
import { useIsMobile } from "@/hooks/use-media-query";

interface MessageComposerProps {
  onSend: (text: string) => void;
  onSendOffer?: (amount: number) => void;
  disabled?: boolean;
  placeholder?: string;
  otherUsername?: string | null;
}

export function MessageComposer({ onSend, onSendOffer, disabled, placeholder, otherUsername }: MessageComposerProps) {
  const [text, setText] = useState("");
  const [offerMode, setOfferMode] = useState(false);
  const [offerAmt, setOfferAmt] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

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

  const closeOfferMode = () => {
    setOfferMode(false);
    setOfferAmt("");
  };

  const canSendOffer = offerAmt.trim() && parseFloat(offerAmt) > 0;

  return (
    <div
      style={{
        flexShrink: 0,
        padding: "12px 18px 14px",
        background: "var(--sr-bg-card)",
        borderTop: "1px solid var(--sr-border-subtle)",
      }}
    >
      {/* Offer input row */}
      {offerMode && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 12px",
            background: "var(--clay-50)",
            border: "1.5px solid var(--clay-200)",
            borderRadius: "var(--sr-radius-md)",
            marginBottom: 10,
          }}
        >
          <Percent size={13} strokeWidth={1.75} style={{ color: "var(--clay-600)", flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--clay-700)",
              whiteSpace: "nowrap",
              flexShrink: 0,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Proposing
          </span>
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "var(--clay-700)",
              flexShrink: 0,
            }}
          >
            $
          </span>
          <input
            type="number"
            placeholder="300"
            value={offerAmt}
            onChange={(e) => setOfferAmt(e.target.value)}
            autoFocus
            aria-label="Offer amount in dollars"
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              outline: "none",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 16,
              fontWeight: 700,
              color: "var(--clay-800)",
              minWidth: 50,
              maxWidth: 120,
            }}
          />
          <span style={{ flex: 1 }} />
          <button
            onClick={closeOfferMode}
            aria-label="Cancel offer"
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "var(--clay-400)",
              display: "grid",
              placeItems: "center",
              padding: 2,
              flexShrink: 0,
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--clay-700)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.color = "var(--clay-400)")
            }
          >
            <X size={14} strokeWidth={1.75} />
          </button>
          <button
            disabled={!canSendOffer}
            onClick={() => {
              if (!canSendOffer) return;
              const amt = parseFloat(offerAmt);
              if (amt > 0) onSendOffer?.(amt);
              closeOfferMode();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "0 14px",
              height: 34,
              background: canSendOffer ? "var(--clay-500)" : "var(--cream-200)",
              color: canSendOffer ? "#fff" : "var(--ink-300)",
              border: "none",
              borderRadius: "var(--sr-radius-sm)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12.5,
              fontWeight: 600,
              cursor: canSendOffer ? "pointer" : "default",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 120ms",
              opacity: canSendOffer ? 1 : 0.5,
            }}
          >
            <Send size={12} strokeWidth={1.75} />
            Send offer
          </button>
        </div>
      )}

      {/* Composer row */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        {/* Make an offer pill — icon-only on mobile to free up textarea width */}
        {!offerMode && !disabled && (
          <button
            onClick={() => setOfferMode(true)}
            title={isMobile ? "Make an offer" : undefined}
            aria-label="Make an offer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: isMobile ? 0 : 6,
              padding: isMobile ? 0 : "0 13px",
              width: isMobile ? 38 : undefined,
              height: 38,
              justifyContent: "center",
              background: "var(--cream-100)",
              border: "1px solid var(--cream-300)",
              borderRadius: 9999,
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12.5,
              fontWeight: 500,
              color: "var(--sr-text-muted)",
              cursor: "pointer",
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "all 120ms",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--clay-50)";
              el.style.borderColor = "var(--clay-200)";
              el.style.color = "var(--clay-700)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--cream-100)";
              el.style.borderColor = "var(--cream-300)";
              el.style.color = "var(--sr-text-muted)";
            }}
          >
            <Percent size={isMobile ? 15 : 12} strokeWidth={1.75} />
            {!isMobile && "Make an offer"}
          </button>
        )}

        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder={
            placeholder ??
            (isMobile
              ? "Message…"
              : otherUsername
                ? `Message @${otherUsername}…`
                : "Type a message…")
          }
          disabled={disabled}
          rows={1}
          maxLength={2000}
          style={{
            flex: 1,
            minWidth: 0,
            resize: "none",
            background: "var(--cream-50)",
            border: "1px solid var(--sr-border-default)",
            borderRadius: 22,
            padding: "9px 16px",
            fontSize: 14,
            fontFamily: "var(--sr-font-sans)",
            color: "var(--sr-text-primary)",
            outline: "none",
            overflowY: "hidden",
            maxHeight: 100,
            lineHeight: 1.4,
            transition: "border-color 120ms, background 120ms",
          }}
          onFocus={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-400)";
            (e.currentTarget as HTMLElement).style.background = "#fff";
          }}
          onBlur={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-default)";
            (e.currentTarget as HTMLElement).style.background = "var(--cream-50)";
          }}
        />

        <div style={{ display: "flex", gap: 5, alignItems: "center", flexShrink: 0 }}>
          <button
            title="Attach"
            aria-label="Attach file"
            style={{
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              color: "var(--sr-text-muted)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              transition: "all 120ms",
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "var(--cream-200)";
              el.style.color = "var(--sr-text-primary)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLElement;
              el.style.background = "transparent";
              el.style.color = "var(--sr-text-muted)";
            }}
          >
            <Paperclip size={15} strokeWidth={1.5} />
          </button>

          <button
            onClick={submit}
            disabled={!text.trim() || disabled}
            title="Send message"
            aria-label="Send message"
            style={{
              width: 38,
              height: 38,
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
            <Send size={14} strokeWidth={1.75} />
          </button>
        </div>
      </div>
    </div>
  );
}
