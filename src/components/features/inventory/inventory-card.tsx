"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchItem } from "@/lib/api";
import { InventoryItem } from "@/lib/types";
import { Clock, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

interface InventoryCardProps {
  item: InventoryItem;
  bundleId: string;
  onSeek: (ts: number) => void;
}

export function InventoryCard({ item, bundleId, onSeek }: InventoryCardProps) {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();

  // Step 1: The Cloud Sync Mutation
  const mutation = useMutation({
    mutationFn: (updates: Partial<InventoryItem>) => 
      patchItem(eventId, bundleId, item.id, updates),
    onSuccess: () => {
      // Invalidate the summary to ensure bundle totals and AI reasoning stay fresh
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
    },
  });

  // Step 2: Custom Number Sanitization
  // This removes browser 'spinners' and prevents invalid scientific notation
  const handleNumberInput = (field: keyof InventoryItem, value: string) => {
    // Regex: allow only digits and a single decimal point
    const cleanValue = value.replace(/[^0-9.]/g, "").slice(0, 7);
    const numValue = parseFloat(cleanValue);
    
    if (!isNaN(numValue) && item[field] !== numValue) {
      mutation.mutate({ [field]: numValue });
    }
  };

  return (
    <div className={`bg-surface-container-high rounded-xl p-6 flex flex-col gap-6 relative transition-all group border border-transparent hover:border-primary/5 ${
      mutation.isPending ? 'opacity-70' : 'opacity-100'
    }`}>
      
      {/* Precision Timestamp: Mono font for technical accuracy */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="flex items-center gap-2 px-3 py-1 bg-surface/40 hover:bg-surface-container-highest rounded border border-outline-variant/10 transition-all group/btn"
        >
          <Clock size={12} className="text-outline group-hover/btn:text-primary transition-colors" />
          <span className="text-[11px] font-mono font-bold text-on-surface tracking-tighter">
            {item.timestamp_label}
          </span>
        </button>
      </div>

      {/* Identity Section: Name and Brand */}
      <div className="flex flex-col gap-1 pr-24">
        <input 
          className="bg-transparent border-none text-lg font-bold text-on-surface w-full p-0 outline-none focus:text-primary transition-colors"
          defaultValue={item.name}
          onBlur={(e) => {
            if (e.target.value !== item.name) {
              mutation.mutate({ name: e.target.value });
            }
          }}
        />
        <input 
          className="bg-transparent border-none text-xs text-on-surface-variant uppercase tracking-[0.2em] font-black w-full p-0 outline-none focus:text-on-surface transition-colors"
          defaultValue={item.brand || "UNBRANDED ASSET"}
          onBlur={(e) => {
            if (e.target.value !== item.brand) {
              mutation.mutate({ brand: e.target.value });
            }
          }}
        />
      </div>

      {/* Pricing Section: Understated Inputs */}
      <div className="flex items-center gap-12 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-outline uppercase tracking-widest font-black">Original Retail</span>
          <div className="flex items-center gap-1 border-b border-outline-variant/20 focus-within:border-primary transition-all pb-1">
            <span className="text-xs text-outline/40 font-medium">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-sm font-bold text-on-surface w-20 outline-none focus:ring-0"
              defaultValue={item.actual_original_price ?? item.predicted_original_price}
              onBlur={(e) => handleNumberInput('actual_original_price', e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[9px] text-tertiary uppercase tracking-widest font-black">Listing Value</span>
          <div className="flex items-center gap-1 border-b border-tertiary/30 focus-within:border-tertiary transition-all pb-1">
            <span className="text-lg font-black text-tertiary">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-xl font-black text-tertiary w-24 outline-none focus:ring-0"
              defaultValue={item.actual_listing_price ?? item.predicted_listing_price}
              onBlur={(e) => handleNumberInput('actual_listing_price', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Inline Feedback: Only shows for individual card syncs */}
      {mutation.isPending && (
        <div className="flex items-center gap-2 text-[9px] text-primary uppercase font-black tracking-widest animate-pulse">
          <Loader2 size={10} className="animate-spin" /> 
          Syncing to Monolith
        </div>
      )}
    </div>
  );
}