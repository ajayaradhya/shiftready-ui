"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function CreateError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    toast.error(error.message || "Something went wrong on the upload page.");
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center bg-surface">
      <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center text-error">
        <AlertTriangle size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">
          Upload Failed
        </h2>
        <p className="text-sm text-on-surface-variant font-medium max-w-sm">
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
      </div>
      <button
        onClick={reset}
        className="flex items-center gap-2 px-8 py-4 bg-primary text-surface rounded-full font-black uppercase tracking-widest text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
      >
        <RotateCcw size={16} />
        Try Again
      </button>
    </div>
  );
}
