import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { useConversations } from "@/hooks/use-conversations";
import type { ConversationSummary } from "@myrio/types";
import { formatAUD } from "@myrio/core";
import { colors } from "@/lib/theme";
import {
  AppText,
  Avatar,
  Chip,
  EmptyState,
  ScalePressable,
  Skeleton,
  StackHeader,
  type StatusVariant,
} from "@/components/ui";

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

function statusChip(conv: ConversationSummary): { label: string; status: StatusVariant } {
  if (conv.dealStatus === "agreed")
    return {
      label: conv.agreedPrice ? `Deal ${formatAUD(conv.agreedPrice)}` : "Deal agreed",
      status: "deal",
    };
  if (conv.activeOfferId) return { label: "Offer active", status: "processing" };
  return { label: "Enquiring", status: "neutral" };
}

function EnquiryRow({ conv }: { conv: ConversationSummary }) {
  const router = useRouter();
  const chip = statusChip(conv);

  return (
    <ScalePressable
      pressScale={0.99}
      haptic="selection"
      onPress={() =>
        router.push({ pathname: "/conversation/[convId]", params: { convId: conv.id } })
      }
      accessibilityRole="button"
      accessibilityLabel={`Enquiry with ${conv.otherUsername ?? "unknown"}, ${chip.label}`}
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        gap: 12,
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <Avatar name={conv.otherUsername} size={44} />
      <View style={{ flex: 1, gap: 5 }}>
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText weight="semibold" style={{ fontSize: 14 }}>
            @{conv.otherUsername ?? "Unknown"}
          </AppText>
          <AppText variant="caption" tone="faint" style={{ fontSize: 11 }}>
            {formatRelative(conv.lastMessageAt)}
          </AppText>
        </View>

        {conv.pinSnapshot?.name ? (
          <AppText variant="caption" tone="muted" numberOfLines={1}>
            {conv.pinSnapshot.name}
            {conv.pinSnapshot.price ? ` · ${formatAUD(conv.pinSnapshot.price)}` : ""}
          </AppText>
        ) : null}

        <Chip label={chip.label} status={chip.status} size="sm" />
      </View>
    </ScalePressable>
  );
}

export default function PurchasesScreen() {
  const { data: convs, isLoading, refetch, isRefetching } = useConversations();

  const sorted = convs
    ? [...convs].sort((a, b) => {
        const rank = (c: ConversationSummary) =>
          c.dealStatus === "agreed" ? 0 : c.activeOfferId ? 1 : 2;
        return rank(a) - rank(b);
      })
    : [];

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="My Purchases" />

      {isLoading ? (
        <View style={{ padding: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} width="100%" height={84} borderRadius={16} />
          ))}
        </View>
      ) : !sorted.length ? (
        <EmptyState
          icon="bag-handle-outline"
          title="No enquiries yet"
          body="Message a seller from any listing to start negotiating. Your conversations appear here."
        />
      ) : (
        <FlatList
          data={sorted}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => <EnquiryRow conv={item} />}
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
