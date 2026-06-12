import { View, type StyleProp, type ViewStyle } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/lib/theme";
import { AppText } from "./AppText";
import { ScalePressable } from "./Pressable";

interface BaseProps {
  /** Right-side actions (icon buttons etc.). */
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export interface TabHeaderProps extends BaseProps {
  title: string;
  /** Small eyebrow line above the large title. */
  eyebrow?: string;
}

/** Large-title header for top-level tab screens. Handles the top safe-area inset. */
export function TabHeader({ title, eyebrow, right, style }: TabHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        {
          paddingTop: insets.top + 12,
          paddingHorizontal: 16,
          paddingBottom: 12,
          backgroundColor: colors.surface,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        },
        style,
      ]}
    >
      <View style={{ flex: 1, marginRight: 12 }}>
        {eyebrow ? (
          <AppText variant="micro" tone="faint" style={{ marginBottom: 2 }}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="display">{title}</AppText>
      </View>
      {right ? <View style={{ flexDirection: "row", gap: 8 }}>{right}</View> : null}
    </View>
  );
}

export interface StackHeaderProps extends BaseProps {
  title?: string;
  /** Transparent over-image mode (floating circular buttons, no bg). */
  transparent?: boolean;
  onBack?: () => void;
}

/** Back-nav header for stack screens. 44pt touch targets. */
export function StackHeader({ title, right, transparent, onBack, style }: StackHeaderProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const buttonStyle: ViewStyle = transparent
    ? {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: "rgba(250,250,247,0.92)",
        alignItems: "center",
        justifyContent: "center",
      }
    : { width: 44, height: 44, alignItems: "center", justifyContent: "center", marginLeft: -10 };

  return (
    <View
      style={[
        {
          paddingTop: insets.top + (transparent ? 8 : 4),
          paddingHorizontal: 16,
          paddingBottom: 8,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: transparent ? "transparent" : colors.surface,
          borderBottomWidth: transparent ? 0 : 1,
          borderBottomColor: colors.outlineVariant,
        },
        style,
      ]}
    >
      <ScalePressable
        onPress={onBack ?? (() => router.back())}
        haptic="selection"
        accessibilityRole="button"
        accessibilityLabel="Go back"
        style={buttonStyle}
      >
        <Ionicons name="arrow-back" size={22} color={colors.onSurface} />
      </ScalePressable>
      {title ? (
        <AppText variant="heading" numberOfLines={1} style={{ flex: 1, marginLeft: 8 }}>
          {title}
        </AppText>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      {right ? <View style={{ flexDirection: "row", gap: 8 }}>{right}</View> : null}
    </View>
  );
}

export interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  color?: string;
  accessibilityLabel: string;
  /** Floating circular style (over images). */
  floating?: boolean;
  badge?: boolean;
}

export function IconButton({ icon, onPress, color, accessibilityLabel, floating, badge }: IconButtonProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={{
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: floating ? "rgba(250,250,247,0.92)" : "transparent",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Ionicons name={icon} size={22} color={color ?? colors.onSurface} />
      {badge ? (
        <View
          style={{
            position: "absolute",
            top: 9,
            right: 9,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.clay600,
          }}
        />
      ) : null}
    </ScalePressable>
  );
}
