import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useConversations } from "@/hooks/use-conversations";
import type { ConversationSummary } from "@shiftready/types";
import { formatAUD } from "@shiftready/core";

function formatRelative(ts: string | null) {
  if (!ts) return "";
  const d = new Date(ts);
  const diffMs = Date.now() - d.getTime();
  const diffH = Math.floor(diffMs / 3_600_000);
  if (diffH < 1) return "just now";
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return "Yesterday";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

function statusChip(conv: ConversationSummary) {
  if (conv.dealStatus === "agreed")
    return { label: conv.agreedPrice ? `Deal ${formatAUD(conv.agreedPrice)}` : "Deal agreed", bg: "#D1FAE5", color: "#065F46" };
  if (conv.activeOfferId)
    return { label: "Offer active", bg: "#FEF3C7", color: "#92400E" };
  return { label: "Enquiring", bg: "#FDE8DC", color: "#7A2E0E" };
}

function EnquiryRow({ conv }: { conv: ConversationSummary }) {
  const router = useRouter();
  const chip = statusChip(conv);
  const initial = (conv.otherUsername ?? "?")[0].toUpperCase();

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() =>
        router.push({ pathname: "/conversation/[convId]", params: { convId: conv.id } })
      }
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
        backgroundColor: "#FAFAF7",
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
      <View style={{ flex: 1, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#2C2416" }}>
            @{conv.otherUsername ?? "Unknown"}
          </Text>
          <Text style={{ fontSize: 11, color: "#A09683" }}>
            {formatRelative(conv.lastMessageAt)}
          </Text>
        </View>

        {conv.pinSnapshot?.name && (
          <Text style={{ fontSize: 13, color: "#7A6A58" }} numberOfLines={1}>
            {conv.pinSnapshot.name}
            {conv.pinSnapshot.price ? ` · ${formatAUD(conv.pinSnapshot.price)}` : ""}
          </Text>
        )}

        <View
          style={{
            alignSelf: "flex-start",
            backgroundColor: chip.bg,
            borderRadius: 5,
            paddingHorizontal: 8,
            paddingVertical: 3,
          }}
        >
          <Text style={{ fontSize: 11, fontWeight: "700", color: chip.color }}>{chip.label}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function PurchasesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: convs, isLoading, refetch } = useConversations();

  const sorted = convs
    ? [...convs].sort((a, b) => {
        const rank = (c: ConversationSummary) =>
          c.dealStatus === "agreed" ? 0 : c.activeOfferId ? 1 : 2;
        return rank(a) - rank(b);
      })
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF7", paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 17, color: "#B5604A" }}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "700", color: "#2C2416" }}>My Purchases</Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : !sorted.length ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Text style={{ fontSize: 32 }}>🛍️</Text>
          <Text style={{ fontSize: 16, fontWeight: "600", color: "#2C2416", marginTop: 8 }}>
            No enquiries yet
          </Text>
          <Text style={{ fontSize: 13, color: "#A09683", textAlign: "center", paddingHorizontal: 32 }}>
            Message a seller from any listing to start negotiating. Your conversations will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <EnquiryRow conv={item} />}
          onRefresh={refetch}
          refreshing={isLoading}
        />
      )}
    </View>
  );
}
