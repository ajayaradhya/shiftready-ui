"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { ArrowLeft, Video } from "lucide-react";
import Link from "next/link";
import { useSaleContext } from "@/lib/sale-context";
import { useEffect } from "react";

// Lazy-load CaptureStage - pulls in heavy MediaPipe WASM, skip SSR
const CaptureStage = dynamic(
  () =>
    import("@/components/features/capture/CaptureStage").then((m) => ({
      default: m.CaptureStage,
    })),
  { ssr: false }
);

type PageState = "gate" | "live";

export default function LiveStreamPage() {
  const [state, setState] = useState<PageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const { setSale } = useSaleContext();

  useEffect(() => {
    setSale({ label: "Live Capture", name: "Spike · Phase 0b" });
    return () => setSale(null);
  }, [setSale]);

  const handleGranted = (s: MediaStream) => {
    setStream(s);
    setState("live");
  };

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  return (
    <div style={{ fontFamily: "var(--sr-font-sans)" }}>
      {/* Sub-header bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "12px 20px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
        }}
      >
        <Link
          href="/seller-central/create"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--sr-text-muted)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 500,
            minHeight: 44,
            padding: "0 4px",
          }}
        >
          <ArrowLeft size={16} strokeWidth={1.5} />
          Back
        </Link>

        <div style={{ width: 1, height: 18, background: "var(--sr-border-subtle)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Video size={15} strokeWidth={1.5} style={{ color: "var(--clay-600)" }} />
          <span
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 15,
              fontWeight: 500,
              color: "var(--ink-700)",
              letterSpacing: "-0.01em",
            }}
          >
            Live Capture
          </span>
          <span
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 9,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--sr-text-muted)",
              padding: "2px 7px",
              border: "1px solid var(--sr-border-subtle)",
              borderRadius: 100,
            }}
          >
            Phase 0b
          </span>
        </div>
      </div>

      {/* Main content */}
      {state === "gate" && <CapturePermissionsGate onGranted={handleGranted} />}
      {state === "live" && stream && <CaptureStage stream={stream} />}
    </div>
  );
}
