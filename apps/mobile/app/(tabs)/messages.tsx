import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import type { ConversationSummary } from "@myrio/types";
import { formatAUD } from "@myrio/core";
import { colors } from "@/lib/theme";
import {
  AppText,
  Avatar,
  Chip,
  EmptyState,
  ItemImage,
  ScalePressable,
  Skeleton,
  TabHeader,
} from "@/components/ui";

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

function ConvRow({ conv }: { conv: ConversationSummary }) {
  const router = useRouter();
  const hasUnread = conv.unreadCount > 0;
  const pinThumb = conv.pinSnapshot?.imageUrl ?? null;
  const previewText = conv.lastMessage ?? "";

  return (
    <ScalePressable
      onPress={() =>
        router.push({ pathname: "/conversation/[convId]", params: { convId: conv.id } })
      }
      haptic="selection"
      pressScale={0.99}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${conv.otherUsername ?? "unknown"}${hasUnread ? `, ${conv.unreadCount} unread` : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 13,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      {/* Avatar + unread dot */}
      <View>
        <Avatar name={conv.otherUsername} size={48} />
        {hasUnread ? (
          <View
            style={{
              position: "absolute",
              top: -1,
              right: -1,
              width: 13,
              height: 13,
              borderRadius: 7,
              backgroundColor: colors.clay600,
              borderWidth: 2,
              borderColor: colors.surface,
            }}
          />
        ) : null}
      </View>

      {/* Text content */}
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flex: 1 }}>
            <AppText
              weight={hasUnread ? "bold" : "semibold"}
              numberOfLines={1}
              style={{ fontSize: 14.5 }}
            >
              @{conv.otherUsername ?? "Unknown"}
            </AppText>
            {conv.dealStatus === "agreed" ? (
              <Chip
                label={conv.agreedPrice ? `Deal ${formatAUD(conv.agreedPrice)}` : "Deal agreed"}
                status="deal"
                size="sm"
              />
            ) : null}
          </View>
          <AppText variant="caption" tone="faint" style={{ fontSize: 11 }}>
            {formatRelative(conv.lastMessageAt)}
          </AppText>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText
            numberOfLines={1}
            weight={hasUnread ? "medium" : "regular"}
            style={{
              flex: 1,
              fontSize: 13,
              color: hasUnread ? colors.onSurface : colors.ink400,
            }}
          >
            {previewText}
          </AppText>
          {hasUnread ? (
            <View
              style={{
                minWidth: 20,
                height: 20,
                borderRadius: 10,
                backgroundColor: colors.clay600,
                alignItems: "center",
                justifyContent: "center",
                paddingHorizontal: 5,
                marginLeft: 8,
              }}
            >
              <AppText weight="bold" style={{ color: colors.onPrimary, fontSize: 11, lineHeight: 14 }}>
                {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
              </AppText>
            </View>
          ) : null}
        </View>
      </View>

      {/* Pinned item thumbnail */}
      {pinThumb ? (
        <ItemImage
          uri={pinThumb}
          width={44}
          height={44}
          borderRadius={8}
        />
      ) : null}
    </ScalePressable>
  );
}

function ConvSkeleton() {
  return (
    <View style={{ paddingTop: 4 }}>
      {[0, 1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 13,
          }}
        >
          <Skeleton width={48} height={48} borderRadius={24} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="45%" height={13} />
            <Skeleton width="70%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function MessagesScreen() {
  const { user, idToken } = useAuth();
  const { data: convs, isLoading, refetch, isRefetching } = useConversations();

  useMessagesWs(idToken);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <TabHeader title="Messages" eyebrow="Inbox" />

      {!user ? (
        <EmptyState
          icon="chatbubble-outline"
          title="Sign in to see messages"
          body="Your conversations with sellers and buyers will appear here."
        />
      ) : isLoading ? (
        <ConvSkeleton />
      ) : !convs?.length ? (
        <EmptyState
          icon="chatbubbles-outline"
          title="No conversations yet"
          body="Message a seller from any item listing to get started."
        />
      ) : (
        <FlatList
          data={convs}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <ConvRow conv={item} />}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.clay600}
              colors={[colors.clay600]}
            />
          }
        />
      )}
    </View>
  );
}
