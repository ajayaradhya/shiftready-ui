"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MoreVertical, Shield, ShieldOff, ShieldCheck } from "lucide-react";
import { useMessages } from "@/hooks/use-messages";
import { useSendMessage } from "@/hooks/use-send-message";
import { useSetPin, useClearPin } from "@/hooks/use-pin";
import { useAcceptOffer, useCounterOffer, useSendOffer, useWithdrawOffer } from "@/hooks/use-offers";
import { markConversationRead, blockConversation, unblockConversation } from "@/lib/api";
import { MessageBubble } from "./MessageBubble";
import { MessageComposer } from "./MessageComposer";
import { OfferCard } from "./OfferCard";
import { DealAgreedBanner } from "./DealAgreedBanner";
import { PinnedItemCard } from "./PinnedItemCard";
import { PinnedFocusCard } from "./PinnedFocusCard";
import { PinChangeSystemMessage } from "./PinChangeSystemMessage";
import { PhoneRevealCard } from "./PhoneRevealCard";
import { FocusPicker } from "./FocusPicker";
import type { ConversationSummary, PinRef } from "@/lib/types";

interface ConversationViewProps {
  convId: string;
  currentUserId: string;
  conversation: ConversationSummary;
  onRefresh: () => void;
  saleBasePath?: string;
}

function formatDate(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

function DateDivider({ dateStr }: { dateStr: string | null }) {
  if (!dateStr) return null;
  return (
    <div
      style={{
        position: "relative",
        textAlign: "center",
        margin: "4px 0 18px",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "50%",
          height: 1,
          background: "var(--cream-300)",
        }}
      />
      <span
        style={{
          position: "relative",
          zIndex: 1,
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.1em",
          color: "var(--sr-text-muted)",
          background: "var(--sr-bg-app)",
          padding: "0 12px",
        }}
      >
        {formatDate(dateStr)}
      </span>
    </div>
  );
}

function MoreMenu({
  convId,
  isBlocked,
  isBlocker,
  onToggle,
}: {
  convId: string;
  isBlocked: boolean;
  isBlocker: boolean;
  onToggle?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const handleBlock = async () => {
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
      setOpen(false);
    }
  };

  if (isBlocked && !isBlocker) return null;

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        title="More options"
        style={{
          width: 34,
          height: 34,
          borderRadius: "var(--sr-radius-sm)",
          border: "none",
          background: open ? "var(--cream-200)" : "transparent",
          color: "var(--sr-text-muted)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          transition: "background 120ms, color 120ms",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = "var(--cream-200)";
          el.style.color = "var(--sr-text-primary)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLElement;
          el.style.background = open ? "var(--cream-200)" : "transparent";
          el.style.color = "var(--sr-text-muted)";
        }}
      >
        <MoreVertical size={15} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            right: 0,
            top: "calc(100% + 4px)",
            background: "var(--sr-bg-card)",
            border: "1px solid var(--sr-border-subtle)",
            borderRadius: "var(--sr-radius-md)",
            boxShadow: "var(--sr-shadow-sm)",
            minWidth: 150,
            zIndex: 20,
            overflow: "hidden",
          }}
        >
          <button
            onClick={handleBlock}
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "10px 14px",
              background: "none",
              border: "none",
              textAlign: "left",
              fontSize: 13,
              fontFamily: "var(--sr-font-sans)",
              color: isBlocked ? "var(--sr-text-secondary)" : "var(--rust-500, #e05252)",
              cursor: loading ? "default" : "pointer",
              opacity: loading ? 0.6 : 1,
              transition: "background 100ms",
            }}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "var(--cream-50)")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLElement).style.background = "none")
            }
          >
            {isBlocked ? (
              <><ShieldCheck size={13} strokeWidth={1.5} /> Unblock user</>
            ) : (
              <><ShieldOff size={13} strokeWidth={1.5} /> Block user</>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export function ConversationView({
  convId,
  currentUserId,
  conversation,
  onRefresh,
  saleBasePath = "/market/sale",
}: ConversationViewProps) {
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(convId);
  const sendMutation = useSendMessage(convId);
  const setPinMutation = useSetPin(convId);
  const clearPinMutation = useClearPin(convId);
  const sendOfferMutation = useSendOffer(convId);
  const acceptOfferMutation = useAcceptOffer(convId);
  const counterOfferMutation = useCounterOffer(convId);
  const withdrawOfferMutation = useWithdrawOffer(convId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [focusPickerOpen, setFocusPickerOpen] = useState(false);

  const allMessages = data?.pages.flatMap((p) => p.messages) ?? [];

  useEffect(() => {
    markConversationRead(convId).catch(() => {});
  }, [convId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const isBlocked = conversation.status === "blocked";

  const handleSend = (text: string) => {
    sendMutation.mutate({ text });
  };

  const handleSendOffer = (amount: number) => {
    sendOfferMutation.mutate({ amount });
  };

  // Derive sale context from first message that has one (fallback for legacy threads)
  const contextMessage = allMessages.find((m) => m.context?.saleEventId);
  const legacySaleEventId = contextMessage?.context?.saleEventId ?? null;

  // Pin data from conversation summary (updated via WS invalidation)
  const activePin = conversation.pin ?? null;
  const pinSnapshot = conversation.pinSnapshot ?? null;
  const isPinned = !!(activePin && pinSnapshot);

  // FocusPicker: use pin's saleEventId or legacy context saleEventId
  const focusSaleEventId = activePin?.saleEventId ?? legacySaleEventId;
  // For legacy PinnedItemCard fallback
  const saleEventId = legacySaleEventId;

  const otherUsername = conversation.otherUsername;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div
        style={{
          height: 62,
          flexShrink: 0,
          background: "var(--sr-bg-card)",
          borderBottom: "1px solid var(--sr-border-subtle)",
          display: "flex",
          alignItems: "center",
          gap: 13,
          padding: "0 20px",
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--clay-300), var(--clay-600))",
            color: "#fff",
            display: "grid",
            placeItems: "center",
            fontSize: 14,
            fontWeight: 700,
            fontFamily: "var(--sr-font-serif)",
            flexShrink: 0,
          }}
        >
          {(otherUsername ?? "?").slice(0, 1).toUpperCase()}
        </div>

        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                fontSize: 15,
                fontWeight: 600,
                color: "var(--sr-text-primary)",
                lineHeight: 1.2,
                letterSpacing: "-0.01em",
                fontFamily: "var(--sr-font-sans)",
              }}
            >
              @{otherUsername ?? "Unknown"}
            </span>
            {/* Verified shield */}
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9.5,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--moss-600)",
              }}
            >
              <Shield size={9} strokeWidth={2} />
              Verified
            </span>
          </div>

          <div
            style={{
              fontSize: 11.5,
              color: "var(--sr-text-muted)",
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 5,
              marginTop: 2,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            {isBlocked ? (
              <span style={{ color: "var(--rust-500, #e05252)" }}>Conversation blocked</span>
            ) : (
              <>
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "var(--moss-500)",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                Online now
              </>
            )}
          </div>
        </div>

        {/* Right actions */}
        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            alignItems: "center",
            gap: 4,
          }}
        >
          <button
            disabled
            title="Call (available after deal)"
            style={{
              width: 34,
              height: 34,
              borderRadius: "var(--sr-radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--sr-text-muted)",
              display: "grid",
              placeItems: "center",
              cursor: "default",
              opacity: 0.4,
            }}
          >
            <Phone size={15} strokeWidth={1.75} />
          </button>

          <MoreMenu
            convId={convId}
            isBlocked={isBlocked}
            isBlocker={isBlocked}
            onToggle={onRefresh}
          />
        </div>
      </div>

      {/* Pinned focus card */}
      {isPinned && pinSnapshot && activePin ? (
        <PinnedFocusCard
          snapshot={pinSnapshot}
          kind={activePin.kind}
          saleEventId={activePin.saleEventId}
          bundleId={activePin.bundleId}
          itemId={activePin.itemId}
          saleBasePath={saleBasePath}
          onChangeFocus={focusSaleEventId ? () => setFocusPickerOpen(true) : undefined}
          onClearPin={() => clearPinMutation.mutate()}
        />
      ) : saleEventId ? (
        <PinnedItemCard saleEventId={saleEventId} saleBasePath={saleBasePath} />
      ) : null}

      {focusPickerOpen && focusSaleEventId && (
        <FocusPicker
          saleEventId={focusSaleEventId}
          onSelect={(pin: PinRef) => {
            setFocusPickerOpen(false);
            setPinMutation.mutate(pin);
          }}
          onClose={() => setFocusPickerOpen(false)}
        />
      )}

      {/* Thread */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 22px 10px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {hasNextPage && (
          <button
            onClick={() => fetchNextPage()}
            style={{
              alignSelf: "center",
              padding: "4px 12px",
              fontSize: 12,
              color: "var(--clay-600)",
              background: "transparent",
              border: "1px solid var(--sr-border-subtle)",
              borderRadius: 12,
              cursor: "pointer",
              marginBottom: 8,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Load older messages
          </button>
        )}

        {isLoading && (
          <div
            style={{
              textAlign: "center",
              color: "var(--sr-text-muted)",
              fontSize: 13,
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            Loading…
          </div>
        )}

        {allMessages.map((msg, i) => {
          const prev = allMessages[i - 1];
          const msgDateKey = msg.createdAt?.split("T")[0] ?? "";
          const prevDateKey = prev?.createdAt?.split("T")[0] ?? "";
          const showDivider = msgDateKey !== prevDateKey;

          const isOwn = msg.senderId === currentUserId;
          const prevSenderId = prev?.senderId;
          const showSender = !isOwn && (i === 0 || prevSenderId !== msg.senderId);

          if (msg.type === "system" && (msg.subtype === "pin_changed" || msg.subtype === "pin_cleared")) {
            return (
              <div key={msg.id}>
                {showDivider && <DateDivider dateStr={msg.createdAt} />}
                <PinChangeSystemMessage
                  text={msg.text}
                  subtype={msg.subtype as "pin_changed" | "pin_cleared"}
                  pinSnapshot={msg.pinSnapshot}
                  saleBasePath={saleBasePath}
                />
              </div>
            );
          }

          if (msg.type === "system" && msg.subtype === "deal_agreed") {
            const dealAmt = allMessages
              .slice(0, i + 1)
              .reverse()
              .find((m) => m.type === "offer_accepted")
              ?.offerPayload?.amount ?? 0;
            return (
              <div key={msg.id}>
                {showDivider && <DateDivider dateStr={msg.createdAt} />}
                <DealAgreedBanner
                  amount={dealAmt}
                  otherUsername={otherUsername}
                  phoneRevealAvailable={conversation.phoneRevealAvailable}
                />
              </div>
            );
          }

          if (msg.type === "offer" || msg.type === "offer_accepted") {
            const offer = msg.offerPayload;
            if (!offer) return null;
            return (
              <div
                key={msg.id}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isOwn ? "flex-end" : "flex-start",
                  marginBottom: 8,
                }}
              >
                {showDivider && <DateDivider dateStr={msg.createdAt} />}
                {!isOwn && showSender && (
                  <div
                    style={{
                      marginBottom: 5,
                      fontFamily: "var(--sr-font-mono)",
                      fontSize: 10,
                      textTransform: "uppercase" as const,
                      letterSpacing: "0.08em",
                      color: "var(--sr-text-muted)",
                    }}
                  >
                    {otherUsername ?? "User"}
                  </div>
                )}
                <OfferCard
                  offer={offer}
                  isOwn={isOwn}
                  onAccept={(offerId) => acceptOfferMutation.mutate({ offerId })}
                  onCounter={(offerId, amount) => counterOfferMutation.mutate({ offerId, amount })}
                  onWithdraw={(offerId) => withdrawOfferMutation.mutate({ offerId })}
                  disabled={
                    acceptOfferMutation.isPending ||
                    counterOfferMutation.isPending ||
                    withdrawOfferMutation.isPending
                  }
                />
              </div>
            );
          }

          return (
            <div key={msg.id}>
              {showDivider && <DateDivider dateStr={msg.createdAt} />}
              <MessageBubble
                message={msg}
                isOwn={isOwn}
                showSender={showSender}
                senderUsername={otherUsername}
              />
            </div>
          );
        })}

        <div ref={bottomRef} />

        {/* Phone reveal — shown at thread tail after deal agreed */}
        {conversation.dealStatus === "agreed" && conversation.phoneRevealAvailable && (
          <PhoneRevealCard convId={convId} otherUsername={otherUsername} />
        )}
      </div>

      {/* Composer */}
      <MessageComposer
        onSend={handleSend}
        onSendOffer={handleSendOffer}
        disabled={isBlocked || sendMutation.isPending}
        placeholder={isBlocked ? "Conversation blocked" : undefined}
        otherUsername={otherUsername}
      />
    </div>
  );
}
