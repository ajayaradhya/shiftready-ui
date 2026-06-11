"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { CaptureOverlay } from "@/components/features/capture/CaptureOverlay";
import { CaptureControls } from "@/components/features/capture/CaptureControls";
import { CaptureBucket } from "@/components/features/capture/CaptureBucket";
import { ItemReviewScreen } from "@/components/features/capture/ItemReviewScreen";
import { ProcessingScreen } from "@/components/features/create/processing-screen";
import { useSaleContext } from "@/lib/sale-context";
import { dataUrlToFile } from "@/lib/capture/capture-types";
import { initCaptureSale, captureFrame, finalizeCaptureV2 } from "@myrio/api";
import { useAuth } from "@/hooks/use-auth";
import type { CapturePageState, CapturedItem } from "@/lib/capture/capture-types";

const CaptureStage = dynamic(
  () =>
    import("@/components/features/capture/CaptureStage").then((m) => ({
      default: m.CaptureStage,
    })),
  { ssr: false }
);

function EmailVerificationRequired({ onResend }: { onResend: () => Promise<void> }) {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleResend = async () => {
    setSending(true);
    try {
      await onResend();
      setSent(true);
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", padding: "2rem", textAlign: "center", gap: "1rem" }}>
      <span style={{ fontSize: 48 }}>✉️</span>
      <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--clay-700)" }}>Verify your email first</h2>
      <p style={{ color: "var(--sr-text-muted)", maxWidth: 320, fontSize: 14, lineHeight: 1.6 }}>
        You need to verify your email address before you can start a capture session or create listings.
      </p>
      {sent ? (
        <p style={{ fontWeight: 600, color: "var(--moss-700)", fontSize: 14 }}>Verification email sent — check your inbox.</p>
      ) : (
        <button
          onClick={handleResend}
          disabled={sending}
          style={{ padding: "0.5rem 1.5rem", borderRadius: 8, background: "var(--clay-600)", color: "#fff", fontWeight: 700, fontSize: 14, border: "none", cursor: sending ? "not-allowed" : "pointer", opacity: sending ? 0.6 : 1 }}
        >
          {sending ? "Sending…" : "Resend verification email"}
        </button>
      )}
    </div>
  );
}

function CapturePageContent() {
  const router = useRouter();
  const { user, sendVerificationEmail } = useAuth();
  const searchParams = useSearchParams();
  const appendTo = searchParams.get("appendTo");
  const isDev = searchParams.get("dev") === "1";
  const { setSale } = useSaleContext();
  useEffect(() => { document.title = "Live Capture - Myrio"; }, []);

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<CapturedItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(appendTo ?? null);
  const [toasts, setToasts] = useState<import("@/lib/capture/capture-types").CaptureToast[]>([]);
  const [saleTitle, setSaleTitle] = useState("");

  // Dev-panel display state (refs can't be read during render)
  const [networkErrorTotal, setNetworkErrorTotal] = useState(0);
  const [debugElapsed, setDebugElapsed] = useState<number | null>(null);

  // Undo-last state
  const [undoItemId, setUndoItemId] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eventIdRef = useRef<string | null>(appendTo ?? null);
  const confirmedItemsRef = useRef<CapturedItem[]>([]);
  const itemCountRef = useRef(0);
  const captureStartTimeRef = useRef<number | null>(null);
  const networkErrorTotalRef = useRef(0);

  useEffect(() => { eventIdRef.current = eventId; }, [eventId]);
  useEffect(() => {
    confirmedItemsRef.current = confirmedItems;
    itemCountRef.current = confirmedItems.length;
  }, [confirmedItems]);

  useEffect(() => {
    setSale({ label: "New Capture", name: "Live Capture" });
    return () => setSale(null);
  }, [setSale]);

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const initSaleOnce = useCallback(async () => {
    if (eventIdRef.current) return;
    try {
      const { event_id } = await initCaptureSale();
      setEventId(event_id);
      eventIdRef.current = event_id;
    } catch {
      // Will retry on next tap or at finalize
    }
  }, []);

  const handleGranted = useCallback((s: MediaStream) => {
    setStream(s);
    setPageState("capturing");
    captureStartTimeRef.current = Date.now();
    // Camera revoke detection — if track ends mid-session, return to gate; items preserved
    s.getVideoTracks().forEach((track) => {
      track.addEventListener("ended", () => {
        setStream(null);
        setPageState("gate");
      });
    });
    // Sale created on first tap, not here — avoids orphan sales if user bails
  }, []);

  const addToast = useCallback((label: string, displayLabel?: string) => {
    const toastId = `${label}-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, label, displayLabel }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 2500);
  }, []);

  // Kick off per-frame Gemini call, update item on completion
  const runCaptureFrame = useCallback(async (itemId: string, frameSrc: string) => {
    // Wait for sale init if first tap — eventIdRef may not be set yet
    if (!eventIdRef.current) {
      await initSaleOnce();
    }
    const eid = eventIdRef.current;
    if (!eid) {
      setConfirmedItems((prev) =>
        prev.map((i) => i.id === itemId ? { ...i, isLoading: false, network_error: true } : i)
      );
      return;
    }
    try {
      const file = await dataUrlToFile(frameSrc, `frame_${itemId}.jpg`);
      const result = await captureFrame(eid, file);
      setConfirmedItems((prev) =>
        prev.map((i) => {
          if (i.id !== itemId) return i;
          return {
            ...i,
            // Never overwrite a name the user has already typed
            name: i.nameSource === "user" ? i.name : result.name,
            brand: i.nameSource === "user" ? i.brand : (result.brand ?? undefined),
            predicted_original_price: result.predicted_original_price,
            gcs_uri: result.gcs_uri,
            isLoading: false,
            error: undefined,
            network_error: false,
            nameSource: i.nameSource === "user" ? "user" : "ai",
            confidence: result.confidence,
          };
        })
      );
    } catch (err) {
      const isNetworkErr = err instanceof TypeError && err.message.includes("fetch");
      if (isNetworkErr) {
        networkErrorTotalRef.current += 1;
        setNetworkErrorTotal((n) => n + 1);
      }
      setConfirmedItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, isLoading: false, error: isNetworkErr ? undefined : "Could not identify", network_error: isNetworkErr }
            : i
        )
      );
    }
  }, [initSaleOnce]);

  const handleRetry = useCallback((id: string) => {
    const item = confirmedItemsRef.current.find((i) => i.id === id);
    if (!item) return;
    setConfirmedItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, isLoading: true, error: undefined, network_error: false } : i)
    );
    runCaptureFrame(id, item.frameSrc);
  }, [runCaptureFrame]);

  // Auto-retry network_error items when coming back online
  useEffect(() => {
    const handleOnline = () => {
      const networkErrorItems = confirmedItemsRef.current.filter((i) => i.network_error);
      for (const item of networkErrorItems) {
        handleRetry(item.id);
      }
    };
    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [handleRetry]);

  // Tick elapsed seconds for the dev analytics panel (avoids reading refs/Date.now in render)
  useEffect(() => {
    if (!isDev) return;
    const id = setInterval(() => {
      setDebugElapsed(
        captureStartTimeRef.current
          ? Math.round((Date.now() - captureStartTimeRef.current) / 1000)
          : null
      );
    }, 1000);
    return () => clearInterval(id);
  }, [isDev]);

  // Tap → immediately add item to bucket, Gemini runs in background
  const handleUserTap = useCallback((frameSrc: string) => {
    // Init sale on first tap (not at permission grant) to avoid orphan sales
    initSaleOnce();

    const itemId = crypto.randomUUID();
    const itemNumber = itemCountRef.current + 1;
    const provisionalLabel = `Item ${itemNumber}`;

    setConfirmedItems((prev) => [
      ...prev,
      { id: itemId, label: provisionalLabel, firstSeenAt: Date.now(), frameSrc, isLoading: true },
    ]);
    addToast(provisionalLabel, "Item captured");

    // Undo-last: show for 3s
    setUndoItemId(itemId);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoItemId(null), 3000);

    runCaptureFrame(itemId, frameSrc);
  }, [addToast, runCaptureFrame, initSaleOnce]);

  const handleUndo = useCallback(() => {
    if (!undoItemId) return;
    setConfirmedItems((prev) => prev.filter((i) => i.id !== undoItemId));
    setUndoItemId(null);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
  }, [undoItemId]);

  const handleFinish = () => {
    setPageState("reviewing");
    stream?.getTracks().forEach((t) => t.stop());
  };

  const handleRemoveById = useCallback((id: string) => {
    setConfirmedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleDuplicate = useCallback((id: string) => {
    const item = confirmedItemsRef.current.find((i) => i.id === id);
    if (!item) return;
    const newId = crypto.randomUUID();
    setConfirmedItems((prev) => {
      const idx = prev.findIndex((i) => i.id === id);
      const clone = { ...item, id: newId };
      const next = [...prev];
      next.splice(idx + 1, 0, clone);
      return next;
    });
  }, []);

  const handleUpdateItem = useCallback((id: string, updates: Partial<CapturedItem>) => {
    setConfirmedItems((prev) => prev.map((i) => i.id === id ? { ...i, ...updates } : i));
  }, []);

  const handleProcess = async () => {
    if (confirmedItems.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      let eid = eventIdRef.current;

      if (!eid) {
        const { event_id } = await initCaptureSale();
        eid = event_id;
        setEventId(event_id);
        eventIdRef.current = event_id;
      }

      // For items missing gcs_uri, upload frameSrc as fallback
      const preparedItems = await Promise.all(
        confirmedItems.map(async (item) => {
          if (item.gcs_uri) return item;
          // Upload frameSrc as fallback — best effort
          try {
            const file = await dataUrlToFile(item.frameSrc, `frame_${item.id}.jpg`);
            const result = await captureFrame(eid!, file);
            return { ...item, gcs_uri: result.gcs_uri, name: item.name ?? result.name, nameSource: item.nameSource ?? "ai" as const };
          } catch {
            return item; // will be needs_review
          }
        })
      );

      await finalizeCaptureV2(
        eid,
        preparedItems.map((i) => ({
          temp_id: i.id,
          name: i.name ?? "Unnamed item",
          brand: i.brand,
          predicted_original_price: i.predicted_original_price,
          gcs_uri: i.gcs_uri ?? "",
          needs_review: !i.name || !i.gcs_uri,
          name_source: i.nameSource ?? "ai",
        })),
        saleTitle.trim() || undefined
      );

      // P6: log capture session analytics at finalize
      if (isDev || process.env.NODE_ENV !== "production") {
        const allItems = confirmedItemsRef.current;
        const elapsed = captureStartTimeRef.current
          ? Math.round((Date.now() - captureStartTimeRef.current) / 1000)
          : 0;
        console.warn("Capture session analytics", {
          "Total items": allItems.length,
          "Identified (name+gcs_uri)": allItems.filter((i) => i.name && i.gcs_uri).length,
          "User-named overrides": allItems.filter((i) => i.nameSource === "user").length,
          "Low confidence": allItems.filter((i) => i.confidence === "low").length,
          "Needs review": allItems.filter((i) => !i.name || !i.gcs_uri).length,
          "Network errors (cumulative)": networkErrorTotalRef.current,
          "Identify success rate": allItems.length > 0
            ? `${Math.round((allItems.filter((i) => i.name && i.gcs_uri).length / allItems.length) * 100)}%`
            : "n/a",
          "Time to finalize (s)": elapsed,
        });
      }

      setProcessingEventId(eid);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const handleBackToCapture = () => {
    setPageState("capturing");
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => {
        setStream(s);
        // Resume analytics timer if not already set
        if (!captureStartTimeRef.current) captureStartTimeRef.current = Date.now();
        // Camera revoke detection for resumed stream
        s.getVideoTracks().forEach((track) => {
          track.addEventListener("ended", () => {
            setStream(null);
            setPageState("gate");
          });
        });
      })
      .catch(() => setPageState("gate"));
  };

  if (processingEventId) {
    return (
      <ProcessingScreen
        eventId={processingEventId}
        uploadedFile={null}
        mode="live"
        capturedItems={confirmedItems}
      />
    );
  }

  if (user && !user.emailVerified) {
    return <EmailVerificationRequired onResend={sendVerificationEmail} />;
  }

  return (
    <div style={{ fontFamily: "var(--sr-font-sans)", position: "relative" }}>
      {pageState === "gate" && <CapturePermissionsGate onGranted={handleGranted} />}

      {pageState === "capturing" && stream && (
        <div style={{ position: "relative" }}>
          <CaptureStage
            stream={stream}
            onUserTap={handleUserTap}
          />

          {/* Exit capture — replaces the global nav that's hidden in immersive mode */}
          <button
            onClick={() => router.push("/seller-central")}
            aria-label="Exit capture"
            style={{
              position: "fixed",
              top: "calc(12px + env(safe-area-inset-top, 0px))",
              left: 12,
              zIndex: 20,
              width: 38,
              height: 38,
              borderRadius: "50%",
              border: "1px solid rgba(255,255,255,0.14)",
              background: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(10px)",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              color: "rgba(255,255,255,0.85)",
            }}
          >
            <X size={18} strokeWidth={2} />
          </button>

          <CaptureOverlay toasts={toasts} />

          {/* Network error banner */}
          {confirmedItems.some((i) => i.network_error) && (
            <div
              style={{
                position: "fixed",
                top: 72,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 30,
                background: "rgba(177,79,59,0.90)",
                backdropFilter: "blur(8px)",
                borderRadius: 100,
                padding: "8px 16px",
                fontSize: 12,
                fontFamily: "var(--sr-font-sans)",
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.01em",
                pointerEvents: "none",
              }}
            >
              Some items waiting for network — reconnect to retry
            </div>
          )}

          {/* Undo-last toast */}
          {undoItemId && (
            <div
              style={{
                position: "fixed",
                bottom: 120,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 30,
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "rgba(12,10,8,0.88)",
                backdropFilter: "blur(12px)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 100,
                padding: "10px 16px",
              }}
            >
              <span style={{ fontSize: 13, fontFamily: "var(--sr-font-sans)", color: "rgba(255,255,255,0.75)" }}>
                Item added
              </span>
              <button
                onClick={handleUndo}
                style={{
                  fontSize: 13,
                  fontFamily: "var(--sr-font-sans)",
                  fontWeight: 700,
                  color: "var(--clay-300)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                Undo
              </button>
            </div>
          )}

          {/* Dev analytics panel — visible at ?dev=1 */}
          {isDev && (
            <div
              style={{
                position: "fixed",
                bottom: 80,
                left: 12,
                zIndex: 40,
                background: "rgba(0,0,0,0.82)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 10,
                padding: "8px 12px",
                fontFamily: "var(--sr-font-mono)",
                fontSize: 11,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.8,
                pointerEvents: "none",
                minWidth: 160,
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.35)", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Analytics
              </div>
              <div>items: <b>{confirmedItems.length}</b></div>
              <div>
                identified:{" "}
                <b>{confirmedItems.filter((i) => i.name && i.gcs_uri && !i.isLoading).length}</b>
                {" / "}{confirmedItems.length}
              </div>
              <div>user-named: <b>{confirmedItems.filter((i) => i.nameSource === "user").length}</b></div>
              <div>low-conf: <b>{confirmedItems.filter((i) => i.confidence === "low").length}</b></div>
              <div>net-err live: <b>{confirmedItems.filter((i) => i.network_error).length}</b></div>
              <div>net-err total: <b>{networkErrorTotal}</b></div>
              <div>
                elapsed:{" "}
                <b>{debugElapsed != null ? `${debugElapsed}s` : "—"}</b>
              </div>
            </div>
          )}

          <CaptureBucket
            items={confirmedItems}
            onRemove={handleRemoveById}
            onRetry={handleRetry}
            onUpdateItem={handleUpdateItem}
          />

          <CaptureControls onFinish={handleFinish} />
        </div>
      )}

      {pageState === "reviewing" && (
        <ItemReviewScreen
          items={confirmedItems}
          isUploading={isUploading}
          uploadError={uploadError}
          saleTitle={saleTitle}
          onSaleTitleChange={setSaleTitle}
          onRemove={handleRemoveById}
          onUpdateItem={handleUpdateItem}
          onDuplicate={handleDuplicate}
          onProcess={handleProcess}
          onBack={handleBackToCapture}
          eventId={eventId}
        />
      )}
    </div>
  );
}

export default function CapturePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading capture…</div>}>
      <CapturePageContent />
    </Suspense>
  );
}
