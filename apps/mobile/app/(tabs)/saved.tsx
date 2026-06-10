import {
  View, Text, ScrollView, TouchableOpacity,
  Image, ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getSaved } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { useAuth } from "@/contexts/auth-context";
import type { SavedSale, SavedItem } from "@myrio/types";

function titleCase(s: string) {
  return s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
}

function SavedSaleRow({ sale }: { sale: SavedSale }) {
  const router = useRouter();
  const days =
    sale.moveOutDate
      ? Math.ceil((new Date(sale.moveOutDate).getTime() - Date.now()) / 86400000)
      : null;

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={() => router.push({ pathname: "/sale/[eventId]", params: { eventId: sale.eventId } })}
      style={{
        flexDirection: "row", alignItems: "center", marginBottom: 8,
        borderRadius: 12, backgroundColor: "#FBF8F3",
        borderWidth: 1, borderColor: "#E0D5C0", padding: 12,
      }}
    >
      <View
        style={{
          width: 48, height: 48, borderRadius: 8, backgroundColor: "#EDE5D6",
          alignItems: "center", justifyContent: "center", marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 20 }}>📦</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F1B17" }} numberOfLines={1}>
          {sale.suburb ? `${titleCase(sale.suburb)} Moving Sale` : "Moving Sale"}
        </Text>
        <Text style={{ fontSize: 11, color: "#4F4838", marginTop: 1 }}>
          {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
          {sale.state ? ` · ${sale.state}` : ""}
        </Text>
        {days != null && days > 0 ? (
          <Text style={{ fontSize: 11, color: "#B5604A", marginTop: 1 }}>
            {days}d left
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={16} color="#A09683" />
    </TouchableOpacity>
  );
}

function SavedItemRow({ item }: { item: SavedItem }) {
  const router = useRouter();

  function handlePress() {
    if (item.eventId && item.bundleId) {
      router.push({ pathname: "/item/[eventId]/[bundleId]/[itemId]", params: { eventId: item.eventId, bundleId: item.bundleId!, itemId: item.itemId } });
    } else if (item.eventId) {
      router.push({ pathname: "/sale/[eventId]", params: { eventId: item.eventId } });
    }
  }

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      style={{
        flexDirection: "row", alignItems: "center", marginBottom: 8,
        borderRadius: 12, backgroundColor: "#FBF8F3",
        borderWidth: 1, borderColor: "#E0D5C0", overflow: "hidden",
      }}
    >
      <View style={{ width: 68, height: 68, backgroundColor: "#EDE5D6" }}>
        {item.image_url ? (
          <Image
            source={{ uri: item.image_url }}
            style={{ width: 68, height: 68 }}
            resizeMode="cover"
          />
        ) : (
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 22 }}>📦</Text>
          </View>
        )}
      </View>
      <View style={{ flex: 1, padding: 12 }}>
        <Text style={{ fontSize: 13, fontWeight: "600", color: "#1F1B17" }} numberOfLines={1}>
          {item.name ?? "Item"}
        </Text>
        {item.brand ? (
          <Text style={{ fontSize: 11, color: "#4F4838" }} numberOfLines={1}>
            {item.brand}
          </Text>
        ) : null}
        <Text style={{ fontSize: 13, fontWeight: "700", color: "#B5604A", marginTop: 4 }}>
          {formatAUD(item.price)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function SavedScreen() {
  const insets = useSafeAreaInsets();
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
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12,
          borderBottomWidth: 1, borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
        }}
      >
        <Text className="text-2xl font-bold text-on-surface">Saved</Text>
      </View>

      {!user ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 14, color: "#4F4838", textAlign: "center", marginBottom: 16 }}>
            Sign in to save sales and items.
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(auth)/login")}
            style={{
              backgroundColor: "#B5604A", borderRadius: 10,
              paddingHorizontal: 24, paddingVertical: 11,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "600", fontSize: 14 }}>Sign in</Text>
          </TouchableOpacity>
        </View>
      ) : isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : isEmpty ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text style={{ fontSize: 36, marginBottom: 12 }}>♡</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#1F1B17", marginBottom: 6 }}>
            Nothing saved yet
          </Text>
          <Text style={{ fontSize: 14, color: "#4F4838", textAlign: "center" }}>
            Tap the heart on any sale or item to save it here.
          </Text>
        </View>
      ) : (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
        >
          {savedSales.length > 0 ? (
            <View style={{ marginBottom: 20 }}>
              <Text
                style={{
                  fontSize: 13, fontWeight: "600", color: "#1F1B17", marginBottom: 10,
                }}
              >
                Saved Sales ({savedSales.length})
              </Text>
              {savedSales.map((s) => (
                <SavedSaleRow key={s.eventId} sale={s} />
              ))}
            </View>
          ) : null}

          {savedItems.length > 0 ? (
            <View>
              <Text
                style={{
                  fontSize: 13, fontWeight: "600", color: "#1F1B17", marginBottom: 10,
                }}
              >
                Saved Items ({savedItems.length})
              </Text>
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
