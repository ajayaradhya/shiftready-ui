import { useEffect, useState } from "react";
import { View, TextInput } from "react-native";
import {
  CATEGORY_OPTIONS,
  PRICE_RANGE_OPTIONS,
  SORT_OPTIONS,
  SYDNEY_SUBURB_NAMES,
} from "@myrio/core";
import type { CategoryFilter, PriceRangeKey, SortKey } from "@myrio/core";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  PillRow,
  ScalePressable,
  SelectPill,
  Sheet,
  triggerHaptic,
} from "@/components/ui";
import { Ionicons } from "@expo/vector-icons";

export interface MarketFilters {
  category: CategoryFilter | null;
  priceRange: PriceRangeKey | null;
  suburb: string | null;
  sort: SortKey;
}

export const DEFAULT_FILTERS: MarketFilters = {
  category: null,
  priceRange: null,
  suburb: null,
  sort: "newest",
};

export function activeFilterCount(f: MarketFilters): number {
  let n = 0;
  if (f.category) n++;
  if (f.priceRange) n++;
  if (f.suburb) n++;
  if (f.sort !== "newest") n++;
  return n;
}

interface Props {
  visible: boolean;
  filters: MarketFilters;
  onApply: (f: MarketFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, filters, onApply, onClose }: Props) {
  const [draft, setDraft] = useState<MarketFilters>(filters);
  const [suburbText, setSuburbText] = useState(filters.suburb ?? "");

  useEffect(() => {
    if (visible) {
      setDraft(filters);
      setSuburbText(filters.suburb ?? "");
    }
  }, [visible]);

  const suburbSuggestions =
    suburbText.length >= 2
      ? SYDNEY_SUBURB_NAMES.filter((s) =>
          s.toLowerCase().startsWith(suburbText.toLowerCase())
        ).slice(0, 6)
      : [];

  function clear() {
    triggerHaptic("selection");
    setDraft(DEFAULT_FILTERS);
    setSuburbText("");
  }

  function apply() {
    triggerHaptic("light");
    const matchedSuburb =
      SYDNEY_SUBURB_NAMES.find(
        (s) => s.toLowerCase() === suburbText.toLowerCase()
      ) ?? null;
    onApply({ ...draft, suburb: matchedSuburb });
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Filters" scroll>
      {/* Sort */}
      <View style={{ gap: 8 }}>
        <AppText variant="micro" tone="faint">
          Sort by
        </AppText>
        <PillRow>
          {SORT_OPTIONS.map((o) => (
            <SelectPill
              key={o.value}
              label={o.label}
              selected={draft.sort === o.value}
              onPress={() => {
                triggerHaptic("selection");
                setDraft({ ...draft, sort: o.value });
              }}
            />
          ))}
        </PillRow>
      </View>

      {/* Price range */}
      <View style={{ gap: 8 }}>
        <AppText variant="micro" tone="faint">
          Price range
        </AppText>
        <PillRow>
          {PRICE_RANGE_OPTIONS.map((o) => (
            <SelectPill
              key={o.value}
              label={o.label}
              selected={draft.priceRange === o.value}
              onPress={() => {
                triggerHaptic("selection");
                setDraft({
                  ...draft,
                  priceRange: draft.priceRange === o.value ? null : o.value,
                });
              }}
            />
          ))}
        </PillRow>
      </View>

      {/* Suburb */}
      <View style={{ gap: 8 }}>
        <AppText variant="micro" tone="faint">
          Suburb
        </AppText>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.surfaceContainer,
            borderRadius: radius.lg,
            paddingHorizontal: 12,
            height: 44,
          }}
        >
          <Ionicons name="location-outline" size={16} color={colors.outline} />
          <TextInput
            value={suburbText}
            onChangeText={(t) => {
              setSuburbText(t);
              if (!t) setDraft({ ...draft, suburb: null });
            }}
            placeholder="Any suburb"
            placeholderTextColor={colors.ink300}
            style={{
              flex: 1,
              fontFamily: fonts.regular,
              fontSize: 15,
              color: colors.onSurface,
              paddingVertical: 0,
              marginLeft: 8,
            }}
          />
          {suburbText ? (
            <ScalePressable
              onPress={() => {
                setSuburbText("");
                setDraft({ ...draft, suburb: null });
              }}
              accessibilityRole="button"
              accessibilityLabel="Clear suburb"
              style={{ padding: 4 }}
            >
              <Ionicons name="close-circle" size={16} color={colors.outline} />
            </ScalePressable>
          ) : null}
        </View>
        {suburbSuggestions.length > 0 ? (
          <View
            style={{
              backgroundColor: colors.surfaceLow,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              overflow: "hidden",
            }}
          >
            {suburbSuggestions.map((s, i) => (
              <ScalePressable
                key={s}
                onPress={() => {
                  triggerHaptic("selection");
                  setSuburbText(s);
                  setDraft({ ...draft, suburb: s });
                }}
                accessibilityRole="button"
                accessibilityLabel={s}
                pressScale={0.99}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderBottomWidth: i === suburbSuggestions.length - 1 ? 0 : 1,
                  borderBottomColor: colors.outlineVariant,
                }}
              >
                <AppText style={{ fontSize: 14 }}>{s}</AppText>
              </ScalePressable>
            ))}
          </View>
        ) : null}
      </View>

      {/* Category */}
      <View style={{ gap: 8 }}>
        <AppText variant="micro" tone="faint">
          Category
        </AppText>
        <PillRow>
          {CATEGORY_OPTIONS.map((o) => (
            <SelectPill
              key={o.value}
              label={o.label}
              selected={draft.category === o.value}
              onPress={() => {
                triggerHaptic("selection");
                setDraft({
                  ...draft,
                  category: draft.category === o.value ? null : (o.value as CategoryFilter),
                });
              }}
            />
          ))}
        </PillRow>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 10, paddingTop: 4 }}>
        <Button label="Clear all" variant="ghost" style={{ flex: 1 }} onPress={clear} />
        <Button label="Apply" style={{ flex: 2 }} haptic="light" onPress={apply} />
      </View>
    </Sheet>
  );
}
