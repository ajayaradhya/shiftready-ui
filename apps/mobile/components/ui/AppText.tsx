import { Text, type TextProps, type TextStyle } from "react-native";
import { colors, fonts } from "@/lib/theme";

export type TextVariant =
  | "display"
  | "title"
  | "heading"
  | "body"
  | "caption"
  | "micro";

export type TextTone = "default" | "muted" | "faint" | "primary" | "inverse" | "error" | "success";

const VARIANT: Record<TextVariant, TextStyle> = {
  display: { fontFamily: fonts.displayBold, fontSize: 28, lineHeight: 34 },
  title: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  heading: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  micro: {
    fontFamily: fonts.medium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
};

const TONE: Record<TextTone, string> = {
  default: colors.onSurface,
  muted: colors.onSurfaceVariant,
  faint: colors.ink300,
  primary: colors.primary,
  inverse: colors.onPrimary,
  error: colors.error,
  success: colors.success,
};

export interface AppTextProps extends TextProps {
  variant?: TextVariant;
  tone?: TextTone;
  /** Override weight within the variant (Inter variants only). */
  weight?: "regular" | "medium" | "semibold" | "bold";
}

export function AppText({
  variant = "body",
  tone = "default",
  weight,
  style,
  ...rest
}: AppTextProps) {
  return (
    <Text
      style={[
        VARIANT[variant],
        { color: TONE[tone] },
        weight ? { fontFamily: fonts[weight] } : null,
        style,
      ]}
      {...rest}
    />
  );
}
