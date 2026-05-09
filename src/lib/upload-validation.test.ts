import { describe, it, expect } from "vitest";
import { ACCEPTED_VIDEO_TYPES, MAX_VIDEO_SIZE_BYTES, MAX_VIDEO_SIZE_MB } from "./constants";

function validateFile(file: { type: string; size: number }): string | null {
  if (!(ACCEPTED_VIDEO_TYPES as readonly string[]).includes(file.type)) {
    return "Unsupported format. Please use MP4, MOV, or WebM.";
  }
  if (file.size > MAX_VIDEO_SIZE_BYTES) {
    return `File too large. Maximum size is ${MAX_VIDEO_SIZE_MB}MB.`;
  }
  return null;
}

describe("upload file validation", () => {
  it("accepts mp4", () => {
    expect(validateFile({ type: "video/mp4", size: 1024 })).toBeNull();
  });

  it("accepts quicktime (MOV)", () => {
    expect(validateFile({ type: "video/quicktime", size: 1024 })).toBeNull();
  });

  it("accepts webm", () => {
    expect(validateFile({ type: "video/webm", size: 1024 })).toBeNull();
  });

  it("rejects unknown video type", () => {
    const err = validateFile({ type: "video/avi", size: 1024 });
    expect(err).toContain("Unsupported format");
  });

  it("rejects non-video file", () => {
    const err = validateFile({ type: "image/jpeg", size: 1024 });
    expect(err).toContain("Unsupported format");
  });

  it("rejects file exceeding size limit", () => {
    const err = validateFile({ type: "video/mp4", size: MAX_VIDEO_SIZE_BYTES + 1 });
    expect(err).toContain("File too large");
    expect(err).toContain(`${MAX_VIDEO_SIZE_MB}MB`);
  });

  it("accepts file exactly at size limit", () => {
    expect(validateFile({ type: "video/mp4", size: MAX_VIDEO_SIZE_BYTES })).toBeNull();
  });
});
