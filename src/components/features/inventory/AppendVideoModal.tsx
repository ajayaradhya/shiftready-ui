"use client";

import { useRef } from "react";
import { Upload, Loader2, CheckCircle2, AlertTriangle, Film } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAppendUpload } from "@/hooks/use-append-upload";
import { ACCEPTED_VIDEO_TYPES } from "@/lib/constants";

interface Props {
  eventId: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AppendVideoModal({ eventId, open, onClose, onSuccess }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { status, progress, error, upload, reset } = useAppendUpload(eventId);

  const handleFile = async (file: File) => {
    await upload(file);
  };

  const handleDone = () => {
    onSuccess();
    reset();
    onClose();
  };

  const handleClose = () => {
    if (status === "uploading" || status === "processing") return;
    reset();
    onClose();
  };

  const isBusy = status === "uploading" || status === "processing";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add items via video</DialogTitle>
          <DialogDescription>
            Record a walkthrough of additional items — they&apos;ll be extracted and appended to this sale.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4 pt-2">

          {/* Idle / error — show file picker */}
          {(status === "idle" || status === "error") && (
            <>
              <label
                htmlFor="append-video-input"
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
                  id="append-video-input"
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
                  <Upload size={14} />
                  Uploading video…
                </span>
                <span className="font-mono font-semibold text-on-surface">{progress}%</span>
              </div>
              <div className="h-1.5 rounded-full bg-surface-container-highest overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Processing */}
          {status === "processing" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 size={28} className="animate-spin text-primary" />
              <p className="text-sm font-medium text-on-surface">Extracting items…</p>
              <p className="text-xs text-on-surface-variant text-center">
                AI is analyzing your video. New items will appear in the inventory when done.
              </p>
            </div>
          )}

          {/* Done */}
          {status === "done" && (
            <div className="flex flex-col items-center gap-3 py-4">
              <CheckCircle2 size={28} className="text-[var(--moss-500)]" />
              <p className="text-sm font-medium text-on-surface">Items added!</p>
              <p className="text-xs text-on-surface-variant text-center">
                New bundles and items have been appended to your sale.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex gap-2 pt-1">
            {status === "done" ? (
              <Button variant="primary" size="md" className="flex-1" onClick={handleDone}>
                View updated inventory
              </Button>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="flex-1"
                onClick={handleClose}
                disabled={isBusy}
              >
                {isBusy ? "Please wait…" : "Cancel"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
