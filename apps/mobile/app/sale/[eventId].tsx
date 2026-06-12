import { useMemo, useState } from "react";
import { View, ScrollView, LayoutAnimation, Platform, UIManager } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPublicSale, saveSale, unsaveSale, startConversation, setPin } from "@myrio/api";
import { formatAUD, formatDateAU } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { PublicBundle, PublicBundleItem } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Avatar,
  Button,
  Chip,
  EmptyState,
  IconButton,
  ItemImage,
  PriceText,
  ScalePressable,
  Skeleton,
  StackHeader,
  triggerHaptic,
} from "@/components/ui";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function ItemRow({ item, onPress }: { item: PublicBundleItem; onPress: () => void }) {
  const isSold = item.sale_status === "sold" || item.sale_status === "withdrawn";
  const isReserved = item.sale_status === "reserved";

  return (
    <ScalePressable
      onPress={isSold ? undefined : onPress}
      haptic="selection"
      disabled={isSold}
      accessibilityRole="button"
      accessibilityLabel={`${item.name ?? "Item"}${isSold ? ", sold" : isReserved ? ", reserved" : `, ${formatAUD(item.price)}`}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 10,
        gap: 12,
      }}
    >
      <ItemImage
        uri={item.image_url}
        width={64}
        height={64}
        borderRadius={radius.md}
        recyclingKey={item.id}
        style={isSold ? { opacity: 0.45 } : undefined}
      />
      <View style={{ flex: 1 }}>
        <AppText
          weight="medium"
          numberOfLines={1}
          style={{ fontSize: 14, color: isSold ? colors.ink300 : colors.onSurface }}
        >
          {item.name}
        </AppText>
        {item.brand ? (
          <AppText variant="caption" tone="faint" numberOfLines={1} style={{ marginTop: 1 }}>
            {item.brand}
          </AppText>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end" }}>
        {isSold ? (
          <Chip label="Sold" status="sold" size="sm" />
        ) : isReserved ? (
          <Chip label="Reserved" status="reserved" size="sm" />
        ) : (
          <PriceText value={item.price} size={14} />
        )}
      </View>
      {!isSold ? <Ionicons name="chevron-forward" size={15} color={colors.ink300} /> : null}
    </ScalePressable>
  );
}

function BundleSection({ bundle, eventId }: { bundle: PublicBundle; eventId: string }) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);
  const savings = bundle.itemTotal - bundle.bundlePrice;

  return (
    <View
      style={{
        marginBottom: 12,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
        backgroundColor: colors.surfaceLow,
        overflow: "hidden",
      }}
    >
      <ScalePressable
        onPress={() => {
          triggerHaptic("selection");
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setExpanded(!expanded);
        }}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${bundle.name ?? "Items"} bundle, ${bundle.items.length} items`}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: 14,
          paddingHorizontal: 14,
          backgroundColor: colors.surfaceContainer,
        }}
      >
        <View style={{ flex: 1 }}>
          <AppText variant="heading" style={{ fontSize: 15 }}>
            {bundle.name ?? "Items"}
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 }}>
            <AppText variant="caption" tone="muted">
              {bundle.items.length} item{bundle.items.length !== 1 ? "s" : ""} · {formatAUD(bundle.bundlePrice)}
            </AppText>
            {savings > 0 ? (
              <AppText variant="caption" weight="semibold" tone="success">
                Save {formatAUD(savings)} bundling
              </AppText>
            ) : null}
          </View>
        </View>
        <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.outline} />
      </ScalePressable>

      {expanded ? (
        <View style={{ paddingHorizontal: 14, paddingVertical: 4 }}>
          {bundle.items.length === 0 ? (
            <AppText variant="caption" tone="faint" style={{ paddingVertical: 12 }}>
              No items in this bundle.
            </AppText>
          ) : (
            bundle.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onPress={() =>
                  router.push({
                    pathname: "/item/[eventId]/[bundleId]/[itemId]",
                    params: { eventId, bundleId: bundle.id, itemId: item.id },
                  })
                }
              />
            ))
          )}
        </View>
      ) : null}
    </View>
  );
}

function SaleSkeleton() {
  return (
    <View>
      <Skeleton width="100%" height={280} borderRadius={0} />
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton width="75%" height={24} />
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Skeleton width={110} height={30} borderRadius={999} />
          <Skeleton width={140} height={30} borderRadius={999} />
        </View>
        <Skeleton width="100%" height={60} borderRadius={16} />
        <Skeleton width="100%" height={180} borderRadius={16} />
      </View>
    </View>
  );
}

export default function SaleDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sale, isLoading, error, refetch } = useQuery({
    queryKey: ["public-sale", eventId],
    queryFn: () => getPublicSale(eventId),
    staleTime: 60_000,
  });

  const [savedOptimistic, setSavedOptimistic] = useState<boolean | null>(null);
  const isSaved = savedOptimistic !== null ? savedOptimistic : (sale?.is_saved ?? false);
  const [messaging, setMessaging] = useState(false);

  async function handleMessageSeller() {
    if (!user || !sale?.sellerId) return;
    setMessaging(true);
    try {
      const res = await startConversation(sale.sellerId, undefined, { saleEventId: eventId });
      if (res.created) {
        // New conversations have no pin; attach the sale so the thread has context.
        setPin(res.conversationId, { kind: "sale", saleEventId: eventId }).catch(() => {});
      }
      router.push({
        pathname: "/conversation/[convId]",
        params: {
          convId: res.conversationId,
          name: sale.sellerUsername ?? "",
          pinName: title,
          pinImage: sale.cover_image_url ?? "",
        },
      });
    } catch {
      // Non-fatal; user can retry.
    } finally {
      setMessaging(false);
    }
  }

  async function toggleSave() {
    if (!user || !sale) return;
    const next = !isSaved;
    setSavedOptimistic(next);
    triggerHaptic("light");
    try {
      if (next) await saveSale(eventId);
      else await unsaveSale(eventId);
      qc.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSavedOptimistic(!next);
    }
  }

  const days = daysUntil(sale?.moveOutDate ?? null);
  const urgencyLabel =
    days == null ? null : days <= 0 ? "Sale ended" : days === 1 ? "Last day!" : `${days} days left`;

  const priceRange = useMemo(() => {
    const prices =
      sale?.bundles.flatMap((b) =>
        b.items.filter((i) => i.sale_status !== "sold" && i.sale_status !== "withdrawn").map((i) => i.price)
      ) ?? [];
    if (prices.length === 0) return null;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return min === max ? formatAUD(min) : `${formatAUD(min)} – ${formatAUD(max)}`;
  }, [sale?.bundles]);

  const hasCover = !!sale?.cover_image_url;
  const title = sale?.title || (sale?.suburb ? `${titleCase(sale.suburb)} Moving Sale` : "Moving Sale");

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {isLoading ? (
        <>
          <StackHeader title="" />
          <SaleSkeleton />
        </>
      ) : error || !sale ? (
        <>
          <StackHeader title="Moving sale" />
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load this sale"
            body="It may have ended, or your connection dropped."
            ctaLabel="Retry"
            onCtaPress={() => refetch()}
          />
        </>
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 110 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Cover with floating controls */}
            {hasCover ? (
              <View>
                <ItemImage uri={sale.cover_image_url} height={280} fallbackIcon="home-outline" />
                <View
                  style={{
                    position: "absolute",
                    top: insets.top + 8,
                    left: 16,
                    right: 16,
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <IconButton icon="arrow-back" floating accessibilityLabel="Go back" onPress={() => router.back()} />
                  {user ? (
                    <IconButton
                      icon={isSaved ? "heart" : "heart-outline"}
                      color={isSaved ? colors.clay600 : colors.onSurface}
                      floating
                      accessibilityLabel={isSaved ? "Remove from saved" : "Save this sale"}
                      onPress={toggleSave}
                    />
                  ) : null}
                </View>
              </View>
            ) : (
              <StackHeader
                title=""
                right={
                  user ? (
                    <IconButton
                      icon={isSaved ? "heart" : "heart-outline"}
                      color={isSaved ? colors.clay600 : colors.onSurface}
                      accessibilityLabel={isSaved ? "Remove from saved" : "Save this sale"}
                      onPress={toggleSave}
                    />
                  ) : undefined
                }
              />
            )}

            {/* Sale info */}
            <View style={{ paddingHorizontal: 16, paddingTop: 18 }}>
              <AppText variant="title">{title}</AppText>

              <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 }}>
                {sale.suburb ? (
                  <Chip
                    icon="location-outline"
                    label={`${titleCase(sale.suburb)}${sale.state ? `, ${sale.state}` : ""}`}
                  />
                ) : null}
                {sale.moveOutDate ? (
                  <Chip icon="calendar-outline" label={`Move out ${formatDateAU(sale.moveOutDate)}`} />
                ) : null}
                {urgencyLabel ? (
                  <Chip
                    label={urgencyLabel}
                    status={days != null && days <= 3 ? "urgent" : "neutral"}
                  />
                ) : null}
              </View>

              {sale.sellerUsername ? (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                    marginTop: 16,
                    paddingVertical: 10,
                    paddingHorizontal: 12,
                    backgroundColor: colors.surfaceLow,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <Avatar name={sale.sellerUsername} size={36} />
                  <View style={{ flex: 1 }}>
                    <AppText weight="semibold" style={{ fontSize: 14 }}>
                      @{sale.sellerUsername}
                    </AppText>
                    <AppText variant="caption" tone="faint">
                      Seller
                    </AppText>
                  </View>
                </View>
              ) : null}

              {sale.description ? (
                <AppText tone="muted" style={{ marginTop: 14 }}>
                  {sale.description}
                </AppText>
              ) : null}
            </View>

            {/* Bundles */}
            <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
              <AppText variant="micro" tone="faint">
                What's for sale
              </AppText>
              <AppText variant="heading" style={{ marginTop: 2, marginBottom: 12 }}>
                {sale.bundles.length} room bundle{sale.bundles.length !== 1 ? "s" : ""}
              </AppText>
              {sale.bundles.length === 0 ? (
                <EmptyState icon="cube-outline" title="No items listed yet" compact />
              ) : (
                sale.bundles.map((bundle) => (
                  <BundleSection key={bundle.id} bundle={bundle} eventId={eventId} />
                ))
              )}
            </View>
          </ScrollView>

          {/* Sticky bottom bar */}
          <View
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              bottom: 0,
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              paddingHorizontal: 16,
              paddingTop: 12,
              paddingBottom: Math.max(insets.bottom, 12),
              backgroundColor: colors.surface,
              borderTopWidth: 1,
              borderTopColor: colors.outlineVariant,
            }}
          >
            <View style={{ flex: 1 }}>
              {priceRange ? (
                <>
                  <AppText variant="micro" tone="faint">
                    Items from
                  </AppText>
                  <AppText weight="bold" style={{ fontSize: 16, color: colors.clay600 }}>
                    {priceRange}
                  </AppText>
                </>
              ) : null}
            </View>
            {user && sale.sellerId && sale.sellerId !== user.uid ? (
              <Button
                label="Message seller"
                icon="chatbubble-outline"
                size="lg"
                loading={messaging}
                onPress={handleMessageSeller}
              />
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}
