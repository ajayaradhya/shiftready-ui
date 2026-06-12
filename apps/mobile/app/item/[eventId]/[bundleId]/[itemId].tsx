import { useState, useRef } from "react";
import {
  View,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPublicItem, getPublicSale, saveItem, unsaveItem, setPin, startConversation } from "@myrio/api";
import { formatAUD, formatDateAU } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { PublicBundleItem, PublicItemImage } from "@myrio/types";
import { MakeOfferSheet } from "@/components/market/MakeOfferSheet";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
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

function ImageGallery({
  images,
  imageUrl,
}: {
  images: PublicItemImage[];
  imageUrl: string | null;
}) {
  const insets = useSafeAreaInsets();
  const { width: SW } = useWindowDimensions();
  const galleryHeight = Math.round(SW * 0.85);
  const [page, setPage] = useState(0);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const listRef = useRef<FlatList<{ url: string }> | null>(null);

  const displayImages: { url: string }[] =
    images.length > 0
      ? images.filter((i): i is PublicItemImage & { url: string } => !!i.url)
      : imageUrl
      ? [{ url: imageUrl }]
      : [];

  if (displayImages.length === 0) {
    return <ItemImage uri={null} height={galleryHeight} fallbackIconSize={48} />;
  }

  return (
    <>
      <View style={{ backgroundColor: colors.surfaceHigh }}>
        <FlatList
          ref={listRef}
          data={displayImages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) =>
            setPage(Math.round(e.nativeEvent.contentOffset.x / SW))
          }
          renderItem={({ item, index }) => (
            <ScalePressable
              pressScale={0.99}
              onPress={() => setLightboxIdx(index)}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Photo ${index + 1} of ${displayImages.length}, tap to expand`}
            >
              <Image
                source={{ uri: item.url }}
                style={{ width: SW, height: galleryHeight }}
                contentFit="cover"
                transition={150}
              />
            </ScalePressable>
          )}
        />
        {displayImages.length > 1 ? (
          <View
            style={{
              position: "absolute",
              bottom: 12,
              alignSelf: "center",
              flexDirection: "row",
              gap: 5,
              backgroundColor: "rgba(20,17,13,0.4)",
              borderRadius: radius.full,
              paddingHorizontal: 8,
              paddingVertical: 5,
            }}
          >
            {displayImages.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 3,
                  backgroundColor: "#fff",
                  opacity: i === page ? 1 : 0.45,
                }}
              />
            ))}
          </View>
        ) : null}
      </View>

      {/* Lightbox */}
      <Modal
        visible={lightboxIdx !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxIdx(null)}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.96)" }}>
          <ScalePressable
            onPress={() => setLightboxIdx(null)}
            accessibilityRole="button"
            accessibilityLabel="Close photo viewer"
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 16,
              zIndex: 10,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "rgba(255,255,255,0.14)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </ScalePressable>
          <FlatList
            data={displayImages}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIdx ?? 0}
            getItemLayout={(_, index) => ({ length: SW, offset: SW * index, index })}
            renderItem={({ item }) => (
              <View style={{ width: SW, flex: 1, alignItems: "center", justifyContent: "center" }}>
                <Image
                  source={{ uri: item.url }}
                  style={{ width: SW, height: SW }}
                  contentFit="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

function MoreFromSaleRail({
  eventId,
  currentItemId,
}: {
  eventId: string;
  currentItemId: string;
}) {
  const router = useRouter();
  const { data: sale } = useQuery({
    queryKey: ["public-sale", eventId],
    queryFn: () => getPublicSale(eventId),
    staleTime: 60_000,
  });

  const others: (PublicBundleItem & { bundleId: string })[] =
    sale?.bundles.flatMap((b) =>
      b.items
        .filter(
          (i) =>
            i.id !== currentItemId &&
            i.sale_status !== "sold" &&
            i.sale_status !== "withdrawn"
        )
        .map((i) => ({ ...i, bundleId: b.id }))
    ) ?? [];

  if (others.length === 0) return null;

  return (
    <View style={{ marginTop: 28 }}>
      <AppText variant="micro" tone="faint" style={{ paddingHorizontal: 16 }}>
        More from this sale
      </AppText>
      <FlatList
        data={others.slice(0, 12)}
        keyExtractor={(i) => i.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 10, paddingTop: 10 }}
        renderItem={({ item }) => (
          <ScalePressable
            onPress={() =>
              router.push({
                pathname: "/item/[eventId]/[bundleId]/[itemId]",
                params: { eventId, bundleId: item.bundleId, itemId: item.id },
              })
            }
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={`${item.name ?? "Item"}, ${formatAUD(item.price)}`}
            style={{
              width: 130,
              backgroundColor: colors.surfaceLow,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              overflow: "hidden",
            }}
          >
            <ItemImage uri={item.image_url} height={100} recyclingKey={item.id} />
            <View style={{ padding: 8 }}>
              <AppText weight="medium" numberOfLines={1} style={{ fontSize: 12.5 }}>
                {item.name}
              </AppText>
              <AppText weight="bold" style={{ fontSize: 13, color: colors.clay600, marginTop: 2 }}>
                {formatAUD(item.price)}
              </AppText>
            </View>
          </ScalePressable>
        )}
      />
    </View>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        paddingVertical: 8,
      }}
    >
      <AppText variant="caption" tone="muted">
        {label}
      </AppText>
      <AppText weight="medium" style={{ fontSize: 14, maxWidth: "60%", textAlign: "right" }}>
        {value}
      </AppText>
    </View>
  );
}

function ItemSkeleton() {
  return (
    <View>
      <Skeleton width="100%" height={320} borderRadius={0} />
      <View style={{ padding: 16, gap: 12 }}>
        <Skeleton width={120} height={28} />
        <Skeleton width="70%" height={20} />
        <Skeleton width="100%" height={140} borderRadius={16} />
      </View>
    </View>
  );
}

export default function ItemDetailScreen() {
  const { eventId, bundleId, itemId } = useLocalSearchParams<{
    eventId: string;
    bundleId: string;
    itemId: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: item, isLoading, error, refetch } = useQuery({
    queryKey: ["public-item", eventId, bundleId, itemId],
    queryFn: () => getPublicItem(eventId, bundleId, itemId),
    staleTime: 60_000,
  });

  const [savedOptimistic, setSavedOptimistic] = useState<boolean | null>(null);
  const isSaved = savedOptimistic !== null ? savedOptimistic : (item?.is_saved ?? false);
  const [messaging, setMessaging] = useState(false);

  async function toggleSave() {
    if (!user || !item) return;
    const next = !isSaved;
    setSavedOptimistic(next);
    triggerHaptic("light");
    try {
      if (next) await saveItem(eventId, bundleId, itemId);
      else await unsaveItem(eventId, bundleId, itemId);
      qc.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSavedOptimistic(!next);
    }
  }

  const isSoldItem = item?.sale_status === "sold";
  const isReserved = item?.sale_status === "reserved";
  const canMessage = !!(user && item?.seller_id && item.seller_id !== user.uid && !isSoldItem);
  const [offerSheet, setOfferSheet] = useState(false);

  const itemImageUrl =
    item?.images?.find((i) => i.is_cover)?.url ?? item?.images?.[0]?.url ?? item?.image_url ?? null;

  function goToConversation(convId: string) {
    router.push({
      pathname: "/conversation/[convId]",
      params: {
        convId,
        // Optimistic pin context so the thread renders instantly (B3).
        pinName: item?.name ?? "",
        pinImage: itemImageUrl ?? "",
        pinPrice: item?.price != null ? String(item.price) : "",
      },
    });
  }

  async function handleMessage() {
    if (!user || !item?.seller_id) return;
    setMessaging(true);
    try {
      const res = await startConversation(item.seller_id, undefined, {
        saleEventId: eventId,
        bundleId,
        itemId,
      });
      if (res.created) {
        // Conversation create ignores context for pinning — set it explicitly.
        setPin(res.conversationId, { kind: "item", saleEventId: eventId, bundleId, itemId }).catch(
          () => {}
        );
      }
      goToConversation(res.conversationId);
    } catch {
      Alert.alert("Error", "Could not start conversation.");
    } finally {
      setMessaging(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader
        title={item?.name ?? ""}
        right={
          user && item && !isSoldItem ? (
            <IconButton
              icon={isSaved ? "heart" : "heart-outline"}
              color={isSaved ? colors.clay600 : colors.onSurface}
              accessibilityLabel={isSaved ? "Remove from saved" : "Save this item"}
              onPress={toggleSave}
            />
          ) : undefined
        }
      />

      {isLoading ? (
        <ItemSkeleton />
      ) : error || !item ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load this item"
          body="It may have been removed, or your connection dropped."
          ctaLabel="Retry"
          onCtaPress={() => refetch()}
        />
      ) : (
        <>
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: canMessage ? 110 : 48 }}
            showsVerticalScrollIndicator={false}
          >
            <ImageGallery images={item.images} imageUrl={item.image_url} />

            {/* Title + price */}
            <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
              {isSoldItem ? (
                <Chip label="Sold" status="sold" style={{ marginBottom: 10 }} />
              ) : isReserved ? (
                <Chip label="Reserved" status="reserved" style={{ marginBottom: 10 }} />
              ) : null}

              <AppText variant="title">{item.name}</AppText>
              {item.brand || item.condition ? (
                <AppText variant="caption" tone="muted" style={{ marginTop: 3 }}>
                  {[item.brand, item.condition].filter(Boolean).join(" · ")}
                </AppText>
              ) : null}

              {!isSoldItem && item.price != null ? (
                <View style={{ marginTop: 12 }}>
                  <PriceText
                    value={item.price}
                    size={28}
                    originalValue={item.original_price}
                    showSavePct
                  />
                </View>
              ) : null}
            </View>

            {/* Details */}
            {(item.condition || item.year || item.original_price != null || item.dimensions || item.material || item.is_fragile || item.disassembly_required) ? (
              <View
                style={{
                  marginHorizontal: 16,
                  marginTop: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: colors.surfaceLow,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                }}
              >
                {item.condition ? <DetailRow label="Condition" value={item.condition} /> : null}
                {item.year ? <DetailRow label="Year" value={String(item.year)} /> : null}
                {item.dimensions ? <DetailRow label="Dimensions" value={item.dimensions} /> : null}
                {item.material ? <DetailRow label="Material" value={item.material} /> : null}
                {item.is_fragile ? <DetailRow label="Fragile" value="Yes — handle with care" /> : null}
                {item.disassembly_required ? <DetailRow label="Disassembly" value="Required" /> : null}
              </View>
            ) : null}

            {/* From the sale — tappable card */}
            {(item.suburb || item.bundle_name || item.sale_title) ? (
              <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
                <AppText variant="micro" tone="faint" style={{ marginBottom: 8 }}>
                  From the sale
                </AppText>
                <ScalePressable
                  onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId } })}
                  haptic="selection"
                  accessibilityRole="button"
                  accessibilityLabel={`View full sale${item.sale_title ? `: ${item.sale_title}` : ""}`}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 12,
                    padding: 12,
                    backgroundColor: colors.surfaceLow,
                    borderRadius: radius.lg,
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: radius.md,
                      backgroundColor: colors.surfaceContainer,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="home-outline" size={20} color={colors.outline} />
                  </View>
                  <View style={{ flex: 1 }}>
                    {item.sale_title ? (
                      <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 14 }}>
                        {item.sale_title}
                      </AppText>
                    ) : null}
                    <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 1 }}>
                      {[
                        item.bundle_name ? `${item.bundle_name} bundle` : null,
                        item.suburb ? `Pickup in ${item.suburb}` : null,
                        item.move_out_date ? `until ${formatDateAU(item.move_out_date)}` : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </AppText>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.ink300} />
                </ScalePressable>
              </View>
            ) : null}

            {/* More from this sale */}
            <MoreFromSaleRail eventId={eventId} currentItemId={itemId} />
          </ScrollView>

          {/* Sticky CTA bar */}
          {canMessage ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                flexDirection: "row",
                alignItems: "center",
                gap: 10,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.outlineVariant,
              }}
            >
              <Button
                label={messaging ? "Opening…" : "Message seller"}
                icon="chatbubble-outline"
                size="lg"
                loading={messaging}
                onPress={handleMessage}
                style={{ flex: 1 }}
              />
              {!isReserved && item.price != null ? (
                <Button
                  label="Make offer"
                  icon="pricetag-outline"
                  size="lg"
                  variant="secondary"
                  onPress={() => setOfferSheet(true)}
                />
              ) : null}
            </View>
          ) : (isSoldItem || isReserved) && user ? (
            <View
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                paddingHorizontal: 16,
                paddingTop: 12,
                paddingBottom: Math.max(insets.bottom, 12),
                backgroundColor: colors.surface,
                borderTopWidth: 1,
                borderTopColor: colors.outlineVariant,
              }}
            >
              <Button
                label="See more from this sale"
                size="lg"
                variant="secondary"
                block
                onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId } })}
              />
            </View>
          ) : null}

          {user && item.seller_id ? (
            <MakeOfferSheet
              visible={offerSheet}
              target={{
                sellerId: item.seller_id,
                eventId,
                bundleId,
                itemId,
                itemName: item.name ?? "Item",
                imageUrl: itemImageUrl,
                listPrice: item.price,
              }}
              onClose={() => setOfferSheet(false)}
              onSent={(convId) => {
                setOfferSheet(false);
                goToConversation(convId);
              }}
            />
          ) : null}
        </>
      )}
    </View>
  );
}
