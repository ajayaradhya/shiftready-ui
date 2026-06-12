import { useState } from "react";
import {
  View,
  SectionList,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import {
  getSummary,
  unpublishSale,
  archiveSale,
  repriceItem,
} from "@myrio/api";
import { formatAUD } from "@myrio/core";
import type { SaleSummary, InventoryItem, RoomBundle } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ItemImage,
  ScalePressable,
  Skeleton,
  StackHeader,
  triggerHaptic,
  type StatusVariant,
} from "@/components/ui";
import { StatusHero } from "@/components/seller/StatusHero";
import { ItemEditSheet } from "@/components/seller/ItemEditSheet";
import { BundleSoldSheet, RenameBundleSheet } from "@/components/seller/BundleSheets";
import { PublishSheet } from "@/components/seller/PublishSheet";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const ITEM_STATUS_CHIP: Record<string, { label: string; status: StatusVariant }> = {
  available: { label: "Available", status: "live" },
  reserved: { label: "Reserved", status: "reserved" },
  sold: { label: "Sold", status: "sold" },
  withdrawn: { label: "Withdrawn", status: "neutral" },
};

function coverUri(item: InventoryItem): string | null {
  const images = item.images ?? [];
  const cover = images.find((i) => i.is_cover) ?? images[0];
  return cover?.thumb_url ?? cover?.url ?? null;
}

function ItemRow({ item, onPress }: { item: InventoryItem; onPress: () => void }) {
  const chip = ITEM_STATUS_CHIP[item.sale_status ?? "available"] ?? ITEM_STATUS_CHIP.available;
  const price = item.actual_listing_price ?? item.predicted_listing_price;
  const dimmed = item.sale_status === "sold" || item.sale_status === "withdrawn";

  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      pressScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${chip.label}${price != null ? `, ${formatAUD(price)}` : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: colors.surface,
      }}
    >
      <ItemImage
        uri={coverUri(item)}
        width={56}
        height={56}
        borderRadius={radius.md}
        recyclingKey={item.id}
        style={dimmed ? { opacity: 0.45 } : undefined}
      />
      <View style={{ flex: 1 }}>
        <AppText
          weight="semibold"
          numberOfLines={1}
          style={{ fontSize: 14.5, color: dimmed ? colors.ink300 : colors.onSurface }}
        >
          {item.name}
        </AppText>
        {item.brand || item.condition ? (
          <AppText variant="caption" tone="faint" numberOfLines={1} style={{ marginTop: 1 }}>
            {[item.brand, item.condition].filter(Boolean).join(" · ")}
          </AppText>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", gap: 4 }}>
        <AppText
          weight="bold"
          style={{
            fontSize: 14.5,
            color: dimmed ? colors.ink300 : colors.clay600,
            fontVariant: ["tabular-nums"],
          }}
        >
          {price != null ? formatAUD(price) : "—"}
        </AppText>
        {item.sale_status && item.sale_status !== "available" ? (
          <Chip label={chip.label} status={chip.status} size="sm" />
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={15} color={colors.ink300} />
    </ScalePressable>
  );
}

function InventorySkeleton() {
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <Skeleton width="100%" height={120} borderRadius={16} />
      <Skeleton width="100%" height={48} borderRadius={12} />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} width="100%" height={72} borderRadius={12} />
      ))}
    </View>
  );
}

export default function InventoryScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<{ item: InventoryItem; bundleId: string } | null>(null);
  const [soldBundle, setSoldBundle] = useState<RoomBundle | null>(null);
  const [renamingBundle, setRenamingBundle] = useState<RoomBundle | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reestimating, setReestimating] = useState(false);

  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId!),
    enabled: !!eventId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "processing" || s === "pricing_in_progress" ? 3000 : false;
    },
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishSale(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
    onError: (e: Error) => Alert.alert("Unpublish failed", e.message),
  });

  const archiveMut = useMutation({
    mutationFn: () => archiveSale(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      router.back();
    },
    onError: (e: Error) => Alert.alert("Archive failed", e.message),
  });

  // No bulk endpoint exists — reprice sequentially so backend rate limits hold.
  async function reestimateAll() {
    if (!summary || reestimating) return;
    const targets = summary.bundles.flatMap((b) =>
      b.items
        .filter((i) => !i.sale_status || i.sale_status === "available")
        .map((i) => ({ bundleId: b.id, itemId: i.id }))
    );
    if (targets.length === 0) return;
    setReestimating(true);
    let failed = 0;
    for (const t of targets) {
      try {
        await repriceItem(eventId!, t.bundleId, t.itemId);
      } catch {
        failed += 1;
      }
    }
    setReestimating(false);
    triggerHaptic(failed === targets.length ? "error" : "success");
    queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
    if (failed > 0) {
      Alert.alert("Re-estimate finished", `${targets.length - failed} repriced, ${failed} failed.`);
    }
  }

  function toggleCollapse(bundleId: string) {
    triggerHaptic("selection");
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(bundleId)) next.delete(bundleId);
      else next.add(bundleId);
      return next;
    });
  }

  const status = summary?.status;
  const isLive = status === "live" || status === "partially_sold";
  const isTerminal = status === "sold" || status === "archived" || status === "expired";

  const sections =
    summary?.bundles?.map((b: RoomBundle) => ({
      key: b.id,
      bundle: b,
      data: collapsed.has(b.id) ? [] : b.items,
    })) ?? [];

  const allItems = summary?.bundles?.flatMap((b) => b.items) ?? [];
  const totalValue = allItems.reduce(
    (sum, i) => sum + (i.actual_listing_price ?? i.predicted_listing_price ?? 0),
    0
  );

  const title =
    summary?.title ?? (summary?.suburb ? `${summary.suburb} Sale` : "Untitled Sale");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title={title} />

      {isLoading || !summary ? (
        <InventorySkeleton />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item: InventoryItem) => item.id}
          stickySectionHeadersEnabled={false}
          ListHeaderComponent={
            <StatusHero
              status={summary.status}
              itemCount={allItems.length}
              totalValue={totalValue}
              onPublish={() => setShowPublish(true)}
              onUnpublish={() =>
                Alert.alert("Unpublish sale?", "It will be removed from the marketplace.", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Unpublish", onPress: () => unpublishMut.mutate() },
                ])
              }
              onReestimate={() =>
                Alert.alert(
                  "Re-estimate all prices?",
                  "AI will reprice every available item. Manual prices will be overwritten.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Re-estimate", onPress: () => reestimateAll() },
                  ]
                )
              }
              reestimating={reestimating}
              unpublishing={unpublishMut.isPending}
            />
          }
          renderSectionHeader={({ section }) => {
            const b = section.bundle as RoomBundle;
            const available = b.items.filter(
              (i) => !i.sale_status || i.sale_status === "available"
            ).length;
            const allSold = b.items.length > 0 && available === 0;
            const isCollapsed = collapsed.has(b.id);
            return (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 8,
                  paddingHorizontal: 16,
                  paddingTop: 18,
                  paddingBottom: 8,
                  backgroundColor: colors.surface,
                }}
              >
                <ScalePressable
                  onPress={() => toggleCollapse(b.id)}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: !isCollapsed }}
                  accessibilityLabel={`${b.name} bundle, ${b.items.length} items`}
                  style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}
                >
                  <Ionicons
                    name={isCollapsed ? "chevron-forward" : "chevron-down"}
                    size={15}
                    color={colors.ink400}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText variant="heading" numberOfLines={1} style={{ fontSize: 15.5 }}>
                      {b.name}
                    </AppText>
                    <AppText variant="caption" tone="faint">
                      {b.items.length} item{b.items.length !== 1 ? "s" : ""} · {available} available
                    </AppText>
                  </View>
                </ScalePressable>
                <ScalePressable
                  onPress={() => setRenamingBundle(b)}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${b.name}`}
                  style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}
                >
                  <Ionicons name="pencil-outline" size={16} color={colors.ink400} />
                </ScalePressable>
                {!allSold && isLive ? (
                  <Button label="Mark sold" size="sm" variant="secondary" onPress={() => setSoldBundle(b)} />
                ) : null}
              </View>
            );
          }}
          renderItem={({ item, section }) => (
            <ItemRow
              item={item}
              onPress={() => setSelectedItem({ item, bundleId: (section.bundle as RoomBundle).id })}
            />
          )}
          ItemSeparatorComponent={() => (
            <View style={{ height: 1, backgroundColor: colors.surfaceContainer, marginLeft: 84 }} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon="cube-outline"
              title="No items yet"
              body="Items appear here once processing finishes."
              compact
            />
          }
          ListFooterComponent={
            <View style={{ padding: 16, paddingBottom: 40, gap: 10 }}>
              {!isTerminal ? (
                <Button
                  label="Archive sale"
                  variant="ghost"
                  block
                  loading={archiveMut.isPending}
                  onPress={() =>
                    Alert.alert(
                      "Archive sale?",
                      "This sale will be archived and removed from the marketplace.",
                      [
                        { text: "Cancel", style: "cancel" },
                        { text: "Archive", style: "destructive", onPress: () => archiveMut.mutate() },
                      ]
                    )
                  }
                />
              ) : null}
            </View>
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

      {selectedItem ? (
        <ItemEditSheet
          // Remount per item so field state resets.
          key={selectedItem.item.id}
          item={selectedItem.item}
          eventId={eventId!}
          bundleId={selectedItem.bundleId}
          onClose={() => setSelectedItem(null)}
        />
      ) : null}

      {soldBundle ? (
        <BundleSoldSheet bundle={soldBundle} eventId={eventId!} onClose={() => setSoldBundle(null)} />
      ) : null}

      {renamingBundle ? (
        <RenameBundleSheet
          key={renamingBundle.id}
          bundle={renamingBundle}
          eventId={eventId!}
          onClose={() => setRenamingBundle(null)}
        />
      ) : null}

      <PublishSheet
        visible={showPublish}
        eventId={eventId!}
        saleTitle={title}
        onClose={() => setShowPublish(false)}
      />
    </View>
  );
}
