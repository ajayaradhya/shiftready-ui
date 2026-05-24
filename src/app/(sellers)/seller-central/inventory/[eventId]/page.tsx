"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { useSaleContext } from "@/lib/sale-context";
import { BundleCard } from "@/components/features/seller-central/bundle-card";
import { ItemCardV2 } from "@/components/features/seller-central/item-card-v2";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { SaleDetailsPanel } from "@/components/features/inventory/sale-details-panel";
import { MousePointerClick, Plus, Trash2, Sparkles } from "lucide-react";
import {
  publishSale, unpublishSale, triggerReestimation,
  createBundle, deleteBundle, createItem, renameBundle,
  archiveSale, deleteSale, republishSale,
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SaleLifecycleMenu } from "@/components/features/inventory/SaleLifecycleMenu";

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
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSale, setProcessing } = useSaleContext();

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [isAddingBundle, setIsAddingBundle] = useState(false);
  const [newBundleName, setNewBundleName] = useState("");
  const [isRenamingBundle, setIsRenamingBundle] = useState(false);
  const [bundleRenameValue, setBundleRenameValue] = useState("");

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

  const renameBundleMutation = useMutation({
    mutationFn: ({ bundleId, name }: { bundleId: string; name: string }) =>
      renameBundle(eventId, bundleId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      setIsRenamingBundle(false);
    },
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

  const archiveMutation = useMutation({
    mutationFn: () => archiveSale(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale archived.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteSale(eventId),
    onSuccess: () => {
      toast.success("Sale deleted.");
      router.push("/seller-central");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const republishMutation = useMutation({
    mutationFn: () => republishSale(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale is now live!");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const isGlobalLoading =
    isProcessing || reestimateMutation.isPending || activeMutations > 0;

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

  if (isLoading && !summary) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ height: 28, width: 220, borderRadius: 6, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ height: 16, width: 140, borderRadius: 4, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 8 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 10, background: "var(--cream-200)", animation: "pulse 1.5s ease-in-out infinite", animationDelay: `${i * 0.1}s` }} />
          ))}
        </div>
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
      style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 32px", overflowY: "auto", fontFamily: "var(--sr-font-sans)" }}
      className="custom-scrollbar pb-14"
      aria-busy={isGlobalLoading || isPricing}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing && "AI is extracting your items…"}
        {isPricing && "AI is pricing your items…"}
        {reestimateMutation.isPending && "Re-analysing prices…"}
      </div>

      <div>
        {/* Inline status banners — non-blocking */}
        {(isPricing || reestimateMutation.isPending || isProcessing) && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 20, borderRadius: "var(--sr-radius-sm)", background: "var(--clay-50)", border: "1px solid var(--clay-100)", color: "var(--clay-700)", fontSize: 13, fontWeight: 500 }}>
            <Sparkles size={15} style={{ flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
            <span>
              {isProcessing && "AI is extracting items from your inventory — bundles will appear shortly."}
              {isPricing && !isProcessing && "Gemini is pricing your items against Sydney market data — prices will appear shortly."}
              {reestimateMutation.isPending && "Re-analysing prices…"}
            </span>
          </div>
        )}

        {/* Top bar */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3" style={{ marginBottom: 28 }}>
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
            <SaleLifecycleMenu
              status={status ?? ""}
              isLive={isLive}
              isArchiving={archiveMutation.isPending}
              isDeleting={deleteMutation.isPending}
              isRepublishing={republishMutation.isPending}
              onArchive={() => archiveMutation.mutate()}
              onDelete={() => deleteMutation.mutate()}
              onRepublish={() => republishMutation.mutate()}
            />
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

        {/* Sale details panel */}
        {summary && (
          <SaleDetailsPanel
            eventId={eventId}
            summary={summary}
            isEditable={["ready_for_review", "live", "partially_sold", "failed"].includes(status ?? "")}
          />
        )}

        {/* Bundle tray — responsive grid */}
        {summary?.bundles && summary.bundles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[14px] mb-8">
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
                {isRenamingBundle ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <input
                      value={bundleRenameValue}
                      onChange={(e) => setBundleRenameValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          const trimmed = bundleRenameValue.trim();
                          if (trimmed) renameBundleMutation.mutate({ bundleId: selectedBundle.id, name: trimmed });
                        }
                        if (e.key === "Escape") setIsRenamingBundle(false);
                      }}
                      autoFocus
                      maxLength={80}
                      style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)", background: "transparent", border: "none", borderBottom: "2px solid var(--clay-400)", outline: "none", minWidth: 120 }}
                    />
                    <button
                      onClick={() => {
                        const trimmed = bundleRenameValue.trim();
                        if (trimmed) renameBundleMutation.mutate({ bundleId: selectedBundle.id, name: trimmed });
                        else setIsRenamingBundle(false);
                      }}
                      style={{ fontSize: 11, color: "var(--clay-600)", border: "none", background: "none", cursor: "pointer", padding: "2px 6px" }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsRenamingBundle(false)}
                      style={{ fontSize: 11, color: "var(--sr-text-muted)", border: "none", background: "none", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div
                    style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)", cursor: isLive ? "default" : "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}
                    onClick={() => { if (!isLive) { setBundleRenameValue(selectedBundle.name); setIsRenamingBundle(true); } }}
                    title={isLive ? undefined : "Click to rename"}
                  >
                    {selectedBundle.name}
                  </div>
                )}
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

            {/* items grid — 1-col mobile, 2-col sm+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-[14px]">
              {selectedBundle.items.map((item) => (
                <ItemCardV2
                  key={item.id}
                  eventId={eventId}
                  bundleId={selectedBundle.id}
                  item={item}
                  allBundles={summary?.bundles ?? []}
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: "var(--sr-bg-card)", border: "1px solid var(--clay-200)", borderRadius: "var(--sr-radius-lg)", padding: "20px 24px", marginTop: 24, boxShadow: "0 2px 0 var(--clay-100)" }}>
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
