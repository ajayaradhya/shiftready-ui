import type { ObjectDetector } from "@mediapipe/tasks-vision";

let detectorPromise: Promise<ObjectDetector> | null = null;

export async function loadObjectDetector(): Promise<ObjectDetector> {
  if (!detectorPromise) {
    detectorPromise = (async () => {
      const { ObjectDetector, FilesetResolver } = await import("@mediapipe/tasks-vision");
      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm"
      );
      return ObjectDetector.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath:
            "https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite",
          delegate: "GPU",
        },
        scoreThreshold: 0.4,
        runningMode: "VIDEO",
      });
    })();
  }
  return detectorPromise;
}

export function resetDetector(): void {
  detectorPromise = null;
}
