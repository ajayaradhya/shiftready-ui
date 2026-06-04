import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import type { ConversationSummary } from "@shiftready/types";

function formatRelative(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return "now";
  if (diffMin < 60) return `${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function DealChip({ status, agreedPrice }: { status?: string; agreedPrice?: number | null }) {
  if (status === "agreed") {
    return (
      <View style={{ backgroundColor: "#D1FAE5", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 }}>
        <Text style={{ fontSize: 10, fontWeight: "600", color: "#065F46" }}>
          {agreedPrice ? `Deal $${agreedPrice}` : "Deal agreed"}
        </Text>
      </View>
    );
  }
  return null;
}

function ConvRow({ conv }: { conv: ConversationSummary }) {
  const router = useRouter();
  const initial = (conv.otherUsername ?? "?")[0].toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() =>
        router.push({ pathname: "/conversation/[convId]", params: { convId: conv.id } })
      }
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: conv.unreadCount > 0 ? "#FAF6EF" : "#FAFAF7",
        borderBottomWidth: 1,
        borderBottomColor: "#E0D5C0",
      }}
    >
      {/* Avatar */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: "#B5604A",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Text style={{ color: "#fff", fontSize: 18, fontWeight: "700" }}>{initial}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1, gap: 3 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: conv.unreadCount > 0 ? "700" : "600",
                color: "#2C2416",
              }}
            >
              @{conv.otherUsername ?? "Unknown"}
            </Text>
            <DealChip status={conv.dealStatus} agreedPrice={conv.agreedPrice} />
          </View>
          <Text style={{ fontSize: 11, color: "#A09683" }}>
            {formatRelative(conv.lastMessageAt)}
          </Text>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text
            numberOfLines={1}
            style={{
              flex: 1,
              fontSize: 13,
              color: conv.unreadCount > 0 ? "#4A2519" : "#7A6A58",
              fontWeight: conv.unreadCount > 0 ? "500" : "400",
            }}
          >
            {conv.pinSnapshot?.name ? `Re: ${conv.pinSnapshot.name}` : (conv.lastMessage ?? "")}
          </Text>
          {conv.unreadCount > 0 && (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: "#B5604A",
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 5,
                marginLeft: 8,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 11, fontWeight: "700" }}>
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  const { user, idToken } = useAuth();
  const { data: convs, isLoading, refetch } = useConversations();

  useMessagesWs(idToken);

  if (!user) {
    return (
      <View className="flex-1 bg-surface items-center justify-center px-6" style={{ paddingTop: insets.top }}>
        <Text className="text-2xl font-bold text-on-surface mb-2">Messages</Text>
        <Text className="text-on-surface-variant text-sm text-center">Sign in to view your conversations.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-3 border-b border-outline-variant bg-surface">
        <Text className="text-2xl font-bold text-on-surface">Messages</Text>
      </View>

      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : !convs?.length ? (
        <View className="flex-1 items-center justify-center px-6 gap-2">
          <Text className="text-4xl">💬</Text>
          <Text className="text-on-surface font-semibold text-base mt-2">No conversations yet</Text>
          <Text className="text-on-surface-variant text-sm text-center">
            Message a seller from any item listing to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={convs}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ConvRow conv={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
