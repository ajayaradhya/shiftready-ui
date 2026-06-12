import { ActivityIndicator, View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";
import { AppText } from "./AppText";
import { ScalePressable, type HapticKind } from "./Pressable";

type Variant = "primary" | "secondary" | "ghost" | "destructive";
type Size = "lg" | "md" | "sm";

const VARIANT: Record<Variant, { bg: string; fg: string; border?: string }> = {
  primary: { bg: colors.clay600, fg: colors.onPrimary },
  secondary: { bg: colors.surfaceContainer, fg: colors.onSurface },
  ghost: { bg: "transparent", fg: colors.clay600, border: colors.outlineVariant },
  destructive: { bg: colors.errorContainer, fg: colors.onErrorContainer },
};

const SIZE: Record<Size, { height: number; px: number; fontSize: number; icon: number }> = {
  lg: { height: 52, px: 24, fontSize: 16, icon: 20 },
  md: { height: 44, px: 18, fontSize: 15, icon: 18 },
  sm: { height: 36, px: 14, fontSize: 13, icon: 16 },
};

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: Size;
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  haptic?: HapticKind;
  /** Stretch to fill the row. */
  block?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon,
  loading = false,
  disabled = false,
  haptic = "selection",
  block = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const v = VARIANT[variant];
  const s = SIZE[size];
  const isDisabled = disabled || loading;

  return (
    <ScalePressable
      onPress={onPress}
      disabled={isDisabled}
      haptic={haptic}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      style={[
        {
          height: s.height,
          paddingHorizontal: s.px,
          borderRadius: radius.lg,
          backgroundColor: v.bg,
          borderWidth: v.border ? 1 : 0,
          borderColor: v.border,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row",
          gap: 8,
          opacity: isDisabled && !loading ? 0.5 : 1,
          alignSelf: block ? "stretch" : "auto",
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={v.fg} />
      ) : (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {icon ? <Ionicons name={icon} size={s.icon} color={v.fg} /> : null}
          <AppText
            weight="semibold"
            style={{ color: v.fg, fontSize: s.fontSize, lineHeight: s.fontSize + 6 }}
          >
            {label}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
}
