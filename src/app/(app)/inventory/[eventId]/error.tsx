"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { AlertTriangle, RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InventoryError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  useEffect(() => {
    toast.error(error.message || "Failed to load inventory.");
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh] gap-6 text-center">
      <div className="w-20 h-20 bg-error/10 rounded-3xl flex items-center justify-center text-error">
        <AlertTriangle size={40} />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-black uppercase tracking-tighter text-on-surface">
          Inventory Error
        </h2>
        <p className="text-sm text-on-surface-variant font-medium max-w-sm">
          {error.message || "Could not load this sale's inventory. It may have been archived or removed."}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 px-6 py-3 bg-surface-container-highest hover:bg-primary/10 hover:text-primary rounded-full font-black uppercase tracking-widest text-xs transition-all"
        >
          <ArrowLeft size={14} />
          Dashboard
        </button>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-6 py-3 bg-primary text-surface rounded-full font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/30"
        >
          <RotateCcw size={14} />
          Retry
        </button>
      </div>
    </div>
  );
}
