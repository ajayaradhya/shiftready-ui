import { View, type StyleProp, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";
import { AppText } from "./AppText";

export type StatusVariant =
  | "live"
  | "processing"
  | "review"
  | "sold"
  | "reserved"
  | "urgent"
  | "deal"
  | "failed"
  | "neutral";

const STATUS: Record<StatusVariant, { bg: string; fg: string }> = {
  live: { bg: colors.successContainer, fg: colors.onSuccessContainer },
  processing: { bg: colors.warningContainer, fg: colors.onWarningContainer },
  review: { bg: colors.warningContainer, fg: colors.onWarningContainer },
  sold: { bg: colors.surfaceHighest, fg: colors.ink500 },
  reserved: { bg: colors.clay100, fg: colors.clay700 },
  urgent: { bg: colors.clay100, fg: colors.clay700 },
  deal: { bg: colors.successContainer, fg: colors.onSuccessContainer },
  failed: { bg: colors.errorContainer, fg: colors.onErrorContainer },
  neutral: { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant },
};

export interface ChipProps {
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  /** Semantic status look. Omit for the plain meta-chip look. */
  status?: StatusVariant;
  size?: "sm" | "md";
  style?: StyleProp<ViewStyle>;
}

export function Chip({ label, icon, status, size = "md", style }: ChipProps) {
  const palette = status ? STATUS[status] : { bg: colors.surfaceContainer, fg: colors.onSurfaceVariant };
  const isSm = size === "sm";
  return (
    <View
      style={[
        {
          flexDirection: "row",
          alignItems: "center",
          gap: 4,
          backgroundColor: palette.bg,
          borderRadius: status ? radius.full : radius.sm,
          paddingHorizontal: isSm ? 8 : 10,
          paddingVertical: isSm ? 3 : 6,
          alignSelf: "flex-start",
        },
        style,
      ]}
    >
      {icon ? <Ionicons name={icon} size={isSm ? 11 : 13} color={palette.fg} /> : null}
      <AppText
        weight={status ? "semibold" : "medium"}
        style={{
          color: palette.fg,
          fontSize: isSm ? 11 : 12,
          lineHeight: isSm ? 14 : 16,
        }}
      >
        {label}
      </AppText>
    </View>
  );
}
