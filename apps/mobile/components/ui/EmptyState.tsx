import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";
import { AppText } from "./AppText";
import { Button } from "./Button";

export interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
  /** Compact spacing for inline (non-full-screen) placement. */
  compact?: boolean;
}

export function EmptyState({ icon, title, body, ctaLabel, onCtaPress, compact }: EmptyStateProps) {
  return (
    <View
      style={{
        alignItems: "center",
        justifyContent: "center",
        paddingHorizontal: 32,
        paddingVertical: compact ? 24 : 64,
        gap: 6,
      }}
    >
      <View
        style={{
          width: 72,
          height: 72,
          borderRadius: 36,
          backgroundColor: colors.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Ionicons name={icon} size={32} color={colors.outline} />
      </View>
      <AppText variant="heading" style={{ textAlign: "center" }}>
        {title}
      </AppText>
      {body ? (
        <AppText variant="caption" tone="muted" style={{ textAlign: "center", maxWidth: 280 }}>
          {body}
        </AppText>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Button label={ctaLabel} onPress={onCtaPress} style={{ marginTop: 16 }} />
      ) : null}
    </View>
  );
}
