import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useNotifications,
  useMarkNotifRead,
  useMarkAllNotifsRead,
} from "@/hooks/use-notifications";
import type { Notification } from "@shiftready/types";

const NOTIF_ICONS: Record<string, string> = {
  "message.new": "💬",
  "offer.new": "💰",
  "offer.accepted": "✅",
  "offer.countered": "🔄",
  "sale.ready": "📦",
};

function formatRelative(ts: string) {
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function NotifRow({ notif }: { notif: Notification }) {
  const markRead = useMarkNotifRead();
  const isUnread = !notif.readAt;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => {
        if (isUnread) markRead.mutate(notif.id);
      }}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isUnread ? "#FAF6EF" : "#FAFAF7",
        borderBottomWidth: 1,
        borderBottomColor: "#E0D5C0",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isUnread ? "#FEE2C0" : "#EDE5D6",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ fontSize: 18 }}>{NOTIF_ICONS[notif.type] ?? "🔔"}</Text>
      </View>
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Text
            style={{
              fontSize: 13,
              fontWeight: isUnread ? "700" : "600",
              color: "#2C2416",
              flex: 1,
              marginRight: 8,
            }}
          >
            {notif.title}
          </Text>
          <Text style={{ fontSize: 11, color: "#A09683", flexShrink: 0 }}>
            {formatRelative(notif.createdAt)}
          </Text>
        </View>
        <Text style={{ fontSize: 13, color: "#7A6A58", lineHeight: 18 }}>{notif.body}</Text>
      </View>
      {isUnread && (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#B5604A",
            marginTop: 6,
            flexShrink: 0,
          }}
        />
      )}
    </TouchableOpacity>
  );
}

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: notifs, isLoading, refetch } = useNotifications();
  const markAll = useMarkAllNotifsRead();
  const unreadCount = notifs?.filter((n) => !n.readAt).length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF7", paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ fontSize: 17, color: "#B5604A" }}>‹ Back</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#2C2416" }}>Notifications</Text>
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAll.mutate()}
            disabled={markAll.isPending}
          >
            <Text style={{ fontSize: 13, color: "#B5604A", fontWeight: "600" }}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : !notifs?.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={{ fontSize: 32 }}>🔔</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#2C2416", marginTop: 8 }}>
            No notifications
          </Text>
          <Text style={{ fontSize: 13, color: "#A09683", textAlign: "center", paddingHorizontal: 32 }}>
            You&apos;re all caught up. Notifications for messages and offers will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NotifRow notif={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
