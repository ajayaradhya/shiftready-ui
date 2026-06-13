import { useState, useRef, useCallback } from "react";
import {
  View,
  SectionList,
  Alert,
  RefreshControl,
  LayoutAnimation,
  Platform,
  UIManager,
  TextInput,
  Modal,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Swipeable } from "react-native-gesture-handler";
import { Ionicons } from "@expo/vector-icons";
import {
  getSummary,
  unpublishSale,
  archiveSale,
  repriceBulk,
  markItemSold,
  withdrawItem,
  relistItem,
  deleteItem,
  moveItem,
} from "@myrio/api";
import { formatAUD } from "@myrio/core";
import type { SaleSummary, InventoryItem, RoomBundle } from "@myrio/types";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Chip,
  EmptyState,
  ItemImage,
  ScalePressable,
  Skeleton,
  StackHeader,
  UndoSnackbar,
  triggerHaptic,
  type StatusVariant,
} from "@/components/ui";
import { StatusHero } from "@/components/seller/StatusHero";
import { BundleSoldSheet, RenameBundleSheet } from "@/components/seller/BundleSheets";
import { PublishSheet } from "@/components/seller/PublishSheet";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeOutDown,
} from "@/lib/reanimated";

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

// ── Inline price editor popover ───────────────────────────────────────────
function PricePopover({
  item,
  eventId,
  bundleId,
  onClose,
}: {
  item: InventoryItem;
  eventId: string;
  bundleId: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [price, setPrice] = useState(
    String(item.actual_listing_price ?? item.predicted_listing_price ?? "")
  );
  const inputRef = useRef<TextInput>(null);
  const [repricing, setRepricing] = useState(false);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!price) return;
    setSaving(true);
    try {
      const { patchItem } = await import("@myrio/api");
      await patchItem(eventId, bundleId, item.id, {
        actual_listing_price: Number(price),
      });
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      triggerHaptic("success");
      onClose();
    } catch (e: unknown) {
      Alert.alert("Save failed", (e as Error).message);
      setSaving(false);
    }
  };

  const reprice = async () => {
    setRepricing(true);
    try {
      const { repriceItem: _reprice } = await import("@myrio/api");
      const res = await _reprice(eventId, bundleId, item.id);
      setPrice(String(res.actual_listing_price));
      triggerHaptic("success");
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
    } catch (e: unknown) {
      Alert.alert("Reprice failed", (e as Error).message);
    } finally {
      setRepricing(false);
    }
  };

  return (
    <View style={{ position: "absolute", inset: 0 }}>
      <ScalePressable
        style={{ flex: 1 }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Dismiss"
      />
      <Animated.View
        entering={FadeInUp.duration(150)}
        style={{
          position: "absolute",
          bottom: 16,
          left: 16,
          right: 16,
          backgroundColor: colors.surfaceLow,
          borderRadius: radius.xl,
          padding: 16,
          gap: 12,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
          elevation: 8,
        }}
      >
        <AppText weight="semibold" numberOfLines={1}>
          {item.name}
        </AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <ScalePressable
            onPress={() =>
              setPrice((p) => String(Math.max(0, Number(p || 0) - 5)))
            }
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Decrease by $5"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold">−5</AppText>
          </ScalePressable>
          <TextInput
            ref={inputRef}
            value={price}
            onChangeText={setPrice}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
            accessibilityLabel="Price"
            style={{
              flex: 1,
              fontFamily: fonts.bold,
              fontSize: 22,
              color: colors.onSurface,
              textAlign: "center",
              borderWidth: 1.5,
              borderColor: colors.clay600,
              borderRadius: radius.md,
              paddingVertical: 8,
            }}
          />
          <ScalePressable
            onPress={() => setPrice((p) => String(Number(p || 0) + 5))}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Increase by $5"
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="bold">+5</AppText>
          </ScalePressable>
        </View>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label="AI reprice"
            icon="sparkles"
            variant="secondary"
            style={{ flex: 1 }}
            loading={repricing}
            onPress={reprice}
          />
          <Button
            label="Save"
            style={{ flex: 1 }}
            loading={saving}
            onPress={save}
          />
        </View>
      </Animated.View>
    </View>
  );
}

// ── Item row with swipe + multi-select ───────────────────────────────────
function ItemRow({
  item,
  bundleId,
  eventId,
  isLive,
  selected,
  selectionMode,
  onPress,
  onPricePress,
  onLongPress,
  onToggleSelect,
  onSwipeMarkSold,
  onSwipeWithdrawRelist,
  onSwipeDelete,
}: {
  item: InventoryItem;
  bundleId: string;
  eventId: string;
  isLive: boolean;
  selected: boolean;
  selectionMode: boolean;
  onPress: () => void;
  onPricePress: () => void;
  onLongPress: () => void;
  onToggleSelect: () => void;
  onSwipeMarkSold: () => void;
  onSwipeWithdrawRelist: () => void;
  onSwipeDelete: () => void;
}) {
  const chip =
    ITEM_STATUS_CHIP[item.sale_status ?? "available"] ??
    ITEM_STATUS_CHIP.available;
  const price = item.actual_listing_price ?? item.predicted_listing_price;
  const dimmed =
    item.sale_status === "sold" || item.sale_status === "withdrawn";
  const isWithdrawn = item.sale_status === "withdrawn";

  return (
    <Swipeable
      renderRightActions={() => (
        <View
          style={{
            flexDirection: "row",
            gap: 4,
            marginLeft: 8,
            alignItems: "stretch",
          }}
        >
          {item.sale_status !== "sold" ? (
            <ScalePressable
              onPress={onSwipeMarkSold}
              accessibilityRole="button"
              accessibilityLabel={`Mark ${item.name} sold`}
              style={{
                width: 64,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#16a34a",
                borderRadius: radius.lg,
              }}
            >
              <Ionicons name="checkmark" size={20} color="#fff" />
              <AppText style={{ color: "#fff", fontSize: 10, marginTop: 2 }}>
                Sold
              </AppText>
            </ScalePressable>
          ) : null}
          <ScalePressable
            onPress={onSwipeWithdrawRelist}
            accessibilityRole="button"
            accessibilityLabel={
              isWithdrawn ? `Relist ${item.name}` : `Withdraw ${item.name}`
            }
            style={{
              width: 64,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.surfaceHighest,
              borderRadius: radius.lg,
            }}
          >
            <Ionicons
              name={isWithdrawn ? "refresh" : "eye-off"}
              size={18}
              color={colors.onSurface}
            />
            <AppText style={{ color: colors.onSurface, fontSize: 10, marginTop: 2 }}>
              {isWithdrawn ? "Relist" : "Withdraw"}
            </AppText>
          </ScalePressable>
          <ScalePressable
            onPress={onSwipeDelete}
            accessibilityRole="button"
            accessibilityLabel={`Delete ${item.name}`}
            style={{
              width: 64,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.error,
              borderRadius: radius.lg,
            }}
          >
            <Ionicons name="trash" size={18} color="#fff" />
            <AppText style={{ color: "#fff", fontSize: 10, marginTop: 2 }}>
              Delete
            </AppText>
          </ScalePressable>
        </View>
      )}
      overshootRight={false}
      enabled={!selectionMode}
    >
      <ScalePressable
        onPress={selectionMode ? onToggleSelect : onPress}
        onLongPress={onLongPress}
        haptic="selection"
        pressScale={0.99}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${chip.label}${
          price != null ? `, ${formatAUD(price)}` : ""
        }`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingVertical: 10,
          backgroundColor: selected
            ? colors.surfaceContainer
            : colors.surface,
        }}
      >
        {selectionMode ? (
          <View
            style={{
              width: 22,
              height: 22,
              borderRadius: 11,
              borderWidth: 2,
              borderColor: selected ? colors.clay600 : colors.outline,
              backgroundColor: selected ? colors.clay600 : "transparent",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {selected ? (
              <Ionicons name="checkmark" size={13} color="#fff" />
            ) : null}
          </View>
        ) : null}
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
            style={{
              fontSize: 14.5,
              color: dimmed ? colors.ink300 : colors.onSurface,
            }}
          >
            {item.name}
          </AppText>
          {item.brand || item.condition ? (
            <AppText
              variant="caption"
              tone="faint"
              numberOfLines={1}
              style={{ marginTop: 1 }}
            >
              {[item.brand, item.condition].filter(Boolean).join(" · ")}
            </AppText>
          ) : null}
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <ScalePressable
            onPress={(e) => {
              e.stopPropagation?.();
              if (!selectionMode) onPricePress();
            }}
            accessibilityRole="button"
            accessibilityLabel={`Edit price: ${price != null ? formatAUD(price) : "no price"}`}
            style={{ padding: 4 }}
          >
            <AppText
              weight="bold"
              style={{
                fontSize: 14.5,
                color: dimmed ? colors.ink300 : colors.clay600,
                fontVariant: ["tabular-nums"],
                textDecorationLine: selectionMode ? "none" : "underline",
                textDecorationStyle: "dotted",
                textDecorationColor: colors.clay600,
              }}
            >
              {price != null ? formatAUD(price) : "—"}
            </AppText>
          </ScalePressable>
          {item.sale_status && item.sale_status !== "available" ? (
            <Chip label={chip.label} status={chip.status} size="sm" />
          ) : null}
        </View>
        {!selectionMode ? (
          <Ionicons name="chevron-forward" size={15} color={colors.ink300} />
        ) : null}
      </ScalePressable>
    </Swipeable>
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

  const [soldBundle, setSoldBundle] = useState<RoomBundle | null>(null);
  const [renamingBundle, setRenamingBundle] = useState<RoomBundle | null>(null);
  const [showPublish, setShowPublish] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [reestimating, setReestimating] = useState(false);

  // Inline price popover
  const [priceItem, setPriceItem] = useState<{
    item: InventoryItem;
    bundleId: string;
  } | null>(null);

  // Multi-select
  const [selectionMode, setSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [showMovePicker, setShowMovePicker] = useState(false);

  // Undo delete
  const [undoItem, setUndoItem] = useState<{
    item: InventoryItem;
    bundleId: string;
    label: string;
  } | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const invalidate = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
    [queryClient, eventId]
  );

  async function reestimateAll() {
    if (!summary || reestimating) return;
    setReestimating(true);
    try {
      const res = await repriceBulk(eventId!);
      triggerHaptic(res.repriced === 0 ? "error" : "success");
      invalidate();
      if (res.failed > 0) {
        Alert.alert(
          "Re-estimate finished",
          `${res.repriced} repriced, ${res.failed} failed.`
        );
      }
    } catch (e: unknown) {
      Alert.alert("Re-estimate failed", (e as Error).message);
      triggerHaptic("error");
    } finally {
      setReestimating(false);
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

  function exitSelection() {
    setSelectionMode(false);
    setSelected(new Set());
  }

  function toggleSelect(itemId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  }

  function scheduleUndo(
    item: InventoryItem,
    bundleId: string,
    label: string,
    action: () => void
  ) {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setUndoItem({ item, bundleId, label });
    undoTimer.current = setTimeout(() => {
      action();
      setUndoItem(null);
    }, 3500);
  }

  function undoDelete() {
    if (undoTimer.current) clearTimeout(undoTimer.current);
    triggerHaptic("selection");
    setUndoItem(null);
    invalidate();
  }

  // Multi-select bulk actions
  async function bulkMarkSold() {
    const targets = getSelectedTargets();
    exitSelection();
    for (const t of targets) {
      try {
        await markItemSold(eventId!, t.bundleId, t.itemId, {});
      } catch {
        /* skip */
      }
    }
    invalidate();
    triggerHaptic("success");
  }

  async function bulkWithdraw() {
    const targets = getSelectedTargets();
    exitSelection();
    for (const t of targets) {
      try {
        await withdrawItem(eventId!, t.bundleId, t.itemId);
      } catch {
        /* skip */
      }
    }
    invalidate();
    triggerHaptic("success");
  }

  async function bulkDelete() {
    const targets = getSelectedTargets();
    exitSelection();
    for (const t of targets) {
      try {
        await deleteItem(eventId!, t.bundleId, t.itemId);
      } catch {
        /* skip */
      }
    }
    invalidate();
    triggerHaptic("success");
  }

  async function bulkMove(targetBundleId: string) {
    const targets = getSelectedTargets();
    exitSelection();
    for (const t of targets) {
      try {
        await moveItem(eventId!, t.bundleId, t.itemId, targetBundleId);
      } catch {
        /* skip */
      }
    }
    invalidate();
    triggerHaptic("success");
  }

  function getSelectedTargets(): { bundleId: string; itemId: string }[] {
    if (!summary) return [];
    return summary.bundles.flatMap((b) =>
      b.items
        .filter((i) => selected.has(i.id))
        .map((i) => ({ bundleId: b.id, itemId: i.id }))
    );
  }

  const status = summary?.status;
  const isLive = status === "live" || status === "partially_sold";
  const isTerminal =
    status === "sold" || status === "archived" || status === "expired";

  const sections =
    summary?.bundles?.map((b: RoomBundle) => ({
      key: b.id,
      bundle: b,
      data: collapsed.has(b.id) ? [] : b.items,
    })) ?? [];

  const allItems = summary?.bundles?.flatMap((b) => b.items) ?? [];
  const totalValue = allItems.reduce(
    (sum, i) =>
      sum + (i.actual_listing_price ?? i.predicted_listing_price ?? 0),
    0
  );

  const title =
    summary?.title ??
    (summary?.suburb ? `${summary.suburb} Sale` : "Untitled Sale");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {selectionMode ? (
        <StackHeader
          title={`${selected.size} selected`}
          left={
            <ScalePressable
              onPress={exitSelection}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Exit selection"
              style={{ padding: 4 }}
            >
              <Ionicons name="close" size={22} color={colors.onSurface} />
            </ScalePressable>
          }
        />
      ) : (
        <StackHeader title={title} />
      )}

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
                Alert.alert(
                  "Unpublish sale?",
                  "It will be removed from the marketplace.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Unpublish",
                      onPress: () => unpublishMut.mutate(),
                    },
                  ]
                )
              }
              onReestimate={() =>
                Alert.alert(
                  "Re-estimate all prices?",
                  "AI will reprice every available item. Manual prices will be overwritten.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Re-estimate",
                      onPress: () => reestimateAll(),
                    },
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
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    flex: 1,
                  }}
                >
                  <Ionicons
                    name={isCollapsed ? "chevron-forward" : "chevron-down"}
                    size={15}
                    color={colors.ink400}
                  />
                  <View style={{ flex: 1 }}>
                    <AppText
                      variant="heading"
                      numberOfLines={1}
                      style={{ fontSize: 15.5 }}
                    >
                      {b.name}
                    </AppText>
                    <AppText variant="caption" tone="faint">
                      {b.items.length} item{b.items.length !== 1 ? "s" : ""} ·{" "}
                      {available} available
                    </AppText>
                  </View>
                </ScalePressable>
                <ScalePressable
                  onPress={() => setRenamingBundle(b)}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${b.name}`}
                  style={{
                    width: 44,
                    height: 44,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color={colors.ink400}
                  />
                </ScalePressable>
                {!allSold && isLive ? (
                  <Button
                    label="Mark sold"
                    size="sm"
                    variant="secondary"
                    onPress={() => setSoldBundle(b)}
                  />
                ) : null}
              </View>
            );
          }}
          renderItem={({ item, section }) => {
            const bId = (section.bundle as RoomBundle).id;
            return (
              <ItemRow
                item={item}
                bundleId={bId}
                eventId={eventId!}
                isLive={isLive}
                selected={selected.has(item.id)}
                selectionMode={selectionMode}
                onPress={() =>
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  router.push(`/seller/item/${eventId}/${bId}/${item.id}` as any)
                }
                onPricePress={() => setPriceItem({ item, bundleId: bId })}
                onLongPress={() => {
                  if (!selectionMode) {
                    triggerHaptic("medium");
                    setSelectionMode(true);
                    setSelected(new Set([item.id]));
                  }
                }}
                onToggleSelect={() => toggleSelect(item.id)}
                onSwipeMarkSold={() => {
                  triggerHaptic("success");
                  markItemSold(eventId!, bId, item.id, {})
                    .then(invalidate)
                    .catch((e: Error) =>
                      Alert.alert("Failed", e.message)
                    );
                }}
                onSwipeWithdrawRelist={() => {
                  if (item.sale_status === "withdrawn") {
                    relistItem(eventId!, bId, item.id)
                      .then(() => {
                        triggerHaptic("success");
                        invalidate();
                      })
                      .catch((e: Error) =>
                        Alert.alert("Relist failed", e.message)
                      );
                  } else {
                    withdrawItem(eventId!, bId, item.id)
                      .then(() => {
                        triggerHaptic("selection");
                        invalidate();
                      })
                      .catch((e: Error) =>
                        Alert.alert("Withdraw failed", e.message)
                      );
                  }
                }}
                onSwipeDelete={() => {
                  triggerHaptic("light");
                  // Optimistic removal via undo pattern
                  queryClient.setQueryData<SaleSummary>(
                    ["summary", eventId],
                    (old) => {
                      if (!old) return old;
                      return {
                        ...old,
                        bundles: old.bundles.map((b) =>
                          b.id === bId
                            ? {
                                ...b,
                                items: b.items.filter((i) => i.id !== item.id),
                              }
                            : b
                        ),
                      };
                    }
                  );
                  scheduleUndo(item, bId, `"${item.name}" deleted`, () =>
                    deleteItem(eventId!, bId, item.id)
                      .then(invalidate)
                      .catch((e: Error) =>
                        Alert.alert("Delete failed", e.message)
                      )
                  );
                }}
              />
            );
          }}
          ItemSeparatorComponent={() => (
            <View
              style={{
                height: 1,
                backgroundColor: colors.surfaceContainer,
                marginLeft: 84,
              }}
            />
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
                        {
                          text: "Archive",
                          style: "destructive",
                          onPress: () => archiveMut.mutate(),
                        },
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

      {/* Multi-select action bar */}
      {selectionMode && selected.size > 0 ? (
        <Animated.View
          entering={FadeIn.duration(150)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: colors.surfaceLow,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant,
            padding: 16,
            gap: 10,
          }}
        >
          <ScrollViewRow>
            <Button
              label="Mark sold"
              size="sm"
              onPress={() =>
                Alert.alert(
                  `Mark ${selected.size} sold?`,
                  undefined,
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Mark sold", onPress: bulkMarkSold },
                  ]
                )
              }
            />
            <Button
              label="Move to bundle"
              size="sm"
              variant="secondary"
              onPress={() => setShowMovePicker(true)}
            />
            <Button
              label="Withdraw"
              size="sm"
              variant="secondary"
              onPress={bulkWithdraw}
            />
            <Button
              label="Delete"
              size="sm"
              variant="destructive"
              onPress={() =>
                Alert.alert(
                  `Delete ${selected.size} items?`,
                  "This cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Delete",
                      style: "destructive",
                      onPress: bulkDelete,
                    },
                  ]
                )
              }
            />
          </ScrollViewRow>
        </Animated.View>
      ) : null}

      {/* Undo delete snackbar */}
      {undoItem ? (
        <UndoSnackbar
          message={undoItem.label}
          onUndo={undoDelete}
          bottom={selectionMode ? 80 : 16}
        />
      ) : null}

      {/* Inline price editor */}
      {priceItem ? (
        <PricePopover
          item={priceItem.item}
          eventId={eventId!}
          bundleId={priceItem.bundleId}
          onClose={() => setPriceItem(null)}
        />
      ) : null}

      {soldBundle ? (
        <BundleSoldSheet
          bundle={soldBundle}
          eventId={eventId!}
          onClose={() => setSoldBundle(null)}
        />
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

      {/* Bundle picker for multi-select move */}
      <Modal
        visible={showMovePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMovePicker(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => setShowMovePicker(false)}
        />
        <View
          style={{
            backgroundColor: colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 16,
            paddingBottom: 40,
            maxHeight: "60%",
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          <AppText
            variant="heading"
            style={{ marginBottom: 16, textAlign: "center" }}
          >
            Move to bundle
          </AppText>
          <ScrollView>
            {(summary?.bundles ?? []).map((b) => (
              <TouchableOpacity
                key={b.id}
                onPress={() => {
                  setShowMovePicker(false);
                  bulkMove(b.id);
                }}
                style={{
                  paddingVertical: 14,
                  paddingHorizontal: 12,
                  borderRadius: 10,
                  marginBottom: 4,
                  backgroundColor: colors.surfaceContainer,
                }}
              >
                <AppText variant="body">{b.name}</AppText>
                <AppText variant="micro" tone="faint">
                  {b.items.length} item{b.items.length !== 1 ? "s" : ""}
                </AppText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// Tiny horizontal scroll wrapper for multi-select action buttons
function ScrollViewRow({ children }: { children: React.ReactNode }) {
  const { ScrollView } = require("react-native");
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ gap: 10, flexDirection: "row" }}
    >
      {children}
    </ScrollView>
  );
}
