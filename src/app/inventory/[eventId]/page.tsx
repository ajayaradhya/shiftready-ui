"use client";

import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";
import { Package, Sparkles, Loader2 } from "lucide-react";
import { triggerReestimation } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const { summary, isProcessing, isLoading, status } = useInventory(eventId);

  // 1. Hooks are correctly placed at the top level
  const reestimateMutation = useMutation({
    mutationFn: () => triggerReestimation(eventId),
  });

  // Derived state for the AI processing overlay
  const isThinking = isProcessing || reestimateMutation.isPending;

  // 2. Handle initial loading state
  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-outline uppercase tracking-[0.3em] text-xs">Synchronizing Data...</div>
      </div>
    );
  }

  const totalItems = summary?.bundles?.reduce((acc, b) => acc + b.items.length, 0) || 0;

  return (
    <div className="relative">
      {/* Global Loading Overlay */}
      {isThinking && (
        <div className="fixed inset-0 z-[100] bg-surface/80 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 border-2 border-primary/10 rounded-full animate-ping" />
              <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={32} />
            </div>
            <div className="text-center">
              <h2 className="text-xl font-bold text-on-surface uppercase tracking-[0.2em]">Recalculating Value</h2>
              <p className="text-on-surface-variant text-xs mt-2 italic">Gemini is analyzing Sydney market demand...</p>
            </div>
          </div>
        </div>
      )}
      <Header isProcessing={isThinking}>
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

      {/* AI PROCESSING OVERLAY: Active during re-estimation or initial pipeline */}
      {isThinking && (
        <div className="fixed inset-0 z-[100] bg-surface/60 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="relative">
              <div className="w-24 h-24 border-2 border-primary/20 rounded-full animate-ping" />
              <Sparkles className="absolute inset-0 m-auto text-primary animate-pulse" size={40} />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-on-surface">Gemini is Pricing</h2>
            <p className="text-on-surface-variant italic">
              Analyzing Sydney market trends based on your corrections. This usually takes 15-30 seconds.
            </p>
          </div>
        </div>
      )}

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        <VideoPreview 
          videoUrl={summary?.videoUrl} 
          status={status}
          itemCount={totalItems} 
        />

        {/* Floating Action Button for Re-analysis */}
        <div className="fixed bottom-12 right-12 z-[60]">
          <button 
            onClick={() => reestimateMutation.mutate()}
            disabled={isThinking}
            className="flex items-center gap-3 bg-primary text-surface px-6 py-4 rounded-full font-black uppercase tracking-tighter shadow-[0_12px_48px_rgba(173,198,255,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isThinking ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Sparkles size={20} fill="currentColor" />
            )}
            {isThinking ? "AI is Calculating..." : "Re-Analyse Prices"}
          </button>
        </div>

        {/* Inventory Review Column */}
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
                    bundleId={bundle.id} // Essential for PATCH requests
                    onSeek={(seconds) => {
                      const video = document.getElementById('inventory-video') as HTMLVideoElement;
                      if (video) {
                        video.currentTime = seconds;
                        video.play();
                        video.parentElement?.classList.add('ring-2', 'ring-primary');
                        setTimeout(() => video.parentElement?.classList.remove('ring-2', 'ring-primary'), 1000);
                      }
                    }} 
                  />
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex flex-col items-center py-12 opacity-20">
            <Package size={48} strokeWidth={0.5} />
            <p className="text-[10px] uppercase tracking-[0.4em] mt-4">End of Catalog</p>
          </div>
        </section>
      </div>
    </div>
  );
}