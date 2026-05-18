"use client";

import { useRef, useState } from "react";
import { Camera, Plus, X, Star } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import type { InventoryImage } from "@/lib/types";
import {
  getItemImageUploadUrls,
  confirmItemImages,
  deleteItemImage,
  setItemImageCover,
  reorderItemImages,
} from "@/lib/api";

const MAX_TOTAL = 8;
const THUMB_COUNT = 3;

interface ItemPhotoStripProps {
  eventId: string;
  bundleId: string;
  itemId: string;
  images: InventoryImage[];
}

export function ItemPhotoStrip({ eventId, bundleId, itemId, images }: ItemPhotoStripProps) {
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [coveringId, setCoveringId] = useState<string | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const dragSrcId = useRef<string | null>(null);

  const sorted = [...images].sort((a, b) => (b.is_cover ? 1 : 0) - (a.is_cover ? 1 : 0));
  const cover = sorted[0] ?? null;
  const thumbs = sorted.slice(1, 1 + THUMB_COUNT);
  const overflow = Math.max(0, sorted.length - 1 - THUMB_COUNT);
  const canAddMore = sorted.length < MAX_TOTAL;

  const refresh = () => qc.invalidateQueries({ queryKey: ["summary", eventId] });

  async function handleFiles(files: FileList) {
    if (!files.length) return;
    const allowed = Array.from(files).slice(0, MAX_TOTAL - sorted.length);
    if (!allowed.length) return;
    setUploading(true);
    try {
      const filesMeta = allowed.map((f) => ({
        filename: f.name,
        content_type: f.type || "image/jpeg",
      }));
      const { urls } = await getItemImageUploadUrls(eventId, bundleId, itemId, filesMeta);
      await Promise.all(
        urls.map((u, i) =>
          fetch(u.upload_url, {
            method: "PUT",
            headers: { "Content-Type": allowed[i].type || "image/jpeg" },
            body: allowed[i],
          })
        )
      );
      await confirmItemImages(
        eventId,
        bundleId,
        itemId,
        urls.map((u) => ({ image_id: u.image_id, gcs_path: u.gcs_path }))
      );
      await refresh();
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(imageId: string) {
    setDeletingId(imageId);
    try {
      await deleteItemImage(eventId, bundleId, itemId, imageId);
      await refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleSetCover(imageId: string) {
    setCoveringId(imageId);
    try {
      await setItemImageCover(eventId, bundleId, itemId, imageId);
      await refresh();
    } finally {
      setCoveringId(null);
    }
  }

  const openLightbox = (idx: number) => setLightboxIdx(idx);

  function handleDragStart(id: string) {
    dragSrcId.current = id;
  }

  async function handleDrop(targetId: string) {
    setDragOverId(null);
    const srcId = dragSrcId.current;
    if (!srcId || srcId === targetId) return;
    const srcIdx = sorted.findIndex((img) => img.id === srcId);
    const tgtIdx = sorted.findIndex((img) => img.id === targetId);
    if (srcIdx === -1 || tgtIdx === -1) return;
    const reordered = [...sorted];
    const [moved] = reordered.splice(srcIdx, 1);
    reordered.splice(tgtIdx, 0, moved);
    await reorderItemImages(eventId, bundleId, itemId, reordered.map((img) => img.id));
    await refresh();
  }

  if (sorted.length === 0) {
    return (
      <div
        style={{
          margin: "-20px -22px 16px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          padding: "20px 22px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          background: "var(--cream-50)",
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: "var(--sr-radius-lg)",
            background: "var(--cream-100)",
            border: "1px solid var(--sr-border-subtle)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <Camera size={16} strokeWidth={1.5} style={{ color: "var(--ink-300)" }} />
        </div>
        <span
          style={{
            flex: 1,
            fontSize: 12,
            color: "var(--sr-text-muted)",
            lineHeight: 1.4,
          }}
        >
          Add photos to improve buyer confidence
        </span>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          style={{
            padding: "6px 14px",
            borderRadius: "var(--sr-radius-full)",
            border: "1px solid var(--clay-300)",
            background: "var(--clay-50)",
            color: "var(--clay-700)",
            fontFamily: "var(--sr-font-sans)",
            fontSize: 12,
            fontWeight: 600,
            cursor: uploading ? "default" : "pointer",
            opacity: uploading ? 0.6 : 1,
            whiteSpace: "nowrap",
          }}
        >
          {uploading ? "Uploading…" : "+ Add photos"}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    );
  }

  return (
    <>
      <div
        style={{
          margin: "-20px -22px 16px",
          borderBottom: "1px solid var(--sr-border-subtle)",
          padding: "12px 14px",
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          background: "var(--cream-50)",
          overflowX: "auto",
        }}
      >
        {/* Cover image */}
        {cover && (
          <PhotoTile
            image={cover}
            width={148}
            height={108}
            showCoverBadge
            isDeleting={deletingId === cover.id}
            isCovering={coveringId === cover.id}
            isDragOver={dragOverId === cover.id}
            onDelete={() => handleDelete(cover.id)}
            onSetCover={() => handleSetCover(cover.id)}
            onClick={() => openLightbox(0)}
            onDragStart={() => handleDragStart(cover.id)}
            onDragOver={() => setDragOverId(cover.id)}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(cover.id)}
          />
        )}

        {/* Thumbnails */}
        {thumbs.map((img, i) => (
          <PhotoTile
            key={img.id}
            image={img}
            width={64}
            height={64}
            isDeleting={deletingId === img.id}
            isCovering={coveringId === img.id}
            isDragOver={dragOverId === img.id}
            onDelete={() => handleDelete(img.id)}
            onSetCover={() => handleSetCover(img.id)}
            onClick={() => openLightbox(i + 1)}
            onDragStart={() => handleDragStart(img.id)}
            onDragOver={() => setDragOverId(img.id)}
            onDragLeave={() => setDragOverId(null)}
            onDrop={() => handleDrop(img.id)}
          />
        ))}

        {/* Overflow chip */}
        {overflow > 0 && (
          <button
            onClick={() => openLightbox(1 + THUMB_COUNT)}
            style={{
              width: 64,
              height: 64,
              borderRadius: "var(--sr-radius-md)",
              border: "1px solid var(--sr-border-subtle)",
              background: "var(--cream-100)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              flexShrink: 0,
              fontFamily: "var(--sr-font-sans)",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--ink-500)",
            }}
          >
            +{overflow}
          </button>
        )}

        {/* Dashed add button */}
        {canAddMore && (
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            style={{
              width: 64,
              height: 64,
              borderRadius: "var(--sr-radius-md)",
              border: "1.5px dashed var(--clay-200)",
              background: "transparent",
              display: "grid",
              placeItems: "center",
              cursor: uploading ? "default" : "pointer",
              flexShrink: 0,
              opacity: uploading ? 0.5 : 1,
              transition: "border-color 120ms, background 120ms",
            }}
            onMouseEnter={(e) => {
              if (!uploading) {
                (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-400)";
                (e.currentTarget as HTMLElement).style.background = "var(--clay-50)";
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "var(--clay-200)";
              (e.currentTarget as HTMLElement).style.background = "transparent";
            }}
          >
            <Plus size={16} strokeWidth={1.5} style={{ color: "var(--clay-400)" }} />
          </button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          style={{ display: "none" }}
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <ItemLightbox
          images={sorted}
          initialIdx={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
          onDelete={handleDelete}
          onSetCover={handleSetCover}
          deletingId={deletingId}
          coveringId={coveringId}
        />
      )}
    </>
  );
}

function Spinner({ color = "var(--clay-500)" }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 11,
        height: 11,
        borderRadius: "50%",
        border: `1.5px solid transparent`,
        borderTopColor: color,
        borderRightColor: color,
        animation: "spin 0.7s linear infinite",
        flexShrink: 0,
      }}
    />
  );
}

interface PhotoTileProps {
  image: InventoryImage;
  width: number;
  height: number;
  showCoverBadge?: boolean;
  isDeleting?: boolean;
  isCovering?: boolean;
  isDragOver?: boolean;
  onDelete: () => void;
  onSetCover: () => void;
  onClick: () => void;
  onDragStart: () => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onDrop: () => void;
}

function PhotoTile({ image, width, height, showCoverBadge, isDeleting, isCovering, isDragOver, onDelete, onSetCover, onClick, onDragStart, onDragOver, onDragLeave, onDrop }: PhotoTileProps) {
  const [hovered, setHovered] = useState(false);
  const busy = isDeleting || isCovering;

  return (
    <div
      draggable={!busy}
      style={{
        position: "relative",
        width,
        height,
        borderRadius: "var(--sr-radius-md)",
        overflow: "hidden",
        flexShrink: 0,
        cursor: busy ? "default" : "grab",
        outline: isDragOver ? "2px solid var(--clay-400)" : "none",
        outlineOffset: 2,
        transition: "outline 80ms",
        opacity: isDragOver ? 0.7 : 1,
      }}
      onMouseEnter={() => !busy && setHovered(true)}
      onMouseLeave={() => { setHovered(false); onDragLeave(); }}
      onDragStart={onDragStart}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
      onDrop={(e) => { e.preventDefault(); onDrop(); }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={image.url ?? "/item-placeholder.svg"}
        alt=""
        onClick={busy ? undefined : onClick}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", opacity: busy ? 0.5 : 1, transition: "opacity 150ms" }}
      />

      {/* Cover badge */}
      {showCoverBadge && !busy && (
        <span
          style={{
            position: "absolute",
            bottom: 6,
            left: 6,
            padding: "2px 7px",
            borderRadius: "var(--sr-radius-sm)",
            background: "rgba(255,255,255,0.88)",
            backdropFilter: "blur(4px)",
            fontFamily: "var(--sr-font-mono)",
            fontSize: 9,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            color: "var(--clay-700)",
          }}
        >
          Cover
        </span>
      )}

      {/* Loading overlay */}
      {busy && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(250,248,245,0.7)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "50%",
              border: "2px solid var(--clay-200)",
              borderTopColor: "var(--clay-500)",
              animation: "spin 0.7s linear infinite",
            }}
          />
        </div>
      )}

      {/* Hover overlay with actions */}
      {hovered && !busy && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(20,17,13,0.45)",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            justifyContent: "space-between",
            padding: 5,
          }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            aria-label="Remove photo"
            style={{
              width: 22,
              height: 22,
              borderRadius: "50%",
              border: "none",
              background: "rgba(255,255,255,0.9)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
            }}
          >
            <X size={11} strokeWidth={2} style={{ color: "var(--ink-700)" }} />
          </button>
          {!showCoverBadge && (
            <button
              onClick={(e) => { e.stopPropagation(); onSetCover(); }}
              aria-label="Set as cover"
              style={{
                padding: "2px 7px",
                borderRadius: "var(--sr-radius-sm)",
                border: "none",
                background: "rgba(255,255,255,0.9)",
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "var(--clay-700)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Star size={9} fill="currentColor" />
              Cover
            </button>
          )}
        </div>
      )}
    </div>
  );
}

interface LightboxProps {
  images: InventoryImage[];
  initialIdx: number;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  onSetCover: (id: string) => Promise<void>;
  deletingId: string | null;
  coveringId: string | null;
}

function ItemLightbox({ images, initialIdx, onClose, onDelete, onSetCover, deletingId, coveringId }: LightboxProps) {
  const [idx, setIdx] = useState(Math.min(initialIdx, images.length - 1));
  const current = images[idx];
  const isBusy = !!(deletingId || coveringId);

  function prev() { if (!isBusy) setIdx((i) => Math.max(0, i - 1)); }
  function next() { if (!isBusy) setIdx((i) => Math.min(images.length - 1, i + 1)); }

  if (!current) return null;

  return (
    <div
      role="dialog"
      aria-modal
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(20,17,13,0.94)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Toolbar */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 20px",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 11, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {idx + 1} / {images.length}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          {!current.is_cover && (
            <button
              onClick={() => !isBusy && onSetCover(current.id)}
              disabled={isBusy}
              style={{
                padding: "5px 12px",
                borderRadius: "var(--sr-radius-sm)",
                border: "1px solid rgba(255,255,255,0.2)",
                background: "transparent",
                color: "#fff",
                fontFamily: "var(--sr-font-sans)",
                fontSize: 12,
                cursor: isBusy ? "default" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: 5,
                opacity: isBusy ? 0.5 : 1,
              }}
            >
              {coveringId === current.id ? <Spinner /> : <Star size={11} strokeWidth={1.5} />}
              {coveringId === current.id ? "Setting…" : "Set as cover"}
            </button>
          )}
          <button
            onClick={() => { if (!isBusy) { onDelete(current.id); if (idx >= images.length - 1) setIdx(Math.max(0, idx - 1)); } }}
            disabled={isBusy}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--sr-radius-sm)",
              border: "1px solid rgba(220,80,60,0.4)",
              background: "transparent",
              color: "rgba(220,120,100,1)",
              fontFamily: "var(--sr-font-sans)",
              fontSize: 12,
              cursor: isBusy ? "default" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 5,
              opacity: isBusy ? 0.5 : 1,
            }}
          >
            {deletingId === current.id ? <Spinner color="rgba(220,120,100,1)" /> : null}
            {deletingId === current.id ? "Removing…" : "Remove"}
          </button>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.2)",
              background: "transparent",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={14} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Main image */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, padding: "0 48px", position: "relative" }}
      >
        {idx > 0 && (
          <button onClick={prev} style={{ ...arrowStyle, left: 4 }}>‹</button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url ?? "/item-placeholder.svg"}
          alt=""
          style={{ maxWidth: "100%", maxHeight: "calc(100vh - 180px)", objectFit: "contain", borderRadius: "var(--sr-radius-lg)" }}
        />
        {idx < images.length - 1 && (
          <button onClick={next} style={{ ...arrowStyle, right: 4 }}>›</button>
        )}
      </div>

      {/* Thumbnail strip */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ display: "flex", gap: 8, padding: "12px 20px", justifyContent: "center", overflowX: "auto" }}
      >
        {images.map((img, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={img.id}
            src={img.url ?? "/item-placeholder.svg"}
            alt=""
            onClick={() => setIdx(i)}
            style={{
              width: 52,
              height: 52,
              objectFit: "cover",
              borderRadius: "var(--sr-radius-sm)",
              cursor: "pointer",
              border: i === idx ? "2px solid var(--clay-400)" : "2px solid transparent",
              opacity: i === idx ? 1 : 0.55,
              flexShrink: 0,
              transition: "opacity 120ms, border-color 120ms",
            }}
          />
        ))}
      </div>
    </div>
  );
}

const arrowStyle: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  transform: "translateY(-50%)",
  width: 40,
  height: 40,
  borderRadius: "50%",
  border: "1px solid rgba(255,255,255,0.2)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  fontSize: 22,
  display: "grid",
  placeItems: "center",
  cursor: "pointer",
};
