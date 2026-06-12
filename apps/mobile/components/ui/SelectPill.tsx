import { View, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius } from "@/lib/theme";
import { AppText } from "./AppText";
import { ScalePressable } from "./Pressable";

export interface SelectPillProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Toggleable pill used for payment methods, pickup days, filters, etc. */
export function SelectPill({ label, selected, onPress, style }: SelectPillProps) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={label}
      style={[
        {
          paddingHorizontal: 14,
          height: 36,
          borderRadius: radius.full,
          backgroundColor: selected ? colors.ink800 : colors.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
        },
        style,
      ]}
    >
      <AppText
        weight={selected ? "semibold" : "medium"}
        style={{
          fontSize: 13,
          lineHeight: 17,
          color: selected ? colors.surface : colors.onSurfaceVariant,
        }}
      >
        {label}
      </AppText>
    </ScalePressable>
  );
}

/** Wrapping row container for SelectPills. */
export function PillRow({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>{children}</View>;
}
