"use client";

import { InventoryItem } from "@/lib/types";
import { Sparkles, MapPin, AlertCircle, CheckCircle2 } from "lucide-react";

export function InventoryCard({ item, onSeek }: { item: InventoryItem; onSeek: (ts: number) => void }) {
  const isUncertain = item.confidence < 0.75;

  return (
    <div className={`bg-surface-container-high rounded-xl p-6 flex flex-col gap-4 transition-all group relative overflow-hidden border-l-4 ${
      isUncertain ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-transparent'
    } hover:bg-surface-container-highest`}>
      
      {/* AI Confidence Badge */}
      <div className="absolute top-0 right-0 p-2">
        {isUncertain ? (
          <div className="flex items-center gap-1 text-[9px] font-bold text-amber-500 uppercase bg-amber-500/10 px-2 py-0.5 rounded-bl-lg">
            <AlertCircle size={10} /> Review Needed
          </div>
        ) : (
          <div className="flex items-center gap-1 text-[9px] font-bold text-tertiary uppercase bg-tertiary/10 px-2 py-0.5 rounded-bl-lg">
            <CheckCircle2 size={10} /> Verified
          </div>
        )}
      </div>

      <div className="flex justify-between items-start pt-2">
        <div className="flex flex-col gap-1 w-full">
          <input 
            className="bg-transparent border-b border-outline-variant/10 focus:border-primary text-lg font-medium text-on-surface w-full px-0 py-1 outline-none transition-all"
            defaultValue={item.name}
          />
          <p className="text-sm text-on-surface-variant italic">{item.brand || "Unbranded"}</p>
        </div>
        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="shrink-0 flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all active:scale-95"
        >
          <MapPin size={12} strokeWidth={3} />
          {item.timestamp_label}
        </button>
      </div>

      <div className="flex items-end gap-12 mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline uppercase tracking-[0.2em] mb-1">Retail New</span>
          <span className="text-sm text-outline/40 line-through">
            ${item.actual_original_price ?? item.predicted_original_price}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-tertiary uppercase tracking-[0.2em] mb-1 font-bold">Resale Value</span>
          <span className="text-2xl font-black text-tertiary">
            ${item.actual_listing_price ?? item.predicted_listing_price}
          </span>
        </div>
      </div>
    </div>
  );
}