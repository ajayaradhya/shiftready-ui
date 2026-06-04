"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const CONSENT_KEY = "sr_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(CONSENT_KEY) === null) {
      setVisible(true);
    }
  }, []);

  function respond(accept: boolean) {
    localStorage.setItem(CONSENT_KEY, String(accept));
    setVisible(false);
    if (accept) {
      window.dispatchEvent(new Event("sr:consent"));
    }
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        maxWidth: 520,
        width: "calc(100% - 32px)",
        background: "var(--ink-800)",
        color: "var(--cream-100)",
        borderRadius: "var(--sr-radius-lg)",
        padding: "16px 20px",
        display: "flex",
        alignItems: "center",
        gap: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        fontFamily: "var(--sr-font-sans)",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <p style={{ margin: 0, flex: 1, color: "var(--cream-200)" }}>
        We use analytics cookies to improve ShiftReady.{" "}
        <Link href="/privacy" style={{ color: "var(--cream-100)", textDecoration: "underline" }}>
          Privacy policy
        </Link>
      </p>
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <button
          onClick={() => respond(false)}
          style={{
            padding: "7px 14px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid rgba(255,255,255,0.2)",
            background: "transparent",
            color: "var(--cream-300)",
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          Decline
        </button>
        <button
          onClick={() => respond(true)}
          style={{
            padding: "7px 14px",
            borderRadius: "var(--sr-radius-md)",
            border: "none",
            background: "var(--clay-500)",
            color: "#fff",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          Accept
        </button>
      </div>
    </div>
  );
}
