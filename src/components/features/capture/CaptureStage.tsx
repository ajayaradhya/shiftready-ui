"use client";

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import { useMediapipeDetector } from "@/hooks/use-mediapipe-detector";
import { AlertTriangle, ScanLine } from "lucide-react";

interface Props {
  stream: MediaStream;
  onUserTap?: (frameSrc: string, label?: string) => void;
}

function captureFrame(video: HTMLVideoElement): string {
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
  useEffect(() => { onUserTapRef.current = onUserTap; }, [onUserTap]);

  const { status, loadError, detect } = useMediapipeDetector();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);

  const handleStageClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    setRipple({ x: clickX, y: clickY });
    setTimeout(() => setRipple(null), 600);

    const frameSrc = captureFrame(video);
    let label: string | undefined;

    if (status === "ready") {
      const result = detect(video);
      if (result && result.detections.length > 0) {
        const dW = rect.width;
        const dH = rect.height;
        const vW = video.videoWidth;
        const vH = video.videoHeight;

        if (vW && vH) {
          const scale = Math.max(dW / vW, dH / vH);
          const offsetX = (dW - vW * scale) / 2;
          const offsetY = (dH - vH * scale) / 2;

          // Prefer bbox that contains the click point
          const hit = result.detections.find((det) => {
            const x = offsetX + det.bbox.x * scale;
            const y = offsetY + det.bbox.y * scale;
            const w = det.bbox.w * scale;
            const h = det.bbox.h * scale;
            return clickX >= x && clickX <= x + w && clickY >= y && clickY <= y + h;
          });

          if (hit) {
            label = hit.label;
          } else {
            // Fall back to nearest by center distance
            const nearest = result.detections.reduce((best, det) => {
              const cx = offsetX + (det.bbox.x + det.bbox.w / 2) * scale;
              const cy = offsetY + (det.bbox.y + det.bbox.h / 2) * scale;
              const dist = Math.hypot(cx - clickX, cy - clickY);
              const bcx = offsetX + (best.bbox.x + best.bbox.w / 2) * scale;
              const bcy = offsetY + (best.bbox.y + best.bbox.h / 2) * scale;
              const bdist = Math.hypot(bcx - clickX, bcy - clickY);
              return dist < bdist ? det : best;
            });
            label = nearest.label;
          }
        }
      }
    }

    onUserTapRef.current?.(frameSrc, label);
  }, [status, detect]);

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
      {status === "ready" && (
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
          ].map((style, i) => (
            <div key={i} style={{ position: "absolute", width: 28, height: 28, ...style }} />
          ))}

          <ScanLine size={28} strokeWidth={1.5} style={{ color: "rgba(255,255,255,0.35)" }} />
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
      )}

      {/* Loading overlay */}
      {status === "loading" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            background: "rgba(0,0,0,0.65)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div
            className="animate-spin"
            style={{
              width: 36,
              height: 36,
              border: "2px solid rgba(255,255,255,0.2)",
              borderTopColor: "var(--clay-400)",
              borderRadius: "50%",
            }}
          />
          <div
            style={{
              fontFamily: "var(--sr-font-serif)",
              fontSize: 18,
              fontWeight: 500,
              color: "#fff",
            }}
          >
            Starting camera…
          </div>
        </div>
      )}

      {/* Error overlay - still tappable, just no label detection */}
      {status === "error" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            background: "rgba(0,0,0,0.4)",
            padding: 24,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <AlertTriangle size={28} strokeWidth={1.5} style={{ color: "var(--rust-400)" }} />
          <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, maxWidth: 260, lineHeight: 1.5 }}>
            {loadError ?? "Tap anywhere to capture items."}
          </div>
        </div>
      )}

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
