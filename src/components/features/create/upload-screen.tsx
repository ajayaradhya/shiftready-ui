"use client";

import { useState } from "react";
import { FolderOpen, Shield, Video } from "lucide-react";
import Link from "next/link";
import { HowTo } from "./how-to";
import { StepHeader } from "./step-header";
import type { UploadStatus } from "@/hooks/use-upload";
import { ACCEPTED_VIDEO_TYPES } from "@/lib/constants";

interface Props {
  status: UploadStatus;
  uploadProgress: number;
  fileError: string | null;
  uploadFile: (file: File) => Promise<void>;
}

export function UploadScreen({ status, uploadProgress, fileError, uploadFile }: Props) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const isUploading = status === "uploading";

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div style={{ background: "var(--sr-bg-app)", minHeight: "100vh", fontFamily: "var(--sr-font-sans)" }}>
      <StepHeader stepActive={0} stepLabel="Upload video" />

      <div style={{ maxWidth: 720, width: "100%", margin: "0 auto", padding: "56px 16px 64px", display: "flex", flexDirection: "column", gap: 32 }}>

        {/* Heading */}
        <div style={{ textAlign: "center" }}>
          <h1 style={{
            fontFamily: "var(--sr-font-serif)", fontSize: 40, fontWeight: 500,
            letterSpacing: "-0.025em", lineHeight: 1.1, color: "var(--ink-800)",
            margin: "0 0 10px",
          }}>
            List your stuff in{" "}
            <em style={{ fontStyle: "italic", color: "var(--clay-600)", fontWeight: 500 }}>minutes</em>
          </h1>
          <p style={{ margin: 0, color: "var(--sr-text-secondary)", fontSize: 16, lineHeight: 1.55 }}>
            Film a walkthrough of your home — AI does the rest.
          </p>
        </div>

        <HowTo />

        {/* Error */}
        {fileError && (
          <div style={{
            padding: "12px 16px",
            background: "var(--rust-50)",
            border: "1px solid var(--rust-100)",
            borderRadius: "var(--sr-radius-md)",
            color: "var(--rust-500)",
            fontSize: 13,
          }}>
            {fileError}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            height: 380,
            background: dragOver
              ? "linear-gradient(180deg, var(--clay-50) 0%, var(--sr-bg-card) 60%)"
              : "var(--sr-bg-card)",
            border: `2px ${isUploading ? "solid" : "dashed"} ${dragOver || isUploading ? "var(--clay-500)" : "var(--cream-400)"}`,
            borderRadius: "var(--sr-radius-xl)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 14, transition: "all 160ms",
            position: "relative", overflow: "hidden",
          }}
        >
          {isUploading ? (
            /* Upload progress state */
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, width: "100%", padding: "0 24px" }}>
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: "var(--clay-50)", color: "var(--clay-600)",
                display: "grid", placeItems: "center",
                boxShadow: "inset 0 0 0 1px var(--clay-100)",
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 22V8M16 8l-5 5M16 8l5 5"/>
                  <path d="M5 20v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3"/>
                </svg>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, color: "var(--ink-800)", marginBottom: 6 }}>
                  Uploading…
                </div>
                <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 28, fontWeight: 500, color: "var(--clay-600)", letterSpacing: "-0.02em" }}>
                  {uploadProgress}%
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: "100%", height: 4, background: "var(--cream-200)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{
                  height: "100%", background: "var(--clay-500)", borderRadius: 2,
                  width: `${uploadProgress}%`, transition: "width 300ms ease",
                }} />
              </div>
            </div>
          ) : (
            /* Idle / drop state */
            <>
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: "var(--clay-50)", color: "var(--clay-600)",
                display: "grid", placeItems: "center",
                boxShadow: "inset 0 0 0 1px var(--clay-100)", marginBottom: 4,
              }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 22V8M16 8l-5 5M16 8l5 5"/>
                  <path d="M5 20v3a2 2 0 0 0 2 2h18a2 2 0 0 0 2-2v-3"/>
                </svg>
              </div>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 24, fontWeight: 500, letterSpacing: "-0.015em", color: "var(--ink-800)" }}>
                Drag your video here
              </div>
              <div style={{
                fontFamily: "var(--sr-font-mono)", fontSize: 11, color: "var(--sr-text-muted)",
                letterSpacing: "0.18em", textTransform: "uppercase",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <span style={{ width: 30, height: 1, background: "var(--cream-300)", display: "block" }} />
                or
                <span style={{ width: 30, height: 1, background: "var(--cream-300)", display: "block" }} />
              </div>
              <label style={{ cursor: "pointer" }}>
                <input
                  type="file"
                  accept={ACCEPTED_VIDEO_TYPES.join(",")}
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadFile(file);
                  }}
                />
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  padding: "12px 20px",
                  background: "var(--sr-bg-card)", color: "var(--sr-text-primary)",
                  border: "1px solid var(--sr-border-default)",
                  borderRadius: "var(--sr-radius-md)",
                  fontSize: 14, fontWeight: 500, cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(74,37,25,0.04)",
                  transition: "border-color 120ms",
                }}>
                  <FolderOpen size={14} strokeWidth={1.7} />
                  Choose file
                </div>
              </label>
              <div style={{ fontSize: 13, color: "var(--sr-text-muted)", marginTop: 4 }}>
                MP4 · MOV · AVI
                <span style={{ color: "var(--ink-200)", margin: "0 6px" }}>·</span>
                Max 2 GB
                <span style={{ color: "var(--ink-200)", margin: "0 6px" }}>·</span>
                Min 30 sec
              </div>
            </>
          )}
        </div>

        {/* Optional details */}
        {!isUploading && (
          <div>
            <button
              onClick={() => setDetailsOpen(o => !o)}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "14px 18px",
                border: "1px solid var(--sr-border-subtle)",
                borderRadius: detailsOpen ? "var(--sr-radius-md) var(--sr-radius-md) 0 0" : "var(--sr-radius-md)",
                background: "var(--sr-bg-card)", cursor: "pointer",
                fontSize: 14, color: "var(--sr-text-primary)", fontWeight: 500,
                textAlign: "left",
              }}
            >
              <span>
                Add details{" "}
                <span style={{ color: "var(--sr-text-muted)", fontWeight: 400, fontSize: 13 }}>(optional)</span>
              </span>
              <svg
                width="14" height="14" viewBox="0 0 14 14" fill="none"
                stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                style={{ transform: detailsOpen ? "rotate(180deg)" : "none", transition: "transform 160ms", color: "var(--sr-text-muted)" }}
              >
                <path d="m4 6 3 3 3-3"/>
              </svg>
            </button>
            {detailsOpen && (
              <div style={{
                padding: "18px 18px 6px",
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14,
                border: "1px solid var(--sr-border-subtle)", borderTop: "none",
                borderRadius: "0 0 var(--sr-radius-md) var(--sr-radius-md)",
                background: "var(--sr-bg-card)",
              }}>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--sr-text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                    Sale name
                  </label>
                  <input
                    placeholder="e.g. Surry Hills 3-bed clearance"
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: "1px solid var(--sr-border-subtle)",
                      borderRadius: "var(--sr-radius-md)",
                      fontSize: 14, color: "var(--sr-text-primary)",
                      background: "var(--sr-bg-card)", outline: "none",
                      fontFamily: "var(--sr-font-sans)",
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: 12, color: "var(--sr-text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                    Suburb
                  </label>
                  <input
                    placeholder="e.g. Surry Hills, NSW"
                    style={{
                      width: "100%", padding: "10px 12px",
                      border: "1px solid var(--sr-border-subtle)",
                      borderRadius: "var(--sr-radius-md)",
                      fontSize: 14, color: "var(--sr-text-primary)",
                      background: "var(--sr-bg-card)", outline: "none",
                      fontFamily: "var(--sr-font-sans)",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live capture shortcut */}
        {!isUploading && (
          <div style={{ textAlign: "center" }}>
            <Link
              href="/seller-central/live-stream"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 7,
                padding: "10px 20px",
                borderRadius: "var(--sr-radius-md)",
                border: "1px solid var(--clay-200)",
                background: "var(--clay-50)",
                color: "var(--clay-700)",
                fontSize: 13,
                fontWeight: 500,
                textDecoration: "none",
                fontFamily: "var(--sr-font-sans)",
                transition: "all 120ms",
              }}
            >
              <Video size={14} strokeWidth={1.75} />
              Try Live Capture instead
              <span style={{
                fontFamily: "var(--sr-font-mono)",
                fontSize: 9,
                textTransform: "uppercase",
                letterSpacing: "0.12em",
                color: "var(--clay-400)",
                padding: "2px 6px",
                border: "1px solid var(--clay-200)",
                borderRadius: 100,
              }}>
                Beta
              </span>
            </Link>
          </div>
        )}

        {/* Privacy footnote */}
        {!isUploading && (
          <div style={{
            textAlign: "center", color: "var(--sr-text-muted)", fontSize: 12.5,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}>
            <Shield size={14} style={{ color: "var(--moss-500)" }} strokeWidth={1.7} />
            Your video is private until you publish. We never share footage.
          </div>
        )}
      </div>
    </div>
  );
}
