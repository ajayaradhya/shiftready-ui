"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
import { initCaptureSale, captureFrame, finalizeCapture } from "@/lib/api";
import type { CapturePageState, CapturedItem, PendingDetection } from "@/lib/capture/capture-types";

const CaptureStage = dynamic(
  () =>
    import("@/components/features/capture/CaptureStage").then((m) => ({
      default: m.CaptureStage,
    })),
  { ssr: false }
);

export default function CapturePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const appendTo = searchParams.get("appendTo");
  const { setSale } = useSaleContext();

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shouldStop, setShouldStop] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<CapturedItem[]>([]);
  const [skippedLabels, setSkippedLabels] = useState<string[]>([]);
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

  const handleItemDetected = useCallback((label: string, frameSrc: string) => {
    if (confirmedItemsRef.current.some((i) => i.label === label)) return;
    setPendingDetection({ label, frameSrc });
  }, []);

  const handleAdd = useCallback((item: PendingDetection) => {
    const itemId = crypto.randomUUID();
    setConfirmedItems((prev) => {
      if (prev.some((i) => i.label === item.label)) return prev;
      return [
        ...prev,
        { id: itemId, label: item.label, firstSeenAt: Date.now(), frameSrc: item.frameSrc, isLoading: true },
      ];
    });
    setPendingDetection(null);
    addToast(item.label);
    runCaptureFrame(itemId, item.frameSrc, item.label);
  }, [addToast, runCaptureFrame]);

  const handleUserTap = useCallback((frameSrc: string) => {
    if (pendingDetectionRef.current) return;
    const itemId = crypto.randomUUID();
    const label = `unknown-${Date.now()}`;
    setConfirmedItems((prev) => [
      ...prev,
      { id: itemId, label, firstSeenAt: Date.now(), frameSrc, source: "user_tap", isLoading: true },
    ]);
    addToast(label, "Item added");
    runCaptureFrame(itemId, frameSrc, label);
  }, [addToast, runCaptureFrame]);

  const handleSkip = useCallback(() => {
    if (pendingDetection) {
      setSkippedLabels((prev) => [...prev, pendingDetection.label]);
    }
    setPendingDetection(null);
  }, [pendingDetection]);

  const handleFinish = () => {
    setShouldStop(true);
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

      // Ensure we have an event_id
      if (!eid) {
        const { event_id } = await initCaptureSale();
        eid = event_id;
        setEventId(event_id);
      }

      // Items with GCS URIs (captureFrame succeeded) → use finalizeCapture (no re-upload)
      const gcsUris = confirmedItems
        .filter((i) => i.gcs_uri)
        .map((i) => i.gcs_uri as string);

      if (gcsUris.length > 0) {
        await finalizeCapture(eid, gcsUris);
        setProcessingEventId(eid);
      } else {
        // All captureFrame calls failed — fall back to re-uploading frames
        const { dataUrlToFile: toFile } = await import("@/lib/capture/capture-types");
        const { processFrames } = await import("@/lib/api");
        const files = await Promise.all(
          confirmedItems.map((item, i) => toFile(item.frameSrc, `frame_${i}.jpg`))
        );
        if (appendTo) {
          await processFrames(appendTo, files);
          router.push(`/seller-central/inventory/${appendTo}`);
        } else {
          await processFrames(eid, files);
          setProcessingEventId(eid);
        }
      }
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const handleBackToCapture = () => {
    setPageState("capturing");
    setShouldStop(false);
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => setStream(s))
      .catch(() => setPageState("gate"));
  };

  if (processingEventId) {
    return <ProcessingScreen eventId={processingEventId} uploadedFile={null} />;
  }

  return (
    <div style={{ fontFamily: "var(--sr-font-sans)", position: "relative" }}>
      {pageState === "gate" && <CapturePermissionsGate onGranted={handleGranted} />}

      {pageState === "capturing" && stream && (
        <div style={{ position: "relative" }}>
          <CaptureStage
            stream={stream}
            shouldStop={shouldStop}
            pendingLabel={pendingDetection?.label ?? null}
            skipLabels={[...skippedLabels, ...confirmedItems.map((i) => i.label)]}
            onItemDetected={handleItemDetected}
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
