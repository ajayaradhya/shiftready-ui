"use client";

import { useState } from "react";
import { initSale, startProcessing } from "@/lib/api";
import {
  ACCEPTED_VIDEO_TYPES,
  MAX_VIDEO_SIZE_BYTES,
  MAX_VIDEO_SIZE_MB,
} from "@/lib/constants";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export type UploadStatus = "idle" | "uploading" | "processing";

export interface UploadedFile {
  name: string;
  size: number;
  durationLabel?: string;
}

export interface UseUploadReturn {
  status: UploadStatus;
  uploadProgress: number;
  fileError: string | null;
  eventId: string | null;
  uploadedFile: UploadedFile | null;
  uploadFile: (file: File) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
}

export function useUpload(): UseUploadReturn {
  const { user } = useAuth();
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);

  const uploadFile = async (file: File) => {
    if (!user) return;

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
      setUploadProgress(0);

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

      await startProcessing(event_id);

      setEventId(event_id);
      setUploadedFile({ name: file.name, size: file.size });
      setStatus("processing");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Upload failed. Please try again.";
      setFileError(message);
      toast.error(message);
      setStatus("idle");
      setUploadProgress(0);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  return { status, uploadProgress, fileError, eventId, uploadedFile, uploadFile, handleFileUpload };
}
