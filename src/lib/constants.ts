export const Z_INDEX = {
  overlay: 100,
  fab: 60,
  sidebar: 50,
  header: 40,
} as const;

export const DURATION_MS = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export const POLLING_MS = {
  active: 1500,
} as const;

export const ACCEPTED_VIDEO_TYPES = [
  "video/mp4",
  "video/quicktime",
  "video/webm",
] as const;

export type AcceptedVideoType = (typeof ACCEPTED_VIDEO_TYPES)[number];

export const MAX_VIDEO_SIZE_MB = 500;
export const MAX_VIDEO_SIZE_BYTES = MAX_VIDEO_SIZE_MB * 1024 * 1024;
