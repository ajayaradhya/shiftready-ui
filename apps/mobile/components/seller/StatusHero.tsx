import { useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "@/lib/reanimated";
import { formatAUD } from "@myrio/core";
import type { SaleStatus } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import { AppText, Button, Chip, type StatusVariant } from "@/components/ui";

export const SALE_STATUS_CHIP: Partial<Record<SaleStatus, { label: string; status: StatusVariant }>> = {
  pending_upload: { label: "Pending", status: "neutral" },
  processing: { label: "Processing…", status: "processing" },
  ready_for_review: { label: "Ready to publish", status: "review" },
  pricing_in_progress: { label: "Pricing…", status: "processing" },
  live: { label: "Live", status: "live" },
  partially_sold: { label: "Partially sold", status: "deal" },
  sold: { label: "Sold", status: "sold" },
  failed: { label: "Failed", status: "failed" },
  archived: { label: "Archived", status: "neutral" },
  expired: { label: "Expired", status: "neutral" },
};

function IndeterminateBar() {
  const x = useSharedValue(-0.4);
  useEffect(() => {
    x.value = withRepeat(
      withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }),
      -1
    );
  }, [x]);
  const style = useAnimatedStyle(() => ({
    left: `${x.value * 100}%`,
  }));
  return (
    <View
      style={{
        height: 3,
        borderRadius: 2,
        backgroundColor: colors.surfaceHigh,
        overflow: "hidden",
        marginTop: 12,
      }}
    >
      <Animated.View
        style={[
          { width: "40%", height: 3, borderRadius: 2, backgroundColor: colors.clay600 },
          style,
        ]}
      />
    </View>
  );
}

export interface StatusHeroProps {
  status: SaleStatus;
  itemCount: number;
  totalValue: number;
  onPublish: () => void;
  onUnpublish: () => void;
  onReestimate: () => void;
  reestimating: boolean;
  unpublishing: boolean;
}

/** Status strip under the header: chip + stats + primary action. */
export function StatusHero({
  status,
  itemCount,
  totalValue,
  onPublish,
  onUnpublish,
  onReestimate,
  reestimating,
  unpublishing,
}: StatusHeroProps) {
  const chip = SALE_STATUS_CHIP[status] ?? { label: status, status: "neutral" as StatusVariant };
  const isProcessing = status === "processing" || status === "pricing_in_progress";
  const canPublish = status === "ready_for_review";
  const isLive = status === "live" || status === "partially_sold";

  return (
    <View
      style={{
        marginHorizontal: 16,
        marginTop: 12,
        padding: 14,
        backgroundColor: colors.surfaceLow,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Chip label={chip.label} status={chip.status} />
        {canPublish ? (
          <Button label="Publish" size="sm" haptic="light" onPress={onPublish} />
        ) : isLive ? (
          <Button
            label="Unpublish"
            size="sm"
            variant="secondary"
            loading={unpublishing}
            onPress={onUnpublish}
          />
        ) : null}
      </View>

      <View style={{ flexDirection: "row", gap: 20, marginTop: 12 }}>
        <View>
          <AppText variant="micro" tone="faint">
            Items
          </AppText>
          <AppText weight="bold" style={{ fontSize: 17, lineHeight: 24 }}>
            {itemCount}
          </AppText>
        </View>
        <View>
          <AppText variant="micro" tone="faint">
            Total value
          </AppText>
          <AppText weight="bold" style={{ fontSize: 17, lineHeight: 24, color: colors.clay600 }}>
            {formatAUD(totalValue)}
          </AppText>
        </View>
        {(canPublish || isLive) && itemCount > 0 ? (
          <View style={{ marginLeft: "auto", justifyContent: "flex-end" }}>
            <Button
              label="AI re-estimate all"
              size="sm"
              variant="ghost"
              icon="sparkles"
              loading={reestimating}
              onPress={onReestimate}
            />
          </View>
        ) : null}
      </View>

      {isProcessing ? (
        <>
          <IndeterminateBar />
          <AppText variant="caption" tone="muted" style={{ marginTop: 8 }}>
            AI is analysing and pricing your items…
          </AppText>
        </>
      ) : null}
    </View>
  );
}
