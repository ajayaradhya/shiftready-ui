"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { useSaleContext } from "@/lib/sale-context";
import { BundleCard } from "@/components/features/seller-central/bundle-card";
import { ItemCardV2 } from "@/components/features/seller-central/item-card-v2";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { SaleDetailsPanel } from "@/components/features/inventory/sale-details-panel";
import {
  MousePointerClick, Plus, Sparkles,
  Pencil, Eye, Box, DollarSign, MapPin, Calendar,
} from "lucide-react";
import {
  publishSale, unpublishSale, triggerReestimation,
  createBundle, deleteBundle, createItem, renameBundle,
  archiveSale, deleteSale, republishSale,
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SaleLifecycleMenu } from "@/components/features/inventory/SaleLifecycleMenu";

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  live:                { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Live" },
  partially_sold:      { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Partially Sold" },
  ready_for_review:    { bg: "var(--honey-50)",  color: "var(--honey-700)", border: "var(--honey-100)", label: "Ready for Review" },
  pricing_in_progress: { bg: "var(--clay-50)",   color: "var(--clay-700)",  border: "var(--clay-100)",  label: "Pricing…" },
  processing:          { bg: "var(--clay-50)",   color: "var(--clay-700)",  border: "var(--clay-100)",  label: "Processing…" },
  archived:            { bg: "var(--cream-200)", color: "var(--ink-500)",   border: "var(--cream-300)", label: "Archived" },
  failed:              { bg: "var(--rust-50)",   color: "var(--rust-500)",  border: "var(--rust-100)",  label: "Failed" },
};

function NewBundleTile({ onSubmit }: { onSubmit: (name: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const t = name.trim();
    if (t) onSubmit(t);
    setAdding(false);
    setName("");
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => !adding && setAdding(true)}
      onKeyDown={(e) => !adding && (e.key === "Enter" || e.key === " ") && setAdding(true)}
      style={{
        border: "1.5px dashed var(--cream-400)",
        borderRadius: "var(--sr-radius-lg)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: 200,
        cursor: adding ? "default" : "pointer",
        transition: "border-color 180ms, background 180ms",
        background: "transparent",
        outline: "none",
        padding: 20,
        gap: 10,
      }}
      onMouseEnter={(e) => { if (!adding) (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-300)"; }}
      onMouseLeave={(e) => { if (!adding) (e.currentTarget as HTMLElement).style.borderColor = "var(--cream-400)"; }}
    >
      {adding ? (
        <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", display: "flex", flexDirection: "column", gap: 8, alignItems: "center" }}>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submit();
              if (e.key === "Escape") { setAdding(false); setName(""); }
            }}
            onBlur={() => { if (!name.trim()) { setAdding(false); setName(""); } else submit(); }}
            placeholder="Room name…"
            maxLength={80}
            style={{
              width: "100%", padding: "8px 10px", borderRadius: "var(--sr-radius-sm)",
              border: "1px solid var(--clay-300)", background: "var(--cream-50)",
              fontSize: 13, fontFamily: "var(--sr-font-serif)", color: "var(--ink-800)",
              outline: "none", textAlign: "center",
            }}
          />
          <span style={{ fontSize: 11, color: "var(--sr-text-muted)" }}>Enter to add · Esc to cancel</span>
        </div>
      ) : (
        <>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "var(--cream-200)", display: "grid", placeItems: "center" }}>
            <Plus size={18} color="var(--ink-400)" strokeWidth={1.5} />
          </div>
          <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 14, color: "var(--ink-500)", fontWeight: 500 }}>New bundle</span>
        </>
      )}
    </div>
  );
}

export default function SellerCentralInventoryPage() {
  const { eventId } = useParams() as { eventId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSale, setProcessing } = useSaleContext();

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { summary, isProcessing, isPricing, isLoading, status, isLive, error } =
    useInventory(eventId);
  const activeMutations = useIsMutating();

  useEffect(() => {
    if (error) toast.error("Could not reach the server. Retrying…");
  }, [error]);

  const addBundleMutation = useMutation({
    mutationFn: (name: string) => createBundle(eventId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
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

  const isGlobalLoading = isProcessing || reestimateMutation.isPending || activeMutations > 0;

  const titleFromUrl = searchParams.get("title");

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
  const totalValue = summary?.bundles?.reduce((s, b) => s + b.suggestedPrice, 0) ?? 0;
  const selectedBundle = summary?.bundles?.find((b) => b.id === selectedBundleId) ?? null;
  const statusInfo = status ? (STATUS_BADGE[status] ?? STATUS_BADGE.archived) : null;

  // Meta row values
  const locationStr = [summary?.suburb, summary?.state].filter(Boolean).join(", ") || null;
  const saleDateStr = summary?.moveOutDate
    ? new Date(summary.moveOutDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : null;

  // Title parts
  const titleParts = titleFromUrl?.split(",").map((s) => s.trim()) ?? [];
  const titleMain = titleParts[0] ?? "Inventory";
  const titleAccent = titleParts[1] ?? "review";

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

      {/* Processing banner */}
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

      {/* ── Sale header ── */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          {/* Title */}
          <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: 0 }}>
            {titleMain}{" "}
            <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>{titleAccent}</em>
          </h2>

          {/* Right: Edit details + Preview listing + lifecycle */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!isLive && (
              <button
                onClick={() => reestimateMutation.mutate()}
                disabled={isGlobalLoading}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "7px 12px", borderRadius: "var(--sr-radius-sm)", fontSize: 12, fontWeight: 500,
                  cursor: isGlobalLoading ? "not-allowed" : "pointer",
                  border: "1px solid var(--sr-border-subtle)", background: "transparent",
                  color: "var(--sr-text-muted)", transition: "all 120ms", opacity: isGlobalLoading ? 0.5 : 1,
                }}
                onMouseEnter={(e) => { if (!isGlobalLoading) (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
              >
                <Sparkles size={12} />
                Re-analyse
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
            <button
              onClick={() => setDetailsOpen((v) => !v)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: "var(--sr-radius-sm)", fontSize: 12, fontWeight: 500,
                cursor: "pointer", border: "1px solid var(--sr-border-subtle)", background: detailsOpen ? "var(--cream-100)" : "transparent",
                color: "var(--ink-600)", transition: "all 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
              onMouseLeave={(e) => { if (!detailsOpen) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              <Pencil size={12} />
              Edit details
            </button>
            <button
              onClick={() => window.open(`/sale/${eventId}`, "_blank")}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "7px 12px", borderRadius: "var(--sr-radius-sm)", fontSize: 12, fontWeight: 600,
                cursor: "pointer", border: "1px solid var(--clay-300)", background: "var(--clay-600)",
                color: "#fff", transition: "all 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-700)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
            >
              <Eye size={12} />
              Preview listing
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap", fontSize: 13, color: "var(--sr-text-muted)" }}>
          {statusInfo && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--sr-radius-sm)", fontSize: 11.5, fontWeight: 500, border: `1px solid ${statusInfo.border}`, background: statusInfo.bg, color: statusInfo.color }}>
              {statusInfo.label}
            </span>
          )}
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Box size={12} style={{ color: "var(--ink-400)" }} />
            {totalItems} items
          </span>
          <span style={{ color: "var(--cream-400)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <DollarSign size={12} style={{ color: "var(--ink-400)" }} />
            <span style={{ color: "var(--sr-text-primary)", fontWeight: 600 }}>${totalValue.toLocaleString()}</span>
            {" "}listing value
          </span>
          <span style={{ color: "var(--cream-400)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <MapPin size={12} style={{ color: "var(--ink-400)" }} />
            {locationStr ?? <span style={{ color: "var(--sr-text-muted)", fontStyle: "italic" }}>Add location</span>}
          </span>
          <span style={{ color: "var(--cream-400)" }}>·</span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Calendar size={12} style={{ color: "var(--ink-400)" }} />
            {saleDateStr ?? <span style={{ fontStyle: "italic" }}>Sale date TBC</span>}
          </span>
        </div>

        <div style={{ height: 1, background: "var(--sr-border-subtle)", marginTop: 16 }} />
      </div>

      {/* Sale details panel — controlled by Edit details button */}
      {summary && (
        <SaleDetailsPanel
          eventId={eventId}
          summary={summary}
          isEditable={["ready_for_review", "live", "partially_sold", "failed"].includes(status ?? "")}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Bundle tray — 4-col grid */}
      {summary?.bundles && (summary.bundles.length > 0 || !isLive) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-8">
          {summary.bundles.map((bundle, idx) => (
            <BundleCard
              key={bundle.id}
              bundle={bundle}
              index={idx}
              active={selectedBundleId === bundle.id}
              isLive={isLive}
              onClick={() => setSelectedBundleId(selectedBundleId === bundle.id ? null : bundle.id)}
              onAddItem={() => {
                setSelectedBundleId(bundle.id);
                addItemMutation.mutate({ bId: bundle.id, name: "New Item" });
              }}
              onDelete={() => delBundleMutation.mutate(bundle.id)}
              onRenameSubmit={(name) => renameBundleMutation.mutate({ bundleId: bundle.id, name })}
            />
          ))}
          {!isLive && (
            <NewBundleTile onSubmit={(name) => addBundleMutation.mutate(name)} />
          )}
        </div>
      )}

      {/* Connector */}
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
          {/* Slim bundle context bar */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "12px 18px", background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-md)" }}>
            <div>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)" }}>
                {selectedBundle.name}
              </div>
              <div style={{ fontSize: 12, color: "var(--sr-text-muted)", marginTop: 1 }}>
                {selectedBundle.items.length} items · ${selectedBundle.suggestedPrice.toLocaleString()} listing value
              </div>
            </div>
          </div>

          {/* Items grid */}
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

      {/* Publish bar */}
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
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <em style={{ fontFamily: "var(--sr-font-serif)", fontSize: 30, fontWeight: 500, color: "var(--clay-600)", letterSpacing: "-0.02em", fontStyle: "italic" }}>
                ${totalValue.toLocaleString()}
              </em>
              <span style={{ fontSize: 13, color: "var(--sr-text-muted)" }}>total listing value</span>
            </div>
            <InventoryActions
              isLive={isLive}
              isPublishing={publishMutation.isPending}
              isUnpublishing={unpublishMutation.isPending}
              onPublish={(payload) => publishMutation.mutate(payload)}
              onUnpublish={() => unpublishMutation.mutate()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
