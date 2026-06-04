"use client";

import { StopCircle } from "lucide-react";

interface Props {
  onFinish: () => void;
}

export function CaptureControls({ onFinish }: Props) {
  return (
    <div
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        padding: "20px 24px",
        paddingBottom: "calc(20px + env(safe-area-inset-bottom, 0px))",
        background: "linear-gradient(to top, rgba(0,0,0,0.80) 0%, transparent 100%)",
        display: "flex",
        justifyContent: "center",
      }}
    >
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
    </div>
  );
}
