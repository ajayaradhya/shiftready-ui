"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { CaptureOverlay } from "@/components/features/capture/CaptureOverlay";
import { CaptureControls } from "@/components/features/capture/CaptureControls";
import { CaptureBucket } from "@/components/features/capture/CaptureBucket";
import { ItemReviewScreen } from "@/components/features/capture/ItemReviewScreen";
import { ProcessingScreen } from "@/components/features/create/processing-screen";
import { useSaleContext } from "@/lib/sale-context";
import { dataUrlToFile } from "@/lib/capture/capture-types";
import { initCaptureSale, captureFrame, finalizeCaptureV2 } from "@/lib/api";
import type { CapturePageState, CapturedItem } from "@/lib/capture/capture-types";

const CaptureStage = dynamic(
  () =>
    import("@/components/features/capture/CaptureStage").then((m) => ({
      default: m.CaptureStage,
    })),
  { ssr: false }
);

function CapturePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appendTo = searchParams.get("appendTo");
  const { setSale } = useSaleContext();
  useEffect(() => { document.title = "Live Capture - ShiftReady"; }, []);

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<CapturedItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(appendTo ?? null);
  const [toasts, setToasts] = useState<import("@/lib/capture/capture-types").CaptureToast[]>([]);
  const [saleTitle, setSaleTitle] = useState("");

  // Undo-last state
  const [undoItemId, setUndoItemId] = useState<string | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const eventIdRef = useRef<string | null>(appendTo ?? null);
  const confirmedItemsRef = useRef<CapturedItem[]>([]);
  const itemCountRef = useRef(0);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setConfirmedItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? { ...i, isLoading: false, error: isNetworkErr ? undefined : "Could not identify", network_error: isNetworkErr }
            : i
        )
      );
    }
  }, [initSaleOnce]);

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
  }, [addToast, runCaptureFrame]);

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

  const handleRetry = useCallback((id: string) => {
    const item = confirmedItemsRef.current.find((i) => i.id === id);
    if (!item) return;
    setConfirmedItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, isLoading: true, error: undefined, network_error: false } : i)
    );
    runCaptureFrame(id, item.frameSrc);
  }, [runCaptureFrame]);

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
      .then((s) => setStream(s))
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

  return (
    <div style={{ fontFamily: "var(--sr-font-sans)", position: "relative" }}>
      {pageState === "gate" && <CapturePermissionsGate onGranted={handleGranted} />}

      {pageState === "capturing" && stream && (
        <div style={{ position: "relative" }}>
          <CaptureStage
            stream={stream}
            onUserTap={handleUserTap}
          />

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
