/**
 * Drop-in wrapper around react-native-reanimated.
 *
 * Expo Go (SDK 53+, new architecture) does not ship the worklets
 * TurboModule, so importing reanimated throws "Exception in
 * HostFunction" during module init and takes the whole route down.
 * This wrapper tries the real library and falls back to a static
 * no-op shim: the UI renders without animations instead of crashing.
 * Development builds load the real library and animate normally.
 *
 * Import from "@/lib/reanimated" instead of "react-native-reanimated".
 */
import { createElement, forwardRef, useRef, type ComponentType } from "react";
import {
  Easing as RNEasing,
  FlatList as RNFlatList,
  Image as RNImage,
  ScrollView as RNScrollView,
  Text as RNText,
  View as RNView,
} from "react-native";

let real: any = null;
try {
  // Throws inside Expo Go where the worklets TurboModule is missing.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  real = require("react-native-reanimated");
  if (!real?.default?.View) real = null;
} catch {
  real = null;
}

// ─── Shim implementation (Expo Go fallback) ──────────────────────────────────

type AnyProps = Record<string, any>;

function wrapComponent(Component: ComponentType<any>) {
  // entering/exiting/layout are reanimated-only props; native views reject them.
  return forwardRef<any, AnyProps>(function AnimatedShim(
    { entering, exiting, layout, ...rest },
    ref
  ) {
    return createElement(Component, { ...rest, ref });
  });
}

/** Chainable no-op builder standing in for FadeIn, ZoomIn, etc. */
function makeBuilder(): any {
  const b: AnyProps = {};
  for (const k of [
    "duration",
    "delay",
    "springify",
    "damping",
    "stiffness",
    "mass",
    "easing",
    "withInitialValues",
    "withCallback",
    "randomDelay",
    "build",
  ]) {
    b[k] = () => b;
  }
  return b;
}

const shimAnimated = {
  View: wrapComponent(RNView),
  Text: wrapComponent(RNText),
  Image: wrapComponent(RNImage),
  ScrollView: wrapComponent(RNScrollView),
  FlatList: wrapComponent(RNFlatList),
  createAnimatedComponent: wrapComponent,
};

function shimUseSharedValue<T>(initial: T): { value: T } {
  return useRef({ value: initial }).current;
}

function shimUseAnimatedStyle(factory: () => AnyProps): AnyProps {
  try {
    return factory();
  } catch {
    return {};
  }
}

/** Animations resolve instantly to their target value. */
const passThrough = (toValue: any, ..._rest: any[]) => toValue;
const sequencePassThrough = (...values: any[]) => values[values.length - 1];

// ─── Exports: real reanimated when available, shim otherwise ─────────────────

export const useSharedValue = real ? real.useSharedValue : shimUseSharedValue;
export const useAnimatedStyle = real ? real.useAnimatedStyle : shimUseAnimatedStyle;
export const withSpring = real ? real.withSpring : passThrough;
export const withTiming = real ? real.withTiming : passThrough;
export const withRepeat = real ? real.withRepeat : passThrough;
export const withSequence = real ? real.withSequence : sequencePassThrough;
export const cancelAnimation = real ? real.cancelAnimation : () => {};
export const Easing = real ? real.Easing : RNEasing;

export const FadeIn = real ? real.FadeIn : makeBuilder();
export const FadeInDown = real ? real.FadeInDown : makeBuilder();
export const FadeInUp = real ? real.FadeInUp : makeBuilder();
export const FadeOut = real ? real.FadeOut : makeBuilder();
export const FadeOutDown = real ? real.FadeOutDown : makeBuilder();
export const FadeOutUp = real ? real.FadeOutUp : makeBuilder();
export const SlideInDown = real ? real.SlideInDown : makeBuilder();
export const SlideOutDown = real ? real.SlideOutDown : makeBuilder();
export const ZoomIn = real ? real.ZoomIn : makeBuilder();
export const ZoomOut = real ? real.ZoomOut : makeBuilder();

const Animated = real ? real.default : shimAnimated;
export default Animated;
