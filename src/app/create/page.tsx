"use client";

import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { InventoryCard } from "@/components/features/inventory/inventory-card";
import { Header } from "@/components/ui/header";
import { 
  Package, 
  Sparkles, 
  Loader2, 
  Database, 
  Globe, 
  ShieldCheck, 
  Power, 
  Send, 
  Plus, 
  Trash2, 
  PlusCircle 
} from "lucide-react";
import { 
  publishSale, 
  triggerReestimation, 
  createBundle, 
  deleteBundle, 
  createItem 
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();

  // 1. Data Fetching
  const { summary, isProcessing, isPricing, isLoading, status } = useInventory(eventId);
  
  // Detects any active background mutation (Save, Delete, Add)
  const activeMutations = useIsMutating();

  // 2. Mutations: Management Operations
  const addBundleMutation = useMutation({
    mutationFn: (name: string) => createBundle(eventId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const delBundleMutation = useMutation({
    mutationFn: (bundleId: string) => deleteBundle(eventId, bundleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ bId, name }: { bId: string; name: string }) => createItem(eventId, bId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  // 3. Mutations: Stage Transitions
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

  // 4. Global State Logic
  const isGlobalLoading = isProcessing || isPricing || reestimateMutation.isPending || activeMutations > 0;
  const isLive = status === "live";

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
      {/* GLOBAL LOADING OVERLAY: Blocks UI during any Sync/Pricing activity */}
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
        <div className="flex items-center gap-4 ml-6 border-l border-outline-variant/20 pl-6">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
            isLive ? 'bg-tertiary/10 border-tertiary/20 text-tertiary' : 'bg-primary/10 border-primary/20 text-primary'
          }`}>
            {isLive ? <Globe size={12} /> : <ShieldCheck size={12} />}
            <span className="text-[10px] font-black uppercase tracking-widest">
              {isLive ? "Live Listing" : "Draft Review"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isLive ? (
              <>
                <button 
                  onClick={() => {
                    const name = prompt("Enter Room or Category Name:");
                    if (name) addBundleMutation.mutate(name);
                  }}
                  className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-primary/10 hover:text-primary rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Plus size={14} /> Add Bundle
                </button>
                <button 
                  onClick={() => {
                    const date = summary?.moveOutDate || new Date().toISOString().split('T')[0];
                    publishMutation.mutate(date);
                  }}
                  disabled={publishMutation.isPending}
                  className="flex items-center gap-2 px-4 py-1.5 bg-primary text-surface hover:opacity-90 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  {publishMutation.isPending ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                  Publish Sale
                </button>
              </>
            ) : (
              <button 
                onClick={() => {/* Un-publish Logic */}}
                className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-error/10 hover:text-error rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Power size={14} /> Unpublish
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

        {/* Floating AI Trigger */}
        {!isLive && (
          <div className="fixed bottom-12 right-12 z-[60]">
            <button 
              onClick={() => reestimateMutation.mutate()}
              disabled={isGlobalLoading}
              className="flex items-center gap-3 bg-primary text-surface px-8 py-5 rounded-full font-black uppercase tracking-tighter shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Sparkles size={20} fill="currentColor" />
              Re-Analyse Prices
            </button>
          </div>
        )}

        <section className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-16 pb-24">
          {summary?.bundles?.map((bundle) => (
            <div key={bundle.id} className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2 group/bundle">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
                  {!isLive && (
                    <button 
                      onClick={() => {
                        if(confirm(`Delete ${bundle.name} and all items inside?`)) delBundleMutation.mutate(bundle.id);
                      }}
                      className="opacity-0 group-hover/bundle:opacity-100 p-1 text-outline hover:text-error transition-all"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
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

                {/* INLINE ADD ITEM ACTION */}
                {!isLive && (
                  <button 
                    onClick={() => addItemMutation.mutate({ bId: bundle.id, name: "New Manual Asset" })}
                    className="flex items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-outline-variant/10 text-outline/40 hover:border-primary/40 hover:bg-primary/[0.02] hover:text-primary transition-all group"
                  >
                    <PlusCircle size={20} className="group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em]">Add Manual Asset</span>
                  </button>
                )}
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