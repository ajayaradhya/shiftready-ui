"use client";

import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const { summary, isProcessing, isLoading, status } = useInventory(eventId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-outline uppercase tracking-[0.3em] animate-pulse">
          Synchronizing Monolith...
        </div>
      </div>
    );
  }

  return (
    <>
      {/* We override the layout header state here */}
      <Header isProcessing={isProcessing} />

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        {/* Dynamic Video Section */}
        <VideoPreview 
          videoUrl={summary?.videoUrl} 
          status={status}
          itemCount={summary?.bundles.reduce((acc, b) => acc + b.items.length, 0) || 0}
        />

        {/* Dynamic Inventory Section */}
        <section className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-12">
          {isProcessing && summary?.bundles.length === 0 && (
            <div className="p-12 border border-dashed border-outline-variant/20 rounded-xl text-center">
              <p className="text-outline uppercase tracking-widest text-sm">
                AI is cataloging your space...
              </p>
            </div>
          )}

          {summary?.bundles.map((bundle) => (
            <div key={bundle.id} className="flex flex-col gap-6">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
                <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
                <span className="text-[10px] text-outline uppercase tracking-widest">
                  {bundle.items.length} Items
                </span>
              </div>
              
              <div className="grid gap-4">
                {bundle.items.map((item) => (
                  <InventoryCard 
                    key={item.id} 
                    item={item} 
                    onSeek={(ts) => {
                      const video = document.querySelector('video');
                      if (video) video.currentTime = ts;
                    }} 
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}