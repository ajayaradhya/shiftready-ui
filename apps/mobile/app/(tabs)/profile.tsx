import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { getMe } from "@myrio/api";
import { useAuth } from "@/contexts/auth-context";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNotifUnreadCount } from "@/hooks/use-notifications";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: notifUnread } = useNotifUnreadCount();
  const notifCount = notifUnread?.unread_count ?? 0;

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

        {/* Quick links */}
        <View className="rounded-xl bg-surface-container-low border border-outline-variant overflow-hidden">
          <TouchableOpacity
            className="px-4 py-3.5 border-b border-outline-variant flex-row items-center justify-between"
            onPress={() => router.push("/notifications")}
          >
            <Text className="text-sm font-medium text-on-surface">Notifications</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              {notifCount > 0 && (
                <View style={{ backgroundColor: "#B5604A", borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>{notifCount}</Text>
                </View>
              )}
              <Text className="text-on-surface-variant text-base">›</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            className="px-4 py-3.5 flex-row items-center justify-between"
            onPress={() => router.push("/purchases")}
          >
            <Text className="text-sm font-medium text-on-surface">My Purchases</Text>
            <Text className="text-on-surface-variant text-base">›</Text>
          </TouchableOpacity>
        </View>

        {/* Seller Central entry */}
        <TouchableOpacity
          className="rounded-xl bg-surface-container p-4 border border-outline-variant"
          onPress={() => router.push("/(tabs)/sell")}
          activeOpacity={0.7}
        >
          <Text className="text-sm font-semibold text-on-surface mb-2">Selling</Text>
          <Text className="text-sm text-on-surface-variant mb-3">
            Manage your sales, inventory, and listings.
          </Text>
          <View className="rounded-lg bg-primary px-4 py-2.5 items-center">
            <Text className="text-on-primary font-medium text-sm">
              Go to My Sales →
            </Text>
          </View>
        </TouchableOpacity>

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
