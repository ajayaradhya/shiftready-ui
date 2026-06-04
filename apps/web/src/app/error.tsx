"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "var(--sr-bg-app)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 24px",
        fontFamily: "var(--sr-font-sans)",
        gap: 32,
      }}
    >
      <Link
        href="/"
        style={{ display: "flex", alignItems: "center", gap: 9, textDecoration: "none" }}
      >
        <Image src="/logo-mark.svg" alt="ShiftReady" width={28} height={28} priority />
        <span
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            color: "var(--sr-text-primary)",
          }}
        >
          ShiftReady
        </span>
      </Link>

      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 96,
            fontWeight: 500,
            letterSpacing: "-0.04em",
            color: "var(--cream-300)",
            lineHeight: 1,
            marginBottom: 24,
          }}
        >
          500
        </div>
        <h1
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-800)",
            margin: "0 0 12px",
          }}
        >
          Something went <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>wrong</em>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--sr-text-muted)",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          An unexpected error occurred. Our team has been notified. Try refreshing or head back home.
          {error.digest && (
            <span
              style={{
                display: "block",
                marginTop: 8,
                fontFamily: "var(--sr-font-mono)",
                fontSize: 11,
                color: "var(--ink-300)",
              }}
            >
              Ref: {error.digest}
            </span>
          )}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button
            onClick={reset}
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
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
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: "var(--sr-radius-md)",
              background: "transparent",
              border: "1px solid var(--cream-400)",
              color: "var(--ink-600)",
              fontSize: 13,
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
