"use client";

import { useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import type { InventoryItem } from "@/lib/types";

interface VideoPanelProps {
  videoUrl?: string;
  items: InventoryItem[];
  activeItemId?: string;
  onSeek: (ts: number) => void;
  eventId?: string;
  isEditable?: boolean;
  onReplaceVideo?: () => void;
}

export function VideoPanel({ videoUrl, items, activeItemId, onSeek, isEditable, onReplaceVideo }: VideoPanelProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handleSeek = (ts: number) => {
    onSeek(ts);
    const v = videoRef.current;
    if (v) {
      v.currentTime = ts;
      v.play().catch(() => {});
      setPlaying(true);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setPlaying(true);
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  return (
    <div
      style={{
        width: 320,
        flexShrink: 0,
        borderRight: "1px solid var(--sr-border-subtle)",
        padding: "24px 20px",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        background: "var(--sr-bg-card)",
        overflowY: "auto",
      }}
      className="custom-scrollbar"
    >
      {/* Video preview */}
      <div
        style={{
          aspectRatio: "9/16",
          width: "100%",
          background: "linear-gradient(160deg, var(--ink-700) 0%, var(--ink-900) 100%)",
          borderRadius: "var(--sr-radius-lg)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
        }}
      >
        {videoUrl && (
          <video
            ref={videoRef}
            id="inventory-video"
            src={videoUrl}
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onEnded={() => setPlaying(false)}
          />
        )}

        {/* Play/pause button */}
        <button
          onClick={togglePlay}
          aria-label={playing ? "Pause video" : "Play video"}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 44,
            height: 44,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.18)",
            backdropFilter: "blur(8px)",
            color: "white",
            display: "grid",
            placeItems: "center",
            border: "1px solid rgba(255,255,255,0.28)",
            cursor: "pointer",
          }}
        >
          {playing ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" />}
        </button>
      </div>

      {/* Replace video button */}
      {isEditable && (videoUrl || onReplaceVideo) && (
        <div style={{ display: "flex", gap: 6 }}>
          {onReplaceVideo && (
            <button
              onClick={onReplaceVideo}
              style={{
                flex: 1,
                padding: "7px 10px",
                borderRadius: "var(--sr-radius-sm)",
                border: "1px solid var(--cream-300)",
                background: "transparent",
                fontSize: 11.5,
                fontWeight: 500,
                color: "var(--sr-text-secondary)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 5,
                transition: "all 120ms",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              Replace video
            </button>
          )}
        </div>
      )}

      {/* Seek list */}
      {items.length > 0 && (
        <div>
          <div
            style={{
              fontFamily: "var(--sr-font-mono)",
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.14em",
              color: "var(--sr-text-muted)",
              marginBottom: 5,
            }}
          >
            Seek to item
          </div>
          {items.map((item) => {
            const isCurrent = item.id === activeItemId;
            return (
              <button
                key={item.id}
                onClick={() => handleSeek(item.video_timestamp)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 10px",
                  borderRadius: "var(--sr-radius-sm)",
                  cursor: "pointer",
                  transition: "background 120ms",
                  fontSize: 12.5,
                  color: isCurrent ? "var(--clay-700)" : "var(--sr-text-secondary)",
                  border: "none",
                  background: isCurrent ? "var(--clay-50)" : "transparent",
                  textAlign: "left",
                  width: "100%",
                  overflow: "hidden",
                }}
                onMouseEnter={(e) => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
                    (e.currentTarget as HTMLElement).style.color = "var(--sr-text-primary)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isCurrent) {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--sr-text-secondary)";
                  }
                }}
              >
                <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12 }}>
                  {item.name}
                </span>
                {item.timestamp_label && (
                  <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, color: isCurrent ? "var(--clay-500)" : "var(--sr-text-muted)", flexShrink: 0 }}>
                    {item.timestamp_label}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
