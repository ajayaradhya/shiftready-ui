export type CapturePageState = "gate" | "capturing" | "finalizing";

export interface CapturedItem {
  label: string;
  firstSeenAt: number;
}

export interface CaptureToast {
  id: string;
  label: string;
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
