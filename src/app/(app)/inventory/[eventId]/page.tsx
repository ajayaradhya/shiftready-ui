"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { VideoPreview } from "@/components/features/inventory/video-preview";
import { LoadingOverlay } from "@/components/features/inventory/loading-overlay";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { BundleSection } from "@/components/features/inventory/bundle-section";
import { Header } from "@/components/ui/header";
import { Package, Sparkles } from "lucide-react";
import {
  publishSale,
  unpublishSale,
  triggerReestimation,
  createBundle,
  deleteBundle,
  createItem,
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function InventoryReviewPage() {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();

  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [newBundleName, setNewBundleName] = useState("");

  const { summary, isProcessing, isPricing, isLoading, status, isLive, error } =
    useInventory(eventId);
  const activeMutations = useIsMutating();

  useEffect(() => {
    if (error) toast.error("Could not reach the server. Retrying…");
  }, [error]);

  const addBundleMutation = useMutation({
    mutationFn: (name: string) => createBundle(eventId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      setIsAddingBundle(false);
      setNewBundleName("");
    },
    onError: () => {
      setIsAddingBundle(false);
      setNewBundleName("");
    },
  });

  const delBundleMutation = useMutation({
    mutationFn: (bundleId: string) => deleteBundle(eventId, bundleId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const addItemMutation = useMutation({
    mutationFn: ({ bId, name }: { bId: string; name: string }) =>
      createItem(eventId, bId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const publishMutation = useMutation({
    mutationFn: (payload: import("@/lib/api").PublishPayload) => publishSale(eventId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale is now live!");
    },
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishSale(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale unpublished.");
    },
  });

  const reestimateMutation = useMutation({
    mutationFn: () => triggerReestimation(eventId),
    onSuccess: () =>
      queryClient.setQueryData(["status", eventId], { status: "pricing_in_progress" }),
  });

  const isGlobalLoading =
    isProcessing || isPricing || reestimateMutation.isPending || activeMutations > 0;

  const handleSeek = (seconds: number) => {
    const v = document.getElementById("inventory-video") as HTMLVideoElement | null;
    if (v) {
      v.currentTime = seconds;
      v.play();
    }
  };

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

  const totalItems = summary?.bundles?.reduce((acc, b) => acc + b.items.length, 0) ?? 0;

  return (
    <div className="relative" aria-busy={isGlobalLoading}>
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isProcessing && "Processing your inventory video…"}
        {isPricing && "AI is pricing your items…"}
        {reestimateMutation.isPending && "Re-analysing prices…"}
      </div>

      {isGlobalLoading && (
        <LoadingOverlay
          isPricing={isPricing}
          isReestimating={reestimateMutation.isPending}
          status={status}
        />
      )}

      <Header isProcessing={isGlobalLoading}>
        <InventoryActions
          isLive={isLive}
          isAddingBundle={isAddingBundle}
          newBundleName={newBundleName}
          isPublishing={publishMutation.isPending}
          isUnpublishing={unpublishMutation.isPending}
          onAddBundleOpen={() => setIsAddingBundle(true)}
          onAddBundleClose={() => {
            setIsAddingBundle(false);
            setNewBundleName("");
          }}
          onBundleNameChange={setNewBundleName}
          onBundleSubmit={() => addBundleMutation.mutate(newBundleName)}
          onPublish={(payload) => publishMutation.mutate(payload)}
          onUnpublish={() => unpublishMutation.mutate()}
        />
      </Header>

      <div className="flex h-[calc(100vh-64px)] w-full p-8 gap-12">
        <VideoPreview videoUrl={summary?.videoUrl} status={status} itemCount={totalItems} />

        {!isLive && (
          <div className="fixed bottom-12 right-12 z-[60]">
            <button
              onClick={() => reestimateMutation.mutate()}
              disabled={isGlobalLoading}
              aria-busy={reestimateMutation.isPending}
              className="flex items-center gap-3 bg-primary text-surface px-8 py-5 rounded-full font-black uppercase tracking-tighter shadow-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary/40"
            >
              <Sparkles size={20} fill="currentColor" aria-hidden />
              Re-Analyse Prices
            </button>
          </div>
        )}

        <section aria-label="Inventory bundles" className="flex-1 overflow-y-auto pr-4 custom-scrollbar flex flex-col gap-16 pb-24">
          {summary?.bundles?.map((bundle) => (
            <BundleSection
              key={bundle.id}
              bundle={bundle}
              isLive={isLive}
              onDeleteBundle={(bundleId) => delBundleMutation.mutate(bundleId)}
              onAddItem={(bId) =>
                addItemMutation.mutate({ bId, name: "New Manual Asset" })
              }
              onSeek={handleSeek}
            />
          ))}

          <div className="flex flex-col items-center py-12 opacity-10">
            <Package size={48} />
            <p className="text-[10px] uppercase tracking-[0.4em] mt-4 font-bold">
              End of Catalog
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
