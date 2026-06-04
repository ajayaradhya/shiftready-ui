import { Tabs } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useUnreadCount } from "@/hooks/use-conversations";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  focused,
}: {
  name: { default: IconName; active: IconName };
  focused: boolean;
}) {
  return (
    <Ionicons
      name={focused ? name.active : name.default}
      size={24}
      color={focused ? "#B5604A" : "#A09683"}
    />
  );
}

export default function TabLayout() {
  const { data: unread } = useUnreadCount();
  const unreadCount = unread?.unreadCount ?? 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#B5604A",
        tabBarInactiveTintColor: "#A09683",
        tabBarStyle: {
          backgroundColor: "#FAFAF7",
          borderTopColor: "#E0D5C0",
          height: Platform.OS === "ios" ? 84 : 64,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Market",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={{ default: "storefront-outline", active: "storefront" }}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={{ default: "heart-outline", active: "heart" }}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? "99+" : unreadCount) : undefined,
          tabBarBadgeStyle: { backgroundColor: "#B5604A", fontSize: 10 },
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={{ default: "chatbubble-outline", active: "chatbubble" }}
              focused={focused}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              name={{ default: "person-outline", active: "person" }}
              focused={focused}
            />
          ),
        }}
      />
    </Tabs>
  );
}
