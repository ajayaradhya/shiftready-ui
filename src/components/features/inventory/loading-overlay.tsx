import { Sparkles, Database, Loader2 } from "lucide-react";

interface LoadingOverlayProps {
  isPricing: boolean;
  isReestimating: boolean;
  status: string | undefined;
}

export function LoadingOverlay({ isPricing, isReestimating, status }: LoadingOverlayProps) {
  const isAiAnalysis = isPricing || isReestimating;

  return (
    <div className="fixed inset-0 z-[100] bg-surface/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
      <div className="flex flex-col items-center gap-8 max-w-sm text-center">
        <div className="relative">
          <div className="w-24 h-24 border border-primary/20 rounded-full animate-ping" />
          <div className="absolute inset-0 flex items-center justify-center text-primary">
            {isAiAnalysis ? (
              <Sparkles className="animate-pulse" size={40} />
            ) : (
              <Database className="animate-bounce" size={40} />
            )}
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-on-surface uppercase tracking-tighter">
            {isAiAnalysis ? "AI Market Analysis" : "Syncing Changes"}
          </h2>
          <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">
            {isAiAnalysis
              ? "Gemini is recalibrating values for Sydney..."
              : "Updating cloud-ledger."}
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/10">
          <Loader2 className="animate-spin text-primary" size={14} />
          <span className="text-[10px] font-black uppercase tracking-widest text-outline">
            Status: {status}
          </span>
        </div>
      </div>
    </div>
  );
}
