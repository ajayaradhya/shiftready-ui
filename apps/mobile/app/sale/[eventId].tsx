import { useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getPublicSale, saveSale, unsaveSale } from "@myrio/api";
import { formatAUD, formatDateAU } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { PublicBundle, PublicBundleItem } from "@myrio/types";

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function daysUntil(dateStr: string | null): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function ItemRow({
  item,
  onPress,
}: {
  item: PublicBundleItem;
  onPress: () => void;
}) {
  const isSold = item.sale_status === "sold" || item.sale_status === "withdrawn";
  const isReserved = item.sale_status === "reserved";

  return (
    <TouchableOpacity
      activeOpacity={isSold ? 1 : 0.85}
      onPress={isSold ? undefined : onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "#E0D5C0",
      }}
    >
      <View
        style={{
          width: 52, height: 52, borderRadius: 8, overflow: "hidden",
          backgroundColor: "#EDE5D6", marginRight: 12,
        }}
      >
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 52, height: 52 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 18 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13, fontWeight: "500",
            color: isSold ? "#A09683" : "#1F1B17",
          }}
          numberOfLines={1}
        >
          {item.name}
        </Text>
        {item.brand ? (
          <Text style={{ fontSize: 11, color: "#4F4838", marginTop: 1 }} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
      </View>
      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
        {isSold ? (
          <View
            style={{
              backgroundColor: "#E0D5C0", borderRadius: 4,
              paddingHorizontal: 7, paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, color: "#4F4838", fontWeight: "600" }}>SOLD</Text>
          </View>
        ) : isReserved ? (
          <View
            style={{
              backgroundColor: "#F5DDCF", borderRadius: 4,
              paddingHorizontal: 7, paddingVertical: 2,
            }}
          >
            <Text style={{ fontSize: 10, color: "#B5604A", fontWeight: "600" }}>RESERVED</Text>
          </View>
        ) : (
          <Text style={{ fontSize: 13, fontWeight: "700", color: "#B5604A" }}>
            {formatAUD(item.price)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function BundleSection({
  bundle,
  eventId,
}: {
  bundle: PublicBundle;
  eventId: string;
}) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(true);

  return (
    <View style={{ marginBottom: 12 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => setExpanded(!expanded)}
        style={{
          flexDirection: "row", alignItems: "center", justifyContent: "space-between",
          paddingVertical: 12, paddingHorizontal: 14,
          backgroundColor: "#F5F0E8",
          borderRadius: expanded ? 12 : 12,
          borderBottomLeftRadius: expanded ? 0 : 12,
          borderBottomRightRadius: expanded ? 0 : 12,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#1F1B17" }}>
            {bundle.name ?? "Items"}
          </Text>
          <Text style={{ fontSize: 11, color: "#4F4838", marginTop: 1 }}>
            {bundle.items.length} item{bundle.items.length !== 1 ? "s" : ""}
            {" · "}
            {formatAUD(bundle.bundlePrice)}
          </Text>
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={16}
          color="#A09683"
        />
      </TouchableOpacity>

      {expanded && (
        <View
          style={{
            paddingHorizontal: 14, paddingBottom: 4,
            backgroundColor: "#FBF8F3",
            borderWidth: 1, borderTopWidth: 0, borderColor: "#E0D5C0",
            borderBottomLeftRadius: 12, borderBottomRightRadius: 12,
          }}
        >
          {bundle.items.length === 0 ? (
            <Text style={{ fontSize: 13, color: "#A09683", paddingVertical: 12 }}>
              No items in this bundle.
            </Text>
          ) : (
            bundle.items.map((item) => (
              <ItemRow
                key={item.id}
                item={item}
                onPress={() => router.push({ pathname: "/item/[eventId]/[bundleId]/[itemId]", params: { eventId, bundleId: bundle.id, itemId: item.id } })}
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

export default function SaleDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ["public-sale", eventId],
    queryFn: () => getPublicSale(eventId),
    staleTime: 60_000,
  });

  const [savedOptimistic, setSavedOptimistic] = useState<boolean | null>(null);
  const isSaved = savedOptimistic !== null ? savedOptimistic : (sale?.is_saved ?? false);

  async function toggleSave() {
    if (!user || !sale) return;
    const next = !isSaved;
    setSavedOptimistic(next);
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
    days == null ? null
    : days <= 0 ? "Sale ended"
    : days === 1 ? "Last day!"
    : `${days} days left`;

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
          {sale?.title || "Moving Sale"}
        </Text>
        {user && (
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
      ) : error || !sale ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 14, color: "#4F4838", textAlign: "center" }}>
            Could not load this sale.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 48 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Cover image */}
          {sale.cover_image_url ? (
            <View style={{ width: "100%", height: 220, backgroundColor: "#EDE5D6" }}>
              <Image
                source={{ uri: sale.cover_image_url }}
                style={{ width: "100%", height: 220 }}
                resizeMode="cover"
              />
            </View>
          ) : null}

          {/* Sale info */}
          <View style={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}>
            <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F1B17" }}>
              {sale.title ||
                (sale.suburb ? `${titleCase(sale.suburb)} Moving Sale` : "Moving Sale")}
            </Text>

            {/* Meta chips */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 12, gap: 8 }}>
              {sale.suburb ? (
                <View
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: "#F5F0E8", borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 6,
                  }}
                >
                  <Ionicons name="location-outline" size={12} color="#A09683" />
                  <Text style={{ fontSize: 12, color: "#4F4838", marginLeft: 4 }}>
                    {titleCase(sale.suburb)}{sale.state ? `, ${sale.state}` : ""}
                  </Text>
                </View>
              ) : null}
              {sale.moveOutDate ? (
                <View
                  style={{
                    flexDirection: "row", alignItems: "center",
                    backgroundColor: "#F5F0E8", borderRadius: 8,
                    paddingHorizontal: 10, paddingVertical: 6,
                  }}
                >
                  <Ionicons name="calendar-outline" size={12} color="#A09683" />
                  <Text style={{ fontSize: 12, color: "#4F4838", marginLeft: 4 }}>
                    Move out {formatDateAU(sale.moveOutDate)}
                  </Text>
                </View>
              ) : null}
              {urgencyLabel ? (
                <View
                  style={{
                    backgroundColor: days != null && days <= 3 ? "#F5DDCF" : "#F5F0E8",
                    borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12, fontWeight: "600",
                      color: days != null && days <= 3 ? "#B5604A" : "#4F4838",
                    }}
                  >
                    {urgencyLabel}
                  </Text>
                </View>
              ) : null}
            </View>

            {sale.sellerUsername ? (
              <Text style={{ fontSize: 12, color: "#A09683", marginTop: 8 }}>
                Sold by @{sale.sellerUsername}
              </Text>
            ) : null}

            {sale.description ? (
              <Text
                style={{
                  fontSize: 14, color: "#4F4838", marginTop: 12, lineHeight: 20,
                }}
              >
                {sale.description}
              </Text>
            ) : null}
          </View>

          {/* Divider */}
          <View
            style={{ height: 1, backgroundColor: "#E0D5C0", marginHorizontal: 16, marginVertical: 16 }}
          />

          {/* Bundles */}
          <View style={{ paddingHorizontal: 16 }}>
            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1F1B17", marginBottom: 12 }}>
              {sale.bundles.length} bundle{sale.bundles.length !== 1 ? "s" : ""}
            </Text>
            {sale.bundles.length === 0 ? (
              <Text style={{ fontSize: 14, color: "#A09683" }}>No items listed yet.</Text>
            ) : (
              sale.bundles.map((bundle) => (
                <BundleSection key={bundle.id} bundle={bundle} eventId={eventId} />
              ))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
