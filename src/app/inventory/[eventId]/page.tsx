"use client";

import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";
import { Package, Sparkles, Loader2, Database } from "lucide-react";
import { triggerReestimation } from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();
  
  // Assumes useInventory returns isPricing = (status === 'pricing_in_progress' || (status === 'ready_for_review' && isFetching))
  const { summary, isProcessing, isPricing, isLoading, status } = useInventory(eventId);
  
  const activeMutations = useIsMutating();

  const reestimateMutation = useMutation({
    mutationFn: () => triggerReestimation(eventId),
    onSuccess: () => {
      // Optimistic update to prevent flicker before next poll
      queryClient.setQueryData(["status", eventId], { status: "pricing_in_progress" });
    },
  });

  /**
   * THE SEAMLESS GLOBAL THINKING STATE
   * The overlay remains active until the final summary fetch completes.
   */
  const isGlobalLoading = isProcessing || isPricing || reestimateMutation.isPending || activeMutations > 0;

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-outline uppercase tracking-[0.3em] text-xs">Initializing Monolith...</div>
      </div>
    );
  }

  const totalItems = summary?.bundles?.reduce((acc, b) => acc + b.items.length, 0) || 0;

  return (
    <div className="relative">
      {/* UNIFIED GLOBAL LOADING SCREEN */}
      {isGlobalLoading && (
        <div className="fixed inset-0 z-[100] bg-surface/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-8 max-w-sm text-center">
            <div className="relative">
              <div className="w-24 h-24 border border-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                {isPricing || reestimateMutation.isPending ? (
                  <Sparkles className="animate-pulse" size={40} />
                ) : (
                  <Database className="animate-bounce" size={40} />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface uppercase tracking-tighter">
                {isPricing || reestimateMutation.isPending ? "AI Market Analysis" : "Syncing Changes"}
              </h2>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">
                {isPricing || reestimateMutation.isPending
                  ? "Gemini is recalculating resale values based on Sydney demand..." 
                  : "Updating cloud-ledger. Please hold while the monolith syncs."}
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/10">
              <Loader2 className="animate-spin text-primary" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                Status: {status || 'active'}
              </span>
            </div>
          </div>
        </div>
      )}

      <Header isProcessing={isGlobalLoading}>
        {summary?.moveOutDate && (
           <div className="flex flex-col items-start ml-6 leading-none border-l border-outline-variant/20 pl-6">
              <span className="text-[9px] text-outline uppercase tracking-[0.3em] mb-1 font-bold">Move-out Deadline</span>
              <span className="text-sm font-bold text-on-surface uppercase">
                {new Date(summary.moveOutDate).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
              </span>
           </div>
        )}
      </Header>

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        <VideoPreview 
          videoUrl={summary?.videoUrl} 
          status={status}
          itemCount={totalItems} 
        />

        {/* Floating Action Button */}
        <div className="fixed bottom-12 right-12 z-[60]">
          <button 
            onClick={() => reestimateMutation.mutate()}
            disabled={isGlobalLoading}
            className="flex items-center gap-3 bg-primary text-surface px-8 py-5 rounded-full font-black uppercase tracking-tighter shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            <Sparkles size={20} fill="currentColor" />
            Re-Analyse Prices
          </button>
        </div>

        <section className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-12 pb-24">
          {summary?.bundles?.map((bundle) => (
            <div key={bundle.id} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
                <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
                <span className="text-[10px] text-outline uppercase tracking-widest">
                  {bundle.items.length} Assets Found
                </span>
              </div>
              
              <div className="grid gap-4">
                {bundle.items.map((item) => (
                  <InventoryCard 
                    key={item.id} 
                    item={item} 
                    bundleId={bundle.id}
                    onSeek={(s) => {
                      const v = document.getElementById('inventory-video') as HTMLVideoElement;
                      if (v) { v.currentTime = s; v.play(); }
                    }} 
                  />
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex flex-col items-center py-12 opacity-10">
            <Package size={48} />
            <p className="text-[10px] uppercase tracking-[0.4em] mt-4 font-bold">End of Catalog</p>
          </div>
        </section>
      </div>
    </div>
  );
}