import { useState, useRef } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator, Modal, Dimensions, FlatList,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPublicItem, saveItem, unsaveItem } from "@shiftready/api";
import { formatAUD, formatDateAU } from "@shiftready/core";
import { useAuth } from "@/contexts/auth-context";
import type { PublicItemImage } from "@shiftready/types";

const { width: SW } = Dimensions.get("window");

function ImageGallery({
  images,
  imageUrl,
}: {
  images: PublicItemImage[];
  imageUrl: string | null;
}) {
  const insets = useSafeAreaInsets();
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const listRef = useRef<FlatList<{ url: string }> | null>(null);

  const displayImages: { url: string }[] =
    images.length > 0
      ? images.filter((i): i is PublicItemImage & { url: string } => !!i.url)
      : imageUrl
      ? [{ url: imageUrl }]
      : [];

  if (displayImages.length === 0) {
    return (
      <View
        style={{
          width: "100%", height: 300, backgroundColor: "#EDE5D6",
          alignItems: "center", justifyContent: "center",
        }}
      >
        <Text style={{ fontSize: 52 }}>📦</Text>
      </View>
    );
  }

  return (
    <>
      <View style={{ backgroundColor: "#EDE5D6" }}>
        <FlatList
          ref={listRef}
          data={displayImages}
          keyExtractor={(_, i) => String(i)}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              activeOpacity={0.95}
              onPress={() => setLightboxIdx(index)}
            >
              <Image
                source={{ uri: item.url }}
                style={{ width: SW, height: 320 }}
                resizeMode="cover"
              />
            </TouchableOpacity>
          )}
        />
        {displayImages.length > 1 && (
          <View
            style={{
              flexDirection: "row", justifyContent: "center",
              paddingVertical: 8, gap: 5,
            }}
          >
            {displayImages.map((_, i) => (
              <View
                key={i}
                style={{
                  width: 6, height: 6, borderRadius: 3,
                  backgroundColor: "#B5604A", opacity: 0.45,
                }}
              />
            ))}
          </View>
        )}
      </View>

      {/* Lightbox modal */}
      <Modal
        visible={lightboxIdx !== null}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setLightboxIdx(null)}
      >
        <View
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.96)" }}
        >
          <TouchableOpacity
            onPress={() => setLightboxIdx(null)}
            style={{
              position: "absolute",
              top: insets.top + 12, right: 16,
              zIndex: 10, padding: 8,
              backgroundColor: "rgba(255,255,255,0.12)",
              borderRadius: 20,
            }}
          >
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <FlatList
            data={displayImages}
            keyExtractor={(_, i) => String(i)}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            initialScrollIndex={lightboxIdx ?? 0}
            getItemLayout={(_, index) => ({
              length: SW, offset: SW * index, index,
            })}
            renderItem={({ item }) => (
              <View
                style={{
                  width: SW, flex: 1,
                  alignItems: "center", justifyContent: "center",
                }}
              >
                <Image
                  source={{ uri: item.url }}
                  style={{ width: SW, height: SW }}
                  resizeMode="contain"
                />
              </View>
            )}
          />
        </View>
      </Modal>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View
      style={{
        flexDirection: "row", justifyContent: "space-between",
        paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: "#E0D5C0",
      }}
    >
      <Text style={{ fontSize: 13, color: "#4F4838" }}>{label}</Text>
      <Text
        style={{ fontSize: 13, fontWeight: "500", color: "#1F1B17", maxWidth: "60%", textAlign: "right" }}
      >
        {value}
      </Text>
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

  const { data: item, isLoading, error } = useQuery({
    queryKey: ["public-item", eventId, bundleId, itemId],
    queryFn: () => getPublicItem(eventId, bundleId, itemId),
    staleTime: 60_000,
  });

  const [savedOptimistic, setSavedOptimistic] = useState<boolean | null>(null);
  const isSaved = savedOptimistic !== null ? savedOptimistic : (item?.is_saved ?? false);

  async function toggleSave() {
    if (!user || !item) return;
    const next = !isSaved;
    setSavedOptimistic(next);
    try {
      if (next) await saveItem(eventId, bundleId, itemId);
      else await unsaveItem(eventId, bundleId, itemId);
      qc.invalidateQueries({ queryKey: ["saved"] });
    } catch {
      setSavedOptimistic(!next);
    }
  }

  const isSoldItem = item?.sale_status === "sold";

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row", alignItems: "center",
          paddingHorizontal: 16, paddingVertical: 12,
          borderBottomWidth: 1, borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
        }}
      >
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }}>
          <Ionicons name="arrow-back" size={22} color="#1F1B17" />
        </TouchableOpacity>
        <Text
          style={{ flex: 1, fontSize: 16, fontWeight: "600", color: "#1F1B17" }}
          numberOfLines={1}
        >
          {item?.name ?? "Item"}
        </Text>
        {user && item && !isSoldItem && (
          <TouchableOpacity onPress={toggleSave} style={{ padding: 4, marginLeft: 8 }}>
            <Ionicons
              name={isSaved ? "heart" : "heart-outline"}
              size={22}
              color={isSaved ? "#B5604A" : "#A09683"}
            />
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : error || !item ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 14, color: "#4F4838", textAlign: "center" }}>
            Could not load this item.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          <ImageGallery images={item.images} imageUrl={item.image_url} />

          {/* Price + name */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            {isSoldItem ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#E0D5C0", borderRadius: 6,
                  paddingHorizontal: 10, paddingVertical: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#4F4838" }}>SOLD</Text>
              </View>
            ) : item.sale_status === "reserved" ? (
              <View
                style={{
                  alignSelf: "flex-start",
                  backgroundColor: "#F5DDCF", borderRadius: 6,
                  paddingHorizontal: 10, paddingVertical: 4,
                  marginBottom: 8,
                }}
              >
                <Text style={{ fontSize: 11, fontWeight: "700", color: "#B5604A" }}>RESERVED</Text>
              </View>
            ) : (
              <Text
                style={{ fontSize: 28, fontWeight: "800", color: "#B5604A", marginBottom: 4 }}
              >
                {formatAUD(item.price)}
              </Text>
            )}

            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F1B17" }}>
              {item.name}
            </Text>
            {item.brand ? (
              <Text style={{ fontSize: 13, color: "#4F4838", marginTop: 2 }}>
                {item.brand}
              </Text>
            ) : null}
          </View>

          {/* Details table */}
          <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
            {item.condition ? <DetailRow label="Condition" value={item.condition} /> : null}
            {item.year ? <DetailRow label="Year" value={String(item.year)} /> : null}
            {item.original_price != null ? (
              <DetailRow label="Original price" value={formatAUD(item.original_price)} />
            ) : null}
            {item.dimensions ? <DetailRow label="Dimensions" value={item.dimensions} /> : null}
            {item.material ? <DetailRow label="Material" value={item.material} /> : null}
            {item.is_fragile ? (
              <DetailRow label="Fragile" value="Yes — handle with care" />
            ) : null}
            {item.disassembly_required ? (
              <DetailRow label="Disassembly" value="Required" />
            ) : null}
          </View>

          {/* Context */}
          {(item.suburb || item.bundle_name || item.sale_title) ? (
            <View
              style={{
                paddingHorizontal: 16, marginTop: 20, paddingTop: 16,
                borderTopWidth: 1, borderTopColor: "#E0D5C0",
              }}
            >
              <Text
                style={{
                  fontSize: 11, fontWeight: "600", color: "#A09683",
                  textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 8,
                }}
              >
                From the sale
              </Text>
              {item.bundle_name ? (
                <Text style={{ fontSize: 13, color: "#4F4838" }}>
                  Bundle: {item.bundle_name}
                </Text>
              ) : null}
              {item.sale_title ? (
                <Text style={{ fontSize: 13, color: "#4F4838", marginTop: 2 }}>
                  {item.sale_title}
                </Text>
              ) : null}
              {item.suburb ? (
                <Text style={{ fontSize: 13, color: "#4F4838", marginTop: 2 }}>
                  Pickup in {item.suburb}
                </Text>
              ) : null}
              {item.move_out_date ? (
                <Text style={{ fontSize: 13, color: "#4F4838", marginTop: 2 }}>
                  Move out {formatDateAU(item.move_out_date)}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* CTA */}
          <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId } })}
              style={{
                backgroundColor: "#B5604A", borderRadius: 12,
                paddingVertical: 14, alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "600", fontSize: 15 }}>
                View full sale
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
