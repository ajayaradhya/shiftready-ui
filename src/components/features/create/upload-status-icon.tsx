import { Video, Sparkles } from "lucide-react";
import type { UploadStatus } from "@/hooks/use-upload";

export function UploadStatusIcon({ status }: { status: UploadStatus }) {
  return (
    <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary">
      {status === "processing" ? (
        <Sparkles className="animate-pulse" size={40} />
      ) : (
        <Video size={40} />
      )}
    </div>
  );
}
