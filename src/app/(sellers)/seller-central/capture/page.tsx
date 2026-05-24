"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { CaptureOverlay } from "@/components/features/capture/CaptureOverlay";
import { CaptureControls } from "@/components/features/capture/CaptureControls";
import { CaptureBucket } from "@/components/features/capture/CaptureBucket";
import { ItemConfirmCard } from "@/components/features/capture/ItemConfirmCard";
import { ItemReviewScreen } from "@/components/features/capture/ItemReviewScreen";
import { ProcessingScreen } from "@/components/features/create/processing-screen";
import { useSaleContext } from "@/lib/sale-context";
import { dataUrlToFile } from "@/lib/capture/capture-types";
import { initCaptureSale, captureFrame, finalizeCaptureV2 } from "@/lib/api";
import type { CapturePageState, CapturedItem, PendingDetection } from "@/lib/capture/capture-types";

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

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [confirmedItems, setConfirmedItems] = useState<CapturedItem[]>([]);
  const [pendingDetection, setPendingDetection] = useState<PendingDetection | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);
  const [eventId, setEventId] = useState<string | null>(appendTo ?? null);
  const [toasts, setToasts] = useState<import("@/lib/capture/capture-types").CaptureToast[]>([]);

  const eventIdRef = useRef<string | null>(appendTo ?? null);
  const confirmedItemsRef = useRef<CapturedItem[]>([]);
  const pendingDetectionRef = useRef<PendingDetection | null>(null);

  useEffect(() => { eventIdRef.current = eventId; }, [eventId]);
  useEffect(() => { confirmedItemsRef.current = confirmedItems; }, [confirmedItems]);
  useEffect(() => { pendingDetectionRef.current = pendingDetection; }, [pendingDetection]);

  useEffect(() => {
    setSale({ label: "New Capture", name: "Live Capture" });
    return () => setSale(null);
  }, [setSale]);

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const handleGranted = useCallback(async (s: MediaStream) => {
    setStream(s);
    setPageState("capturing");
    // Init sale early so we have event_id for per-frame Gemini calls
    if (!eventIdRef.current) {
      try {
        const { event_id } = await initCaptureSale();
        setEventId(event_id);
      } catch {
        // Will retry at finalize if still null
      }
    }
  }, []);

  const addToast = useCallback((label: string, displayLabel?: string) => {
    const toastId = `${label}-${Date.now()}`;
    setToasts((prev) => [...prev, { id: toastId, label, displayLabel }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== toastId)), 2500);
  }, []);

  // Kick off per-frame Gemini call and update item state on completion
  const runCaptureFrame = useCallback(async (itemId: string, frameSrc: string, label: string) => {
    const eid = eventIdRef.current;
    if (!eid) {
      setConfirmedItems((prev) =>
        prev.map((i) => i.id === itemId ? { ...i, isLoading: false } : i)
      );
      return;
    }
    try {
      const file = await dataUrlToFile(frameSrc, `frame_${itemId}.jpg`);
      const result = await captureFrame(eid, file);
      setConfirmedItems((prev) =>
        prev.map((i) =>
          i.id === itemId
            ? {
                ...i,
                name: result.name,
                brand: result.brand,
                predicted_original_price: result.predicted_original_price,
                gcs_uri: result.gcs_uri,
                isLoading: false,
                error: undefined,
              }
            : i
        )
      );
    } catch {
      setConfirmedItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, isLoading: false, error: "Could not identify" } : i
        )
      );
    }
  }, []);

  const handleAdd = useCallback((item: PendingDetection) => {
    const itemId = crypto.randomUUID();
    setConfirmedItems((prev) => [
      ...prev,
      { id: itemId, label: item.label, firstSeenAt: Date.now(), frameSrc: item.frameSrc, isLoading: true },
    ]);
    setPendingDetection(null);
    addToast(item.label, "Item captured");
    runCaptureFrame(itemId, item.frameSrc, item.label);
  }, [addToast, runCaptureFrame]);

  const handleUserTap = useCallback((frameSrc: string, label?: string) => {
    if (pendingDetectionRef.current) return;
    setPendingDetection({ label: label ?? "item", frameSrc });
  }, []);

  const handleSkip = useCallback(() => {
    setPendingDetection(null);
  }, []);

  const handleFinish = () => {
    setPendingDetection(null);
    setPageState("reviewing");
    stream?.getTracks().forEach((t) => t.stop());
  };

  const handleRemoveById = useCallback((id: string) => {
    setConfirmedItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const handleRetry = useCallback((id: string) => {
    const item = confirmedItemsRef.current.find((i) => i.id === id);
    if (!item) return;
    setConfirmedItems((prev) =>
      prev.map((i) => i.id === id ? { ...i, isLoading: true, error: undefined } : i)
    );
    runCaptureFrame(id, item.frameSrc, item.label);
  }, [runCaptureFrame]);

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
      }

      // Items with GCS URIs → use finalize-v2 (pre-analyzed, no re-extraction)
      const analyzedItems = confirmedItems.filter((i) => i.gcs_uri && i.name);

      if (analyzedItems.length === 0) {
        throw new Error("No items with valid capture data. Please try capturing again.");
      }

      await finalizeCaptureV2(
        eid,
        analyzedItems.map((i) => ({
          temp_id: i.id,
          name: i.name!,
          brand: i.brand,
          predicted_original_price: i.predicted_original_price,
          gcs_uri: i.gcs_uri!,
        }))
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

          <CaptureBucket
            items={confirmedItems}
            onRemove={handleRemoveById}
            onRetry={handleRetry}
          />

          <CaptureControls onFinish={handleFinish} />

          {pendingDetection && (
            <ItemConfirmCard
              pending={pendingDetection}
              onAdd={handleAdd}
              onSkip={handleSkip}
            />
          )}
        </div>
      )}

      {pageState === "reviewing" && (
        <ItemReviewScreen
          items={confirmedItems}
          isUploading={isUploading}
          uploadError={uploadError}
          onRemove={handleRemoveById}
          onProcess={handleProcess}
          onBack={handleBackToCapture}
        />
      )}
    </div>
  );
}

// 2. Wrap the internal component in Suspense within your default export
export default function CapturePage() {
  return (
    <Suspense fallback={<div style={{ padding: "2rem" }}>Loading capture system...</div>}>
      <CapturePageContent />
    </Suspense>
  );
}