import { View, ScrollView, Switch } from "react-native";
import { useMySettings, useUpdatePrivacy } from "@/hooks/use-settings";
import { colors, radius } from "@/lib/theme";
import { AppText, Skeleton, StackHeader, triggerHaptic, ScalePressable } from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

const MESSAGING_FILTERS: { value: string; label: string; caption: string }[] = [
  { value: "anyone", label: "Anyone", caption: "All signed-in buyers can message you" },
  { value: "verified", label: "Verified buyers", caption: "Only buyers with verified emails" },
  { value: "active", label: "Active buyers", caption: "Only buyers active in the last 30 days" },
];

export default function PrivacySettings() {
  const { data: settings, isLoading } = useMySettings();
  const update = useUpdatePrivacy();
  const prefs = settings?.privacyPrefs;

  function save(patch: Partial<NonNullable<typeof prefs>>) {
    if (!prefs) return;
    update.mutate({ ...prefs, ...patch });
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Privacy" />
      {isLoading || !prefs ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={160} borderRadius={16} />
          <Skeleton width="100%" height={70} borderRadius={16} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 18 }}>
          <View>
            <AppText variant="micro" tone="faint" style={{ marginBottom: 8, marginLeft: 2 }}>
              Who can message you
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
              {MESSAGING_FILTERS.map((f, i) => {
                const selected = prefs.messagingFilter === f.value;
                return (
                  <ScalePressable
                    key={f.value}
                    onPress={() => {
                      triggerHaptic("selection");
                      save({ messagingFilter: f.value });
                    }}
                    pressScale={0.99}
                    accessibilityRole="radio"
                    accessibilityState={{ selected }}
                    accessibilityLabel={f.label}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingHorizontal: 14,
                      paddingVertical: 13,
                      borderBottomWidth: i === MESSAGING_FILTERS.length - 1 ? 0 : 1,
                      borderBottomColor: colors.outlineVariant,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <AppText weight="medium" style={{ fontSize: 14.5 }}>
                        {f.label}
                      </AppText>
                      <AppText variant="caption" tone="faint">
                        {f.caption}
                      </AppText>
                    </View>
                    <Ionicons
                      name={selected ? "radio-button-on" : "radio-button-off"}
                      size={20}
                      color={selected ? colors.clay600 : colors.outline}
                    />
                  </ScalePressable>
                );
              })}
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              backgroundColor: colors.surfaceLow,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
            }}
          >
            <View style={{ flex: 1 }}>
              <AppText weight="medium" style={{ fontSize: 14.5 }}>
                Public profile
              </AppText>
              <AppText variant="caption" tone="faint">
                Buyers can see your username and bio on your sales
              </AppText>
            </View>
            <Switch
              value={prefs.profileVisible}
              onValueChange={(v) => {
                triggerHaptic("selection");
                save({ profileVisible: v });
              }}
              trackColor={{ true: colors.clay600, false: colors.surfaceHighest }}
              thumbColor={colors.surfaceLowest}
              accessibilityLabel="Public profile"
            />
          </View>

          <AppText variant="caption" tone="faint" style={{ marginLeft: 2 }}>
            Blocked someone? You can block or unblock a person from inside the conversation.
          </AppText>
        </ScrollView>
      )}
    </View>
  );
}
