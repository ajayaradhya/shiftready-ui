"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { initSale, startProcessing } from "@/lib/api";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
} from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type UploadStatus = "idle" | "uploading" | "processing";

export interface UseUploadReturn {
  status: UploadStatus;
  uploadProgress: number;
  fileError: string | null;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useUpload(): UseUploadReturn {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setFileError(null);

    if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
      setFileError("Unsupported format. Please use MP4, MOV, or WebM.");
      return;
    }
    if (file.size > MAX_VIDEO_SIZE_BYTES) {
      setFileError(`File too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`);
      return;
    }

    try {
      setStatus("uploading");

      const { event_id, upload_url } = await initSale(user.uid, file.name);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            setUploadProgress(100);
            resolve();
          } else {
            reject(new Error(`GCS upload failed (${xhr.status})`));
          }
        };
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setStatus("processing");
      await startProcessing(event_id);

      setTimeout(() => {
        router.push(`/inventory/${event_id}`);
      }, 1500);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setFileError(message);
      toast.error(message);
      setStatus("idle");
      setUploadProgress(0);
    }
  };

  return { status, uploadProgress, fileError, handleFileUpload };
}
