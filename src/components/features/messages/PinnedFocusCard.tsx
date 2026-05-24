import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ExternalLink, Package, ChevronDown, ChevronUp, X, Pin } from "lucide-react";
import type { PinSnapshot, PinKind } from "@/lib/types";

interface PinnedFocusCardProps {
  snapshot: PinSnapshot;
  kind: PinKind;
  saleEventId: string;
  bundleId?: string | null;
  itemId?: string | null;
  saleBasePath?: string;
  onChangeFocus?: () => void;
  onClearPin?: () => void;
}

function fmt(n: number) {
  return n.toLocaleString("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 });
}

const EYEBROW: Record<PinKind, string> = {
  item: "Item in discussion",
  bundle: "Bundle in discussion",
  sale: "Sale in discussion",
};

export function PinnedFocusCard({
  snapshot,
  kind,
  saleEventId,
  bundleId,
  itemId,
  saleBasePath = "/market/sale",
  onChangeFocus,
  onClearPin,
}: PinnedFocusCardProps) {
  const [collapsed, setCollapsed] = useState(false);

  const viewHref =
    kind === "item" && bundleId && itemId
      ? `${saleBasePath}/${saleEventId}/item/${itemId}?bundle=${bundleId}`
      : `${saleBasePath}/${saleEventId}`;

  return (
    <div
      style={{
        borderBottom: "1px solid var(--sr-border-subtle)",
        background: "var(--cream-50)",
        flexShrink: 0,
      }}
    >
      {/* Collapsed strip */}
      {collapsed ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 14px",
          }}
        >
          <Pin size={11} strokeWidth={1.5} color="var(--sr-text-muted)" />
          <span
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "var(--sr-text-muted)",
              flex: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {EYEBROW[kind]}: {snapshot.name ?? "—"}
          </span>
          <button
            onClick={() => setCollapsed(false)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--sr-text-muted)", display: "flex" }}
          >
            <ChevronDown size={13} strokeWidth={1.5} />
          </button>
        </div>
      ) : (
        <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12 }}>
          {/* Thumbnail */}
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: "var(--sr-radius-md)",
              background: "var(--cream-200)",
              flexShrink: 0,
              display: "grid",
              placeItems: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {snapshot.imageUrl ? (
              <Image
                src={snapshot.imageUrl}
                alt={snapshot.name ?? ""}
                fill
                style={{ objectFit: "cover" }}
                sizes="46px"
              />
            ) : (
              <Package size={16} strokeWidth={1.5} color="var(--ink-300)" />
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--sr-text-muted)",
                marginBottom: 2,
              }}
            >
              {EYEBROW[kind]}
            </div>
            <div
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.01em",
                color: "var(--ink-800)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {snapshot.name ?? "—"}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                marginTop: 2,
                flexWrap: "wrap",
              }}
            >
              {snapshot.price != null && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--clay-700)",
                  }}
                >
                  {fmt(snapshot.price)}
                </span>
              )}
              {snapshot.rrp != null && snapshot.rrp > (snapshot.price ?? 0) && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-sans)",
                    fontSize: 11,
                    color: "var(--ink-400)",
                    textDecoration: "line-through",
                  }}
                >
                  {fmt(snapshot.rrp)}
                </span>
              )}
              {snapshot.condition && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    fontWeight: 700,
                    color: "var(--clay-600)",
                    background: "var(--clay-50)",
                    padding: "1px 6px",
                    borderRadius: "var(--sr-radius-sm)",
                  }}
                >
                  {snapshot.condition}
                </span>
              )}
              {snapshot.itemCount != null && (
                <span
                  style={{
                    fontFamily: "var(--sr-font-mono)",
                    fontSize: 9,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    color: "var(--ink-400)",
                    background: "var(--cream-200)",
                    padding: "1px 6px",
                    borderRadius: "var(--sr-radius-sm)",
                  }}
                >
                  {snapshot.itemCount} {snapshot.itemCount === 1 ? "item" : "items"}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <Link
              href={viewHref}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: "var(--sr-font-sans)",
                color: "var(--clay-600)",
                textDecoration: "none",
                whiteSpace: "nowrap",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration = "underline";
                (e.currentTarget as HTMLAnchorElement).style.textUnderlineOffset = "2px";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.textDecoration = "none";
              }}
            >
              View
              <ExternalLink size={11} strokeWidth={1.5} />
            </Link>

            {onChangeFocus && (
              <button
                onClick={onChangeFocus}
                title="Change focus"
                style={{
                  background: "none",
                  border: "1px solid var(--sr-border-subtle)",
                  borderRadius: "var(--sr-radius-sm)",
                  padding: "3px 8px",
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 9,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  color: "var(--sr-text-muted)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sr-text-primary)")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.color = "var(--sr-text-muted)")}
              >
                Change
              </button>
            )}

            <button
              onClick={() => setCollapsed(true)}
              title="Collapse"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--sr-text-muted)", display: "flex" }}
            >
              <ChevronUp size={13} strokeWidth={1.5} />
            </button>

            {onClearPin && (
              <button
                onClick={onClearPin}
                title="Remove pin"
                style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "var(--sr-text-muted)", display: "flex" }}
              >
                <X size={13} strokeWidth={1.5} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
