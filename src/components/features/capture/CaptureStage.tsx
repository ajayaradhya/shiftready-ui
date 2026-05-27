"use client";

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";

interface Props {
  stream: MediaStream;
  onUserTap?: (frameSrc: string) => void;
}

function captureFrameFromVideo(video: HTMLVideoElement): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = video.videoWidth || 640;
  offscreen.height = video.videoHeight || 480;
  const ctx = offscreen.getContext("2d");
  if (ctx) ctx.drawImage(video, 0, 0);
  return offscreen.toDataURL("image/jpeg", 0.85);
}

export function CaptureStage({ stream, onUserTap }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const onUserTapRef = useRef(onUserTap);
  const throttleRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);

  useEffect(() => { onUserTapRef.current = onUserTap; }, [onUserTap]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);

  useEffect(() => {
    let active = true;
    const acquire = async () => {
      try {
        if ("wakeLock" in navigator) {
          wakeLockRef.current = await navigator.wakeLock.request("screen");
        }
      } catch {}
    };
    acquire();
    const handleVisibility = () => {
      if (document.visibilityState === "visible" && active) acquire();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      active = false;
      document.removeEventListener("visibilitychange", handleVisibility);
      wakeLockRef.current?.release().catch(() => {});
      wakeLockRef.current = null;
    };
  }, []);

  const handleStageClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (throttleRef.current) return;

    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setRipple({ x: clickX, y: clickY });
    setTimeout(() => setRipple(null), 600);

    // Haptic feedback (best-effort)
    try { navigator.vibrate?.(15); } catch {}

    throttleRef.current = true;
    setTimeout(() => { throttleRef.current = false; }, 400);

    const frameSrc = captureFrameFromVideo(video);
    onUserTapRef.current?.(frameSrc);
  }, []);

  return (
    <div
      onClick={handleStageClick}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100dvh - 64px)",
        background: "#000",
        overflow: "hidden",
        cursor: "crosshair",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      {/* Idle hint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        {[
          { top: "28%", left: "15%", borderTop: "2px solid rgba(255,255,255,0.4)", borderLeft: "2px solid rgba(255,255,255,0.4)" },
          { top: "28%", right: "15%", borderTop: "2px solid rgba(255,255,255,0.4)", borderRight: "2px solid rgba(255,255,255,0.4)" },
          { bottom: "28%", left: "15%", borderBottom: "2px solid rgba(255,255,255,0.4)", borderLeft: "2px solid rgba(255,255,255,0.4)" },
          { bottom: "28%", right: "15%", borderBottom: "2px solid rgba(255,255,255,0.4)", borderRight: "2px solid rgba(255,255,255,0.4)" },
        ].map((s, i) => (
          <div key={i} style={{ position: "absolute", width: 28, height: 28, ...s }} />
        ))}
        <span
          style={{
            fontFamily: "var(--sr-font-sans)",
            fontSize: 13,
            fontWeight: 500,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.01em",
          }}
        >
          Tap an item to capture it
        </span>
      </div>

      {/* Tap ripple */}
      {ripple && (
        <div
          style={{
            position: "absolute",
            left: ripple.x,
            top: ripple.y,
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "2px solid rgba(255,255,255,0.85)",
            transform: "translate(-50%, -50%)",
            animation: "tapRipple 600ms ease-out forwards",
            pointerEvents: "none",
          }}
        />
      )}

      <style>{`
        @keyframes tapRipple {
          from { opacity: 0.9; transform: translate(-50%, -50%) scale(0.2); }
          to   { opacity: 0;   transform: translate(-50%, -50%) scale(2.2); }
        }
      `}</style>
    </div>
  );
}
