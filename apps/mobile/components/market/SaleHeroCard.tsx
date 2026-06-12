import { View } from "react-native";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { formatAUD } from "@myrio/core";
import type { ActiveSaleSummary } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import { AppText, Chip, ItemImage, ScalePressable } from "@/components/ui";

export const HERO_CARD_WIDTH = 260;
const HERO_CARD_HEIGHT = 185;

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function daysUntil(dateStr?: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

export function SaleHeroCard({ sale }: { sale: ActiveSaleSummary & { moveOutDate?: string | null } }) {
  const router = useRouter();
  const title = sale.title || (sale.suburb ? `${titleCase(sale.suburb)} Sale` : "Moving Sale");
  const coverUrl = sale.cover_image_url || sale.preview_images?.[0];
  const days = daysUntil(sale.moveOutDate);

  return (
    <ScalePressable
      onPress={() =>
        router.push({ pathname: "/sale/[eventId]", params: { eventId: sale.eventId } })
      }
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${sale.itemCount} items${sale.minPrice != null ? `, from ${formatAUD(sale.minPrice)}` : ""}`}
      style={{
        width: HERO_CARD_WIDTH,
        height: HERO_CARD_HEIGHT,
        borderRadius: radius.xl,
        overflow: "hidden",
        backgroundColor: colors.surfaceHigh,
      }}
    >
      <ItemImage uri={coverUrl} height={HERO_CARD_HEIGHT} fallbackIcon="home-outline" fallbackIconSize={40} />

      {/* Scrim for text legibility */}
      <LinearGradient
        colors={["transparent", "rgba(20,17,13,0.05)", "rgba(20,17,13,0.72)"]}
        locations={[0, 0.45, 1]}
        style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
      />

      {/* Top chips */}
      <View
        style={{
          position: "absolute",
          top: 10,
          left: 10,
          right: 10,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {days != null && days <= 3 && days > 0 ? (
          <Chip label={days === 1 ? "Last day" : `${days} days left`} status="urgent" size="sm" />
        ) : (
          <View />
        )}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 3,
            backgroundColor: "rgba(20,17,13,0.55)",
            borderRadius: radius.full,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Ionicons name="cube-outline" size={11} color={colors.onPrimary} />
          <AppText weight="semibold" style={{ color: colors.onPrimary, fontSize: 11, lineHeight: 14 }}>
            {sale.itemCount}
          </AppText>
        </View>
      </View>

      {/* Bottom info */}
      <View style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
        <AppText
          weight="bold"
          numberOfLines={2}
          style={{ color: colors.onPrimary, fontSize: 16, lineHeight: 21 }}
        >
          {title}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
          {sale.suburb ? (
            <>
              <Ionicons name="location" size={11} color="rgba(255,255,255,0.85)" />
              <AppText style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, lineHeight: 16 }}>
                {titleCase(sale.suburb)}
              </AppText>
            </>
          ) : null}
          {sale.minPrice != null ? (
            <AppText weight="semibold" style={{ color: colors.onPrimary, fontSize: 12, lineHeight: 16 }}>
              {sale.suburb ? " · " : ""}from {formatAUD(sale.minPrice)}
            </AppText>
          ) : null}
        </View>
      </View>
    </ScalePressable>
  );
}
