"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useMediapipeDetector, type DetectionEntry } from "@/hooks/use-mediapipe-detector";
import { Zap, AlertTriangle } from "lucide-react";

interface Props {
  stream: MediaStream;
}

const LABEL_COLORS: Record<string, string> = {
  default: "var(--clay-500)",
  sofa: "var(--moss-600)",
  chair: "var(--moss-600)",
  couch: "var(--moss-600)",
  tv: "var(--honey-600)",
  "television": "var(--honey-600)",
  bed: "var(--clay-600)",
  table: "var(--clay-500)",
  laptop: "var(--honey-600)",
  book: "var(--ink-400)",
};

function getColor(label: string): string {
  const key = label.toLowerCase();
  return LABEL_COLORS[key] ?? LABEL_COLORS.default;
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

  // object-fit: cover scale + offset
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

export function CaptureStage({ stream }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const { status, loadError, loadMs, detect } = useMediapipeDetector();
  const [detections, setDetections] = useState<DetectionEntry[]>([]);
  const [fps, setFps] = useState(0);
  const [frameCount, setFrameCount] = useState(0);

  // Attach stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream;
    video.play().catch(() => {});
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  // Stop stream on unmount
  useEffect(() => {
    return () => {
      stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  // RAF detection loop — starts once detector is ready
  const runLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Sync canvas size to displayed video size
    const { clientWidth, clientHeight } = video;
    if (canvas.width !== clientWidth || canvas.height !== clientHeight) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }

    const result = detect(video);
    if (result) {
      setDetections(result.detections);
      setFps(result.fps);
      setFrameCount((n) => n + 1);
      drawBboxes(canvas, video, result.detections);
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
    <div style={{ position: "relative", width: "100%", height: "calc(100vh - 64px)", background: "#000", overflow: "hidden" }}>
      {/* Camera feed */}
      <video
        ref={videoRef}
        muted
        playsInline
        autoPlay
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
        }}
      />

      {/* Bbox canvas */}
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

      {/* Top HUD: FPS + model status */}
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
        {/* FPS pill */}
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

        {/* Load time pill (shown once loaded) */}
        {loadMs !== null && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.6)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 11,
              letterSpacing: "0.04em",
            }}
          >
            WASM {(loadMs / 1000).toFixed(1)}s init
          </div>
        )}

        {/* Frame counter */}
        {frameCount > 0 && (
          <div
            style={{
              padding: "4px 10px",
              borderRadius: 100,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(8px)",
              color: "rgba(255,255,255,0.5)",
              fontFamily: "var(--sr-font-mono)",
              fontSize: 11,
            }}
          >
            {frameCount} frames
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
          <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, maxWidth: 260 }}>{loadError}</div>
        </div>
      )}

      {/* Bottom detections panel */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          background: "linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)",
          padding: "40px 20px 20px",
        }}
      >
        {detections.length === 0 && status === "ready" ? (
          <p
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 11,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "rgba(255,255,255,0.4)",
              textAlign: "center",
              margin: 0,
            }}
          >
            Point camera at items to detect
          </p>
        ) : (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {detections.slice(0, 6).map((det, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "5px 12px",
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
                    fontSize: 13,
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
                    fontSize: 11,
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {Math.round(det.score * 100)}%
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
