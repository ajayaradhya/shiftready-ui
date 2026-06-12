import { View, ScrollView } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { getMe, getSaved, listSales } from "@myrio/api";
import { useAuth } from "@/contexts/auth-context";
import { useNotifUnreadCount } from "@/hooks/use-notifications";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Avatar,
  Button,
  ScalePressable,
  TabHeader,
} from "@/components/ui";

function MenuRow({
  icon,
  label,
  onPress,
  badge,
  last,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: number;
  last?: boolean;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      haptic="selection"
      pressScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`${label}${badge ? `, ${badge} unread` : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 14,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name={icon} size={17} color={colors.onSurfaceVariant} />
      </View>
      <AppText weight="medium" style={{ flex: 1, fontSize: 14.5 }}>
        {label}
      </AppText>
      {badge ? (
        <View
          style={{
            minWidth: 20,
            height: 20,
            borderRadius: 10,
            backgroundColor: colors.clay600,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 5,
          }}
        >
          <AppText weight="bold" style={{ color: colors.onPrimary, fontSize: 11, lineHeight: 14 }}>
            {badge}
          </AppText>
        </View>
      ) : null}
      <Ionicons name="chevron-forward" size={15} color={colors.ink300} />
    </ScalePressable>
  );
}

function MenuGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <AppText variant="micro" tone="faint" style={{ marginBottom: 8, marginLeft: 2 }}>
        {title}
      </AppText>
      <View
        style={{
          backgroundColor: colors.surfaceLow,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
          overflow: "hidden",
        }}
      >
        {children}
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { data: notifUnread } = useNotifUnreadCount();
  const notifCount = notifUnread?.unread_count ?? 0;

  const { data: profile } = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !!user,
  });

  const { data: sales } = useQuery({
    queryKey: ["sales"],
    queryFn: listSales,
    enabled: !!user,
  });

  const { data: saved } = useQuery({
    queryKey: ["saved"],
    queryFn: getSaved,
    enabled: !!user,
  });

  const activeSales = sales?.filter((s) => s.status === "live" || s.status === "partially_sold").length ?? 0;
  const itemsListed = sales?.reduce((n, s) => n + s.itemCount, 0) ?? 0;
  const savedCount = (saved?.saved_items?.length ?? 0) + (saved?.saved_sales?.length ?? 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Profile" eyebrow="Account" />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, gap: 18, paddingBottom: 90 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Identity card */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            padding: 16,
            backgroundColor: colors.surfaceLow,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}
        >
          <Avatar name={profile?.username ?? user?.displayName} uri={user?.photoURL} size={56} />
          <View style={{ flex: 1 }}>
            <AppText variant="heading" numberOfLines={1}>
              {user?.displayName ?? "User"}
            </AppText>
            {profile?.username ? (
              <AppText variant="caption" weight="medium" style={{ color: colors.clay600, marginTop: 1 }}>
                @{profile.username}
              </AppText>
            ) : null}
            <AppText variant="caption" tone="faint" numberOfLines={1} style={{ marginTop: 1 }}>
              {user?.email}
            </AppText>
          </View>
        </View>

        {/* Stats */}
        {sales && sales.length > 0 ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            {[
              { label: "Active sales", value: activeSales },
              { label: "Items listed", value: itemsListed },
              { label: "Saved", value: savedCount },
            ].map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  alignItems: "center",
                  paddingVertical: 14,
                  backgroundColor: colors.surfaceLow,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                }}
              >
                <AppText weight="bold" style={{ fontSize: 22, lineHeight: 28, color: colors.clay600 }}>
                  {stat.value}
                </AppText>
                <AppText variant="caption" tone="muted">
                  {stat.label}
                </AppText>
              </View>
            ))}
          </View>
        ) : null}

        <MenuGroup title="Buying">
          <MenuRow
            icon="notifications-outline"
            label="Notifications"
            badge={notifCount > 0 ? notifCount : undefined}
            onPress={() => router.push("/notifications")}
          />
          <MenuRow icon="bag-check-outline" label="My Purchases" onPress={() => router.push("/purchases")} />
          <MenuRow icon="heart-outline" label="Saved" last onPress={() => router.push("/(tabs)/saved")} />
        </MenuGroup>

        <MenuGroup title="Selling">
          <MenuRow icon="storefront-outline" label="My Sales" last onPress={() => router.push("/(tabs)/sell")} />
        </MenuGroup>

        <MenuGroup title="Account">
          <MenuRow icon="settings-outline" label="Settings" last onPress={() => router.push("/settings")} />
        </MenuGroup>

        <Button label="Sign out" variant="ghost" block onPress={signOut} />
      </ScrollView>
    </View>
  );
}
