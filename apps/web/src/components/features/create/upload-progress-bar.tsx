import { Loader2 } from "lucide-react";
import type { UploadStatus } from "@/hooks/use-upload";

interface UploadProgressBarProps {
  status: UploadStatus;
  progress: number;
}

export function UploadProgressBar({ status, progress }: UploadProgressBarProps) {
  return (
    <div className="w-full mt-4 space-y-6">
      <div className="h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
        <Loader2 className="animate-spin" size={14} />
        {status}... {progress}%
      </div>
    </div>
  );
}
