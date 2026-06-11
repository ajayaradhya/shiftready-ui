import Link from "next/link";
import { Pin, PinOff } from "lucide-react";
import type { PinSnapshot, PinKind } from "@myrio/types";

interface PinChangeSystemMessageProps {
  text: string;
  subtype: "pin_changed" | "pin_cleared";
  pinSnapshot?: PinSnapshot | null;
  saleBasePath?: string;
  saleEventId?: string | null;
  bundleId?: string | null;
  itemId?: string | null;
  kind?: PinKind | null;
}

export function PinChangeSystemMessage({
  text,
  subtype,
  pinSnapshot,
  saleBasePath = "/market/sale",
  saleEventId,
  bundleId,
  itemId,
  kind,
}: PinChangeSystemMessageProps) {
  const isCleared = subtype === "pin_cleared";

  const viewHref =
    saleEventId && kind === "item" && bundleId && itemId
      ? `${saleBasePath}/${saleEventId}/item/${itemId}?bundle=${bundleId}`
      : saleEventId
      ? `${saleBasePath}/${saleEventId}`
      : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        padding: "8px 0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "4px 12px",
          borderRadius: "var(--sr-radius-full)",
          background: "var(--cream-100)",
          border: "1px solid var(--sr-border-subtle)",
        }}
      >
        {isCleared ? (
          <PinOff size={11} strokeWidth={1.5} color="var(--sr-text-muted)" />
        ) : (
          <Pin size={11} strokeWidth={1.5} color="var(--clay-500)" />
        )}
        <span
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--sr-text-muted)",
          }}
        >
          {text}
        </span>
      </div>

      {!isCleared && pinSnapshot?.name && viewHref && (
        <Link
          href={viewHref}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 12px",
            borderRadius: "var(--sr-radius-md)",
            background: "var(--sr-bg-card)",
            border: "1px solid var(--sr-border-subtle)",
            textDecoration: "none",
            maxWidth: 280,
          }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background = "var(--cream-50)")
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLAnchorElement).style.background = "var(--sr-bg-card)")
          }
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "var(--sr-radius-sm)",
              background: "var(--cream-200)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 12,
                fontWeight: 500,
                color: "var(--ink-800)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {pinSnapshot.name}
            </div>
            {pinSnapshot.price != null && (
              <div
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 11,
                  color: "var(--clay-600)",
                  fontWeight: 600,
                }}
              >
                {pinSnapshot.price.toLocaleString("en-AU", {
                  style: "currency",
                  currency: "AUD",
                  maximumFractionDigits: 0,
                })}
              </div>
            )}
          </div>
        </Link>
      )}
    </div>
  );
}
