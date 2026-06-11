"use client";

import React, { useEffect, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { useInventory } from "@/hooks/use-inventory";
import { useSaleContext } from "@/lib/sale-context";
import { BundleCard } from "@/components/features/seller-central/bundle-card";
import { ItemCardV3 } from "@/components/features/seller-central/item-card-v3";
import { AddItemDrawer } from "@/components/features/seller-central/add-item-drawer";
import { InventoryActions } from "@/components/features/inventory/inventory-actions";
import { SaleDetailsPanel } from "@/components/features/inventory/sale-details-panel";
import {
  MousePointerClick, Plus, Sparkles,
  Pencil, Eye, Box, MapPin, Calendar, Trash2, Send, Power, Loader2,
} from "lucide-react";
import type { PublishPayload } from "@/lib/api";
import { formatAUD, plural } from "@/lib/format";
import { useIsMobile } from "@/hooks/use-media-query";
import {
  publishSale, unpublishSale, updateSale,
  createBundle, deleteBundle, renameBundle, patchBundle,
  archiveSale, deleteSale, republishSale,
} from "@/lib/api";
import { useMutation, useIsMutating, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { SaleLifecycleMenu } from "@/components/features/inventory/SaleLifecycleMenu";
import { useAuth } from "@/hooks/use-auth";

const STATUS_BADGE: Record<string, { bg: string; color: string; border: string; label: string }> = {
  live:                { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Live" },
  partially_sold:      { bg: "var(--moss-50)",   color: "var(--moss-700)",  border: "var(--moss-100)",  label: "Partially Sold" },
  sold:                { bg: "var(--moss-100)",  color: "var(--moss-800)",  border: "var(--moss-200)",  label: "Sold" },
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

function MobileBundleStrip({
  bundles, selectedId, onSelect, onAddBundle,
}: {
  bundles: { id: string; name: string; items: unknown[]; suggestedPrice?: number | null }[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddBundle: (name: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");

  function submit() {
    const t = name.trim();
    if (t) onAddBundle(t);
    setAdding(false);
    setName("");
  }

  return (
    <div
      className="custom-scrollbar -mx-4"
      style={{ display: "flex", gap: 8, overflowX: "auto", padding: "2px 16px 10px", marginBottom: 14, scrollSnapType: "x proximity" }}
    >
      {bundles.map((b) => {
        const sel = b.id === selectedId;
        return (
          <button
            key={b.id}
            onClick={() => onSelect(b.id)}
            style={{
              flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2,
              padding: "8px 12px", borderRadius: "var(--sr-radius-md)", scrollSnapAlign: "start",
              border: `1.5px solid ${sel ? "var(--clay-400)" : "var(--sr-border-subtle)"}`,
              background: sel ? "var(--clay-50)" : "var(--sr-bg-card)",
              minWidth: 100, maxWidth: 168, cursor: "pointer", textAlign: "left",
              transition: "border-color 160ms, background 160ms",
            }}
          >
            <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 14, fontWeight: 500, color: sel ? "var(--clay-700)" : "var(--ink-800)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 144 }}>
              {b.name}
            </span>
            <span style={{ fontSize: 11, color: "var(--sr-text-muted)", whiteSpace: "nowrap" }}>
              {plural(b.items.length, "item")} · {formatAUD(b.suggestedPrice ?? 0)}
            </span>
          </button>
        );
      })}
      {adding ? (
        <input
          autoFocus
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); if (e.key === "Escape") { setAdding(false); setName(""); } }}
          onBlur={submit}
          placeholder="Room name…"
          maxLength={80}
          style={{ flexShrink: 0, minWidth: 130, padding: "8px 12px", borderRadius: "var(--sr-radius-md)", border: "1.5px solid var(--clay-300)", background: "var(--cream-50)", fontFamily: "var(--sr-font-serif)", fontSize: 14, color: "var(--ink-800)", outline: "none" }}
        />
      ) : (
        <button
          onClick={() => setAdding(true)}
          style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: "var(--sr-radius-md)", border: "1.5px dashed var(--cream-400)", background: "transparent", color: "var(--ink-500)", cursor: "pointer", fontSize: 13, fontWeight: 500 }}
        >
          <Plus size={14} /> New
        </button>
      )}
    </div>
  );
}

const today = new Date().toISOString().split("T")[0];
const emptyPublishForm = (): PublishPayload => ({
  move_out_date: today,
  street_address: "",
  suburb: "",
  pincode: "",
  state: "NSW",
});

function MobileStickyPublish({
  status, isLive, totalValue, uncategorisedCount, emailVerified,
  isPublishing, isUnpublishing,
  onPublish, onUnpublish,
}: {
  status: string;
  isLive: boolean;
  totalValue: number;
  uncategorisedCount: number;
  emailVerified: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  onPublish: (p: PublishPayload) => void;
  onUnpublish: () => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<PublishPayload>(emptyPublishForm);
  const [confirmUnpublish, setConfirmUnpublish] = useState(false);

  const isProcessingState = (s: string) => ["processing", "pricing_in_progress"].includes(s);
  const canAct = !isProcessingState(status);
  const isFormValid = form.street_address.trim() && form.suburb.trim() && form.pincode.trim() && form.move_out_date;

  const setField = (f: keyof PublishPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [f]: e.target.value }));

  function handlePublish() {
    if (!isFormValid) return;
    onPublish(form);
    setDialogOpen(false);
    setForm(emptyPublishForm());
  }

  return (
    <>
      {/* Sticky bar — sits above tab bar (pb-16 = 64px) */}
      <div
        className="md:hidden"
        style={{
          position: "fixed", bottom: 64, left: 0, right: 0, zIndex: 45,
          background: "var(--sr-bg-card)", borderTop: "1px solid var(--sr-border-default)",
          padding: "10px 16px", display: "flex", alignItems: "center", gap: 10,
          boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 600, color: "var(--clay-600)", letterSpacing: "-0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {formatAUD(totalValue)}
          </div>
          <div style={{ fontSize: 11, color: "var(--sr-text-muted)" }}>
            {isLive ? "Live on marketplace" : uncategorisedCount > 0 ? `${uncategorisedCount} item${uncategorisedCount > 1 ? "s" : ""} need a category` : "Ready to publish"}
          </div>
        </div>
        {isLive ? (
          <button
            onClick={() => setConfirmUnpublish(true)}
            disabled={isUnpublishing}
            style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 16px", borderRadius: "var(--sr-radius-md)", border: "1px solid var(--sr-border-default)", background: "transparent", color: "var(--ink-700)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
          >
            {isUnpublishing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Power size={14} />}
            Unpublish
          </button>
        ) : (
          <button
            onClick={() => canAct && setDialogOpen(true)}
            disabled={!canAct || isPublishing || !emailVerified || uncategorisedCount > 0}
            style={{
              display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 18px",
              borderRadius: "var(--sr-radius-md)", border: "none",
              background: (!canAct || !emailVerified || uncategorisedCount > 0) ? "var(--cream-300)" : "var(--clay-600)",
              color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            {isPublishing ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={14} />}
            Publish sale
          </button>
        )}
      </div>

      {/* Publish dialog */}
      {dialogOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(20,17,13,0.5)", display: "flex", alignItems: "flex-end" }} onClick={() => setDialogOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", background: "#FFFDF8", borderRadius: "20px 20px 0 0", padding: "24px 20px 32px", display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--cream-400)" }} />
            </div>
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)", marginBottom: 2 }}>Publish Sale</div>
            <p style={{ fontSize: 12, color: "var(--sr-text-secondary)", margin: 0 }}>Buyers will see your address and move-out date on the marketplace.</p>

            <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <span style={labelStyle}>Street Address</span>
              <input placeholder="12 Example St" value={form.street_address} onChange={setField("street_address")} style={inputStyle} />
            </label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Suburb</span>
                <input placeholder="Waterloo" value={form.suburb} onChange={setField("suburb")} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Postcode</span>
                <input placeholder="2017" value={form.pincode} onChange={setField("pincode")} maxLength={4} style={inputStyle} />
              </label>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 72px", gap: 10 }}>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>Move-Out Date</span>
                <input type="date" value={form.move_out_date} onChange={setField("move_out_date")} min={today} style={inputStyle} />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <span style={labelStyle}>State</span>
                <input placeholder="NSW" value={form.state} onChange={setField("state")} maxLength={3} style={inputStyle} />
              </label>
            </div>

            <button
              onClick={handlePublish}
              disabled={!isFormValid || isPublishing}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "13px", borderRadius: "var(--sr-radius-md)", border: "none", background: !isFormValid ? "var(--cream-300)" : "var(--clay-600)", color: "#fff", fontSize: 14, fontWeight: 600, cursor: !isFormValid ? "default" : "pointer", marginTop: 4 }}
            >
              {isPublishing ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={16} />}
              Publish
            </button>
          </div>
        </div>
      )}

      {/* Unpublish confirm */}
      {confirmUnpublish && (
        <div style={{ position: "fixed", inset: 0, zIndex: 70, background: "rgba(20,17,13,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setConfirmUnpublish(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)", padding: "28px 24px", maxWidth: 340, width: "90%", display: "flex", flexDirection: "column", gap: 12 }}>
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)" }}>Unpublish sale?</div>
            <p style={{ fontSize: 13, color: "var(--sr-text-secondary)", margin: 0, lineHeight: 1.5 }}>Your listing will be removed from the marketplace immediately.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 8 }}>
              <button onClick={() => setConfirmUnpublish(false)} style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: "transparent", fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={() => { onUnpublish(); setConfirmUnpublish(false); }} style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "none", background: "var(--rust-500)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>Unpublish</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

const labelStyle: React.CSSProperties = {
  fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--sr-text-muted)",
};

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "10px 12px", borderRadius: "var(--sr-radius-sm)",
  border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)",
  fontSize: 14, color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-sans)",
  outline: "none", boxSizing: "border-box",
};

export default function SellerCentralInventoryPage() {
  const { eventId } = useParams() as { eventId: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setSale, setProcessing } = useSaleContext();
  const { user } = useAuth();

  const [selectedBundleId, setSelectedBundleId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [addItemDrawerBundleId, setAddItemDrawerBundleId] = useState<string | null>(null);
  const [bundleRenaming, setBundleRenaming] = useState(false);
  const [bundleRenameVal, setBundleRenameVal] = useState("");
  const [bundleDeleteConfirm, setBundleDeleteConfirm] = useState(false);
  const isMobile = useIsMobile();

  const { summary, isProcessing, isPricing, isLoading, status, isLive, error } =
    useInventory(eventId);
  const activeMutations = useIsMutating();

  useEffect(() => { document.title = "Inventory - Myrio"; }, []);
  useEffect(() => {
    if (error) toast.error("Could not reach the server. Retrying…");
  }, [error]);

  const addBundleMutation = useMutation({
    mutationFn: (name: string) => createBundle(eventId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
    onError: (err: Error) => toast.error(err.message || "Failed to create bundle"),
  });

  const delBundleMutation = useMutation({
    mutationFn: (bundleId: string) => deleteBundle(eventId, bundleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      setSelectedBundleId(null);
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete bundle"),
  });

  const renameBundleMutation = useMutation({
    mutationFn: ({ bundleId, name }: { bundleId: string; name: string }) =>
      renameBundle(eventId, bundleId, name),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
    onError: (err: Error) => toast.error(err.message || "Failed to rename bundle"),
  });

  const patchBundleMutation = useMutation({
    mutationFn: ({ bundleId, updates }: { bundleId: string; updates: { bundle_discount_percent?: number | null } }) =>
      patchBundle(eventId, bundleId, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
    onError: (err: Error) => toast.error(err.message || "Failed to update bundle"),
  });

  const publishMutation = useMutation({
    mutationFn: async (payload: import("@/lib/api").PublishPayload) => {
      await publishSale(eventId, payload);
      if (!summary?.title || summary.title === "Your Moving Sale") {
        try {
          await updateSale(eventId, { title: `${payload.suburb} Moving Sale` });
        } catch {
          // non-critical — sale is already live
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale is now live!");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to publish sale"),
  });

  const unpublishMutation = useMutation({
    mutationFn: () => unpublishSale(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["status", eventId] });
      toast.success("Sale unpublished.");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to unpublish sale"),
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

  const isGlobalLoading = isProcessing || activeMutations > 0;

  const titleFromUrl = searchParams.get("title");

  useEffect(() => {
    setSale({ label: "Sale · Inventory", name: summary?.title ?? titleFromUrl ?? eventId.slice(0, 8) });
    return () => setSale(null);
  }, [summary?.title, titleFromUrl, eventId, setSale]);

  useEffect(() => {
    setProcessing(isGlobalLoading);
    return () => setProcessing(false);
  }, [isGlobalLoading, setProcessing]);

  // On mobile, auto-select the first bundle so items are visible without a long
  // scroll past large bundle cards / empty-state hint.
  useEffect(() => {
    if (isMobile && !selectedBundleId && (summary?.bundles?.length ?? 0) > 0) {
      setSelectedBundleId(summary!.bundles[0].id);
    }
  }, [isMobile, selectedBundleId, summary]);

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
  const uncategorisedCount = allItems.filter((i) => !i.category).length;
  const totalValue = summary?.bundles?.reduce((s, b) => s + (b.suggestedPrice ?? 0), 0) ?? 0;
  const selectedBundle = summary?.bundles?.find((b) => b.id === selectedBundleId) ?? null;
  const statusInfo = status ? (STATUS_BADGE[status] ?? STATUS_BADGE.archived) : null;

  // Meta row values
  const locationStr = [summary?.suburb, summary?.state].filter(Boolean).join(", ") || null;
  const saleDateStr = summary?.moveOutDate
    ? new Date(summary.moveOutDate).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })
    : null;

  // Title parts - prefer the real sale title once loaded, fall back to URL param (suburb, state)
  const rawTitle = summary?.title ?? titleFromUrl ?? "";
  const titleWords = rawTitle.trim().split(/\s+/);
  const titleMain = titleWords.length > 1 ? titleWords.slice(0, -1).join(" ") : rawTitle;
  const titleAccent = titleWords.length > 1 ? titleWords[titleWords.length - 1] : "";

  return (
    <div
      style={{ maxWidth: 1200, margin: "0 auto", padding: "28px clamp(16px, 4vw, 32px)", overflowX: "hidden", overflowY: "auto", fontFamily: "var(--sr-font-sans)" }}
      className="custom-scrollbar pb-14"
      aria-busy={isGlobalLoading || isPricing}
    >
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {isProcessing && "AI is extracting your items…"}
        {isPricing && "AI is pricing your items…"}
      </div>

      {/* Processing banner */}
      {(isPricing || isProcessing) && (
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", marginBottom: 20, borderRadius: "var(--sr-radius-sm)", background: "var(--clay-50)", border: "1px solid var(--clay-100)", color: "var(--clay-700)", fontSize: 13, fontWeight: 500 }}>
          <Sparkles size={15} style={{ flexShrink: 0, animation: "pulse 2s ease-in-out infinite" }} />
          <span>
            {isProcessing && "AI is extracting items from your inventory - bundles will appear shortly."}
            {isPricing && !isProcessing && "Gemini is pricing your items against Sydney market data - prices will appear shortly."}
          </span>
        </div>
      )}

      {/* ── Sale header ── */}
      <div style={{ marginBottom: 24 }}>
        {isMobile ? (
          /* ── Mobile compact header ── */
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              {/* Title (single line, tap → edit details) */}
              <button
                onClick={() => setDetailsOpen(true)}
                style={{
                  flex: 1, minWidth: 0, textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer",
                  fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em",
                  color: "var(--ink-800)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}
              >
                {rawTitle || "Untitled sale"}
              </button>
              {/* Status chip */}
              {statusInfo && (
                <span style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", padding: "3px 9px", borderRadius: "var(--sr-radius-sm)", fontSize: 11, fontWeight: 500, border: `1px solid ${statusInfo.border}`, background: statusInfo.bg, color: statusInfo.color }}>
                  {statusInfo.label}
                </span>
              )}
              {/* In-app preview — router.push, not window.open */}
              <button
                onClick={() => router.push(`/market/sale/${eventId}`)}
                aria-label="Preview listing"
                style={{ flexShrink: 0, width: 32, height: 32, display: "grid", placeItems: "center", border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-sm)", background: "transparent", color: "var(--ink-500)", cursor: "pointer" }}
              >
                <Eye size={14} />
              </button>
              {/* Kebab: lifecycle actions */}
              <SaleLifecycleMenu
                status={status ?? ""}
                isLive={isLive}
                isDeleting={deleteMutation.isPending}
                isRepublishing={republishMutation.isPending}
                wasPublished={!!summary?.suburb}
                onDelete={() => deleteMutation.mutate()}
                onRepublish={() => republishMutation.mutate()}
              />
            </div>
            {/* One-line meta strip */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, color: "var(--sr-text-muted)", flexWrap: "wrap" }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <Box size={11} style={{ color: "var(--ink-400)" }} />
                {plural(totalItems, "item")}
              </span>
              <span style={{ color: "var(--cream-400)" }}>·</span>
              <span style={{ fontWeight: 600, color: "var(--sr-text-primary)" }}>{formatAUD(totalValue)}</span>
              <span style={{ color: "var(--cream-400)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} style={{ color: "var(--ink-400)" }} />
                {locationStr
                  ? <span>{locationStr}</span>
                  : <button onClick={() => setDetailsOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--clay-600)", fontSize: 12, fontWeight: 500, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2 }}>Add location</button>
                }
              </span>
              {saleDateStr && <><span style={{ color: "var(--cream-400)" }}>·</span><span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><Calendar size={11} style={{ color: "var(--ink-400)" }} />{saleDateStr}</span></>}
            </div>
          </div>
        ) : (
          /* ── Desktop header (unchanged) ── */
          <>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10, flexWrap: "wrap" }}>
              {/* Title */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0, flex: "1 1 240px" }}>
                <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)", margin: 0, minWidth: 0, overflowWrap: "anywhere" }}>
                  {titleMain}{" "}
                  <em style={{ fontStyle: "italic", color: "var(--clay-600)" }}>{titleAccent}</em>
                </h2>
                {!summary?.title && status === "ready_for_review" && (
                  <button
                    onClick={() => setDetailsOpen(true)}
                    style={{
                      display: "inline-flex", alignItems: "center", gap: 5,
                      padding: "4px 10px", borderRadius: "var(--sr-radius-sm)",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                      border: "1px solid var(--honey-200)", background: "var(--honey-50)",
                      color: "var(--honey-700)", transition: "all 120ms", flexShrink: 0,
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--honey-300)"; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--honey-200)"; }}
                  >
                    <Pencil size={10} strokeWidth={2} />
                    Name your sale
                  </button>
                )}
              </div>

              {/* Right: Edit details + Preview listing + lifecycle */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <SaleLifecycleMenu
                  status={status ?? ""}
                  isLive={isLive}
                  isDeleting={deleteMutation.isPending}
                  isRepublishing={republishMutation.isPending}
                  wasPublished={!!summary?.suburb}
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
                  onClick={() => window.open(`/market/sale/${eventId}`, "_blank")}
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
                {plural(totalItems, "item")}
              </span>
              <span style={{ color: "var(--cream-400)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span style={{ color: "var(--sr-text-primary)", fontWeight: 600 }}>{formatAUD(totalValue)}</span>
                {" "}listing value
              </span>
              <span style={{ color: "var(--cream-400)" }}>·</span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                <MapPin size={12} style={{ color: "var(--ink-400)" }} />
                {locationStr
                  ? locationStr
                  : <button onClick={() => setDetailsOpen(true)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", color: "var(--clay-600)", fontSize: 13, fontWeight: 500, textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 2 }}>Add location</button>
                }
              </span>
              {saleDateStr && <span style={{ color: "var(--cream-400)" }}>·</span>}
              {saleDateStr && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <Calendar size={12} style={{ color: "var(--ink-400)" }} />
                  {saleDateStr}
                </span>
              )}
            </div>
          </>
        )}

        {!isMobile && <div style={{ height: 1, background: "var(--sr-border-subtle)", marginTop: 16 }} />}
      </div>

      {/* Sale details panel - controlled by Edit details button */}
      {summary && (
        <SaleDetailsPanel
          eventId={eventId}
          summary={summary}
          isEditable={true}
          isOpen={detailsOpen}
          onOpenChange={setDetailsOpen}
        />
      )}

      {/* Bundle tray - sticky strip on mobile, 4-col grid on desktop */}
      {summary?.bundles && (
        isMobile ? (
          <div style={{ position: "sticky", top: 0, zIndex: 20, background: "var(--sr-bg-app)", marginBottom: 0, paddingBottom: 2 }}>
            <MobileBundleStrip
              bundles={summary.bundles}
              selectedId={selectedBundleId}
              onSelect={(id) => setSelectedBundleId(id)}
              onAddBundle={(name) => addBundleMutation.mutate(name)}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-[14px] mb-8">
            {summary.bundles.map((bundle, idx) => (
              <BundleCard
                key={bundle.id}
                bundle={bundle}
                index={idx}
                active={selectedBundleId === bundle.id}
                isLive={isLive}
                eventId={eventId}
                onClick={() => setSelectedBundleId(selectedBundleId === bundle.id ? null : bundle.id)}
                onAddItem={() => {
                  setSelectedBundleId(bundle.id);
                  setAddItemDrawerBundleId(bundle.id);
                }}
                onDelete={() => delBundleMutation.mutate(bundle.id)}
                onRenameSubmit={(name) => renameBundleMutation.mutate({ bundleId: bundle.id, name })}
                onDiscountChange={(pct) => patchBundleMutation.mutate({ bundleId: bundle.id, updates: { bundle_discount_percent: pct } })}
              />
            ))}
            <NewBundleTile onSubmit={(name) => addBundleMutation.mutate(name)} />
          </div>
        )
      )}

      {/* Connector (desktop only) */}
      {selectedBundle && !isMobile && (
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
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 16, padding: "12px 18px", background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)", borderRadius: "var(--sr-radius-md)" }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              {bundleRenaming ? (
                <input
                  autoFocus
                  value={bundleRenameVal}
                  onChange={(e) => setBundleRenameVal(e.target.value)}
                  maxLength={80}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const t = bundleRenameVal.trim();
                      if (t && t !== selectedBundle.name) renameBundleMutation.mutate({ bundleId: selectedBundle.id, name: t });
                      setBundleRenaming(false);
                    }
                    if (e.key === "Escape") setBundleRenaming(false);
                  }}
                  onBlur={() => {
                    const t = bundleRenameVal.trim();
                    if (t && t !== selectedBundle.name) renameBundleMutation.mutate({ bundleId: selectedBundle.id, name: t });
                    setBundleRenaming(false);
                  }}
                  style={{ width: "100%", fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, color: "var(--ink-800)", background: "transparent", border: "none", borderBottom: "2px solid var(--clay-300)", outline: "none", padding: "0 0 2px" }}
                />
              ) : (
                <div
                  style={{ fontFamily: "var(--sr-font-serif)", fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em", color: "var(--ink-800)", overflowWrap: "anywhere" }}
                  onDoubleClick={() => { setBundleRenameVal(selectedBundle.name); setBundleRenaming(true); }}
                  title="Double-click to rename"
                >
                  {selectedBundle.name}
                </div>
              )}
              <div style={{ fontSize: 12, color: "var(--sr-text-muted)", marginTop: 1 }}>
                {plural(selectedBundle.items.length, "item")} · {formatAUD(selectedBundle.suggestedPrice ?? 0)} listing value
              </div>
            </div>

            {/* Mobile action cluster - desktop has hover controls on the bundle cards */}
            {isMobile && !bundleRenaming && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  aria-label="Add item"
                  onClick={() => setAddItemDrawerBundleId(selectedBundle.id)}
                  style={{ width: 40, height: 40, borderRadius: "var(--sr-radius-sm)", display: "grid", placeItems: "center", border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)", color: "var(--ink-600)", cursor: "pointer" }}
                >
                  <Plus size={15} />
                </button>
                <button
                  aria-label="Rename bundle"
                  onClick={() => { setBundleRenameVal(selectedBundle.name); setBundleRenaming(true); }}
                  style={{ width: 40, height: 40, borderRadius: "var(--sr-radius-sm)", display: "grid", placeItems: "center", border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)", color: "var(--ink-600)", cursor: "pointer" }}
                >
                  <Pencil size={14} />
                </button>
                <button
                  aria-label="Delete bundle"
                  onClick={() => setBundleDeleteConfirm(true)}
                  style={{ width: 40, height: 40, borderRadius: "var(--sr-radius-sm)", display: "grid", placeItems: "center", border: "1px solid var(--sr-border-subtle)", background: "var(--cream-50)", color: "var(--rust-500)", cursor: "pointer" }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Items grid — list on mobile, 2-col on desktop */}
          <div className={isMobile ? "flex flex-col gap-[6px]" : "grid grid-cols-1 sm:grid-cols-2 gap-[14px]"}>
            {selectedBundle.items.map((item) => (
              <ItemCardV3
                key={item.id}
                eventId={eventId}
                bundleId={selectedBundle.id}
                item={item}
                allBundles={summary?.bundles ?? []}
                bundleIndex={summary?.bundles?.findIndex((b) => b.id === selectedBundle.id) ?? 0}
                saleStatus={summary?.status}
              />
            ))}
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "48px 32px", textAlign: "center", border: "1.5px dashed var(--cream-400)", borderRadius: "var(--sr-radius-xl)" }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: "var(--cream-200)", color: "var(--ink-400)", display: "grid", placeItems: "center", marginBottom: 14 }}>
            <MousePointerClick size={22} strokeWidth={1.5} />
          </div>
          {(summary?.bundles?.length ?? 0) === 0 ? (
            <>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-700)", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
                No bundles yet
              </div>
              <p style={{ fontSize: 13, color: "var(--sr-text-muted)", maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
                Create your first bundle above to start adding items.
              </p>
            </>
          ) : (
            <>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-700)", letterSpacing: "-0.01em", margin: "0 0 6px" }}>
                Select a bundle to browse
              </div>
              <p style={{ fontSize: 13, color: "var(--sr-text-muted)", maxWidth: 280, lineHeight: 1.5, margin: 0 }}>
                Tap any room card above to review and edit its items.
              </p>
            </>
          )}
        </div>
      )}

      {/* Mobile sticky CTA bar — shows above tab bar */}
      {isMobile && summary && totalItems > 0 && (
        <MobileStickyPublish
          status={status ?? ""}
          isLive={isLive}
          totalValue={totalValue}
          uncategorisedCount={uncategorisedCount}
          emailVerified={user?.emailVerified ?? true}
          isPublishing={publishMutation.isPending}
          isUnpublishing={unpublishMutation.isPending}
          onPublish={(payload) => publishMutation.mutate(payload)}
          onUnpublish={() => unpublishMutation.mutate()}
        />
      )}

      {/* Publish bar — desktop only */}
      {!isMobile && summary && totalItems > 0 && (
        <div style={{ background: "var(--sr-bg-card)", border: "1px solid var(--clay-200)", borderRadius: "var(--sr-radius-lg)", padding: "20px 24px", marginTop: 24, boxShadow: "0 2px 0 var(--clay-100)" }}>
          {uncategorisedCount > 0 && !isLive && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", marginBottom: 14, borderRadius: "var(--sr-radius-sm)", background: "var(--honey-50)", border: "1px solid var(--honey-200)", fontSize: 12, color: "var(--honey-700)" }}>
              <span style={{ fontWeight: 700 }}>⚠</span>
              {uncategorisedCount} item{uncategorisedCount > 1 ? "s" : ""} missing a category — open each item card and set a category before publishing.
            </div>
          )}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)", letterSpacing: "-0.01em" }}>
                {isLive ? "Currently live" : "Ready to publish"}
              </div>
              <div style={{ fontSize: 13, color: "var(--sr-text-secondary)", marginTop: 2 }}>
                {isLive ? "Sale is visible on the marketplace." : "All bundles reviewed - publish to the marketplace."}
              </div>
            </div>
            <div className="flex flex-col items-stretch gap-3 w-full sm:flex-row sm:items-center sm:gap-4 sm:w-auto">
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, minWidth: 0, flexWrap: "wrap" }}>
                <em style={{ fontFamily: "var(--sr-font-serif)", fontSize: 30, fontWeight: 500, color: "var(--clay-600)", letterSpacing: "-0.02em", fontStyle: "italic", overflowWrap: "anywhere" }}>
                  {formatAUD(totalValue)}
                </em>
                <span style={{ fontSize: 13, color: "var(--sr-text-muted)" }}>total listing value</span>
              </div>
              <InventoryActions
                status={status ?? ""}
                isLive={isLive}
                isPublishing={publishMutation.isPending}
                isUnpublishing={unpublishMutation.isPending}
                isArchiving={archiveMutation.isPending}
                emailVerified={user?.emailVerified ?? true}
                uncategorisedCount={uncategorisedCount}
                onPublish={(payload) => publishMutation.mutate(payload)}
                onUnpublish={() => unpublishMutation.mutate()}
                onArchive={() => archiveMutation.mutate()}
              />
            </div>
          </div>
        </div>
      )}

      {/* Add Item Drawer */}
      {summary?.bundles && (
        <AddItemDrawer
          eventId={eventId}
          bundles={summary.bundles}
          defaultBundleId={addItemDrawerBundleId ?? (summary.bundles[0]?.id ?? "")}
          open={!!addItemDrawerBundleId}
          onClose={() => setAddItemDrawerBundleId(null)}
        />
      )}

      {/* Bundle delete confirm dialog */}
      {bundleDeleteConfirm && selectedBundle && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(20,17,13,0.55)", display: "flex", alignItems: "center", justifyContent: "center" }}
          onClick={() => setBundleDeleteConfirm(false)}
        >
          <div
            role="dialog"
            aria-modal
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#FFFDF8", borderRadius: "var(--sr-radius-lg)", padding: "28px 32px", maxWidth: 360, width: "90%", fontFamily: "var(--sr-font-sans)" }}
          >
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 500, color: "var(--ink-800)", marginBottom: 8 }}>Delete bundle?</div>
            <p style={{ fontSize: 13, color: "var(--sr-text-secondary)", lineHeight: 1.5, margin: "0 0 22px" }}>
              &ldquo;{selectedBundle.name}&rdquo; and its {plural(selectedBundle.items.length, "item")} will be permanently removed.
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button
                onClick={() => setBundleDeleteConfirm(false)}
                style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: "transparent", fontSize: 13, cursor: "pointer", color: "var(--sr-text-primary)" }}
              >
                Cancel
              </button>
              <button
                onClick={() => { delBundleMutation.mutate(selectedBundle.id); setBundleDeleteConfirm(false); }}
                style={{ padding: "8px 16px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--rust-200)", background: "var(--rust-500)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
