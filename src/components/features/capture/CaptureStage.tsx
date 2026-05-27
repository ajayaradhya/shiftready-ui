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

const HOW_IT_WORKS_STEPS = [
  {
    icon: "👆",
    title: "Tap any item",
    desc: "Point at an item and tap — it's added to your bucket instantly. AI identifies it in the background.",
  },
  {
    icon: "✏️",
    title: "Review names",
    desc: "Check AI guesses and edit names before uploading. Low-confidence items are flagged for you.",
  },
  {
    icon: "🏷️",
    title: "Create your sale",
    desc: "Tap \"Create Sale\" — we group and price everything. Buyers can browse in minutes.",
  },
];

export function CaptureStage({ stream, onUserTap }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const onUserTapRef = useRef(onUserTap);
  const throttleRef = useRef(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const showHowItWorksRef = useRef(false);

  useEffect(() => { onUserTapRef.current = onUserTap; }, [onUserTap]);
  useEffect(() => { showHowItWorksRef.current = showHowItWorks; }, [showHowItWorks]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);

  // Wake lock — keep screen on; re-acquire after tab returns to foreground
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

  // Orientation lock — portrait during capture (best-effort; not supported on iOS Safari)
  useEffect(() => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (screen.orientation as any)?.lock?.("portrait").catch?.(() => {});
    } catch {}
    return () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (screen.orientation as any)?.unlock?.();
      } catch {}
    };
  }, []);

  const handleStageClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (showHowItWorksRef.current) {
      setShowHowItWorks(false);
      return;
    }
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

      {/* Corner guides + center hint (non-interactive layer) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
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

        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            textAlign: "center",
          }}
        >
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
      </div>

      {/* "How it works" link */}
      <button
        onClick={(e) => { e.stopPropagation(); setShowHowItWorks(true); }}
        style={{
          position: "absolute",
          bottom: 96,
          left: "50%",
          transform: "translateX(-50%)",
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "6px 14px",
          borderRadius: 100,
          color: "rgba(255,255,255,0.30)",
          fontFamily: "var(--sr-font-sans)",
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.01em",
          zIndex: 5,
          whiteSpace: "nowrap",
        }}
      >
        How it works
      </button>

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

      {/* How it works overlay */}
      {showHowItWorks && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 70,
            background: "rgba(0,0,0,0.72)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px 20px",
          }}
          onClick={(e) => { e.stopPropagation(); setShowHowItWorks(false); }}
        >
          <div
            style={{
              background: "rgba(18,14,12,0.97)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 20,
              padding: "28px 24px 32px",
              maxWidth: 340,
              width: "100%",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 20,
                fontWeight: 500,
                color: "rgba(255,255,255,0.90)",
                marginBottom: 24,
                letterSpacing: "-0.02em",
              }}
            >
              How it works
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {HOW_IT_WORKS_STEPS.map((step, i) => (
                <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: "rgba(181,96,74,0.18)",
                      border: "1px solid rgba(181,96,74,0.28)",
                      display: "grid",
                      placeItems: "center",
                      fontSize: 18,
                      flexShrink: 0,
                    }}
                  >
                    {step.icon}
                  </div>
                  <div>
                    <div
                      style={{
                        fontFamily: "var(--sr-font-sans)",
                        fontSize: 14,
                        fontWeight: 600,
                        color: "rgba(255,255,255,0.85)",
                        marginBottom: 4,
                      }}
                    >
                      {step.title}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--sr-font-sans)",
                        fontSize: 13,
                        color: "rgba(255,255,255,0.45)",
                        lineHeight: 1.5,
                      }}
                    >
                      {step.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setShowHowItWorks(false)}
              style={{
                marginTop: 28,
                width: "100%",
                height: 48,
                borderRadius: 14,
                border: "none",
                background: "var(--clay-600)",
                color: "#fff",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "var(--sr-font-sans)",
                cursor: "pointer",
              }}
            >
              Got it
            </button>
          </div>
        </div>
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
