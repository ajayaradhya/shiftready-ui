import { View, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getSaved } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { SavedSale, SavedItem } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Chip,
  EmptyState,
  ItemImage,
  PriceText,
  ScalePressable,
  Skeleton,
  TabHeader,
} from "@/components/ui";

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function SavedSaleRow({ sale }: { sale: SavedSale }) {
  const router = useRouter();
  const days = sale.moveOutDate
    ? Math.ceil((new Date(sale.moveOutDate).getTime() - Date.now()) / 86400000)
    : null;
  const title = sale.suburb ? `${titleCase(sale.suburb)} Moving Sale` : "Moving Sale";

  return (
    <ScalePressable
      onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId: sale.eventId } })}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={title}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        marginBottom: 10,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceLow,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: 12,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: radius.md,
          backgroundColor: colors.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="home-outline" size={20} color={colors.outline} />
      </View>
      <View style={{ flex: 1 }}>
        <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 14 }}>
          {title}
        </AppText>
        <AppText variant="caption" tone="muted" style={{ marginTop: 1 }}>
          {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
          {sale.state ? ` · ${sale.state}` : ""}
        </AppText>
      </View>
      {days != null && days > 0 && days <= 7 ? (
        <Chip label={`${days}d left`} status="urgent" size="sm" />
      ) : null}
      <Ionicons name="chevron-forward" size={16} color={colors.ink300} />
    </ScalePressable>
  );
}

function SavedItemRow({ item }: { item: SavedItem }) {
  const router = useRouter();

  function handlePress() {
    if (item.eventId && item.bundleId) {
      router.push({
        pathname: "/item/[eventId]/[bundleId]/[itemId]",
        params: { eventId: item.eventId, bundleId: item.bundleId, itemId: item.itemId },
      });
    } else if (item.eventId) {
      router.push({ pathname: "/sale/[eventId]", params: { eventId: item.eventId } });
    }
  }

  return (
    <ScalePressable
      onPress={handlePress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${item.name ?? "Item"}${item.price != null ? `, ${formatAUD(item.price)}` : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 10,
        borderRadius: radius.lg,
        backgroundColor: colors.surfaceLow,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        overflow: "hidden",
      }}
    >
      <ItemImage uri={item.image_url} width={72} height={72} recyclingKey={item.itemId} />
      <View style={{ flex: 1, padding: 12 }}>
        <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 14 }}>
          {item.name ?? "Item"}
        </AppText>
        {item.brand ? (
          <AppText variant="caption" tone="faint" numberOfLines={1}>
            {item.brand}
          </AppText>
        ) : null}
        {item.price != null ? (
          <View style={{ marginTop: 3 }}>
            <PriceText value={item.price} size={14} />
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.ink300} style={{ marginRight: 12 }} />
    </ScalePressable>
  );
}

function SavedSkeleton() {
  return (
    <View style={{ padding: 16, gap: 10 }}>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={72} borderRadius={16} />
      ))}
    </View>
  );
}

export default function SavedScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["saved"],
    queryFn: getSaved,
    enabled: !!user,
    staleTime: 30_000,
  });

  const savedSales = data?.saved_sales ?? [];
  const savedItems = data?.saved_items ?? [];
  const isEmpty = !isLoading && savedSales.length === 0 && savedItems.length === 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Saved" eyebrow="Your shortlist" />

      {!user ? (
        <EmptyState
          icon="heart-outline"
          title="Sign in to save things"
          body="Keep a shortlist of sales and items you love."
          ctaLabel="Sign in"
          onCtaPress={() => router.push("/(auth)/login")}
        />
      ) : isLoading ? (
        <SavedSkeleton />
      ) : isEmpty ? (
        <EmptyState
          icon="heart-outline"
          title="Nothing saved yet"
          body="Tap the heart on any sale or item to keep it here."
          ctaLabel="Browse the market"
          onCtaPress={() => router.push("/(tabs)")}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 16, paddingBottom: 90 }}
          showsVerticalScrollIndicator={false}
        >
          {savedSales.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <AppText variant="micro" tone="faint" style={{ marginBottom: 10 }}>
                Sales · {savedSales.length}
              </AppText>
              {savedSales.map((s) => (
                <SavedSaleRow key={s.eventId} sale={s} />
              ))}
            </View>
          ) : null}

          {savedItems.length > 0 ? (
            <View>
              <AppText variant="micro" tone="faint" style={{ marginBottom: 10 }}>
                Items · {savedItems.length}
              </AppText>
              {savedItems.map((item) => (
                <SavedItemRow key={item.itemId} item={item} />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}
