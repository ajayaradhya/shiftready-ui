"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";

interface RouteErrorProps {
  reset: () => void;
  backHref?: string;
  backLabel?: string;
  message?: string;
  digest?: string;
}

export function RouteError({
  reset,
  backHref = "/",
  backLabel = "Go back",
  message = "Something went wrong loading this page.",
  digest,
}: RouteErrorProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 320,
        padding: "48px 24px",
        textAlign: "center",
        fontFamily: "var(--sr-font-sans)",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          background: "var(--rust-50)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--rust-500)",
        }}
      >
        <AlertTriangle size={20} strokeWidth={1.5} />
      </div>
      <div>
        <p
          style={{
            fontSize: 15,
            fontWeight: 500,
            color: "var(--sr-text-primary)",
            margin: "0 0 6px",
          }}
        >
          {message}
        </p>
        {digest && (
          <p
            style={{
              fontSize: 11,
              fontFamily: "var(--sr-font-mono)",
              color: "var(--ink-300)",
              margin: 0,
            }}
          >
            Ref: {digest}
          </p>
        )}
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
        <button
          onClick={reset}
          style={{
            padding: "8px 18px",
            borderRadius: "var(--sr-radius-md)",
            background: "var(--clay-500)",
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          Try again
        </button>
        <Link
          href={backHref}
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "8px 18px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--cream-400)",
            color: "var(--ink-600)",
            fontSize: 13,
            fontWeight: 500,
            textDecoration: "none",
          }}
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
