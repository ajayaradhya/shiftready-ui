import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { listSales } from "@shiftready/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import type { SaleListing, SaleStatus } from "@shiftready/types";
import { Ionicons } from "@expo/vector-icons";

const STATUS_LABEL: Record<SaleStatus, string> = {
  pending_upload: "Pending",
  processing: "Processing…",
  ready_for_review: "Review needed",
  pricing_in_progress: "Pricing…",
  live: "Live",
  partially_sold: "Part. sold",
  sold: "Sold",
  failed: "Failed",
  archived: "Archived",
  expired: "Expired",
};

const STATUS_STYLE: Record<SaleStatus, { bg: string; fg: string }> = {
  pending_upload:      { bg: "#f5f5f4", fg: "#57534e" },
  processing:          { bg: "#fef3c7", fg: "#92400e" },
  ready_for_review:    { bg: "#fef3c7", fg: "#b45309" },
  pricing_in_progress: { bg: "#fef3c7", fg: "#92400e" },
  live:                { bg: "#dcfce7", fg: "#166534" },
  partially_sold:      { bg: "#dbeafe", fg: "#1e40af" },
  sold:                { bg: "#f3e8ff", fg: "#6b21a8" },
  failed:              { bg: "#fee2e2", fg: "#991b1b" },
  archived:            { bg: "#f5f5f4", fg: "#57534e" },
  expired:             { bg: "#f5f5f4", fg: "#57534e" },
};

const fmtAUD = (v: number) =>
  new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(v);

function SaleCard({ sale, onPress }: { sale: SaleListing; onPress: () => void }) {
  const { bg, fg } = STATUS_STYLE[sale.status] ?? STATUS_STYLE.archived;
  return (
    <TouchableOpacity
      className="bg-surface-container-low rounded-xl border border-outline-variant mx-4 mb-3 p-4"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between mb-1">
        <Text
          className="text-base font-semibold text-on-surface flex-1 mr-2"
          numberOfLines={1}
        >
          {sale.title ?? (sale.suburb ? `${sale.suburb} Sale` : "Untitled Sale")}
        </Text>
        <View
          style={{
            backgroundColor: bg,
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: 99,
          }}
        >
          <Text style={{ color: fg, fontSize: 11, fontWeight: "600" }}>
            {STATUS_LABEL[sale.status]}
          </Text>
        </View>
      </View>

      {sale.suburb && (
        <Text className="text-sm text-on-surface-variant mb-2">
          {sale.suburb}, {sale.state ?? "NSW"}
        </Text>
      )}

      <View style={{ flexDirection: "row", gap: 16 }}>
        <Text className="text-sm text-on-surface-variant">
          {sale.itemCount} item{sale.itemCount !== 1 ? "s" : ""}
        </Text>
        <Text className="text-sm text-on-surface-variant">
          {fmtAUD(sale.totalValue)} value
        </Text>
      </View>

      <Text className="text-xs text-on-surface-variant mt-2">
        Created {new Date(sale.createdAt).toLocaleDateString("en-AU")}
      </Text>
    </TouchableOpacity>
  );
}

export default function SellScreen() {
  const insets = useSafeAreaInsets();
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
      <View
        className="flex-1 bg-surface items-center justify-center p-6"
        style={{ paddingTop: insets.top }}
      >
        <Ionicons name="bag-outline" size={48} color="#A09683" />
        <Text className="text-base font-semibold text-on-surface mt-4 mb-2">
          Sell your stuff
        </Text>
        <Text className="text-sm text-on-surface-variant text-center mb-6">
          Sign in to create and manage your sales
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3"
          onPress={() => router.push("/(auth)/login")}
        >
          <Text className="text-on-primary font-medium">Sign in</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-3 border-b border-outline-variant bg-surface flex-row items-center justify-between">
        <Text className="text-2xl font-bold text-on-surface">My Sales</Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-4 py-2.5 flex-row items-center"
          onPress={() => router.push("/capture")}
          style={{ gap: 6 }}
        >
          <Ionicons name="camera" size={16} color="#fff" />
          <Text className="text-on-primary font-semibold text-sm">Capture</Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#B5604A" />
        </View>
      ) : (
        <FlatList
          data={sales ?? []}
          keyExtractor={(s) => s.id}
          renderItem={({ item }) => (
            <SaleCard
              sale={item}
              onPress={() => router.push(`/seller/inventory/${item.id}`)}
            />
          )}
          ListHeaderComponent={<View style={{ height: 16 }} />}
          ListFooterComponent={<View style={{ height: 40 }} />}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-8">
              <Ionicons name="bag-outline" size={52} color="#A09683" />
              <Text className="text-lg font-semibold text-on-surface mt-4 mb-2">
                No sales yet
              </Text>
              <Text className="text-sm text-on-surface-variant text-center mb-6">
                Start capturing your items to create your first sale listing
              </Text>
              <TouchableOpacity
                className="bg-primary rounded-xl px-6 py-3"
                onPress={() => router.push("/capture")}
              >
                <Text className="text-on-primary font-semibold">
                  Start capturing
                </Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor="#B5604A"
            />
          }
        />
      )}
    </View>
  );
}
