"use client";

import { useState } from "react";
import { Camera, AlertTriangle, Wifi } from "lucide-react";

interface Props {
  onGranted: (stream: MediaStream) => void;
}

export function CapturePermissionsGate({ onGranted }: Props) {
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestCamera = async () => {
    setRequesting(true);
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      onGranted(stream);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Camera access denied");
      setRequesting(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "calc(100vh - 64px)",
        padding: "32px 24px",
        fontFamily: "var(--sr-font-sans)",
        textAlign: "center",
        gap: 24,
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 24,
          background: "var(--clay-50)",
          border: "1px solid var(--clay-100)",
          display: "grid",
          placeItems: "center",
          color: "var(--clay-600)",
        }}
      >
        <Camera size={36} strokeWidth={1.5} />
      </div>

      {/* Copy */}
      <div style={{ maxWidth: 320 }}>
        <h1
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 28,
            fontWeight: 500,
            letterSpacing: "-0.02em",
            color: "var(--ink-800)",
            margin: "0 0 10px",
          }}
        >
          Allow camera access
        </h1>
        <p style={{ fontSize: 15, color: "var(--sr-text-secondary)", lineHeight: 1.55, margin: 0 }}>
          ShiftReady uses your camera to detect and log household items in real time.
        </p>
      </div>

      {/* Notes */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          maxWidth: 300,
          width: "100%",
        }}
      >
        {[
          "Video is processed on-device — nothing streamed yet",
          "Rear camera used automatically on mobile",
          "Microphone not required for this step",
        ].map((note) => (
          <div
            key={note}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 10,
              padding: "10px 14px",
              background: "var(--sr-bg-card)",
              border: "1px solid var(--sr-border-subtle)",
              borderRadius: "var(--sr-radius-md)",
              textAlign: "left",
            }}
          >
            <Wifi
              size={14}
              strokeWidth={1.5}
              style={{ color: "var(--clay-500)", flexShrink: 0, marginTop: 2 }}
            />
            <span style={{ fontSize: 13, color: "var(--sr-text-secondary)", lineHeight: 1.45 }}>
              {note}
            </span>
          </div>
        ))}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: "12px 16px",
            background: "var(--rust-50)",
            border: "1px solid var(--rust-100)",
            borderRadius: "var(--sr-radius-md)",
            maxWidth: 320,
            width: "100%",
            textAlign: "left",
          }}
        >
          <AlertTriangle size={14} strokeWidth={1.5} style={{ color: "var(--rust-500)", flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 13, color: "var(--rust-600)", lineHeight: 1.45 }}>{error}</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={requestCamera}
        disabled={requesting}
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minWidth: 220,
          minHeight: 52,
          padding: "14px 28px",
          borderRadius: "var(--sr-radius-lg)",
          border: "none",
          background: requesting ? "var(--clay-200)" : "var(--clay-600)",
          color: "#fff",
          fontSize: 15,
          fontWeight: 600,
          fontFamily: "var(--sr-font-sans)",
          cursor: requesting ? "not-allowed" : "pointer",
          transition: "background 120ms",
          letterSpacing: "-0.01em",
        }}
      >
        <Camera size={18} strokeWidth={1.75} />
        {requesting ? "Requesting…" : "Enable Camera"}
      </button>
    </div>
  );
}
