"use client";

import { InventoryItem } from "@/lib/types";
import { Sparkles, MapPin } from "lucide-react";

export function InventoryCard({ item, onSeek }: { item: InventoryItem; onSeek: (ts: number) => void }) {
  return (
    <div className="bg-surface-container-high rounded-xl p-6 flex flex-col gap-4 hover:bg-surface-container-highest transition-all group animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 w-full">
          <input 
            className="bg-transparent border-b border-outline-variant/20 focus:border-primary text-lg font-medium text-on-surface w-full px-0 py-1 focus:ring-0 transition-colors outline-none"
            defaultValue={item.name}
          />
          <p className="text-sm text-on-surface-variant">{item.brand}</p>
        </div>
        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/20 transition-colors"
        >
          <MapPin size={12} />
          {item.timestamp_label}
        </button>
      </div>

      <div className="flex items-end gap-8 mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline uppercase tracking-widest">Orig. Retail</span>
          <span className="text-sm text-outline/60 line-through">
            ${item.actual_original_price ?? item.predicted_original_price}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-tertiary uppercase tracking-widest font-bold">Est. Listing</span>
          <span className="text-2xl font-black text-tertiary">
            ${item.actual_listing_price ?? item.predicted_listing_price}
          </span>
        </div>
      </div>

      {item.pricing_reasoning && (
        <div className="mt-2 bg-primary/5 rounded-lg p-3 flex gap-3 items-start border border-primary/10">
          <Sparkles className="text-primary w-4 h-4 mt-0.5 shrink-0" />
          <p className="text-xs text-on-surface-variant leading-relaxed italic">
            {item.pricing_reasoning}
          </p>
        </div>
      )}
    </div>
  );
}