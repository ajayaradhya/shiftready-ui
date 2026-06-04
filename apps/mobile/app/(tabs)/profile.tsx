import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { getMe } from "@shiftready/api";
import { useAuth } from "@/contexts/auth-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!user,
  });

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-3 border-b border-outline-variant bg-surface">
        <Text className="text-2xl font-bold text-on-surface">Profile</Text>
      </View>

      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, gap: 12 }}>
        {/* User card */}
        <View className="rounded-xl bg-surface-container-low p-4 border border-outline-variant">
          <Text className="text-base font-semibold text-on-surface">
            {user?.displayName ?? "User"}
          </Text>
          <Text className="text-sm text-on-surface-variant mt-0.5">
            {user?.email}
          </Text>
          {profile?.username && (
            <Text className="text-sm text-primary mt-0.5">@{profile.username}</Text>
          )}
        </View>

        {/* Seller Central entry */}
        <View className="rounded-xl bg-surface-container p-4 border border-outline-variant">
          <Text className="text-sm font-semibold text-on-surface mb-2">Selling</Text>
          <Text className="text-sm text-on-surface-variant mb-3">
            Manage your sales, inventory, and listings.
          </Text>
          <View className="rounded-lg bg-primary px-4 py-2.5 items-center">
            <Text className="text-on-primary font-medium text-sm">
              Seller Central — Phase 4
            </Text>
          </View>
        </View>

        {/* Sign out */}
        <TouchableOpacity
          className="rounded-xl bg-surface-container-low border border-outline-variant px-4 py-3.5 items-center mt-2"
          onPress={signOut}
        >
          <Text className="text-error font-medium text-sm">Sign out</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
