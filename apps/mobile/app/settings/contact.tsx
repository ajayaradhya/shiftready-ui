import { useEffect, useMemo, useState } from "react";
import { View, ScrollView, Switch } from "react-native";
import { SYDNEY_SUBURB_NAMES } from "@myrio/core";
import { useMySettings, useUpdateLocation, useUpdatePhone } from "@/hooks/use-settings";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Field,
  ScalePressable,
  Skeleton,
  StackHeader,
  triggerHaptic,
} from "@/components/ui";

/** AU mobile: accepts 04xx xxx xxx or +614xxxxxxxx, normalises to E.164. */
function toE164(input: string): string | null {
  const digits = input.replace(/[^\d+]/g, "");
  if (/^\+614\d{8}$/.test(digits)) return digits;
  if (/^04\d{8}$/.test(digits)) return `+61${digits.slice(1)}`;
  return null;
}

function fromE164(e164: string | null): string {
  if (!e164) return "";
  if (e164.startsWith("+61")) return `0${e164.slice(3)}`;
  return e164;
}

export default function ContactSettings() {
  const { data: settings, isLoading } = useMySettings();
  const updatePhone = useUpdatePhone();
  const updateLocation = useUpdateLocation();

  const [phone, setPhone] = useState("");
  const [shareOptIn, setShareOptIn] = useState(false);
  const [suburbQuery, setSuburbQuery] = useState("");
  const [suburb, setSuburb] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (settings && !hydrated) {
      setPhone(fromE164(settings.phoneE164));
      setShareOptIn(settings.phoneShareOptIn);
      setSuburb(settings.suburb);
      setSuburbQuery(settings.suburb ?? "");
      setHydrated(true);
    }
  }, [settings, hydrated]);

  const suggestions = useMemo(() => {
    const q = suburbQuery.trim().toLowerCase();
    if (!q || q === suburb?.toLowerCase()) return [];
    return SYDNEY_SUBURB_NAMES.filter((n) => n.toLowerCase().startsWith(q)).slice(0, 6);
  }, [suburbQuery, suburb]);

  const e164 = toE164(phone);
  const phoneValid = phone.trim() === "" || !!e164;
  const phoneDirty =
    hydrated &&
    (fromE164(settings?.phoneE164 ?? null) !== phone || (settings?.phoneShareOptIn ?? false) !== shareOptIn);
  const locationDirty = hydrated && suburb !== (settings?.suburb ?? null);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Contact & pickup" />
      {isLoading || !settings ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width="100%" height={44} borderRadius={12} />
          <Skeleton width="100%" height={44} borderRadius={12} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <Field
            label="Mobile number"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            placeholder="04xx xxx xxx"
            hint={
              !phoneValid
                ? "Enter a valid Australian mobile (04xx xxx xxx)."
                : "Only shared after a deal is agreed — and only if you opt in."
            }
            hintTone={!phoneValid ? "error" : "muted"}
          />

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
                Auto-share after deal
              </AppText>
              <AppText variant="caption" tone="faint">
                Buyers can reveal your number once an offer is accepted
              </AppText>
            </View>
            <Switch
              value={shareOptIn}
              onValueChange={(v) => {
                triggerHaptic("selection");
                setShareOptIn(v);
              }}
              trackColor={{ true: colors.clay600, false: colors.surfaceHighest }}
              thumbColor={colors.surfaceLowest}
            />
          </View>

          <Button
            label="Save contact"
            disabled={!phoneDirty || !phoneValid || !e164}
            loading={updatePhone.isPending}
            onPress={() => e164 && updatePhone.mutate({ phoneE164: e164, shareOptIn })}
          />

          <View style={{ height: 1, backgroundColor: colors.outlineVariant, marginVertical: 4 }} />

          <View>
            <Field
              label="Pickup suburb"
              value={suburbQuery}
              onChangeText={(t) => {
                setSuburbQuery(t);
                setSuburb(null);
              }}
              placeholder="Start typing a Sydney suburb…"
              hint={suburb ? `Selected: ${suburb}, NSW` : undefined}
              hintTone="success"
            />
            {suggestions.length > 0 ? (
              <View
                style={{
                  marginTop: 6,
                  backgroundColor: colors.surfaceLow,
                  borderRadius: radius.md,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                  overflow: "hidden",
                }}
              >
                {suggestions.map((name, i) => (
                  <ScalePressable
                    key={name}
                    onPress={() => {
                      triggerHaptic("selection");
                      setSuburb(name);
                      setSuburbQuery(name);
                    }}
                    accessibilityRole="button"
                    accessibilityLabel={`Select ${name}`}
                    style={{
                      paddingHorizontal: 14,
                      paddingVertical: 11,
                      borderBottomWidth: i === suggestions.length - 1 ? 0 : 1,
                      borderBottomColor: colors.outlineVariant,
                    }}
                  >
                    <AppText style={{ fontSize: 14 }}>{name}</AppText>
                  </ScalePressable>
                ))}
              </View>
            ) : null}
          </View>

          <Button
            label="Save pickup location"
            variant="secondary"
            disabled={!locationDirty || !suburb}
            loading={updateLocation.isPending}
            onPress={() => updateLocation.mutate({ suburb, state: "NSW" })}
          />
        </ScrollView>
      )}
    </View>
  );
}
