import { useCallback } from "react";
import { Platform, Pressable as RNPressable, type PressableProps, type ViewStyle, type StyleProp } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "@/lib/reanimated";
import * as Haptics from "expo-haptics";

const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export type HapticKind = "selection" | "light" | "medium" | "success" | "error" | "none";

export function triggerHaptic(kind: HapticKind) {
  if (Platform.OS === "web" || kind === "none") return;
  switch (kind) {
    case "selection":
      Haptics.selectionAsync().catch(() => {});
      break;
    case "light":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      break;
    case "medium":
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
      break;
    case "success":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      break;
    case "error":
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      break;
  }
}

export interface ScalePressableProps extends PressableProps {
  /** Scale applied while pressed. */
  pressScale?: number;
  haptic?: HapticKind;
  style?: StyleProp<ViewStyle>;
}

/** Pressable with spring scale-down feedback + optional haptic. */
export function ScalePressable({
  pressScale = 0.97,
  haptic = "none",
  onPressIn,
  onPressOut,
  onPress,
  style,
  ...rest
}: ScalePressableProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressIn"]>>[0]) => {
      scale.value = withSpring(pressScale, { damping: 20, stiffness: 400 });
      onPressIn?.(e);
    },
    [onPressIn, pressScale, scale]
  );
  const handlePressOut = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPressOut"]>>[0]) => {
      scale.value = withSpring(1, { damping: 20, stiffness: 400 });
      onPressOut?.(e);
    },
    [onPressOut, scale]
  );
  const handlePress = useCallback(
    (e: Parameters<NonNullable<PressableProps["onPress"]>>[0]) => {
      triggerHaptic(haptic);
      onPress?.(e);
    },
    [haptic, onPress]
  );

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={[style, animatedStyle]}
      {...rest}
    />
  );
}
