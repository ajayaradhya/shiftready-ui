"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { ObjectDetector } from "@mediapipe/tasks-vision";
import { loadObjectDetector } from "@/lib/capture/mediapipe-loader";

export type DetectionEntry = {
  label: string;
  score: number;
  bbox: { x: number; y: number; w: number; h: number };
};

export type DetectorStatus = "idle" | "loading" | "ready" | "error";

export function useMediapipeDetector() {
  const detectorRef = useRef<ObjectDetector | null>(null);
  const [status, setStatus] = useState<DetectorStatus>("idle");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadMs, setLoadMs] = useState<number | null>(null);
  const lastTimestampRef = useRef<number>(0);
  const fpsWindowRef = useRef<number[]>([]);

  useEffect(() => {
    setStatus("loading");
    const t0 = performance.now();
    loadObjectDetector()
      .then((d) => {
        detectorRef.current = d;
        setLoadMs(Math.round(performance.now() - t0));
        setStatus("ready");
      })
      .catch((e) => {
        setLoadError(String(e));
        setStatus("error");
      });
  }, []);

  const detect = useCallback(
    (video: HTMLVideoElement): { detections: DetectionEntry[]; fps: number } | null => {
      const d = detectorRef.current;
      if (!d || video.readyState < 2) return null;

      const now = performance.now();
      const result = d.detectForVideo(video, now);

      if (lastTimestampRef.current > 0) {
        const dt = now - lastTimestampRef.current;
        fpsWindowRef.current = [...fpsWindowRef.current.slice(-9), 1000 / dt];
      }
      lastTimestampRef.current = now;

      const fps =
        fpsWindowRef.current.length > 0
          ? Math.round(
              fpsWindowRef.current.reduce((a, b) => a + b) / fpsWindowRef.current.length
            )
          : 0;

      const detections: DetectionEntry[] = result.detections
        .filter((det) => det.boundingBox && det.categories.length > 0)
        .map((det) => ({
          label: det.categories[0].categoryName,
          score: det.categories[0].score,
          bbox: {
            x: det.boundingBox!.originX,
            y: det.boundingBox!.originY,
            w: det.boundingBox!.width,
            h: det.boundingBox!.height,
          },
        }));

      return { detections, fps };
    },
    []
  );

  return { status, loadError, loadMs, detect };
}
