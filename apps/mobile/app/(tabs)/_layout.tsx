import { Tabs } from "expo-router";
import { useUnreadCount } from "@/hooks/use-conversations";
import { TabBar } from "@/components/shell/TabBar";

export default function TabLayout() {
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.unreadCount ?? 0;

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: "Market" }} />
      <Tabs.Screen name="saved" options={{ title: "Saved" }} />
      <Tabs.Screen name="sell" options={{ title: "Sell" }} />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge:
            unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
        }}
      />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
