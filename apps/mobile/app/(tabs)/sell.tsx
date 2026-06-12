import { View, FlatList, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { listSales } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { SaleListing, SaleStatus } from "@myrio/types";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ItemImage,
  ScalePressable,
  Skeleton,
  TabHeader,
  type StatusVariant,
} from "@/components/ui";

const STATUS_CHIP: Record<SaleStatus, { label: string; status: StatusVariant }> = {
  pending_upload: { label: "Pending", status: "neutral" },
  processing: { label: "Processing…", status: "processing" },
  ready_for_review: { label: "Review needed", status: "review" },
  pricing_in_progress: { label: "Pricing…", status: "processing" },
  live: { label: "Live", status: "live" },
  partially_sold: { label: "Part. sold", status: "deal" },
  sold: { label: "Sold", status: "sold" },
  failed: { label: "Failed", status: "failed" },
  archived: { label: "Archived", status: "neutral" },
  expired: { label: "Expired", status: "neutral" },
};

const IN_FLIGHT: SaleStatus[] = ["processing", "pricing_in_progress"];

function relativeDate(iso: string): string {
  const d = new Date(iso);
  const days = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (days === 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days} days ago`;
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function SaleCard({ sale, onPress }: { sale: SaleListing; onPress: () => void }) {
  const chip = STATUS_CHIP[sale.status] ?? STATUS_CHIP.archived;
  const inFlight = IN_FLIGHT.includes(sale.status);
  const coverUri =
    sale.coverImage?.thumb_url ?? sale.coverImage?.url ?? sale.preview_images?.[0] ?? null;

  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      accessibilityRole="button"
      accessibilityLabel={`${sale.title ?? "Sale"}, ${chip.label}, ${sale.itemCount} items`}
      style={{
        marginHorizontal: 16,
        marginBottom: 12,
        backgroundColor: colors.surfaceLow,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        padding: 14,
      }}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <ItemImage
          uri={coverUri}
          width={64}
          height={64}
          borderRadius={radius.md}
          fallbackIcon="home-outline"
          recyclingKey={sale.id}
        />
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
            <AppText variant="heading" numberOfLines={1} style={{ flex: 1, fontSize: 16 }}>
              {sale.title ?? (sale.suburb ? `${sale.suburb} Sale` : "Untitled Sale")}
            </AppText>
            <Chip label={chip.label} status={chip.status} size="sm" />
          </View>

          {sale.suburb ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
              <Ionicons name="location-outline" size={12} color={colors.ink300} />
              <AppText variant="caption" tone="muted">
                {sale.suburb}, {sale.state ?? "NSW"}
              </AppText>
            </View>
          ) : null}

          <View style={{ flexDirection: "row", gap: 18, marginTop: 8 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="cube-outline" size={13} color={colors.ink400} />
              <AppText variant="caption" tone="muted">
                {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
              </AppText>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
              <Ionicons name="pricetag-outline" size={13} color={colors.ink400} />
              <AppText variant="caption" weight="semibold" style={{ color: colors.clay600 }}>
                {formatAUD(sale.totalValue)}
              </AppText>
            </View>
            <AppText variant="caption" tone="faint" style={{ marginLeft: "auto" }}>
              {relativeDate(sale.createdAt)}
            </AppText>
          </View>
        </View>
      </View>

      {inFlight ? (
        <View
          style={{
            marginTop: 12,
            height: 3,
            borderRadius: 2,
            backgroundColor: colors.surfaceHigh,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              width: "55%",
              height: 3,
              borderRadius: 2,
              backgroundColor: colors.clay600,
            }}
          />
        </View>
      ) : null}
    </ScalePressable>
  );
}

function SalesSkeleton() {
  return (
    <View style={{ paddingTop: 16, gap: 12, paddingHorizontal: 16 }}>
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} width="100%" height={110} borderRadius={16} />
      ))}
    </View>
  );
}

export default function SellScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const {
    data: sales,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["sales"],
    queryFn: listSales,
    enabled: !!user,
  });

  if (!user) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <TabHeader title="My Sales" eyebrow="Selling" />
        <EmptyState
          icon="bag-handle-outline"
          title="Sell your stuff"
          body="Sign in to create and manage your moving sales."
          ctaLabel="Sign in"
          onCtaPress={() => router.push("/(auth)/login")}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader
        title="My Sales"
        eyebrow="Selling"
        right={
          <Button
            label="Capture"
            icon="camera"
            size="sm"
            haptic="light"
            onPress={() => router.push("/capture")}
          />
        }
      />

      {isLoading ? (
        <SalesSkeleton />
      ) : (
        <FlatList
          data={sales ?? []}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <SaleCard sale={item} onPress={() => router.push(`/seller/inventory/${item.id}`)} />
          )}
          ListHeaderComponent={<View style={{ height: 16 }} />}
          ListFooterComponent={<View style={{ height: 90 }} />}
          ListEmptyComponent={
            <EmptyState
              icon="camera-outline"
              title="No sales yet"
              body="Point your camera at what you're selling — AI identifies, groups, and prices everything."
              ctaLabel="Start capturing"
              onCtaPress={() => router.push("/capture")}
            />
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.clay600}
              colors={[colors.clay600]}
            />
          }
        />
      )}
    </View>
  );
}
