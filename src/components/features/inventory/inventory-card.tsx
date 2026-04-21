// src/components/features/inventory/inventory-card.tsx
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchItem } from "@/lib/api";
import { InventoryItem } from "@/lib/types";
import { Clock, Sparkles, Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

export function InventoryCard({ item, bundleId, onSeek }: { 
  item: InventoryItem; 
  bundleId: string;
  onSeek: (ts: number) => void 
}) {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (updates: Partial<InventoryItem>) => patchItem(eventId, bundleId, item.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  // Task 1: Custom Number Sanitization (No Arrows, Max 6 digits)
  const handleNumberInput = (field: keyof InventoryItem, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "").slice(0, 6);
    if (item[field] !== parseFloat(cleanValue)) {
      mutation.mutate({ [field]: parseFloat(cleanValue) || 0 });
    }
  };

  return (
    <div className={`bg-surface-container-high rounded-xl p-6 flex flex-col gap-5 relative transition-all group border border-transparent hover:border-primary/10 ${
      mutation.isPending ? 'opacity-70' : ''
    }`}>
      
      {/* Task 2: Refined Timestamp UI */}
      <div className="absolute top-4 right-4">
        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="flex items-center gap-2 px-3 py-1 bg-surface-container-highest rounded-md border border-outline-variant/10 hover:border-primary/40 transition-all group/btn"
        >
          <Clock size={12} className="text-outline group-hover/btn:text-primary" />
          <span className="text-[11px] font-mono font-medium text-on-surface-variant tracking-tighter">
            {item.timestamp_label}
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-1 pr-20">
        <input 
          className="bg-transparent border-none text-xl font-bold text-on-surface w-full p-0 outline-none focus:text-primary transition-colors"
          defaultValue={item.name}
          onBlur={(e) => mutation.mutate({ name: e.target.value })}
        />
        <input 
          className="bg-transparent border-none text-sm text-on-surface-variant italic w-full p-0 outline-none"
          defaultValue={item.brand || "Unknown Brand"}
          onBlur={(e) => mutation.mutate({ brand: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-10 mt-2">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-outline uppercase tracking-widest font-bold">Original Value</span>
          <div className="flex items-center gap-1 border-b border-outline-variant/10 focus-within:border-primary transition-all pb-1">
            <span className="text-sm text-outline/40">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-sm text-on-surface w-20 outline-none focus:ring-0"
              defaultValue={item.actual_original_price ?? item.predicted_original_price}
              onBlur={(e) => handleNumberInput('actual_original_price', e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-tertiary uppercase tracking-widest font-black">Resale Estimate</span>
          <div className="flex items-center gap-1 border-b border-tertiary/20 focus-within:border-tertiary transition-all pb-1">
            <span className="text-xl font-black text-tertiary">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-2xl font-black text-tertiary w-24 outline-none focus:ring-0"
              defaultValue={item.actual_listing_price ?? item.predicted_listing_price}
              onBlur={(e) => handleNumberInput('actual_listing_price', e.target.value)}
            />
          </div>
        </div>
      </div>

      {mutation.isPending && (
        <div className="flex items-center gap-2 text-[9px] text-primary uppercase font-bold tracking-widest animate-pulse">
          <Loader2 size={10} className="animate-spin" /> Syncing with Monolith
        </div>
      )}
    </div>
  );
}