"use client";

import { Clock, AlertCircle, CheckCircle2, Loader2, Trash2 } from "lucide-react";

interface CardHeaderProps {
  isLowConfidence: boolean;
  isSyncing: boolean;
  timestampLabel: string;
  onSeek: () => void;
  onDeleteInitiate: () => void;
}

export function CardHeader({ isLowConfidence, isSyncing, timestampLabel, onSeek, onDeleteInitiate }: CardHeaderProps) {
  return (
    <div className="flex items-center justify-between relative">
      <div className="flex items-center gap-2">
        {isLowConfidence ? (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
            <AlertCircle size={10} /> Review Needed
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-tertiary/10 text-tertiary text-[9px] font-black uppercase tracking-widest border border-tertiary/20">
            <CheckCircle2 size={10} /> Verified
          </div>
        )}
        {isSyncing && (
          <div className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase animate-pulse">
            <Loader2 size={10} className="animate-spin" /> Syncing
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 translate-x-2 group-hover:translate-x-0 transition-transform duration-300">
        <button 
          onClick={onDeleteInitiate}
          className="opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 p-2 rounded-full bg-error/10 hover:bg-error text-error hover:text-white backdrop-blur-md transition-all duration-300 border border-error/20"
        >
          <Trash2 size={14} />
        </button>

        <button 
          onClick={onSeek}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface/40 hover:bg-surface-container-highest transition-all border border-outline-variant/10"
        >
          <Clock size={12} className="text-outline" />
          <span className="text-[11px] font-mono font-bold text-on-surface tracking-tighter">
            {timestampLabel}
          </span>
        </button>
      </div>
    </div>
  );
}