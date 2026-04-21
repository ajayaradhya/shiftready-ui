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
      <Header isProcessing={isProcessing}>
        {summary?.moveOutDate && (
          <div className="hidden lg:flex items-center gap-4 ml-6 animate-in fade-in slide-in-from-top-2 duration-1000">
            <div className="h-6 w-[1px] bg-outline-variant/20" />
            <div className="flex flex-col items-start leading-none">
              <span className="text-[9px] text-outline uppercase tracking-[0.3em] mb-1 font-bold">Move-out Deadline</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-on-surface uppercase">
                  {new Date(summary.moveOutDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'long' })}
                </span>
                <span className="text-[10px] px-2 py-0.5 bg-amber-500/10 text-amber-500 rounded font-black">
                  {Math.ceil((new Date(summary.moveOutDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))} DAYS LEFT
                </span>
              </div>
            </div>
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
          {isProcessing && summary?.bundles.length === 0 && (
            <div className="flex flex-col gap-4 opacity-40">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-32 w-full bg-surface-container-high rounded-xl animate-pulse" />
              ))}
              <p className="text-center text-[10px] uppercase tracking-[0.4em] text-outline mt-4">
                Gemini is cataloging space...
              </p>
            </div>
          )}
          { summary?.bundles?.map((bundle) => (
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
                    onSeek={(seconds) => {
                      const video = document.getElementById('inventory-video') as HTMLVideoElement;
                      if (video) {
                        video.currentTime = seconds;
                        video.play();
                        // Visual feedback: briefly highlight the video border
                        video.parentElement?.classList.add('ring-2', 'ring-primary');
                        setTimeout(() => video.parentElement?.classList.remove('ring-2', 'ring-primary'), 1000);
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