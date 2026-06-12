import { View, FlatList, RefreshControl } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  useNotifications,
  useMarkNotifRead,
  useMarkAllNotifsRead,
} from "@/hooks/use-notifications";
import type { Notification } from "@myrio/types";
import { colors } from "@/lib/theme";
import {
  AppText,
  EmptyState,
  ScalePressable,
  Skeleton,
  StackHeader,
} from "@/components/ui";

type IconName = keyof typeof Ionicons.glyphMap;

const NOTIF_ICONS: Record<string, IconName> = {
  "message.new": "chatbubble-outline",
  "offer.new": "pricetag-outline",
  "offer.accepted": "checkmark-circle-outline",
  "offer.countered": "swap-horizontal-outline",
  "sale.ready": "sparkles-outline",
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
    <ScalePressable
      pressScale={0.99}
      onPress={() => {
        if (isUnread) markRead.mutate(notif.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={`${notif.title}${isUnread ? ", unread" : ""}`}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        backgroundColor: isUnread ? colors.surfaceLow : colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isUnread ? colors.clay100 : colors.surfaceContainer,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Ionicons
          name={NOTIF_ICONS[notif.type] ?? "notifications-outline"}
          size={18}
          color={isUnread ? colors.clay700 : colors.onSurfaceVariant}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <AppText
            weight={isUnread ? "bold" : "semibold"}
            style={{ fontSize: 13.5, flex: 1, marginRight: 8 }}
          >
            {notif.title}
          </AppText>
          <AppText variant="caption" tone="faint" style={{ fontSize: 11 }}>
            {formatRelative(notif.createdAt)}
          </AppText>
        </View>
        <AppText variant="caption" tone="muted" style={{ lineHeight: 18 }}>
          {notif.body}
        </AppText>
      </View>
      {isUnread ? (
        <View
          style={{
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: colors.clay600,
            marginTop: 6,
            flexShrink: 0,
          }}
        />
      ) : null}
    </ScalePressable>
  );
}

function NotifSkeleton() {
  return (
    <View style={{ paddingTop: 4 }}>
      {[0, 1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: "row",
            gap: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
          }}
        >
          <Skeleton width={40} height={40} borderRadius={20} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="55%" height={12} />
            <Skeleton width="85%" height={11} />
          </View>
        </View>
      ))}
    </View>
  );
}

export default function NotificationsScreen() {
  const { data: notifs, isLoading, refetch, isRefetching } = useNotifications();
  const markAll = useMarkAllNotifsRead();
  const unreadCount = notifs?.filter((n) => !n.readAt).length ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader
        title="Notifications"
        right={
          unreadCount > 0 ? (
            <ScalePressable
              onPress={() => markAll.mutate()}
              disabled={markAll.isPending}
              haptic="selection"
              accessibilityRole="button"
              accessibilityLabel="Mark all notifications as read"
              style={{ paddingHorizontal: 4, justifyContent: "center", height: 40 }}
            >
              <AppText variant="caption" weight="semibold" style={{ color: colors.clay600 }}>
                Mark all read
              </AppText>
            </ScalePressable>
          ) : undefined
        }
      />

      {isLoading ? (
        <NotifSkeleton />
      ) : !notifs?.length ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications"
          body="You're all caught up. Messages and offers will appear here."
        />
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(n) => n.id}
          renderItem={({ item }) => <NotifRow notif={item} />}
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
