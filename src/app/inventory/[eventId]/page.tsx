"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";
import { 
  Package, Sparkles, Loader2, Database, Globe, 
  ShieldCheck, Power, Send, X, Check 
} from "lucide-react";
import { publishSale, unpublishSale, triggerReestimation } from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();

  // 1. Hooks - State Management from the Monolith
  const { 
    summary, 
    status, 
    isProcessing, 
    isPricing, 
    isLoading, 
    isLive, 
    isDraft 
  } = useInventory(eventId);

  const activeMutations = useIsMutating();
  
  // Local state for "Zero-Alert" confirmations
  const [isConfirmingUnpublish, setIsConfirmingUnpublish] = useState(false);

  // 2. Mutations
  const reestimateMutation = useMutation({
    mutationFn: () => triggerReestimation(eventId),
    onSuccess: () => {
      queryClient.setQueryData(["status", eventId], { status: "pricing_in_progress" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: (date: string) => publishSale(eventId, date),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishSale(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      setIsConfirmingUnpublish(false);
    },
    onError: () => {
      setIsConfirmingUnpublish(false);
      // Logic for a toast notification would go here
    }
  });

  // Reset confirmation state if the status changes externally
  useEffect(() => {
    setIsConfirmingUnpublish(false);
  }, [status]);

  /**
   * GLOBAL LOADING LOGIC
   */
  const isAIPipelineActive = isProcessing || isPricing || reestimateMutation.isPending;
  const isSyncing = activeMutations > 0;
  const isGlobalLoading = isAIPipelineActive || isSyncing;

  if (isLoading && !summary) {
    return (
      <div className="flex flex-col items-center justify-center h-[80vh] gap-4">
        <div className="w-12 h-12 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
        <div className="text-outline uppercase tracking-[0.3em] text-[10px] font-black">
          Initializing Monolith...
        </div>
      </div>
    );
  }

  const totalItems = summary?.bundles?.reduce((acc, b) => acc + b.items.length, 0) || 0;

  return (
    <div className="relative">
      {/* GLOBAL LOADING OVERLAY */}
      {isGlobalLoading && (
        <div className="fixed inset-0 z-[100] bg-surface/60 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
          <div className="flex flex-col items-center gap-8 max-w-sm text-center">
            <div className="relative">
              <div className="w-24 h-24 border border-primary/20 rounded-full animate-ping" />
              <div className="absolute inset-0 flex items-center justify-center text-primary">
                {isAIPipelineActive ? (
                  <Sparkles className="animate-pulse" size={40} />
                ) : (
                  <Database className="animate-bounce" size={40} />
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <h2 className="text-2xl font-black text-on-surface uppercase tracking-tighter">
                {isAIPipelineActive ? "AI Analysis in Progress" : "Syncing Ledger"}
              </h2>
              <p className="text-sm text-on-surface-variant font-medium leading-relaxed italic">
                {isAIPipelineActive
                  ? "Gemini is calibrating resale values for the Sydney 2026 market..." 
                  : "Finalizing edits and anchoring data to the cloud monolith."}
              </p>
            </div>
            
            <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest rounded-full border border-outline-variant/10">
              <Loader2 className="animate-spin text-primary" size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest text-outline">
                STATUS: {status?.replace('_', ' ') || 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>
      )}

      <Header isProcessing={isGlobalLoading}>
        <div className="flex items-center gap-4 ml-6 border-l border-outline-variant/20 pl-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border transition-colors ${
            isLive 
              ? 'bg-tertiary/10 border-tertiary/20 text-tertiary' 
              : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            {isLive ? <Globe size={12} /> : <ShieldCheck size={12} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLive ? "Live Marketplace" : "Internal Draft"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isLive ? (
              <div className="flex items-center gap-1">
                {isConfirmingUnpublish ? (
                  <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                    <button 
                      onClick={() => setIsConfirmingUnpublish(false)}
                      className="p-1.5 text-outline hover:text-on-surface transition-colors"
                      title="Cancel"
                    >
                      <X size={16} />
                    </button>
                    <button 
                      onClick={() => unpublishMutation.mutate()}
                      disabled={unpublishMutation.isPending}
                      className="flex items-center gap-2 px-4 py-1.5 bg-error text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg shadow-error/20 hover:brightness-110 transition-all"
                    >
                      {unpublishMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Check size={14} />}
                      Confirm Unpublish
                    </button>
                  </div>
                ) : (
                  <button 
                    onClick={() => setIsConfirmingUnpublish(true)}
                    className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-error/10 hover:text-error rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <Power size={14} /> Unpublish Sale
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={() => {
                  const date = summary?.moveOutDate || new Date().toISOString().split('T')[0];
                  publishMutation.mutate(date);
                }}
                disabled={publishMutation.isPending || isGlobalLoading}
                className="flex items-center gap-2 px-4 py-1.5 bg-primary text-surface hover:opacity-90 rounded-md text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
              >
                {publishMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                Publish Live
              </button>
            )}
          </div>
        </div>
      </Header>

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        <VideoPreview 
          videoUrl={summary?.videoUrl} 
          status={status}
          itemCount={totalItems} 
        />

        {!isLive && (
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
        )}

        <section className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-12 pb-24">
          {summary?.bundles?.map((bundle) => (
            <div key={bundle.id} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2">
                <h3 className="text-xl font-medium text-on-surface tracking-tight">
                  {bundle.name}
                </h3>
                <span className="text-[10px] text-outline uppercase tracking-widest font-bold">
                  {bundle.items.length} Assets Identified
                </span>
              </div>
              
              <div className="grid gap-4">
                {bundle.items.map((item) => (
                  <InventoryCard 
                    key={item.id} 
                    item={item} 
                    bundleId={bundle.id}
                    onSeek={(s: number) => {
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
            <p className="text-[10px] uppercase tracking-[0.4em] mt-4 font-black">
              End of Catalog
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}