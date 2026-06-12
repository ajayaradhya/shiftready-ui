import { View, ScrollView, Switch } from "react-native";
import { useMySettings, useUpdateNotifications } from "@/hooks/use-settings";
import type { NotifPrefs } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import { AppText, Skeleton, StackHeader, triggerHaptic } from "@/components/ui";

const SELLING: { key: keyof NotifPrefs; label: string; caption: string }[] = [
  { key: "msg", label: "New message", caption: "A buyer messages you" },
  { key: "offer", label: "New offer", caption: "A buyer makes an offer" },
  { key: "counter", label: "Counter-offer", caption: "A buyer counters your price" },
  { key: "deal", label: "Deal agreed", caption: "An offer is accepted" },
  { key: "ready", label: "Sale ready", caption: "AI finishes processing your sale" },
  { key: "viewed", label: "Sale activity", caption: "Buyers view or save your items" },
];

const BUYING: { key: keyof NotifPrefs; label: string; caption: string }[] = [
  { key: "buy_msg", label: "Seller replies", caption: "A seller responds to you" },
  { key: "buy_offer", label: "Offer updates", caption: "Your offer is accepted or countered" },
  { key: "price_drop", label: "Price drops", caption: "Saved items get cheaper" },
];

function ToggleRow({
  label,
  caption,
  value,
  onChange,
  last,
}: {
  label: string;
  caption: string;
  value: boolean;
  onChange: (v: boolean) => void;
  last?: boolean;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.outlineVariant,
      }}
    >
      <View style={{ flex: 1 }}>
        <AppText weight="medium" style={{ fontSize: 14.5 }}>
          {label}
        </AppText>
        <AppText variant="caption" tone="faint">
          {caption}
        </AppText>
      </View>
      <Switch
        value={value}
        onValueChange={(v) => {
          triggerHaptic("selection");
          onChange(v);
        }}
        trackColor={{ true: colors.clay600, false: colors.surfaceHighest }}
        thumbColor={colors.surfaceLowest}
        accessibilityLabel={label}
      />
    </View>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
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

export default function NotificationSettings() {
  const { data: settings, isLoading } = useMySettings();
  const update = useUpdateNotifications();

  // Optimistic cache update in the hook makes each toggle auto-save instantly.
  function toggle(key: keyof NotifPrefs, value: boolean) {
    if (!settings) return;
    update.mutate({ ...settings.notifPrefs, [key]: value });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Notifications" />
      {isLoading || !settings ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={220} borderRadius={16} />
          <Skeleton width="100%" height={140} borderRadius={16} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <Group title="Selling">
            {SELLING.map((row, i) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                value={settings.notifPrefs[row.key]}
                onChange={(v) => toggle(row.key, v)}
                last={i === SELLING.length - 1}
              />
            ))}
          </Group>
          <Group title="Buying">
            {BUYING.map((row, i) => (
              <ToggleRow
                key={row.key}
                label={row.label}
                caption={row.caption}
                value={settings.notifPrefs[row.key]}
                onChange={(v) => toggle(row.key, v)}
                last={i === BUYING.length - 1}
              />
            ))}
          </Group>
        </ScrollView>
      )}
    </View>
  );
}
