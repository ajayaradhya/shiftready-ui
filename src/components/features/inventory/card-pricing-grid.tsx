"use client";

import { Sparkles } from "lucide-react";

export function CardPricingGrid({ 
  retail, 
  listing, 
  onRetailUpdate, 
  onListingUpdate, 
  hasReasoning, 
  isReasoningOpen, 
  onToggleReasoning 
}: any) {
  return (
    <div className="grid grid-cols-2 gap-8 py-2 border-t border-outline-variant/5">
      <div className="flex flex-col gap-2">
        <span className="text-[9px] text-outline uppercase tracking-[0.2em] font-black">Original Retail</span>
        <div className="flex items-center gap-1">
          <span className="text-sm font-medium opacity-40">$</span>
          <input 
            type="text"
            className="bg-transparent border-none p-0 text-base font-bold text-on-surface w-full outline-none"
            defaultValue={retail}
            onBlur={(e) => onRetailUpdate(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-tertiary uppercase tracking-[0.2em] font-black">Listing Value</span>
          {hasReasoning && (
            <button onClick={onToggleReasoning} className={`transition-all ${isReasoningOpen ? 'text-tertiary scale-110' : 'text-tertiary/40'}`}>
              <Sparkles size={12} fill={isReasoningOpen ? "currentColor" : "none"} />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-lg font-black text-tertiary">$</span>
          <input 
            type="text"
            className="bg-transparent border-none p-0 text-2xl font-black text-tertiary w-full outline-none"
            defaultValue={listing}
            onBlur={(e) => onListingUpdate(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

// Separate component for the actual reasoning text
export function CardAiReasoning({ text }: { text: string }) {
  return (
    <div className="animate-in slide-in-from-top-2 fade-in duration-300 p-4 rounded-xl bg-surface/40 border border-tertiary/10">
      <div className="flex items-start gap-3">
        <Sparkles size={14} className="text-tertiary shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium italic">
          {text}
        </p>
      </div>
    </div>
  );
}