"use client";

import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";
import { Calendar, Package } from "lucide-react";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const { summary, isProcessing, isLoading, status } = useInventory(eventId);

  // UX Fix: Better loading state that matches the "Monolith" aesthetic
  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-outline uppercase tracking-[0.3em] text-xs">Synchronizing Data...</div>
      </div>
    );
  }

  // Calculate total items from the real API response
  const totalItems = summary?.bundles?.reduce((acc, b) => acc + b.items.length, 0) || 0;

  return (
    <>
      {/* Fix #3: Show real Move-out date in the Header */}
      <Header isProcessing={isProcessing}>
        {summary?.moveOutDate && (
          <div className="hidden md:flex items-center gap-2 px-4 py-1 bg-surface-container-high rounded-full border border-outline-variant/10">
            <Calendar size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
              Move-out: {new Date(summary.moveOutDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        )}
      </Header>

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        {/* Fix #2: Pass real status and item count to Preview */}
        <VideoPreview 
          videoUrl={summary?.videoUrl} 
          status={status}
          itemCount={totalItems}
        />

        {/* Fix #1: Correct Data Mapping for Bundles */}
        <section className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-12 pb-24">
          {summary?.bundles?.map((bundle) => (
            <div key={bundle.id} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
                  <span className="bg-surface-container-highest px-2 py-0.5 rounded text-[10px] text-primary font-bold">
                    ${bundle.suggestedPrice} VALUE
                  </span>
                </div>
                <span className="text-[10px] text-outline uppercase tracking-widest">
                  {bundle.items.length} Assets
                </span>
              </div>
              
              <div className="grid gap-4">
                {bundle.items.map((item) => (
                  <InventoryCard 
                    key={item.id} 
                    item={item} 
                    onSeek={(ts) => {
                      const video = document.querySelector('video');
                      if (video) {
                        video.currentTime = ts;
                        video.play();
                      }
                    }} 
                  />
                ))}
              </div>
            </div>
          ))}
          
          {/* UX Fix: Show "End of Inventory" message */}
          <div className="flex flex-col items-center py-12 opacity-20">
            <Package size={48} strokeWidth={0.5} />
            <p className="text-[10px] uppercase tracking-[0.4em] mt-4">End of Catalog</p>
          </div>
        </section>
      </div>
    </>
  );
}