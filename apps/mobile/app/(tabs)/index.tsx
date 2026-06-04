import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getLandingData } from "@shiftready/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const { data, isLoading, error } = useQuery({
    queryKey: ["landing"],
    queryFn: () => getLandingData(),
  });

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 border-b border-outline-variant bg-surface">
        <Text className="text-2xl font-bold text-on-surface">The Marketplace</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {isLoading && (
          <View className="py-16 items-center">
            <ActivityIndicator color="#B5604A" />
          </View>
        )}

        {error && (
          <View className="py-8 items-center">
            <Text className="text-on-surface-variant text-sm">
              Could not load listings.
            </Text>
          </View>
        )}

        {data && (
          <>
            <Text className="text-on-surface-variant text-sm mb-4">
              {data.active_sales.length} active sales nearby
            </Text>
            {/* Placeholder — Phase 2 will build the full card grid */}
            <View className="rounded-xl bg-surface-container p-4 items-center py-12">
              <Text className="text-on-surface-variant text-base">
                Browse coming in Phase 2 📦
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}
