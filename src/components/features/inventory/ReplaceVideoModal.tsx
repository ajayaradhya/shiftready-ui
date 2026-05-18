"use client";

import { useRef, useState } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Film, RefreshCw, PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { replaceVideoInit, replaceVideoConfirm } from "@/lib/api";
import { ACCEPTED_VIDEO_TYPES } from "@/lib/constants";

type Mode = "wipe" | "append";
type Status = "idle" | "uploading" | "processing" | "done" | "error";

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReplaceVideoModal({ eventId, open, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<Mode>("wipe");
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const isBusy = status === "uploading" || status === "processing";

  const handleFile = async (file: File) => {
    setError(null);
    setStatus("uploading");
    setProgress(0);

    try {
      const { upload_url, gcs_uri, video_id } = await replaceVideoInit(eventId, file.name);

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", upload_url);
        xhr.setRequestHeader("Content-Type", "video/mp4");
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
        };
        xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.send(file);
      });

      setStatus("processing");
      await replaceVideoConfirm(eventId, gcs_uri, mode, video_id);
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  const handleDone = () => {
    onSuccess();
    resetState();
    onClose();
  };

  const resetState = () => {
    setStatus("idle");
    setProgress(0);
    setError(null);
    setMode("wipe");
  };

  const handleClose = () => {
    if (isBusy) return;
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Replace video</DialogTitle>
          <DialogDescription>
            Upload a new video for this sale.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">
          {/* Mode selector — only show when idle */}
          {status === "idle" && (
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("wipe")}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--sr-radius-sm)",
                  border: `1.5px solid ${mode === "wipe" ? "var(--clay-400)" : "var(--cream-300)"}`,
                  background: mode === "wipe" ? "var(--clay-50)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <RefreshCw size={13} style={{ color: mode === "wipe" ? "var(--clay-600)" : "var(--sr-text-muted)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: mode === "wipe" ? "var(--clay-700)" : "var(--ink-600)" }}>
                    Replace
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--sr-text-muted)", lineHeight: 1.4, margin: 0 }}>
                  Clears existing items and re-extracts from new video
                </p>
              </button>
              <button
                onClick={() => setMode("append")}
                style={{
                  padding: "10px 12px",
                  borderRadius: "var(--sr-radius-sm)",
                  border: `1.5px solid ${mode === "append" ? "var(--clay-400)" : "var(--cream-300)"}`,
                  background: mode === "append" ? "var(--clay-50)" : "transparent",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                  <PlusCircle size={13} style={{ color: mode === "append" ? "var(--clay-600)" : "var(--sr-text-muted)" }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: mode === "append" ? "var(--clay-700)" : "var(--ink-600)" }}>
                    Add more
                  </span>
                </div>
                <p style={{ fontSize: 11, color: "var(--sr-text-muted)", lineHeight: 1.4, margin: 0 }}>
                  Appends new items alongside existing inventory
                </p>
              </button>
            </div>
          )}

          {/* File picker */}
          {(status === "idle" || status === "error") && (
            <>
              <label
                htmlFor="replace-video-input"
                className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-outline-variant/40 bg-surface-container-low p-8 cursor-pointer hover:border-primary/40 hover:bg-surface-container transition-colors"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-container-highest">
                  <Film size={22} className="text-on-surface-variant" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-on-surface">Choose video</p>
                  <p className="text-xs text-on-surface-variant mt-1">MP4, MOV or WebM · up to 500 MB</p>
                </div>
                <input
                  ref={fileInputRef}
                  id="replace-video-input"
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(",")}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFile(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {error && (
                <div className="flex items-start gap-2 rounded-lg bg-[var(--rust-50)] border border-[var(--rust-100)] px-3 py-2.5">
                  <AlertTriangle size={14} className="text-[var(--rust-500)] mt-0.5 shrink-0" />
                  <p className="text-xs text-[var(--rust-600)] leading-relaxed">{error}</p>
                </div>
              )}
            </>
          )}

          {/* Uploading */}
          {status === "uploading" && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-sm text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <Upload size={14} /> Uploading video…
                </span>
                <span className="font-mono font-semibold text-on-surface">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Processing */}
          {status === "processing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm font-medium text-on-surface">
                {mode === "wipe" ? "Replacing video…" : "Extracting new items…"}
              </p>
              <p className="text-xs text-on-surface-variant text-center">
                AI is processing your video. This may take a minute.
              </p>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={28} className="text-[var(--moss-500)]" />
              <p className="text-sm font-medium text-on-surface">
                {mode === "wipe" ? "Video replaced!" : "Items added!"}
              </p>
              <p className="text-xs text-on-surface-variant text-center">
                {mode === "wipe"
                  ? "Re-extraction is running. New bundles will appear shortly."
                  : "New bundles and items have been appended to your sale."}
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex gap-2 pt-1">
            {status === "done" ? (
              <Button variant="primary" size="md" className="flex-1" onClick={handleDone}>
                View updated inventory
              </Button>
            ) : (
              <Button variant="secondary" size="md" className="flex-1" onClick={handleClose} disabled={isBusy}>
                {isBusy ? "Please wait…" : "Cancel"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
