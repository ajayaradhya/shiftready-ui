import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import type { MessageContext } from "@myrio/types";

export function SaleContextChip({ context }: { context: MessageContext }) {
  return (
    <Link
      href={`/market/sale/${context.saleEventId}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 20,
        background: "var(--clay-50)",
        border: "1px solid var(--clay-200)",
        textDecoration: "none",
        fontSize: 11,
        fontFamily: "var(--sr-font-mono)",
        color: "var(--clay-700)",
        letterSpacing: "0.04em",
        marginBottom: 4,
        maxWidth: 220,
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
      }}
    >
      <ShoppingBag size={11} strokeWidth={1.5} />
      View sale
    </Link>
  );
}
