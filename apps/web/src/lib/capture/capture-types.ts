export type CapturePageState = "gate" | "capturing" | "reviewing";

export type NameSource = "ai" | "user";

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
  /** Gemini identify errored — but item stays in bucket */
  error?: string;
  /** Frame upload / network failure — user can retry */
  network_error?: boolean;
  /** True when name/gcs_uri missing after all retries */
  needs_review?: boolean;
  /** Whether name was set by AI or overridden by user */
  nameSource?: NameSource;
  /** Gemini identification confidence */
  confidence?: "high" | "medium" | "low";
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
  return new File([blob], `myrio-capture.${ext}`, { type: baseType });
}

export async function dataUrlToFile(dataUrl: string, filename: string): Promise<File> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return new File([blob], filename, { type: "image/jpeg" });
}
