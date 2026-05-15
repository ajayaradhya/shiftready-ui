export type CapturePageState = "gate" | "capturing" | "reviewing";

export interface CapturedItem {
  id: string;
  label: string;
  firstSeenAt: number;
  frameSrc: string;
  source?: "auto" | "user_tap";
  // Gemini quick-identify results (populated after captureFrame API call)
  name?: string;
  brand?: string;
  predicted_original_price?: number;
  gcs_uri?: string;
  isLoading?: boolean;
  error?: string;
}

export interface PendingDetection {
  label: string;
  frameSrc: string;
}

export interface CaptureToast {
  id: string;
  label: string;
  displayLabel?: string;
}

export function pickRecordingMimeType(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates = [
    "video/webm;codecs=vp9",
    "video/webm;codecs=vp8",
    "video/webm",
    "video/mp4",
  ];
  return (
    candidates.find((t) => {
      try {
        return MediaRecorder.isTypeSupported(t);
      } catch {
        return false;
      }
    }) ?? ""
  );
}

export function blobToFile(blob: Blob, mimeType: string): File {
  const baseType = mimeType.split(";")[0];
  const ext = baseType === "video/mp4" ? "mp4" : "webm";
  return new File([blob], `shiftready-capture.${ext}`, { type: baseType });
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
}
