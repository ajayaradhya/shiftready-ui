"use client";

import { useState } from "react";
import { FolderOpen, Shield, Video } from "lucide-react";
import Link from "next/link";
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
      <StepHeader stepActive={0} stepLabel="Add items" />

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
            Point your camera at each item - AI does the rest.
          </p>
        </div>

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

        {/* PRIMARY: Live Capture */}
        {!isUploading && (
          <Link
            href="/seller-central/capture"
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 18,
              padding: "40px 24px",
              background: "linear-gradient(160deg, var(--clay-50) 0%, var(--sr-bg-card) 70%)",
              border: "2px solid var(--clay-300)",
              borderRadius: "var(--sr-radius-xl)",
              textDecoration: "none",
              transition: "all 160ms",
            }}
          >
            <div style={{
              width: 80, height: 80, borderRadius: 24,
              background: "var(--clay-100)", color: "var(--clay-600)",
              display: "grid", placeItems: "center",
              boxShadow: "inset 0 0 0 1px var(--clay-200)",
            }}>
              <Video size={36} strokeWidth={1.5} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, color: "var(--ink-800)", marginBottom: 6 }}>
                Live Capture
              </div>
              <div style={{ fontSize: 14, color: "var(--sr-text-secondary)", lineHeight: 1.5 }}>
                Walk through your home with the camera. AI identifies each item in real-time.
              </div>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                marginTop: 14, padding: "10px 22px",
                background: "var(--clay-500)", color: "white",
                borderRadius: "var(--sr-radius-md)",
                fontSize: 14, fontWeight: 600,
              }}>
                <Video size={15} strokeWidth={1.7} />
                Start capturing →
              </div>
            </div>
          </Link>
        )}

        {/* Upload progress state */}
        {isUploading && (
          <div style={{
            height: 280,
            background: "var(--sr-bg-card)",
            border: "2px solid var(--clay-500)",
            borderRadius: "var(--sr-radius-xl)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 20, padding: "0 24px",
          }}>
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
            <div style={{ width: "100%", height: 4, background: "var(--cream-200)", borderRadius: 2, overflow: "hidden" }}>
              <div style={{
                height: "100%", background: "var(--clay-500)", borderRadius: 2,
                width: `${uploadProgress}%`, transition: "width 300ms ease",
              }} />
            </div>
          </div>
        )}

        {/* SECONDARY: Video upload fallback */}
        {!isUploading && (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 12, marginBottom: 16,
              color: "var(--sr-text-muted)", fontSize: 13,
            }}>
              <span style={{ flex: 1, height: 1, background: "var(--cream-300)" }} />
              or upload a pre-recorded video
              <span style={{ flex: 1, height: 1, background: "var(--cream-300)" }} />
            </div>

            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              style={{
                padding: "28px 24px",
                background: dragOver ? "var(--clay-50)" : "var(--sr-bg-card)",
                border: `1.5px dashed ${dragOver ? "var(--clay-500)" : "var(--cream-400)"}`,
                borderRadius: "var(--sr-radius-xl)",
                display: "flex", flexDirection: "column",
                alignItems: "center", gap: 10,
                transition: "all 160ms",
              }}
            >
              <div style={{ fontSize: 13, color: "var(--sr-text-secondary)" }}>
                Drag a video here, or
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
                  display: "inline-flex", alignItems: "center", gap: 7,
                  padding: "10px 18px",
                  background: "var(--sr-bg-card)", color: "var(--sr-text-primary)",
                  border: "1px solid var(--sr-border-default)",
                  borderRadius: "var(--sr-radius-md)",
                  fontSize: 13, fontWeight: 500, cursor: "pointer",
                  boxShadow: "0 1px 2px rgba(74,37,25,0.04)",
                }}>
                  <FolderOpen size={13} strokeWidth={1.7} />
                  Choose file
                </div>
              </label>
              <div style={{ fontSize: 12, color: "var(--sr-text-muted)" }}>
                MP4 · MOV · AVI · Max 2 GB · Min 30 sec
              </div>
            </div>
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
