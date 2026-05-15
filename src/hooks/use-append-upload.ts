"use client";

import { useState, useCallback, useRef } from "react";
import { appendInitSale, startAppendProcessing, getStatus } from "@/lib/api";
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB } from "@/lib/constants";

export type AppendUploadStatus = "idle" | "uploading" | "processing" | "done" | "error";

export interface UseAppendUploadReturn {
  status: AppendUploadStatus;
  progress: number;
  error: string | null;
  upload: (file: File) => Promise<void>;
  reset: () => void;
}

const POLL_INTERVAL_MS = 1500;

export function useAppendUpload(eventId: string): UseAppendUploadReturn {
  const [status, setStatus] = useState<AppendUploadStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPoll = () => {
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  };

  const pollUntilDone = useCallback(() => {
    const tick = async () => {
      try {
        const { status: saleStatus } = await getStatus(eventId);
        if (saleStatus === "processing") {
          pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
        } else if (saleStatus === "failed") {
          stopPoll();
          setError("Extraction failed. Please try again.");
          setStatus("error");
        } else {
          stopPoll();
          setStatus("done");
        }
      } catch {
        pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
      }
    };
    pollRef.current = setTimeout(tick, POLL_INTERVAL_MS);
  }, [eventId]);

  const upload = useCallback(
    async (file: File) => {
      setError(null);

      if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
        setError("Unsupported format. Use MP4, MOV, or WebM.");
        return;
      }
      if (file.size > MAX_VIDEO_SIZE_BYTES) {
        setError(`File too large. Max ${MAX_VIDEO_SIZE_MB}MB.`);
        return;
      }

      try {
        setStatus("uploading");
        setProgress(0);

        const { upload_url, gcs_uri } = await appendInitSale(eventId, file.name);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open("PUT", upload_url);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.upload.onprogress = (ev) => {
            if (ev.lengthComputable) {
              setProgress(Math.round((ev.loaded / ev.total) * 100));
            }
          };
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              setProgress(100);
              resolve();
            } else {
              reject(new Error(`Upload failed (${xhr.status})`));
            }
          };
          xhr.onerror = () => reject(new Error("Network error during upload"));
          xhr.send(file);
        });

        await startAppendProcessing(eventId, gcs_uri);
        setStatus("processing");
        pollUntilDone();
      } catch (err) {
        stopPoll();
        const msg = err instanceof Error ? err.message : "Upload failed.";
        setError(msg);
        setStatus("error");
      }
    },
    [eventId, pollUntilDone]
  );

  const reset = useCallback(() => {
    stopPoll();
    setStatus("idle");
    setProgress(0);
    setError(null);
  }, []);

  return { status, progress, error, upload, reset };
}
