"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { patchItem } from "@/lib/api";
import { InventoryItem } from "@/lib/types";
import { Clock, Loader2, AlertCircle, CheckCircle2, Sparkles, ChevronDown } from "lucide-react";
import { useParams } from "next/navigation";
import { useState } from "react";

interface InventoryCardProps {
  item: InventoryItem;
  bundleId: string;
  onSeek: (ts: number) => void;
}

export function InventoryCard({ item, bundleId, onSeek }: InventoryCardProps) {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();
  const [showReasoning, setShowReasoning] = useState(false);

  const mutation = useMutation({
    mutationFn: (updates: Partial<InventoryItem>) => 
      patchItem(eventId, bundleId, item.id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
    },
  });

  const handleSave = (field: keyof InventoryItem, value: any) => {
    if (item[field] !== value) {
      mutation.mutate({ [field]: value });
    }
  };

  const handleNumberInput = (field: keyof InventoryItem, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "").slice(0, 7);
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue) && item[field] !== numValue) {
      mutation.mutate({ [field]: numValue });
    }
  };

  // Logic for Trust Badges (Confidence)
  const isLowConfidence = item.confidence < 0.75;

  return (
    <div className={`group relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-300 border ${
      isLowConfidence 
        ? 'bg-amber-500/[0.02] border-amber-500/10 hover:border-amber-500/30' 
        : 'bg-surface-container-high border-transparent hover:border-primary/10'
    } ${mutation.isPending ? 'opacity-70 grayscale-[0.5]' : 'opacity-100'}`}>
      
      {/* Top Action Row: Badges & Timestamp */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLowConfidence ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
              <AlertCircle size={10} />
              Review Needed
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-tertiary/10 text-tertiary text-[9px] font-black uppercase tracking-widest border border-tertiary/20">
              <CheckCircle2 size={10} />
              Verified
            </div>
          )}
          {mutation.isPending && (
            <div className="flex items-center gap-1 text-[9px] text-primary font-bold uppercase animate-pulse">
              <Loader2 size={10} className="animate-spin" /> Syncing
            </div>
          )}
        </div>

        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="flex items-center gap-2 px-3 py-1 rounded bg-surface/30 hover:bg-surface-container-highest transition-colors border border-outline-variant/10 group/btn"
        >
          <Clock size={12} className="text-outline group-hover/btn:text-primary transition-colors" />
          <span className="text-[11px] font-mono font-bold text-on-surface tracking-tighter">
            {item.timestamp_label}
          </span>
        </button>
      </div>

      {/* Main Identity: Product & Brand */}
      <div className="flex flex-col gap-1.5 pr-10">
        <input 
          className="bg-transparent border-none text-xl font-bold text-on-surface w-full p-0 outline-none focus:text-primary placeholder:opacity-20"
          defaultValue={item.name}
          onBlur={(e) => handleSave('name', e.target.value)}
        />
        <div className="flex items-center gap-4">
          <input 
            className="bg-transparent border-none text-xs text-on-surface-variant uppercase tracking-[0.2em] font-black w-1/2 p-0 outline-none focus:text-on-surface"
            defaultValue={item.brand || "UNKNOWN"}
            onBlur={(e) => handleSave('brand', e.target.value)}
          />
          <div className="flex items-center gap-1.5 border-l border-outline-variant/20 pl-4">
            <span className="text-[9px] text-outline font-black uppercase">Year:</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-xs font-bold text-on-surface-variant w-12 outline-none focus:text-primary"
              defaultValue={item.actual_year_of_purchase ?? item.predicted_year_of_purchase ?? ""}
              onBlur={(e) => handleNumberInput('actual_year_of_purchase', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Pricing Grid */}
      <div className="grid grid-cols-2 gap-8 py-2 border-t border-outline-variant/5">
        <div className="flex flex-col gap-2">
          <span className="text-[9px] text-outline uppercase tracking-[0.2em] font-black">Original Retail</span>
          <div className="flex items-center gap-1 focus-within:text-primary transition-colors">
            <span className="text-sm font-medium opacity-40">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-base font-bold text-on-surface w-full outline-none"
              defaultValue={item.actual_original_price ?? item.predicted_original_price ?? ""}
              onBlur={(e) => handleNumberInput('actual_original_price', e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-[9px] text-tertiary uppercase tracking-[0.2em] font-black">Listing Value</span>
            {item.pricing_reasoning && (
              <button 
                onClick={() => setShowReasoning(!showReasoning)}
                className="text-tertiary/40 hover:text-tertiary transition-colors"
              >
                <Sparkles size={12} />
              </button>
            )}
          </div>
          <div className="flex items-center gap-1">
            <span className="text-lg font-black text-tertiary">$</span>
            <input 
              type="text"
              inputMode="numeric"
              className="bg-transparent border-none p-0 text-2xl font-black text-tertiary w-full outline-none"
              defaultValue={item.actual_listing_price ?? item.predicted_listing_price ?? ""}
              onBlur={(e) => handleNumberInput('actual_listing_price', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Expandable AI Reasoning */}
      {showReasoning && item.pricing_reasoning && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-300 p-4 rounded-xl bg-surface/40 border border-tertiary/10">
          <div className="flex items-start gap-3">
            <Sparkles size={14} className="text-tertiary shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed text-on-surface-variant font-medium">
              {item.pricing_reasoning}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}