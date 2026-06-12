import { View } from "react-native";
import { formatAUD } from "@myrio/core";
import { colors, fonts } from "@/lib/theme";
import { AppText } from "./AppText";

export interface PriceTextProps {
  value: number;
  size?: number;
  color?: string;
  /** Original price rendered struck-through beside the value. */
  originalValue?: number | null;
  /** Show "−NN%" chip-style save hint when originalValue is higher. */
  showSavePct?: boolean;
}

export function PriceText({
  value,
  size = 15,
  color = colors.clay600,
  originalValue,
  showSavePct = false,
}: PriceTextProps) {
  const hasOriginal = originalValue != null && originalValue > value;
  const pct = hasOriginal ? Math.round((1 - value / originalValue!) * 100) : 0;

  return (
    <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
      <AppText
        style={{
          fontFamily: fonts.bold,
          fontSize: size,
          lineHeight: size * 1.25,
          color,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatAUD(value)}
      </AppText>
      {hasOriginal ? (
        <AppText
          style={{
            fontFamily: fonts.regular,
            fontSize: size * 0.72,
            color: colors.ink300,
            textDecorationLine: "line-through",
          }}
        >
          {formatAUD(originalValue!)}
        </AppText>
      ) : null}
      {hasOriginal && showSavePct && pct >= 5 ? (
        <AppText
          weight="semibold"
          style={{ fontSize: size * 0.72, color: colors.success }}
        >
          −{pct}%
        </AppText>
      ) : null}
    </View>
  );
}
