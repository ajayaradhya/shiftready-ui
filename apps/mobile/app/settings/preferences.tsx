import { View, ScrollView } from "react-native";
import { useMySettings, useUpdatePreferences } from "@/hooks/use-settings";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  PillRow,
  ScalePressable,
  SelectPill,
  Skeleton,
  StackHeader,
  triggerHaptic,
} from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

const PAYMENT_METHODS = ["Cash", "Bank transfer", "PayID", "Afterpay"];
const PICKUP_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PICKUP_TIMES = ["Morning", "Afternoon", "Evening"];
const MIN_OFFER_MIN = 40;
const MIN_OFFER_MAX = 95;
const MIN_OFFER_STEP = 5;

function toggleIn(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

export default function PreferenceSettings() {
  const { data: settings, isLoading } = useMySettings();
  const update = useUpdatePreferences();
  const prefs = settings?.sellerPrefs;

  // Every control auto-saves; the hook applies the change optimistically.
  function save(patch: Partial<NonNullable<typeof prefs>>) {
    if (!prefs) return;
    update.mutate({ ...prefs, ...patch });
  }

  function stepMinOffer(delta: number) {
    if (!prefs) return;
    const next = Math.min(MIN_OFFER_MAX, Math.max(MIN_OFFER_MIN, prefs.minOfferPercent + delta));
    if (next !== prefs.minOfferPercent) {
      triggerHaptic("selection");
      save({ minOfferPercent: next });
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Preferences" />
      {isLoading || !prefs ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={90} borderRadius={16} />
          <Skeleton width="100%" height={90} borderRadius={16} />
          <Skeleton width="100%" height={90} borderRadius={16} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 22 }}>
          <View>
            <AppText variant="heading" style={{ fontSize: 15.5, marginBottom: 4 }}>
              Payment methods
            </AppText>
            <AppText variant="caption" tone="faint" style={{ marginBottom: 10 }}>
              Shown to buyers when arranging pickup
            </AppText>
            <PillRow>
              {PAYMENT_METHODS.map((m) => (
                <SelectPill
                  key={m}
                  label={m}
                  selected={prefs.paymentMethods.includes(m)}
                  onPress={() => save({ paymentMethods: toggleIn(prefs.paymentMethods, m) })}
                />
              ))}
            </PillRow>
          </View>

          <View>
            <AppText variant="heading" style={{ fontSize: 15.5, marginBottom: 10 }}>
              Pickup days
            </AppText>
            <PillRow>
              {PICKUP_DAYS.map((d) => (
                <SelectPill
                  key={d}
                  label={d}
                  selected={prefs.pickupDays.includes(d)}
                  onPress={() => save({ pickupDays: toggleIn(prefs.pickupDays, d) })}
                />
              ))}
            </PillRow>
          </View>

          <View>
            <AppText variant="heading" style={{ fontSize: 15.5, marginBottom: 10 }}>
              Pickup times
            </AppText>
            <PillRow>
              {PICKUP_TIMES.map((t) => (
                <SelectPill
                  key={t}
                  label={t}
                  selected={prefs.pickupTimes.includes(t)}
                  onPress={() => save({ pickupTimes: toggleIn(prefs.pickupTimes, t) })}
                />
              ))}
            </PillRow>
          </View>

          <View>
            <AppText variant="heading" style={{ fontSize: 15.5, marginBottom: 4 }}>
              Minimum offer
            </AppText>
            <AppText variant="caption" tone="faint" style={{ marginBottom: 10 }}>
              Offers below this share of your listed price get a nudge to go higher
            </AppText>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 14,
                backgroundColor: colors.surfaceLow,
                borderRadius: radius.lg,
                borderWidth: 1,
                borderColor: colors.outlineVariant,
              }}
            >
              <ScalePressable
                onPress={() => stepMinOffer(-MIN_OFFER_STEP)}
                accessibilityRole="button"
                accessibilityLabel="Decrease minimum offer percentage"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surfaceContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="remove" size={20} color={colors.onSurface} />
              </ScalePressable>
              <View style={{ alignItems: "center" }}>
                <AppText weight="bold" style={{ fontSize: 26, lineHeight: 32, color: colors.clay600 }}>
                  {prefs.minOfferPercent}%
                </AppText>
                <AppText variant="caption" tone="faint">
                  of listed price
                </AppText>
              </View>
              <ScalePressable
                onPress={() => stepMinOffer(MIN_OFFER_STEP)}
                accessibilityRole="button"
                accessibilityLabel="Increase minimum offer percentage"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  backgroundColor: colors.surfaceContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="add" size={20} color={colors.onSurface} />
              </ScalePressable>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}
