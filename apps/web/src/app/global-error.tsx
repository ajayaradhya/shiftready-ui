"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => { console.error("Root crash:", error); }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#fafaf7",
          fontFamily: "system-ui, sans-serif",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100dvh",
          padding: "40px 24px",
          gap: 24,
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 48, color: "#d4cfc9" }}>⚠</div>
        <div>
          <p style={{ fontSize: 18, fontWeight: 600, color: "#1c1917", margin: "0 0 8px" }}>
            Myrio ran into a problem
          </p>
          <p style={{ fontSize: 14, color: "#78716c", margin: 0 }}>
            Refresh the page or try again.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#a8a29e", marginTop: 8 }}>
              Ref: {error.digest}
            </p>
          )}
        </div>
        <button
          onClick={reset}
          style={{
            padding: "10px 24px",
            borderRadius: 10,
            background: "#b45309",
            color: "#fff",
            fontSize: 14,
            fontWeight: 600,
            border: "none",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
