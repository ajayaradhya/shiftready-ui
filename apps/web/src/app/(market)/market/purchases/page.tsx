"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, MessageSquare, LogIn } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useConversations } from "@/hooks/use-conversations";
import type { ConversationSummary } from "@myrio/types";

function formatRelative(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function statusChip(conv: ConversationSummary) {
  if (conv.dealStatus === "agreed")
    return { label: "Deal agreed", bg: "var(--moss-50)", color: "var(--moss-700)", border: "var(--moss-200)" };
  if (conv.activeOfferId)
    return { label: "Offer active", bg: "var(--honey-50)", color: "var(--honey-700, #92400e)", border: "var(--honey-200, #fde68a)" };
  return { label: "Enquiring", bg: "var(--clay-50)", color: "var(--clay-700)", border: "var(--clay-200)" };
}

function EnquiryRow({ conv }: { conv: ConversationSummary }) {
  const chip = statusChip(conv);
  const itemName = conv.pinSnapshot?.name;
  const itemPrice = conv.pinSnapshot?.price;

  return (
    <Link
      href={`/market/messages/${conv.id}`}
      style={{
        display: "flex",
        alignItems: "flex-start",
        gap: 14,
        padding: "16px 20px",
        background: "var(--sr-bg-card)",
        border: "1px solid var(--sr-border-subtle)",
        borderRadius: "var(--sr-radius-lg)",
        textDecoration: "none",
        color: "inherit",
        transition: "border-color 150ms, box-shadow 150ms",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-300)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 12px -8px rgba(74,37,25,0.2)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-subtle)";
        (e.currentTarget as HTMLElement).style.boxShadow = "none";
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--clay-300), var(--clay-600))",
          color: "#fff",
          display: "grid",
          placeItems: "center",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "var(--sr-font-serif)",
          flexShrink: 0,
        }}
      >
        {(conv.otherUsername ?? "?").slice(0, 1).toUpperCase()}
      </div>

      {/* Body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 3 }}>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            @{conv.otherUsername ?? conv.otherUserId ?? "Unknown"}
          </span>
          <span style={{ fontSize: 11, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-mono)", flexShrink: 0 }}>
            {formatRelative(conv.lastMessageAt)}
          </span>
        </div>

        {itemName && (
          <p style={{ fontSize: 13, color: "var(--ink-600)", fontFamily: "var(--sr-font-sans)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {itemName}
            {conv.dealStatus === "agreed" && conv.agreedPrice != null ? (
              <span style={{ color: "var(--moss-600)", marginLeft: 6, fontWeight: 600 }}>
                â€” ${conv.agreedPrice.toLocaleString("en-AU")} agreed
              </span>
            ) : itemPrice != null ? (
              <span style={{ color: "var(--ink-400)", marginLeft: 6 }}>
                â€” ${itemPrice.toLocaleString("en-AU")}
              </span>
            ) : null}
          </p>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "2px 8px",
              borderRadius: 9999,
              background: chip.bg,
              color: chip.color,
              border: `1px solid ${chip.border}`,
              fontSize: 10,
              fontWeight: 600,
              fontFamily: "var(--sr-font-mono)",
              textTransform: "uppercase" as const,
              letterSpacing: "0.07em",
            }}
          >
            {chip.label}
          </span>
          {conv.unreadCount > 0 && (
            <span style={{ fontSize: 11, color: "var(--clay-600)", fontFamily: "var(--sr-font-sans)" }}>
              {conv.unreadCount} unread
            </span>
          )}
        </div>
      </div>

      <MessageSquare size={16} color="var(--ink-300)" strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 4 }} />
    </Link>
  );
}

function SignInPrompt() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", borderRadius: "var(--sr-radius-xl)", background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)", textAlign: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--sr-radius-lg)", background: "var(--clay-50)", display: "grid", placeItems: "center" }}>
        <ShoppingBag size={24} color="var(--clay-500)" strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, color: "var(--sr-text-primary)", marginBottom: 8 }}>
          Sign in to see your enquiries
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 300 }}>
          Track conversations with sellers and manage your offers.
        </p>
      </div>
      <Link href="/login" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: "var(--sr-radius-lg)", background: "var(--clay-500)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "var(--sr-font-sans)", textDecoration: "none" }}>
        <LogIn size={15} strokeWidth={1.5} />
        Sign in
      </Link>
    </div>
  );
}

function EmptyEnquiries() {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", borderRadius: "var(--sr-radius-xl)", background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)", textAlign: "center", gap: 16 }}>
      <div style={{ width: 56, height: 56, borderRadius: "var(--sr-radius-lg)", background: "var(--clay-50)", display: "grid", placeItems: "center" }}>
        <ShoppingBag size={24} color="var(--clay-500)" strokeWidth={1.5} />
      </div>
      <div>
        <p style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--ink-400)", marginBottom: 8 }}>
          No enquiries yet
        </p>
        <p style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, color: "var(--sr-text-primary)", marginBottom: 8 }}>
          Find something you like?
        </p>
        <p style={{ fontSize: 13, color: "var(--ink-400)", maxWidth: 300 }}>
          Express interest in items from the marketplace and your conversations with sellers will appear here.
        </p>
      </div>
      <Link href="/market" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", borderRadius: "var(--sr-radius-lg)", background: "var(--clay-500)", color: "#fff", fontSize: 13, fontWeight: 600, fontFamily: "var(--sr-font-sans)", textDecoration: "none" }}>
        Browse marketplace
      </Link>
    </div>
  );
}

export default function PurchasesPage() {
  const { user, loading: authLoading } = useAuth();
  const { data: convs, isLoading: convsLoading } = useConversations();
  useEffect(() => { document.title = "Purchases - Myrio"; }, []);

  return (
    <div style={{ padding: "40px 32px", maxWidth: 800, margin: "0 auto" }}>
      <h1 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, color: "var(--sr-text-primary)", marginBottom: 4 }}>
        Purchases
      </h1>
      <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 40 }}>
        Your conversations with sellers and active offers.
      </p>

      {authLoading || convsLoading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 88, borderRadius: "var(--sr-radius-lg)", background: "var(--cream-100)", border: "1px solid var(--sr-border-subtle)", animation: "pulse 1.4s ease-in-out infinite" }} />
          ))}
        </div>
      ) : !user ? (
        <SignInPrompt />
      ) : !convs?.length ? (
        <EmptyEnquiries />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {convs.map((c) => (
            <EnquiryRow key={c.id} conv={c} />
          ))}
        </div>
      )}
    </div>
  );
}
