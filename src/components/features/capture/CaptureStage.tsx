"use client";

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import { useMediapipeDetector, type DetectionEntry } from "@/hooks/use-mediapipe-detector";
import { AlertTriangle, ScanLine } from "lucide-react";

interface Props {
  stream: MediaStream;
  shouldStop?: boolean;
  pendingLabel?: string | null;
  skipLabels?: string[];
  onItemDetected?: (label: string, frameSrc: string) => void;
  onUserTap?: (frameSrc: string) => void;
}

const CONFIRM_THRESHOLD = 5;

const LABEL_COLORS: Record<string, string> = {
  default: "var(--clay-500)",
  sofa: "var(--moss-600)",
  chair: "var(--moss-600)",
  couch: "var(--moss-600)",
  tv: "var(--honey-600)",
  television: "var(--honey-600)",
  bed: "var(--clay-600)",
  table: "var(--clay-500)",
  laptop: "var(--honey-600)",
  book: "var(--ink-400)",
};

function getColor(label: string): string {
  return LABEL_COLORS[label.toLowerCase()] ?? LABEL_COLORS.default;
}

function drawBboxes(
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement,
  detections: DetectionEntry[]
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const dW = canvas.width;
  const dH = canvas.height;
  const vW = video.videoWidth;
  const vH = video.videoHeight;

  ctx.clearRect(0, 0, dW, dH);
  if (!vW || !vH || detections.length === 0) return;

  const scale = Math.max(dW / vW, dH / vH);
  const offsetX = (dW - vW * scale) / 2;
  const offsetY = (dH - vH * scale) / 2;

  ctx.lineWidth = 2;
  ctx.font = "bold 12px system-ui, sans-serif";

  for (const det of detections) {
    const x = offsetX + det.bbox.x * scale;
    const y = offsetY + det.bbox.y * scale;
    const w = det.bbox.w * scale;
    const h = det.bbox.h * scale;
    const color = getColor(det.label);

    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, w, h);

    const textW = ctx.measureText(det.label).width + 10;
    const textH = 20;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y - textH, textW, textH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText(det.label, x + 5, y - 5);
  }
}

function captureFrame(video: HTMLVideoElement): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = video.videoWidth || 640;
  offscreen.height = video.videoHeight || 480;
  const ctx = offscreen.getContext("2d");
  if (ctx) ctx.drawImage(video, 0, 0);
  return offscreen.toDataURL("image/jpeg", 0.85);
}

export function CaptureStage({ stream, shouldStop, pendingLabel, skipLabels, onItemDetected, onUserTap }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const seenCountRef = useRef<Map<string, number>>(new Map());
  const pendingLabelRef = useRef<string | null>(null);
  const skipLabelsRef = useRef<Set<string>>(new Set());
  const onItemDetectedRef = useRef(onItemDetected);

  useEffect(() => { onItemDetectedRef.current = onItemDetected; }, [onItemDetected]);
  useEffect(() => { pendingLabelRef.current = pendingLabel ?? null; }, [pendingLabel]);
  useEffect(() => { skipLabelsRef.current = new Set(skipLabels ?? []); }, [skipLabels]);

  const { status, loadError, detect } = useMediapipeDetector();
  const [detections, setDetections] = useState<DetectionEntry[]>([]);
  const [ripple, setRipple] = useState<{ x: number; y: number } | null>(null);
  const onUserTapRef = useRef(onUserTap);
  useEffect(() => { onUserTapRef.current = onUserTap; }, [onUserTap]);

  const handleStageClick = useCallback((e: MouseEvent<HTMLDivElement>) => {
    if (status !== "ready" || !videoRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    setRipple({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setTimeout(() => setRipple(null), 600);
    onUserTapRef.current?.(captureFrame(videoRef.current));
  }, [status]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);

  useEffect(() => {
    if (shouldStop) cancelAnimationFrame(rafRef.current);
  }, [shouldStop]);

  const runLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const { clientWidth, clientHeight } = video;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }

    const result = detect(video);
    if (result) {
      setDetections(result.detections);
      drawBboxes(canvas, video, result.detections);

      if (pendingLabelRef.current === null) {
        for (const det of result.detections) {
          if (det.score < 0.6) continue;
          const label = det.label.toLowerCase();
          if (skipLabelsRef.current.has(label)) continue;

          const count = (seenCountRef.current.get(label) ?? 0) + 1;
          seenCountRef.current.set(label, count);

          if (count >= CONFIRM_THRESHOLD) {
            seenCountRef.current.delete(label);
            pendingLabelRef.current = label;
            const frameSrc = captureFrame(video);
            onItemDetectedRef.current?.(label, frameSrc);
            break;
          }
        }
      }
    }

    rafRef.current = requestAnimationFrame(runLoop);
  }, [detect]);

  useEffect(() => {
    if (status !== "ready") return;
    rafRef.current = requestAnimationFrame(runLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [status, runLoop]);

  return (
    <div
      onClick={handleStageClick}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100dvh - 64px)",
        background: "#000",
        overflow: "hidden",
        cursor: status === "ready" ? "crosshair" : "default",
      }}
    >
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />

      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }}
      />

      {/* Idle hint — shown when ready and no detections pending */}
      {status === "ready" && detections.length === 0 && !pendingLabel && (
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
          {/* Corner frame guides */}
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
            Point at an item · tap to capture
          </span>
        </div>
      )}

      {/* Active detection badges — small pills near bottom, above controls */}
      {status === "ready" && detections.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: 110,
            left: 16,
            right: 16,
            pointerEvents: "none",
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          {detections.slice(0, 4).map((det, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
                padding: "4px 10px",
                borderRadius: 100,
                background: "rgba(0,0,0,0.60)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${getColor(det.label)}50`,
              }}
            >
              <span
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: "50%",
                  background: getColor(det.label),
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "var(--sr-font-sans)",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#fff",
                  textTransform: "capitalize",
                }}
              >
                {det.label}
              </span>
            </div>
          ))}
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

      {/* Error overlay */}
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
            background: "rgba(0,0,0,0.7)",
            padding: 24,
            textAlign: "center",
          }}
        >
          <AlertTriangle size={32} strokeWidth={1.5} style={{ color: "var(--rust-400)" }} />
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Detection unavailable</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, maxWidth: 260, lineHeight: 1.5 }}>
            {loadError ?? "Tap anywhere to manually capture items."}
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
