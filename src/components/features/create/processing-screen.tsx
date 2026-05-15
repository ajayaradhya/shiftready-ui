"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HowTo } from "./how-to";
import { StepHeader } from "./step-header";
import { getStatus } from "@/lib/api";
import type { UploadedFile } from "@/hooks/use-upload";

const DEMO_ITEMS = [
  "Linen sofa", "Oak dining table", "Bosch washer", "Fiddle leaf fig",
  "Floor lamp", "Bookshelf", "Coffee table", "Weber BBQ",
  "Office chair", "Persian rug", "Bedside drawers", "Standing mirror",
];

const SUB_LINES = [
  "Identifying furniture…",
  "Detecting appliances…",
  "Reading dimensions…",
  "Pricing against marketplace data…",
];

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024);
  return mb >= 1000 ? `${(mb / 1024).toFixed(1)} GB` : `${Math.round(mb)} MB`;
}

interface Props {
  eventId: string;
  uploadedFile: UploadedFile | null;
}

export function ProcessingScreen({ eventId, uploadedFile }: Props) {
  const router = useRouter();
  const [itemCount, setItemCount] = useState(4);
  const [visibleItems, setVisibleItems] = useState(DEMO_ITEMS.slice(0, 4));
  const [subIdx, setSubIdx] = useState(0);
  const [popCount, setPopCount] = useState(false);

  /* Poll for completion */
  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const { status } = await getStatus(eventId);
        if (status === "ready_for_review" || status === "pricing_in_progress" || status === "live") {
          clearInterval(poll);
          router.push(`/seller-central/inventory/${eventId}`);
        } else if (status === "failed") {
          clearInterval(poll);
        }
      } catch {
        // silently retry
      }
    }, 3000);
    return () => clearInterval(poll);
  }, [eventId, router]);

  /* Animated item discovery loop */
  useEffect(() => {
    const t = setInterval(() => {
      setItemCount(c => c + 1);
      setPopCount(true);
      setTimeout(() => setPopCount(false), 220);
      setSubIdx(i => (i + 1) % SUB_LINES.length);
      setVisibleItems(prev => {
        if (prev.length >= DEMO_ITEMS.length) return prev;
        return DEMO_ITEMS.slice(0, prev.length + 1);
      });
    }, 2400);
    return () => clearInterval(t);
  }, []);

  const minRemaining = Math.max(1, 5 - Math.floor(itemCount / 6));

  const goToDashboard = useCallback(() => router.push("/dashboard"), [router]);
  const stayAndWatch = useCallback(() => router.push(`/seller-central/inventory/${eventId}`), [router, eventId]);

  return (
    <div style={{ background: "var(--sr-bg-app)", minHeight: "100vh", fontFamily: "var(--sr-font-sans)" }}>
      <StepHeader stepActive={1} stepLabel="AI scanning" />

      <div style={{ maxWidth: 880, width: "100%", margin: "0 auto", padding: "56px 20px 64px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "var(--sr-font-serif)", fontSize: 40, fontWeight: 500,
            letterSpacing: "-0.025em", lineHeight: 1.1, color: "var(--ink-800)",
            margin: "0 0 10px",
          }}>
            List your stuff in{" "}
            <em style={{ fontStyle: "italic", color: "var(--clay-600)", fontWeight: 500 }}>minutes</em>
          </h1>
          <p style={{ margin: 0, color: "var(--sr-text-secondary)", fontSize: 16, lineHeight: 1.55 }}>
            Film a walkthrough of your home — AI does the rest.
          </p>
        </div>

        <HowTo />

        {/* Upload confirm banner */}
        {uploadedFile && <div style={{
          display: "flex", alignItems: "center", gap: 14,
          padding: "14px 20px",
          background: "var(--moss-50)", border: "1px solid var(--moss-100)",
          borderRadius: "var(--sr-radius-md)",
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: "50%",
            background: "var(--moss-500)", color: "white",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="m4 8.5 2.5 2.5L12 5.5"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 600, color: "var(--moss-700)", fontSize: 14 }}>
              Video uploaded successfully
            </div>
            <div style={{ fontSize: 12.5, color: "var(--ink-500)" }}>
              {uploadedFile?.name ?? "video.mp4"}
              {uploadedFile?.size ? ` · ${formatBytes(uploadedFile.size)}` : ""}
            </div>
          </div>
          <div style={{ flex: 1 }} />
          <button
            style={{
              background: "transparent", color: "var(--sr-text-secondary)",
              border: "none", cursor: "pointer", padding: "6px 12px",
              fontSize: 13, borderRadius: "var(--sr-radius-sm)",
            }}
          >
            Replace
          </button>
        </div>}

        {/* Main panel */}
        <div style={{
          background: "var(--sr-bg-card)",
          border: "1px solid var(--sr-border-subtle)",
          borderRadius: "var(--sr-radius-xl)",
          padding: "36px 36px 32px",
          boxShadow: "0 1px 2px rgba(74,37,25,0.05), 0 2px 4px rgba(74,37,25,0.04)",
        }}>
          {/* Orb + status */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22, padding: "28px 0 12px" }}>
            {/* Orb */}
            <div style={{ position: "relative", width: 144, height: 144, display: "grid", placeItems: "center" }}>
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1px solid var(--clay-300)",
                animation: "orb-ripple 2.4s ease-out infinite",
              }} />
              <span style={{
                position: "absolute", inset: 0, borderRadius: "50%",
                border: "1px solid var(--clay-300)",
                animation: "orb-ripple 2.4s ease-out infinite",
                animationDelay: "1.2s",
              }} />
              <div style={{
                width: 96, height: 96, borderRadius: "50%",
                background: "radial-gradient(circle at 35% 30%, #FFFFFF 0%, var(--clay-200) 35%, var(--clay-500) 100%)",
                boxShadow: "0 0 0 1px rgba(204,120,92,0.18), 0 8px 28px rgba(204,120,92,0.30), inset 0 -10px 24px rgba(148,74,57,0.30)",
                animation: "orb-breathe 2.4s ease-in-out infinite",
              }} />
            </div>

            {/* Status text */}
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500,
                letterSpacing: "-0.015em", color: "var(--ink-800)",
              }}>
                AI is scanning your video…
              </div>
              <div style={{ color: "var(--sr-text-secondary)", fontSize: 14, height: 20, transition: "opacity 200ms" }}>
                {SUB_LINES[subIdx]}
              </div>
            </div>

            {/* Big count */}
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 10, marginTop: 4 }}>
              <span style={{
                fontFamily: "var(--sr-font-serif)", fontSize: 56, fontWeight: 500,
                letterSpacing: "-0.04em", color: "var(--clay-600)",
                lineHeight: 1,
                animation: popCount ? "count-pop 220ms ease" : undefined,
              }}>
                {itemCount}
              </span>
              <span style={{ fontSize: 13, color: "var(--sr-text-muted)" }}>
                items found across 6 rooms
              </span>
            </div>
            <div style={{
              fontFamily: "var(--sr-font-mono)", fontSize: 11,
              color: "var(--sr-text-muted)", letterSpacing: "0.10em",
              textTransform: "uppercase", marginTop: 6,
            }}>
              Usually takes 2–5 min · {minRemaining} min remaining
            </div>
          </div>

          {/* Split decision cards */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 8 }}>
            {/* Go to dashboard */}
            <button
              onClick={goToDashboard}
              style={{
                borderRadius: "var(--sr-radius-lg)", padding: "22px 22px 20px",
                display: "flex", flexDirection: "column", gap: 12,
                background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)",
                cursor: "pointer", textAlign: "left", transition: "all 160ms",
              }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--cream-200)", color: "var(--ink-500)",
                display: "grid", placeItems: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 8a5 5 0 0 1 10 0c0 5.5 2.5 7 2.5 7H2.5S5 13.5 5 8"/>
                  <path d="M8.5 17.5a1.5 1.5 0 0 0 3 0"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)" }}>
                  Go to dashboard
                </div>
                <div style={{ fontSize: 13.5, color: "var(--sr-text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
                  We&apos;ll send a notification when your inventory is ready to review.
                </div>
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "10px 16px",
                background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-default)",
                borderRadius: "var(--sr-radius-md)", fontSize: 14, fontWeight: 500,
                color: "var(--sr-text-primary)", marginTop: "auto",
              }}>
                Go to dashboard
                <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m6 3.5 4.5 4.5L6 12.5"/>
                </svg>
              </div>
            </button>

            {/* Stay & watch */}
            <button
              onClick={stayAndWatch}
              style={{
                borderRadius: "var(--sr-radius-lg)", padding: "22px 22px 20px",
                display: "flex", flexDirection: "column", gap: 12,
                background: "var(--clay-50)", border: "1.5px solid var(--clay-500)",
                boxShadow: "0 2px 0 var(--clay-100), 0 1px 2px rgba(74,37,25,0.05)",
                cursor: "pointer", textAlign: "left", position: "relative",
              }}
            >
              {/* Check badge */}
              <div style={{
                position: "absolute", top: 14, right: 14,
                width: 22, height: 22, borderRadius: "50%",
                background: "var(--clay-500)", color: "white",
                display: "grid", placeItems: "center",
              }}>
                <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m4 8.5 2.5 2.5L12 5.5"/>
                </svg>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: "var(--clay-500)", color: "var(--cream-50)",
                display: "grid", placeItems: "center",
              }}>
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 10s3-6 8-6 8 6 8 6-3 6-8 6-8-6-8-6Z"/>
                  <circle cx="10" cy="10" r="2.4"/>
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)" }}>
                  Stay &amp; watch
                </div>
                <div style={{ fontSize: 13.5, color: "var(--sr-text-secondary)", lineHeight: 1.5, marginTop: 4 }}>
                  See items appear in real time as the AI finds them. Auto-redirects when complete.
                </div>
              </div>
              <span style={{
                fontFamily: "var(--sr-font-mono)", fontSize: 10.5,
                color: "var(--clay-700)", letterSpacing: "0.14em", textTransform: "uppercase",
                display: "inline-flex", alignItems: "center", gap: 6, marginTop: "auto",
              }}>
                <span style={{
                  width: 6, height: 6, borderRadius: "50%", background: "var(--clay-500)",
                  animation: "badge-pulse 1.6s infinite",
                  display: "inline-block",
                }} />
                You&apos;re here now
              </span>
            </button>
          </div>
        </div>

        {/* Items found pills */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <span style={{
              fontFamily: "var(--sr-font-mono)", fontSize: 11,
              color: "var(--sr-text-muted)", letterSpacing: "0.14em", textTransform: "uppercase",
            }}>
              Items found so far
            </span>
            <span style={{ fontSize: 12.5, color: "var(--sr-text-muted)" }}>
              {visibleItems.length} of ~{itemCount}
            </span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {visibleItems.map((label, i) => (
              <span
                key={label}
                style={{
                  padding: "7px 12px",
                  background: i === visibleItems.length - 1 ? "var(--clay-50)" : "var(--sr-bg-card)",
                  border: `1px solid ${i === visibleItems.length - 1 ? "var(--clay-300)" : "var(--sr-border-subtle)"}`,
                  borderRadius: "var(--sr-radius-full)",
                  fontSize: 13, color: "var(--sr-text-primary)",
                  display: "inline-flex", alignItems: "center", gap: 7,
                  animation: "pill-in 360ms cubic-bezier(0.2,0.7,0.2,1) backwards",
                  animationDelay: `${i * 60}ms`,
                }}
              >
                <span style={{
                  width: 5, height: 5, borderRadius: "50%",
                  background: i === visibleItems.length - 1 ? "var(--clay-600)" : "var(--clay-400)",
                  display: "inline-block",
                }} />
                {label}
              </span>
            ))}
            <span style={{
              padding: "7px 12px",
              background: "transparent",
              border: "1px dashed var(--sr-border-subtle)",
              borderRadius: "var(--sr-radius-full)",
              fontSize: 13, color: "var(--sr-text-muted)",
              display: "inline-flex", alignItems: "center", gap: 7,
            }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--ink-200)", display: "inline-block" }} />
              scanning…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
