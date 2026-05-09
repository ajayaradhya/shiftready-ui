"use client";

import { useUpload } from "@/hooks/use-upload";
import { ACCEPTED_VIDEO_TYPES } from "@/lib/constants";
import { Upload } from "lucide-react";
import { UploadStatusIcon } from "@/components/features/create/upload-status-icon";
import { UploadProgressBar } from "@/components/features/create/upload-progress-bar";
import { RelocationSteps } from "@/components/features/create/relocation-steps";

export default function CreateSalePage() {
  const { status, uploadProgress, fileError, handleFileUpload } = useUpload();

  return (
    <div className="flex flex-col items-center justify-center min-h-[90vh] bg-surface">
      <div className="w-full max-w-xl bg-surface-container-high rounded-[2rem] p-12 border border-outline-variant/10 shadow-2xl flex flex-col items-center gap-8 text-center animate-in fade-in zoom-in duration-500">
        <UploadStatusIcon status={status} />

        <div className="space-y-2">
          <h1 className="text-4xl font-black text-on-surface uppercase tracking-tighter">
            {status === "idle"
              ? "Start Your Move"
              : status === "uploading"
                ? "Syncing Bytes"
                : "AI Extraction"}
          </h1>
          <p className="text-sm text-on-surface-variant font-medium italic leading-relaxed px-4">
            {status === "idle"
              ? "Upload your residential walkthrough. Gemini will identify assets and benchmark market prices."
              : "Connecting to the ShiftReady cloud. Gemini is preparing to scan your inventory."}
          </p>
        </div>

        {fileError && (
          <div className="w-full px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium text-left animate-in fade-in duration-300">
            {fileError}
          </div>
        )}

        {status === "idle" ? (
          <label className="group relative cursor-pointer mt-4">
            <input
              type="file"
              accept={ACCEPTED_VIDEO_TYPES.join(",")}
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="flex items-center gap-3 bg-primary text-surface px-10 py-5 rounded-full font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30">
              <Upload size={20} />
              Select Walkthrough
            </div>
          </label>
        ) : (
          <UploadProgressBar status={status} progress={uploadProgress} />
        )}

        <RelocationSteps />
      </div>
    </div>
  );
}
