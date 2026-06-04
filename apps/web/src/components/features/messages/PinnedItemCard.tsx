import Link from "next/link";
import { ExternalLink, ShoppingBag } from "lucide-react";

interface PinnedItemCardProps {
  saleEventId: string;
  itemName?: string | null;
  saleBasePath?: string;
}

export function PinnedItemCard({
  saleEventId,
  itemName,
  saleBasePath = "/market/sale",
}: PinnedItemCardProps) {
  return (
    <div
      style={{
        padding: "10px 20px",
        borderBottom: "1px solid var(--sr-border-subtle)",
        background: "var(--cream-50)",
        display: "flex",
        alignItems: "center",
        gap: 12,
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "var(--sr-radius-md)",
          background: "var(--cream-200)",
          flexShrink: 0,
          display: "grid",
          placeItems: "center",
        }}
      >
        <ShoppingBag size={16} strokeWidth={1.5} color="var(--ink-300)" />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 9,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--sr-text-muted)",
            marginBottom: 3,
          }}
        >
          Item in discussion
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
          {itemName ?? "View listing details"}
        </div>
      </div>

      <Link
        href={`${saleBasePath}/${saleEventId}`}
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
          flexShrink: 0,
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
    </div>
  );
}
