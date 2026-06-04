import {
  View, Text, ScrollView, FlatList,
  TouchableOpacity, Image, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getLandingData } from "@shiftready/api";
import { formatAUD } from "@shiftready/core";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { ActiveSaleSummary, MarketplaceItem } from "@shiftready/types";

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function SaleCard({ sale }: { sale: ActiveSaleSummary }) {
  const router = useRouter();
  const title = sale.title || (sale.suburb ? `${titleCase(sale.suburb)} Sale` : "Moving Sale");
  const coverUrl = sale.cover_image_url || sale.preview_images?.[0];

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId: sale.eventId } })}
      style={{
        width: 176,
        marginRight: 12,
        borderRadius: 14,
        overflow: "hidden",
        backgroundColor: "#FBF8F3",
        borderWidth: 1,
        borderColor: "#E0D5C0",
      }}
    >
      <View style={{ width: 176, height: 128, backgroundColor: "#EDE5D6" }}>
        {coverUrl ? (
          <Image source={{ uri: coverUrl }} style={{ width: 176, height: 128 }} resizeMode="cover" />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 32 }}>📦</Text>
          </View>
        )}
        <View
          style={{
            position: "absolute", bottom: 8, left: 8,
            backgroundColor: "#B5604A", borderRadius: 5,
            paddingHorizontal: 7, paddingVertical: 2,
          }}
        >
          <Text style={{ color: "#fff", fontSize: 10, fontWeight: "600" }}>
            {sale.itemCount} items
          </Text>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <Text
          className="text-sm font-semibold text-on-surface"
          numberOfLines={1}
        >
          {title}
        </Text>
        <Text
          className="text-xs text-on-surface-variant"
          style={{ marginTop: 2 }}
          numberOfLines={1}
        >
          {sale.minPrice != null ? `from ${formatAUD(sale.minPrice)}` : "POA"}
          {sale.suburb ? ` · ${titleCase(sale.suburb)}` : ""}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ItemRow({ item }: { item: MarketplaceItem }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId: item.eventId } })}
      style={{
        flexDirection: "row",
        marginBottom: 8,
        borderRadius: 12,
        overflow: "hidden",
        backgroundColor: "#FBF8F3",
        borderWidth: 1,
        borderColor: "#E0D5C0",
      }}
    >
      <View style={{ width: 76, height: 76, backgroundColor: "#EDE5D6" }}>
        {item.thumb_url ? (
          <Image
            source={{ uri: item.thumb_url }}
            style={{ width: 76, height: 76 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 12, justifyContent: "center" }}>
        <Text className="text-sm font-semibold text-on-surface" numberOfLines={1}>
          {item.name}
        </Text>
        <Text className="text-xs text-on-surface-variant" numberOfLines={1}>
          {[item.brand, item.condition].filter(Boolean).join(" · ")}
        </Text>
        <Text
          style={{ fontSize: 14, fontWeight: "700", color: "#B5604A", marginTop: 4 }}
        >
          {formatAUD(item.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useQuery({
    queryKey: ["landing"],
    queryFn: () => getLandingData(),
    staleTime: 60_000,
  });

  const hasSales = (data?.active_sales?.length ?? 0) > 0;
  const hasItems = (data?.items?.length ?? 0) > 0;

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
        }}
      >
        <Text className="text-2xl font-bold text-on-surface">The Marketplace</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : error ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-on-surface-variant text-sm text-center">
            Could not load listings. Check your connection.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Active Sales horizontal scroll */}
          {hasSales && (
            <View style={{ marginTop: 20 }}>
              <Text
                style={{
                  fontSize: 15, fontWeight: "600",
                  color: "#1F1B17", paddingHorizontal: 16, marginBottom: 12,
                }}
              >
                Moving sales live now
              </Text>
              <FlatList
                data={data!.active_sales}
                keyExtractor={(s) => s.eventId}
                renderItem={({ item }) => <SaleCard sale={item} />}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 16 }}
              />
            </View>
          )}

          {/* Items feed */}
          {hasItems && (
            <View style={{ marginTop: 24, paddingHorizontal: 16 }}>
              <Text
                style={{
                  fontSize: 15, fontWeight: "600",
                  color: "#1F1B17", marginBottom: 12,
                }}
              >
                Everything on the belt
              </Text>
              {data!.items.map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </View>
          )}

          {/* Empty */}
          {!hasSales && !hasItems && (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 48 }}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
              <Text
                style={{ fontSize: 16, fontWeight: "600", color: "#1F1B17", marginBottom: 6 }}
              >
                Belt is empty
              </Text>
              <Text style={{ fontSize: 14, color: "#4F4838", textAlign: "center" }}>
                No active sales yet. Check back soon.
              </Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}
