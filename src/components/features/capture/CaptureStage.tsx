"use client";

import { useEffect, useRef, useState, useCallback, type MouseEvent } from "react";
import { useMediapipeDetector, type DetectionEntry } from "@/hooks/use-mediapipe-detector";
import { Zap, AlertTriangle } from "lucide-react";

interface Props {
  stream: MediaStream;
  shouldStop?: boolean;
  pendingLabel?: string | null;
  skipLabels?: string[];
  onItemDetected?: (label: string, frameSrc: string) => void;
  onUserTap?: (frameSrc: string) => void;
}

// Detection count before triggering confirm prompt
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
    const label = `${det.label} ${Math.round(det.score * 100)}%`;

    ctx.strokeStyle = color;
    ctx.strokeRect(x, y, w, h);

    const textW = ctx.measureText(label).width + 10;
    const textH = 20;
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.85;
    ctx.fillRect(x, y - textH, textW, textH);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.fillText(label, x + 5, y - 5);
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

  const { status, loadError, loadMs, detect } = useMediapipeDetector();
  const [detections, setDetections] = useState<DetectionEntry[]>([]);
  const [fps, setFps] = useState(0);
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

  // Attach stream to video
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => { video.srcObject = null; };
  }, [stream]);

  // Reset seen counts when shouldStop
  useEffect(() => {
    if (shouldStop) {
      cancelAnimationFrame(rafRef.current);
    }
  }, [shouldStop]);

  // RAF detection loop
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
      setFps(result.fps);
      drawBboxes(canvas, video, result.detections);

      // Freeze all counting while a confirm card is visible
      if (pendingLabelRef.current === null) {
        for (const det of result.detections) {
          if (det.score < 0.6) continue;
          const label = det.label.toLowerCase();

          // Never re-surface rejected or already-confirmed labels
          if (skipLabelsRef.current.has(label)) continue;

          const count = (seenCountRef.current.get(label) ?? 0) + 1;
          seenCountRef.current.set(label, count);

          if (count >= CONFIRM_THRESHOLD) {
            seenCountRef.current.delete(label);
            pendingLabelRef.current = label;
            const frameSrc = captureFrame(video);
            onItemDetectedRef.current?.(label, frameSrc);
            break; // one prompt at a time
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

  const fpsColor =
    fps >= 15 ? "var(--moss-600)" : fps >= 8 ? "var(--honey-600)" : "var(--rust-500)";

  return (
    <div
      onClick={handleStageClick}
      style={{
        position: "relative",
        width: "100%",
        height: "calc(100vh - 64px)",
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
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />

      {/* FPS pill */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-end",
          gap: 6,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "5px 12px",
            borderRadius: 100,
            background: "rgba(0,0,0,0.55)",
            backdropFilter: "blur(8px)",
            color: fpsColor,
            fontFamily: "var(--sr-font-mono)",
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: "0.04em",
          }}
        >
          <Zap size={12} strokeWidth={2} />
          {status === "loading" ? "…" : `${fps} fps`}
        </div>
        {loadMs !== null && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
            }}
          >
            WASM {(loadMs / 1000).toFixed(1)}s init
          </div>
        )}
      </div>

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
            background: "rgba(0,0,0,0.6)",
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
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontFamily: "var(--sr-font-serif)",
                fontSize: 18,
                fontWeight: 500,
                color: "#fff",
                marginBottom: 4,
              }}
            >
              Loading AI model…
            </div>
            <div
              style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 11,
                color: "rgba(255,255,255,0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.12em",
              }}
            >
              EfficientDet Lite0 · WASM
            </div>
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
          <div style={{ color: "#fff", fontSize: 15, fontWeight: 500 }}>Model failed to load</div>
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, maxWidth: 260 }}>
            {loadError}
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

      {/* Live detection badges */}
      <div
        style={{
          position: "absolute",
          bottom: 100,
          left: 0,
          right: 0,
          padding: "0 16px",
          pointerEvents: "none",
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {detections.slice(0, 5).map((det, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "4px 10px",
                borderRadius: 100,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(8px)",
                border: `1px solid ${getColor(det.label)}40`,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
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
              <span
                style={{
                  fontFamily: "var(--sr-font-mono)",
                  fontSize: 10,
                  color: "rgba(255,255,255,0.5)",
                }}
              >
                {Math.round(det.score * 100)}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes tapRipple {
          from { opacity: 0.9; transform: translate(-50%, -50%) scale(0.2); }
          to   { opacity: 0;   transform: translate(-50%, -50%) scale(2.2); }
        }
      `}</style>
    </div>
  );
}
