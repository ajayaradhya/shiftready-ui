"use client";

import { StopCircle } from "lucide-react";

interface Props {
  recordingSeconds: number;
  onFinish: () => void;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function CaptureControls({ recordingSeconds, onFinish }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 24px 32px",
        background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      {/* REC indicator */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 14px",
          borderRadius: 100,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--rust-500)",
            animation: "recPulse 1.2s ease-in-out infinite",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 12,
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
        >
          REC {formatDuration(recordingSeconds)}
        </span>
      </div>

      {/* Finish button */}
      <button
        onClick={onFinish}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 10,
          width: "100%",
          maxWidth: 320,
          minHeight: 52,
          padding: "14px 24px",
          borderRadius: "var(--sr-radius-lg)",
          border: "none",
          background: "var(--clay-600)",
          color: "#fff",
          fontSize: 16,
          fontWeight: 700,
          fontFamily: "var(--sr-font-sans)",
          cursor: "pointer",
          letterSpacing: "-0.01em",
          transition: "background 120ms",
        }}
      >
        <StopCircle size={20} strokeWidth={2} />
        Finish Capture
      </button>

      <style>{`
        @keyframes recPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
