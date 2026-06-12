/**
 * Systemized motion tokens for the Myrio mobile app.
 * All animations, springs, and haptic triggers go here.
 *
 * Usage:
 *   import { springs, entering, haptic } from "@/lib/motion";
 *   <Animated.View entering={entering.listItem(index)} style={useAnimatedStyle(springs.pressScale(pressed))} />
 */

import {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  FadeOutDown,
  FadeOutUp,
  SlideInDown,
  SlideOutDown,
  ZoomIn,
  ZoomOut,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { triggerHaptic, type HapticKind } from "@/components/ui";

// ─── Spring configs ───────────────────────────────────────────────────────────

export const springs = {
  /** Button/pressable scale on long-press */
  pressScale: {
    damping: 15,
    stiffness: 200,
    mass: 0.8,
  },
  /** Bottom sheet entrance/exit */
  sheet: {
    damping: 20,
    stiffness: 260,
    mass: 1,
  },
  /** Item pop-in after confirm */
  pop: {
    damping: 12,
    stiffness: 280,
    mass: 0.6,
  },
} as const;

// ─── Entering / exiting presets ───────────────────────────────────────────────

/** List item entrance: fade + 6px rise, with per-index stagger. */
function listItem(index: number = 0) {
  return FadeInDown.delay(Math.min(index * 30, 180))
    .duration(220)
    .springify()
    .damping(springs.sheet.damping)
    .stiffness(springs.sheet.stiffness);
}

/** Standard sheet slide-up. */
const sheetEnter = SlideInDown.duration(280).springify().damping(20).stiffness(260);

/** Standard sheet slide-down on close. */
const sheetExit = SlideOutDown.duration(220).springify();

/** Snackbar appear from bottom. */
const snackEnter = FadeInDown.duration(200);
const snackExit = FadeOutDown.duration(150);

/** Card / overlay fade. */
const fadeIn = FadeIn.duration(200);
const fadeOut = FadeOut.duration(150);
const fadeInUp = FadeInUp.duration(250).springify();

/** Success check / confirmation zoom. */
const successZoom = ZoomIn.duration(400).springify().damping(10).stiffness(200);
const zoomIn = ZoomIn.duration(280).springify();
const zoomOut = ZoomOut.duration(200);

export const entering = {
  listItem,
  sheetEnter,
  snackEnter,
  fadeIn,
  fadeInUp,
  successZoom,
  zoomIn,
} as const;

export const exiting = {
  sheetExit,
  snackExit,
  fadeOut,
  zoomOut,
} as const;

// ─── Haptics map ──────────────────────────────────────────────────────────────

/**
 * Semantic haptic map.
 * Prefer these over raw triggerHaptic calls.
 */
export const haptic = {
  /** Tabs, chips, toggles, row taps */
  selection: () => triggerHaptic("selection"),
  /** Shutter capture, heart save */
  capture: () => triggerHaptic("medium"),
  /** Message send, confirm sheet close */
  confirm: () => triggerHaptic("light"),
  /** Offer accepted, publish success, deal agreed */
  success: () => triggerHaptic("success"),
  /** Error state, failed send */
  error: () => triggerHaptic("error"),
  /** Destructive action (delete, withdraw) */
  warning: () => triggerHaptic("light"),
} as const;

export type HapticEvent = keyof typeof haptic;
