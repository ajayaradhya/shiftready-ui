import { View } from "react-native";
import { useRouter } from "expo-router";
import type { MarketplaceItem } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import { AppText, ItemImage, PriceText, ScalePressable } from "@/components/ui";

export function ItemGridCard({ item, width }: { item: MarketplaceItem; width: number }) {
  const router = useRouter();
  const imageHeight = width; // square image

  const goToItem = () => {
    if (item.bundleId) {
      router.push({
        pathname: "/item/[eventId]/[bundleId]/[itemId]",
        params: { eventId: item.eventId, bundleId: item.bundleId, itemId: item.id },
      });
    } else {
      // Older payloads without bundleId — fall back to the sale page.
      router.push({ pathname: "/sale/[eventId]", params: { eventId: item.eventId } });
    }
  };

  return (
    <ScalePressable
      onPress={goToItem}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${item.name}${item.price != null ? `, $${item.price}` : ""}`}
      style={{
        width,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceLow,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        overflow: "hidden",
      }}
    >
      <ItemImage uri={item.thumb_url ?? item.image_url} height={imageHeight} recyclingKey={item.id} />
      <View style={{ padding: 10, gap: 2 }}>
        <AppText weight="medium" numberOfLines={2} style={{ fontSize: 13.5, lineHeight: 18, minHeight: 36 }}>
          {item.name}
        </AppText>
        {item.brand ? (
          <AppText variant="caption" tone="faint" numberOfLines={1} style={{ fontSize: 11.5 }}>
            {[item.brand, item.condition].filter(Boolean).join(" · ")}
          </AppText>
        ) : null}
        {item.price != null ? (
          <View style={{ marginTop: 2 }}>
            <PriceText value={item.price} originalValue={item.metadata?.originalPrice} />
          </View>
        ) : null}
      </View>
    </ScalePressable>
  );
}
