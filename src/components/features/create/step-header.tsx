"use client";

import { useRouter } from "next/navigation";

interface Props {
  stepActive: number;
  stepLabel?: string;
}

export function StepHeader({ stepActive }: Props) {
  const router = useRouter();

  return (
    <div style={{
      height: 64, background: "rgba(245,240,232,0.92)",
      borderBottom: "1px solid var(--sr-border-subtle)",
      display: "flex", alignItems: "center",
      padding: "0 32px",
      backdropFilter: "blur(12px)",
      position: "sticky", top: 64, zIndex: 9,
    }}>
      <button
        onClick={() => router.back()}
        aria-label="Back"
        style={{
          width: 36, height: 36, borderRadius: "50%",
          border: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
          display: "grid", placeItems: "center",
          color: "var(--sr-text-secondary)", cursor: "pointer",
          marginRight: 16, flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9.5 3.5-4.5 4.5 4.5 4.5"/>
        </svg>
      </button>

      <div style={{ display: "flex", flexDirection: "column" }}>
        <span style={{
          fontFamily: "var(--sr-font-mono)", fontSize: 10,
          textTransform: "uppercase", letterSpacing: "0.16em",
          color: "var(--sr-text-muted)",
        }}>
          Sellers · Step {stepActive + 1} of 4
        </span>
        <span style={{
          fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500,
          color: "var(--sr-text-primary)", letterSpacing: "-0.01em", lineHeight: 1.1,
        }}>
          New sale
        </span>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <div className="hidden sm:flex" style={{ alignItems: "center", gap: 6, fontSize: 11, color: "var(--sr-text-muted)" }}>
          {["Add items", "Review", "Set details", "Publish"].map((name, i) => (
            <span key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{
                fontFamily: "var(--sr-font-mono)",
                letterSpacing: "0.04em",
                fontWeight: i === stepActive ? 700 : 400,
                color: i === stepActive ? "var(--clay-600)" : i < stepActive ? "var(--ink-400)" : "var(--cream-400)",
                textDecoration: i < stepActive ? "line-through" : "none",
              }}>
                {name}
              </span>
              {i < 3 && <span style={{ color: "var(--cream-300)" }}>›</span>}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", gap: 4 }}>
          {[0, 1, 2, 3].map(i => (
            <span
              key={i}
              style={{
                width: 18, height: 4, borderRadius: 2,
                background: i === stepActive ? "var(--clay-500)" : i < stepActive ? "var(--clay-300)" : "var(--cream-300)",
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
