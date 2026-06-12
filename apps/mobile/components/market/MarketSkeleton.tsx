import { View } from "react-native";
import { Skeleton } from "@/components/ui";
import { HERO_CARD_WIDTH } from "./SaleHeroCard";

export function MarketSkeleton({ gridItemWidth }: { gridItemWidth: number }) {
  return (
    <View style={{ paddingTop: 16 }}>
      <Skeleton width={140} height={14} style={{ marginLeft: 16, marginBottom: 12 }} />
      <View style={{ flexDirection: "row", gap: 12, paddingHorizontal: 16 }}>
        <Skeleton width={HERO_CARD_WIDTH} height={185} borderRadius={20} />
        <Skeleton width={HERO_CARD_WIDTH} height={185} borderRadius={20} />
      </View>
      <Skeleton width={120} height={14} style={{ marginLeft: 16, marginTop: 28, marginBottom: 12 }} />
      <View
        style={{
          flexDirection: "row",
          flexWrap: "wrap",
          gap: 12,
          paddingHorizontal: 16,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={{ width: gridItemWidth, gap: 8 }}>
            <Skeleton width={gridItemWidth} height={gridItemWidth} borderRadius={16} />
            <Skeleton width="80%" height={12} />
            <Skeleton width="50%" height={12} />
          </View>
        ))}
      </View>
    </View>
  );
}
