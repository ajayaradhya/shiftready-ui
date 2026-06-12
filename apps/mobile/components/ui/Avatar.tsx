import { View } from "react-native";
import { Image } from "expo-image";
import { colors } from "@/lib/theme";
import { AppText } from "./AppText";

// Deterministic hue from username so avatars differ per user.
const PALETTE = [
  { bg: colors.clay600, fg: colors.onPrimary },
  { bg: colors.clay700, fg: colors.onPrimary },
  { bg: colors.success, fg: colors.onPrimary },
  { bg: colors.ink400, fg: colors.onPrimary },
  { bg: colors.info, fg: colors.onPrimary },
  { bg: colors.warning, fg: colors.onPrimary },
];

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export interface AvatarProps {
  name?: string | null;
  uri?: string | null;
  size?: number;
}

export function Avatar({ name, uri, size = 44 }: AvatarProps) {
  const display = (name ?? "?").replace(/^@/, "");
  const initial = (display[0] ?? "?").toUpperCase();
  const { bg, fg } = PALETTE[hashCode(display) % PALETTE.length];

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
        accessibilityLabel={`${display} avatar`}
      />
    );
  }
  return (
    <View
      accessibilityLabel={`${display} avatar`}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AppText
        weight="bold"
        style={{ color: fg, fontSize: size * 0.42, lineHeight: size * 0.55 }}
      >
        {initial}
      </AppText>
    </View>
  );
}
