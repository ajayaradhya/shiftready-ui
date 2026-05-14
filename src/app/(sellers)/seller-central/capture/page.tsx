"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { CapturePermissionsGate } from "@/components/features/capture/CapturePermissionsGate";
import { CaptureOverlay } from "@/components/features/capture/CaptureOverlay";
import { CaptureControls } from "@/components/features/capture/CaptureControls";
import { FinalizeCaptureDialog } from "@/components/features/capture/FinalizeCaptureDialog";
import { ProcessingScreen } from "@/components/features/create/processing-screen";
import { useUpload } from "@/hooks/use-upload";
import { useSaleContext } from "@/lib/sale-context";
import { blobToFile } from "@/lib/capture/capture-types";
import type { CapturePageState, CapturedItem, CaptureToast } from "@/lib/capture/capture-types";

const CaptureStage = dynamic(
  () =>
    import("@/components/features/capture/CaptureStage").then((m) => ({
      default: m.CaptureStage,
    })),
  { ssr: false }
);

const TOAST_DURATION_MS = 3000;
const MAX_TOASTS = 3;

export default function CapturePage() {
  const router = useRouter();
  const { setSale } = useSaleContext();
  const { status: uploadStatus, uploadProgress, fileError, eventId, uploadedFile, uploadFile } =
    useUpload();

  const [pageState, setPageState] = useState<CapturePageState>("gate");
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [shouldStop, setShouldStop] = useState(false);
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null);
  const [capturedMimeType, setCapturedMimeType] = useState("");
  const [detectedItems, setDetectedItems] = useState<CapturedItem[]>([]);
  const [toasts, setToasts] = useState<CaptureToast[]>([]);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

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

  // Stop camera tracks when page unmounts or stream changes
  useEffect(() => {
    return () => { stream?.getTracks().forEach((t) => t.stop()); };
  }, [stream]);

  const handleNewItem = useCallback((label: string) => {
    setDetectedItems((prev) => {
      if (prev.some((i) => i.label === label)) return prev;
      return [...prev, { label, firstSeenAt: Date.now() }];
    });

    const id = `${label}-${Date.now()}`;
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, label }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const handleRecordingComplete = useCallback((blob: Blob, mimeType: string) => {
    setCapturedBlob(blob);
    setCapturedMimeType(mimeType);
    setPageState("finalizing");
  }, []);

  const handleFinish = () => {
    setShouldStop(true);
  };

  const handleUpload = async () => {
    if (!capturedBlob) return;
    const file = blobToFile(capturedBlob, capturedMimeType);
    await uploadFile(file);
  };

  const handleCancelFinalize = () => {
    router.push("/seller-central/create");
  };

  // Once upload transitions to processing, ProcessingScreen takes over
  if (uploadStatus === "processing" && eventId) {
    return <ProcessingScreen eventId={eventId} uploadedFile={uploadedFile} />;
  }

  return (
    <div style={{ fontFamily: "var(--sr-font-sans)", position: "relative" }}>
      {pageState === "gate" && <CapturePermissionsGate onGranted={handleGranted} />}

      {(pageState === "capturing" || pageState === "finalizing") && stream && (
        <div style={{ position: "relative" }}>
          <CaptureStage
            stream={stream}
            shouldStop={shouldStop}
            onNewItem={handleNewItem}
            onRecordingComplete={handleRecordingComplete}
          />

          <CaptureOverlay detectedItems={detectedItems} toasts={toasts} />

          {pageState === "capturing" && (
            <CaptureControls
              recordingSeconds={recordingSeconds}
              onFinish={handleFinish}
            />
          )}

          {pageState === "finalizing" && (
            <FinalizeCaptureDialog
              itemCount={detectedItems.length}
              durationSeconds={recordingSeconds}
              uploadStatus={uploadStatus}
              uploadProgress={uploadProgress}
              fileError={fileError}
              onUpload={handleUpload}
              onCancel={handleCancelFinalize}
            />
          )}
        </div>
      )}
    </div>
  );
}
