"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { useSaleContext } from "@/lib/sale-context";
import { BundleCard } from "@/components/features/seller-central/bundle-card";
import { ItemCardV2 } from "@/components/features/seller-central/item-card-v2";
import { VideoPanel } from "@/components/features/seller-central/video-panel";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { LoadingOverlay } from "@/components/features/inventory/loading-overlay";
import { MousePointerClick, Plus, Trash2, Sparkles } from "lucide-react";
import {
  publishSale, unpublishSale, triggerReestimation,
  createBundle, deleteBundle, createItem,
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  live:               { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Live" },
  partially_sold:     { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Partially Sold" },
  ready_for_review:   { bg: "var(--honey-50)",  color: "var(--honey-700)", border: "var(--honey-100)", label: "Ready for Review" },
  pricing_in_progress:{ bg: "var(--clay-50)",   color: "var(--clay-700)",  border: "var(--clay-100)",  label: "Pricing…" },
  processing:         { bg: "var(--clay-50)",   color: "var(--clay-700)",  border: "var(--clay-100)",  label: "Processing…" },
  archived:           { bg: "var(--cream-200)", color: "var(--ink-500)",   border: "var(--cream-300)", label: "Archived" },
  failed:             { bg: "var(--rust-50)",   color: "var(--rust-500)",  border: "var(--rust-100)",  label: "Failed" },
};

export default function SellerCentralInventoryPage() {
  const { eventId } = useParams() as { eventId: string };
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { setSale, setProcessing } = useSaleContext();

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [newBundleName, setNewBundleName] = useState("");
  const [activeItemId, setActiveItemId] = useState<string | undefined>(undefined);

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
    onError: () => { setIsAddingBundle(false); setNewBundleName(""); },
  });

  const delBundleMutation = useMutation({
    mutationFn: (bundleId: string) => deleteBundle(eventId, bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      setSelectedBundleId(null);
    },
  });

  const addItemMutation = useMutation({
    mutationFn: ({ bId, name }: { bId: string; name: string }) => createItem(eventId, bId, name),
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

  // Sale title from URL search param (set by sale-row when navigating)
  const titleFromUrl = searchParams.get("title");

  // Wire sale context
  useEffect(() => {
    setSale({ label: "Sale · Inventory", name: titleFromUrl ?? eventId.slice(0, 8) });
    return () => setSale(null);
  }, [titleFromUrl, eventId, setSale]);

  useEffect(() => {
    setProcessing(isGlobalLoading);
    return () => setProcessing(false);
  }, [isGlobalLoading, setProcessing]);

  const handleSeek = (ts: number) => {
    const v = document.getElementById("inventory-video") as HTMLVideoElement | null;
    if (v) { v.currentTime = ts; v.play().catch(() => {}); }
    // find which item has this timestamp
    const item = allItems.find((i) => i.video_timestamp === ts);
    setActiveItemId(item?.id);
  };

  if (isLoading && !summary) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "calc(100vh - 64px)", gap: 16 }}>
        <div style={{ width: 40, height: 40, border: "2px solid var(--clay-100)", borderTopColor: "var(--clay-500)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.3em", color: "var(--sr-text-muted)" }}>
          Loading inventory…
        </span>
      </div>
    );
  }

  const allItems = summary?.bundles?.flatMap((b) => b.items) ?? [];
  const totalItems = allItems.length;
  const bundleCount = summary?.bundles?.length ?? 0;
  const totalValue = summary?.bundles?.reduce((s, b) => s + b.suggestedPrice, 0) ?? 0;
  const selectedBundle = summary?.bundles?.find((b) => b.id === selectedBundleId) ?? null;

  const statusInfo = status ? (STATUS_BADGE[status] ?? STATUS_BADGE.archived) : null;

  return (
    <div
      style={{ display: "flex", height: "calc(100vh - 64px)" }}
      aria-busy={isGlobalLoading}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
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

      {/* Left: video panel */}
      <VideoPanel
        videoUrl={summary?.videoUrl}
        items={allItems}
        activeItemId={activeItemId}
        onSeek={handleSeek}
      />

      {/* Right: main inventory */}
      <div
        style={{ flex: 1, overflowY: "auto", padding: "28px 32px 56px", fontFamily: "var(--sr-font-sans)" }}
        className="custom-scrollbar"
      >
        {/* Top bar */}
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: "0 0 5px" }}>
              {titleFromUrl ? (
                <>
                  {titleFromUrl.split(",")[0]}{" "}
                  <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>
                    {titleFromUrl.includes(",") ? titleFromUrl.split(",").slice(1).join(",").trim() : "clearance"}
                  </em>
                </>
              ) : (
                <>Inventory <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>review</em></>
              )}
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "var(--sr-text-muted)" }}>
              {statusInfo && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--sr-radius-sm)", fontSize: 11.5, fontWeight: 500, border: `1px solid ${statusInfo.border}`, background: statusInfo.bg, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              )}
              <span>{totalItems} items · {bundleCount} bundles</span>
            </div>
          </div>

          {/* Actions: inventory actions (publish/add-bundle) + re-analyse */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isLive && (
              <button
                onClick={() => reestimateMutation.mutate()}
                disabled={isGlobalLoading}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: "var(--sr-radius-sm)",
                  fontSize: 12,
                  fontWeight: 500,
                  cursor: isGlobalLoading ? "not-allowed" : "pointer",
                  border: "1px solid var(--sr-border-subtle)",
                  background: "transparent",
                  color: "var(--sr-text-muted)",
                  transition: "all 120ms",
                  opacity: isGlobalLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isGlobalLoading) { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; } }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Sparkles size={12} />
                Re-analyse prices
              </button>
            )}
            <InventoryActions
              isLive={isLive}
              isAddingBundle={isAddingBundle}
              newBundleName={newBundleName}
              isPublishing={publishMutation.isPending}
              isUnpublishing={unpublishMutation.isPending}
              onAddBundleOpen={() => setIsAddingBundle(true)}
              onAddBundleClose={() => { setIsAddingBundle(false); setNewBundleName(""); }}
              onBundleNameChange={setNewBundleName}
              onBundleSubmit={() => addBundleMutation.mutate(newBundleName)}
              onPublish={(payload) => publishMutation.mutate(payload)}
              onUnpublish={() => unpublishMutation.mutate()}
            />
          </div>
        </div>

        {/* Bundle tray — 3-col grid */}
        {summary?.bundles && summary.bundles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 32 }}>
            {summary.bundles.map((bundle, idx) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                index={idx}
                active={selectedBundleId === bundle.id}
                onClick={() => setSelectedBundleId(selectedBundleId === bundle.id ? null : bundle.id)}
              />
            ))}
          </div>
        )}

        {/* Connector line */}
        {selectedBundle && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 24 }}>
            <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
              <path d="M10 0v24" stroke="var(--sr-border-default)" strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
          </div>
        )}

        {/* Items section OR no-selection hint */}
        {selectedBundle ? (
          <div style={{ animation: "fadeSlide 280ms ease" }}>
            {/* Section header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "14px 18px", background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-md)" }}>
              <div>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)" }}>
                  {selectedBundle.name}
                </div>
                <div style={{ fontSize: 13, color: "var(--sr-text-muted)", marginTop: 2 }}>
                  {selectedBundle.items.length} items · ${selectedBundle.suggestedPrice.toLocaleString()} listing value
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => addItemMutation.mutate({ bId: selectedBundle.id, name: "New Item" })}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: "var(--sr-radius-sm)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid var(--sr-border-subtle)",
                    background: "transparent",
                    color: "var(--sr-text-muted)",
                    transition: "all 120ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Plus size={12} /> Add item
                </button>
                <button
                  onClick={() => delBundleMutation.mutate(selectedBundle.id)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "7px 13px",
                    borderRadius: "var(--sr-radius-sm)",
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    border: "1px solid var(--sr-border-subtle)",
                    background: "transparent",
                    color: "var(--rust-500)",
                    transition: "all 120ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--rust-50)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>

            {/* 2-col items grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
              {selectedBundle.items.map((item) => (
                <ItemCardV2
                  key={item.id}
                  eventId={eventId}
                  bundleId={selectedBundle.id}
                  item={item}
                  onSeek={handleSeek}
                />
              ))}
            </div>

          </div>
        ) : (
          /* No-selection hint */
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center", border: "1.5px dashed var(--cream-400)", borderRadius: "var(--sr-radius-xl)" }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--cream-200)", color: "var(--ink-400)", display: "grid", placeItems: "center", marginBottom: 14 }}>
              <MousePointerClick size={22} strokeWidth={1.5} />
            </div>
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-700)", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
              Select a bundle to browse
            </div>
            <p style={{ fontSize: 13, color: "var(--sr-text-muted)", maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
              Tap any room card above to review and edit its items.
            </p>
          </div>
        )}

        {/* Publish bar — always visible when inventory is loaded */}
        {summary && totalItems > 0 && (
          <div style={{ background: "var(--sr-bg-card)", border: "1px solid var(--clay-200)", borderRadius: "var(--sr-radius-lg)", padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, marginTop: 24, boxShadow: "0 2px 0 var(--clay-100)" }}>
            <div>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)", letterSpacing: "-0.01em" }}>
                {isLive ? "Currently live" : "Ready to publish"}
              </div>
              <div style={{ fontSize: 13, color: "var(--sr-text-secondary)", marginTop: 2 }}>
                {isLive ? "Sale is visible on the marketplace." : "All bundles reviewed — publish to the marketplace."}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <em style={{ fontFamily: "var(--sr-font-serif)", fontSize: 30, fontWeight: 500, color: "var(--clay-600)", letterSpacing: "-0.02em", fontStyle: "italic" }}>
                ${totalValue.toLocaleString()}
              </em>
              <span style={{ fontSize: 13, color: "var(--sr-text-muted)" }}>total listing value</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
