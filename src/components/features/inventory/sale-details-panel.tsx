"use client";

import { useState, useRef } from "react";
import { ChevronDown, ImagePlus, X, Upload } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  updateSale,
  getCoverUploadUrl,
  confirmCover,
  deleteCover,
  type SaleUpdatePayload,
} from "@/lib/api";
import type { SaleSummary } from "@/lib/types";

interface Props {
  eventId: string;
  summary: SaleSummary;
  isEditable: boolean;
}

export function SaleDetailsPanel({ eventId, summary, isEditable }: Props) {
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(summary.title ?? "");
  const [description, setDescription] = useState(summary.description ?? "");
  const [streetAddress, setStreetAddress] = useState(summary.streetAddress ?? "");
  const [suburb, setSuburb] = useState(summary.suburb ?? "");
  const [pincode, setPincode] = useState(summary.pincode ?? "");
  const [state, setState] = useState(summary.state ?? "NSW");
  const [moveOutDate, setMoveOutDate] = useState(summary.moveOutDate ?? "");
  const [coverUploading, setCoverUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["summary", eventId] });

  const patchMutation = useMutation({
    mutationFn: (patch: SaleUpdatePayload) => updateSale(eventId, patch),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Failed to save changes"),
  });

  const delCoverMutation = useMutation({
    mutationFn: () => deleteCover(eventId),
    onSuccess: () => invalidate(),
    onError: () => toast.error("Failed to remove cover"),
  });

  function handleBlur(field: keyof SaleUpdatePayload, value: string) {
    if (!isEditable) return;
    const original: string =
      field === "title" ? (summary.title ?? "")
      : field === "description" ? (summary.description ?? "")
      : field === "street_address" ? (summary.streetAddress ?? "")
      : field === "suburb" ? (summary.suburb ?? "")
      : field === "pincode" ? (summary.pincode ?? "")
      : field === "state" ? (summary.state ?? "NSW")
      : field === "move_out_date" ? (summary.moveOutDate ?? "")
      : "";
    if (value.trim() !== original.trim()) {
      patchMutation.mutate({ [field]: value.trim() || undefined });
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const { image_id, upload_url, gcs_path } = await getCoverUploadUrl(eventId);
      await fetch(upload_url, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": "image/jpeg" },
      });
      await confirmCover(eventId, image_id, gcs_path);
      invalidate();
      toast.success("Cover updated");
    } catch {
      toast.error("Cover upload failed");
    } finally {
      setCoverUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const coverUrl = summary.coverImage?.url;
  const displaySubtitle = [summary.suburb, summary.state].filter(Boolean).join(", ");

  return (
    <div
      style={{
        background: "var(--sr-bg-card)",
        border: "1px solid var(--sr-border-subtle)",
        borderRadius: "var(--sr-radius-md)",
        marginBottom: 20,
        overflow: "hidden",
      }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((p) => !p)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 18px",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
          {/* Cover thumbnail */}
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="cover"
              style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", flexShrink: 0, border: "1px solid var(--sr-border-subtle)" }}
            />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 6, background: "var(--cream-200)", display: "grid", placeItems: "center", flexShrink: 0 }}>
              <ImagePlus size={16} color="var(--ink-400)" strokeWidth={1.5} />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 14, fontWeight: 500, color: "var(--ink-800)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {summary.title || <span style={{ color: "var(--sr-text-muted)", fontStyle: "italic" }}>No title set</span>}
            </div>
            <div style={{ fontSize: 12, color: "var(--sr-text-muted)", marginTop: 1 }}>
              Sale details{displaySubtitle ? ` · ${displaySubtitle}` : ""}
            </div>
          </div>
        </div>
        <ChevronDown
          size={16}
          color="var(--ink-400)"
          style={{ flexShrink: 0, transition: "transform 200ms", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>

      {/* Expanded body */}
      {expanded && (
        <div style={{ padding: "0 18px 18px", display: "flex", flexDirection: "column", gap: 16, borderTop: "1px solid var(--sr-border-subtle)" }}>
          <div style={{ paddingTop: 16, display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Cover image column */}
            <div style={{ flexShrink: 0 }}>
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: 8,
                  overflow: "hidden",
                  border: "1.5px dashed var(--cream-400)",
                  background: "var(--cream-100)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  cursor: isEditable ? "pointer" : "default",
                }}
                onClick={() => isEditable && fileInputRef.current?.click()}
              >
                {coverUrl ? (
                  <>
                    <img src={coverUrl} alt="cover" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    {isEditable && (
                      <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.35)", display: "flex", alignItems: "center", justifyContent: "center", opacity: 0, transition: "opacity 150ms" }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0"; }}
                      >
                        <Upload size={18} color="#fff" />
                      </div>
                    )}
                  </>
                ) : coverUploading ? (
                  <div style={{ width: 20, height: 20, border: "2px solid var(--clay-300)", borderTopColor: "var(--clay-600)", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
                ) : (
                  <>
                    <ImagePlus size={20} color="var(--ink-400)" strokeWidth={1.5} />
                    {isEditable && <span style={{ fontSize: 10, color: "var(--ink-400)", marginTop: 4 }}>Add cover</span>}
                  </>
                )}
              </div>
              {coverUrl && isEditable && (
                <button
                  onClick={() => delCoverMutation.mutate()}
                  style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 3, fontSize: 11, color: "var(--rust-500)", border: "none", background: "none", cursor: "pointer", padding: 0 }}
                >
                  <X size={10} /> Remove
                </button>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleCoverUpload} />
            </div>

            {/* Title + Description */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Title</label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={(e) => handleBlur("title", e.target.value)}
                  disabled={!isEditable}
                  maxLength={80}
                  placeholder="e.g. Surry Hills apartment clearance"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: isEditable ? "var(--cream-50)" : "transparent", fontSize: 13, color: "var(--ink-800)", outline: "none", fontFamily: "var(--sr-font-sans)" }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-400)"; }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onBlur={(e) => handleBlur("description", e.target.value)}
                  disabled={!isEditable}
                  maxLength={1000}
                  rows={2}
                  placeholder="Tell buyers about the sale…"
                  style={{ width: "100%", padding: "8px 10px", borderRadius: "var(--sr-radius-sm)", border: "1px solid var(--sr-border-subtle)", background: isEditable ? "var(--cream-50)" : "transparent", fontSize: 13, color: "var(--ink-800)", outline: "none", resize: "vertical", fontFamily: "var(--sr-font-sans)", lineHeight: 1.5 }}
                  onFocus={(e) => { (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-400)"; }}
                />
              </div>
            </div>
          </div>

          {/* Address + date row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 80px 80px", gap: 10 }}>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Street</label>
              <input
                value={streetAddress}
                onChange={(e) => setStreetAddress(e.target.value)}
                onBlur={(e) => handleBlur("street_address", e.target.value)}
                disabled={!isEditable}
                placeholder="123 King St"
                style={fieldStyle(isEditable)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Suburb</label>
              <input
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                onBlur={(e) => handleBlur("suburb", e.target.value)}
                disabled={!isEditable}
                placeholder="Surry Hills"
                style={fieldStyle(isEditable)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Postcode</label>
              <input
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                onBlur={(e) => handleBlur("pincode", e.target.value)}
                disabled={!isEditable}
                placeholder="2010"
                maxLength={4}
                style={fieldStyle(isEditable)}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>State</label>
              <input
                value={state}
                onChange={(e) => setState(e.target.value)}
                onBlur={(e) => handleBlur("state", e.target.value)}
                disabled={!isEditable}
                placeholder="NSW"
                maxLength={3}
                style={fieldStyle(isEditable)}
              />
            </div>
          </div>

          <div style={{ maxWidth: 200 }}>
            <label style={{ display: "block", fontSize: 11, fontWeight: 500, color: "var(--sr-text-muted)", marginBottom: 4, letterSpacing: "0.03em", textTransform: "uppercase" }}>Move-out date</label>
            <input
              type="date"
              value={moveOutDate}
              onChange={(e) => setMoveOutDate(e.target.value)}
              onBlur={(e) => handleBlur("move_out_date", e.target.value)}
              disabled={!isEditable}
              style={fieldStyle(isEditable)}
            />
          </div>

          {patchMutation.isPending && (
            <div style={{ fontSize: 11, color: "var(--sr-text-muted)" }}>Saving…</div>
          )}
        </div>
      )}
    </div>
  );
}

function fieldStyle(editable: boolean): React.CSSProperties {
  return {
    width: "100%",
    padding: "7px 10px",
    borderRadius: "var(--sr-radius-sm)",
    border: "1px solid var(--sr-border-subtle)",
    background: editable ? "var(--cream-50)" : "transparent",
    fontSize: 13,
    color: "var(--ink-800)",
    outline: "none",
    fontFamily: "var(--sr-font-sans)",
  };
}
