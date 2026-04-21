// src/components/features/inventory/inventory-card.tsx
import { InventoryItem } from "@/lib/types";
import { Sparkles, MapPin, History } from "lucide-react";

export function InventoryCard({ item, onSeek }: { item: InventoryItem; onSeek: (ts: number) => void }) {
  // Fix: If AI is unsure (confidence < 0.8), we add a subtle highlight
  const needsReview = item.confidence < 0.8;

  return (
    <div className={`bg-surface-container-high rounded-xl p-6 flex flex-col gap-4 hover:bg-surface-container-highest transition-all group relative overflow-hidden ${
      needsReview ? 'border-l-2 border-amber-500/30' : ''
    }`}>
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1 w-full">
          <input 
            className="bg-transparent border-b border-outline-variant/10 focus:border-primary text-lg font-medium text-on-surface w-full px-0 py-1 focus:ring-0 transition-colors outline-none"
            defaultValue={item.name}
          />
          <div className="flex items-center gap-4">
             <p className="text-sm text-on-surface-variant font-medium">{item.brand}</p>
             {/* Show Purchase Year if it exists */}
             {item.actual_year_of_purchase && (
               <div className="flex items-center gap-1 text-[10px] text-outline">
                 <History size={10} />
                 PURCHASED {item.actual_year_of_purchase}
               </div>
             )}
          </div>
        </div>
        <button 
          onClick={() => onSeek(item.video_timestamp)}
          className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter hover:bg-primary/20 transition-all active:scale-95"
        >
          <MapPin size={12} />
          {item.timestamp_label}
        </button>
      </div>

      <div className="flex items-end gap-10 mt-2">
        <div className="flex flex-col">
          <span className="text-[10px] text-outline uppercase tracking-widest">Orig. Value</span>
          <span className="text-sm text-outline/40 line-through">
            ${item.actual_original_price ?? item.predicted_original_price}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-tertiary uppercase tracking-widest font-black">Listing Price</span>
          <div className="flex items-center gap-1">
            <span className="text-2xl font-black text-tertiary">
              ${item.actual_listing_price ?? item.predicted_listing_price}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}