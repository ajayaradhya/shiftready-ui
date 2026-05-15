"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { CaptureOverlay } from "@/components/features/capture/CaptureOverlay";
import { CaptureControls } from "@/components/features/capture/CaptureControls";
import { ItemConfirmCard } from "@/components/features/capture/ItemConfirmCard";
import { ItemReviewScreen } from "@/components/features/capture/ItemReviewScreen";
import { ProcessingScreen } from "@/components/features/create/processing-screen";
import { useSaleContext } from "@/lib/sale-context";
import { dataUrlToFile } from "@/lib/capture/capture-types";
import { initCaptureSale, processFrames } from "@/lib/api";
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
  const { setSale } = useSaleContext();

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shouldStop, setShouldStop] = useState(false);
  const [confirmedItems, setConfirmedItems] = useState<CapturedItem[]>([]);
  const [pendingDetection, setPendingDetection] = useState<PendingDetection | null>(null);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [processingEventId, setProcessingEventId] = useState<string | null>(null);

  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    setSale({ label: "New Capture", name: "Phase 1" });
    return () => setSale(null);
  }, [setSale]);

  // Recording timer
  useEffect(() => {
    if (pageState !== "capturing") return;
    startTimeRef.current = Date.now();
    const id = setInterval(() => {
      setRecordingSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000));
    }, 1000);
    return () => clearInterval(id);
  }, [pageState]);

  const handleGranted = (s: MediaStream) => {
    setStream(s);
    setPageState("capturing");
  };

  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const confirmedItemsRef = useRef<CapturedItem[]>([]);
  useEffect(() => { confirmedItemsRef.current = confirmedItems; }, [confirmedItems]);

  // CaptureStage fires this when an item crosses the detection threshold
  const handleItemDetected = useCallback((label: string, frameSrc: string) => {
    if (confirmedItemsRef.current.some((i) => i.label === label)) return;
    setPendingDetection({ label, frameSrc });
  }, []);

  const handleAdd = useCallback((item: PendingDetection) => {
    setConfirmedItems((prev) => {
      if (prev.some((i) => i.label === item.label)) return prev;
      return [...prev, { label: item.label, firstSeenAt: Date.now(), frameSrc: item.frameSrc }];
    });
    setPendingDetection(null);
  }, []);

  const handleSkip = useCallback(() => {
    setPendingDetection(null);
  }, []);

  const handleFinish = () => {
    setShouldStop(true);
    setPendingDetection(null);
    setPageState("reviewing");
    stream?.getTracks().forEach((t) => t.stop());
  };

  const handleRemoveItem = (label: string) => {
    setConfirmedItems((prev) => prev.filter((i) => i.label !== label));
  };

  const handleProcess = async () => {
    if (confirmedItems.length === 0) return;
    setIsUploading(true);
    setUploadError(null);

    try {
      const { event_id } = await initCaptureSale();

      const files = await Promise.all(
        confirmedItems.map((item, i) =>
          dataUrlToFile(item.frameSrc, `frame_${i}_${item.label}.jpg`)
        )
      );

      await processFrames(event_id, files);
      setProcessingEventId(event_id);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
      setIsUploading(false);
    }
  };

  const handleBackToCapture = () => {
    setPageState("capturing");
    setShouldStop(false);
    // Re-request camera since we stopped tracks
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment" }, audio: false })
      .then((s) => setStream(s))
      .catch(() => setPageState("gate"));
  };

  // Hand off to processing screen once we have an event_id
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
            onItemDetected={handleItemDetected}
          />

          <CaptureOverlay detectedItems={confirmedItems} toasts={[]} />

          <CaptureControls
            recordingSeconds={recordingSeconds}
            onFinish={handleFinish}
          />

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
          onRemove={handleRemoveItem}
          onProcess={handleProcess}
          onBack={handleBackToCapture}
        />
      )}
    </div>
  );
}
