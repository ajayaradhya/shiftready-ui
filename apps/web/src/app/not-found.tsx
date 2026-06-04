import Link from "next/link";
import Image from "next/image";

export default function NotFound() {
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
      {/* Logo */}
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
          404
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
          Page not <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>found</em>
        </h1>
        <p
          style={{
            fontSize: 14,
            color: "var(--sr-text-muted)",
            lineHeight: 1.6,
            margin: "0 0 28px",
          }}
        >
          This page doesn&apos;t exist or may have moved. Head back home to browse sales or manage your listings.
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 20px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--clay-500)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Go back home
          </Link>
          <Link
            href="/market"
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
            Browse marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}
