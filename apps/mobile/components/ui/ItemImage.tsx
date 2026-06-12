import { View, type StyleProp, type ViewStyle } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/lib/theme";

export interface ItemImageProps {
  uri?: string | null;
  width?: number | "100%";
  height: number;
  borderRadius?: number;
  /** Icon used when there is no image. */
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
  fallbackIconSize?: number;
  style?: StyleProp<ViewStyle>;
  recyclingKey?: string;
}

/** Product image with consistent placeholder treatment (no emoji). */
export function ItemImage({
  uri,
  width = "100%",
  height,
  borderRadius = 0,
  fallbackIcon = "cube-outline",
  fallbackIconSize = 24,
  style,
  recyclingKey,
}: ItemImageProps) {
  if (!uri) {
    return (
      <View
        style={[
          {
            width,
            height,
            borderRadius,
            backgroundColor: colors.surfaceHigh,
            alignItems: "center",
            justifyContent: "center",
          },
          style,
        ]}
      >
        <Ionicons name={fallbackIcon} size={fallbackIconSize} color={colors.outline} />
      </View>
    );
  }
  return (
    <Image
      source={{ uri }}
      recyclingKey={recyclingKey}
      style={[{ width, height, borderRadius, backgroundColor: colors.surfaceHigh }, style as object]}
      contentFit="cover"
      transition={150}
    />
  );
}
