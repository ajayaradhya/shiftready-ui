import { View, type StyleProp, type ViewStyle, type ViewProps } from "react-native";
import { colors, radius } from "@/lib/theme";
import { ScalePressable, type HapticKind } from "./Pressable";

const baseStyle: ViewStyle = {
  backgroundColor: colors.surfaceLow,
  borderRadius: radius.lg,
  borderWidth: 1,
  borderColor: colors.outlineVariant,
  overflow: "hidden",
};

export interface CardProps extends ViewProps {
  onPress?: () => void;
  haptic?: HapticKind;
  /** Inner padding; 0 for image-bleed cards. */
  padding?: number;
  style?: StyleProp<ViewStyle>;
}

export function Card({ onPress, haptic = "none", padding = 14, style, children, ...rest }: CardProps) {
  const content = (
    <View style={{ padding }} {...rest}>
      {children}
    </View>
  );
  if (onPress) {
    return (
      <ScalePressable
        onPress={onPress}
        haptic={haptic}
        accessibilityRole="button"
        style={[baseStyle, style]}
      >
        {content}
      </ScalePressable>
    );
  }
  return <View style={[baseStyle, style]}>{content}</View>;
}
