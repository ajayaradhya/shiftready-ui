import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  FlatList,
  TextInput,
  ScrollView,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLandingData, searchMarketplace } from "@myrio/api";
import type { MarketplaceSearchParams } from "@myrio/api";
import type { MarketplaceItem } from "@myrio/types";
import { priceRangeToParams } from "@myrio/core";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  ScalePressable,
  triggerHaptic,
} from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SaleHeroCard } from "@/components/market/SaleHeroCard";
import { ItemGridCard } from "@/components/market/ItemGridCard";
import { MarketSkeleton } from "@/components/market/MarketSkeleton";
import {
  FilterSheet,
  DEFAULT_FILTERS,
  activeFilterCount,
} from "@/components/market/FilterSheet";
import type { MarketFilters } from "@/components/market/FilterSheet";

const GRID_GAP = 12;
const H_PADDING = 16;
const RECENT_KEY = "mkt_recent_searches";
const MAX_RECENT = 8;

async function loadRecentSearches(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

async function saveRecentSearches(searches: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(searches));
  } catch {}
}

function addToRecent(q: string, current: string[]): string[] {
  const trimmed = q.trim();
  if (!trimmed) return current;
  return [trimmed, ...current.filter((s) => s !== trimmed)].slice(0, MAX_RECENT);
}

function categoryLabel(cat: string): string {
  return cat.charAt(0).toUpperCase() + cat.slice(1);
}

export default function MarketScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  const gridItemWidth = (Math.min(screenWidth, 480) - H_PADDING * 2 - GRID_GAP) / 2;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filters, setFilters] = useState<MarketFilters>(DEFAULT_FILTERS);
  const [filterSheetVisible, setFilterSheetVisible] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches on mount
  useEffect(() => {
    loadRecentSearches().then(setRecentSearches);
  }, []);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 350);
    return () => clearTimeout(t);
  }, [search]);

  const hasActiveFilters =
    filters.category != null ||
    filters.priceRange != null ||
    filters.suburb != null ||
    filters.sort !== "newest";

  const isSearching = !!debouncedSearch.trim() || hasActiveFilters;

  // Landing query — used when no search/filters active
  const landingQuery = useQuery({
    queryKey: ["landing"],
    queryFn: () => getLandingData(),
    staleTime: 60_000,
    enabled: !isSearching,
  });

  // Server search query — used when any filter/search active
  const searchParams = useMemo<MarketplaceSearchParams>(() => {
    const p: MarketplaceSearchParams = {};
    if (debouncedSearch.trim()) p.q = debouncedSearch.trim();
    if (filters.category) p.category = filters.category;
    if (filters.suburb) p.suburb = filters.suburb;
    if (filters.priceRange) {
      const range = priceRangeToParams(filters.priceRange);
      if (range.min != null) p.min_price = range.min;
      if (range.max != null) p.max_price = range.max;
    }
    if (filters.sort !== "newest") p.sort = filters.sort;
    return p;
  }, [debouncedSearch, filters]);

  const searchQuery = useQuery({
    queryKey: ["search", searchParams],
    queryFn: () => searchMarketplace(searchParams),
    staleTime: 30_000,
    enabled: isSearching,
  });

  // Derived display values
  const isLoading = isSearching ? searchQuery.isLoading : landingQuery.isLoading;
  const isRefetching = isSearching ? searchQuery.isRefetching : landingQuery.isRefetching;
  const error = isSearching ? searchQuery.error : landingQuery.error;

  function refetch() {
    if (isSearching) searchQuery.refetch();
    else landingQuery.refetch();
  }

  const items: MarketplaceItem[] = isSearching
    ? (searchQuery.data?.items ?? [])
    : (landingQuery.data?.items ?? []);

  // Category chips derived from landing data (server search uses filter sheet for categories)
  const landingCategories = useMemo(() => {
    const set = new Set<string>();
    landingQuery.data?.items?.forEach(
      (i) => i.category && set.add(i.category.toLowerCase())
    );
    return [...set].sort();
  }, [landingQuery.data?.items]);

  const filterCount = activeFilterCount(filters);
  const showRecentDropdown = searchFocused && !search.trim() && recentSearches.length > 0;

  function submitSearch(q: string) {
    const trimmed = q.trim();
    if (!trimmed) return;
    const updated = addToRecent(trimmed, recentSearches);
    setRecentSearches(updated);
    saveRecentSearches(updated);
  }

  function clearAll() {
    triggerHaptic("selection");
    setSearch("");
    setDebouncedSearch("");
    setFilters(DEFAULT_FILTERS);
  }

  const header = (
    <View>
      {/* Sales carousel — only shown in landing mode */}
      {!isSearching && (landingQuery.data?.active_sales?.length ?? 0) > 0 ? (
        <View style={{ marginTop: 18 }}>
          <AppText variant="micro" tone="faint" style={{ paddingHorizontal: H_PADDING }}>
            Live now
          </AppText>
          <AppText
            variant="heading"
            style={{ paddingHorizontal: H_PADDING, marginTop: 2, marginBottom: 12 }}
          >
            Moving sales near you
          </AppText>
          <FlatList
            data={landingQuery.data!.active_sales}
            keyExtractor={(s) => s.eventId}
            renderItem={({ item }) => <SaleHeroCard sale={item} />}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: H_PADDING, gap: 12 }}
            snapToInterval={260 + 12}
            decelerationRate="fast"
          />
        </View>
      ) : null}

      {/* Items section header */}
      <View
        style={{
          marginTop: !isSearching && (landingQuery.data?.active_sales?.length ?? 0) > 0 ? 28 : 18,
          marginBottom: 12,
          paddingHorizontal: H_PADDING,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <View>
          {!isSearching ? (
            <AppText variant="micro" tone="faint">
              Browse
            </AppText>
          ) : null}
          <AppText variant="heading" style={{ marginTop: isSearching ? 0 : 2 }}>
            {isSearching
              ? `${items.length} result${items.length === 1 ? "" : "s"}`
              : "Fresh finds"}
          </AppText>
        </View>
        {isSearching ? (
          <ScalePressable
            onPress={clearAll}
            accessibilityRole="button"
            accessibilityLabel="Clear all filters"
            style={{ paddingVertical: 4 }}
          >
            <AppText variant="caption" style={{ color: colors.clay600 }} weight="semibold">
              Clear filters
            </AppText>
          </ScalePressable>
        ) : null}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Top header */}
      <View
        style={{
          paddingTop: insets.top + 10,
          paddingHorizontal: H_PADDING,
          paddingBottom: 10,
          backgroundColor: colors.surface,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <AppText
            style={{ fontFamily: fonts.displayBold, fontSize: 26, lineHeight: 32, color: colors.onSurface }}
          >
            Myrio
          </AppText>
          <IconButton
            icon="notifications-outline"
            accessibilityLabel="Notifications"
            onPress={() => router.push("/notifications")}
          />
        </View>

        {/* Search bar + filter button */}
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 10 }}>
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: colors.surfaceContainer,
              borderRadius: radius.lg,
              paddingHorizontal: 12,
              height: 44,
            }}
          >
            <Ionicons name="search" size={18} color={colors.outline} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onSubmitEditing={() => submitSearch(search)}
              placeholder="Search sofas, desks, brands…"
              placeholderTextColor={colors.ink300}
              returnKeyType="search"
              accessibilityLabel="Search items"
              style={{
                flex: 1,
                fontFamily: fonts.regular,
                fontSize: 15,
                color: colors.onSurface,
                paddingVertical: 0,
                marginLeft: 8,
              }}
            />
            {search ? (
              <ScalePressable
                onPress={() => setSearch("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                style={{ padding: 4 }}
              >
                <Ionicons name="close-circle" size={18} color={colors.outline} />
              </ScalePressable>
            ) : null}
          </View>

          {/* Filter icon button with badge */}
          <ScalePressable
            onPress={() => setFilterSheetVisible(true)}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel={
              filterCount > 0 ? `Filters, ${filterCount} active` : "Filters"
            }
            style={{
              width: 44,
              height: 44,
              borderRadius: radius.lg,
              backgroundColor:
                filterCount > 0 ? colors.ink800 : colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="options-outline"
              size={20}
              color={filterCount > 0 ? colors.surface : colors.onSurfaceVariant}
            />
            {filterCount > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: 7,
                  right: 7,
                  width: 14,
                  height: 14,
                  borderRadius: 7,
                  backgroundColor: colors.clay600,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AppText
                  weight="bold"
                  style={{ color: colors.onPrimary, fontSize: 9, lineHeight: 12 }}
                >
                  {filterCount}
                </AppText>
              </View>
            ) : null}
          </ScalePressable>
        </View>

        {/* Recent searches dropdown */}
        {showRecentDropdown ? (
          <View
            style={{
              marginTop: 6,
              backgroundColor: colors.surfaceLow,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                paddingHorizontal: 14,
                paddingTop: 10,
                paddingBottom: 4,
              }}
            >
              <AppText variant="micro" tone="faint">
                Recent
              </AppText>
              <ScalePressable
                onPress={() => {
                  const cleared: string[] = [];
                  setRecentSearches(cleared);
                  saveRecentSearches(cleared);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear recent searches"
                style={{ padding: 4 }}
              >
                <AppText variant="caption" tone="muted">
                  Clear
                </AppText>
              </ScalePressable>
            </View>
            {recentSearches.map((q, i) => (
              <ScalePressable
                key={q}
                onPress={() => {
                  setSearch(q);
                  setDebouncedSearch(q);
                  setSearchFocused(false);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Search for ${q}`}
                pressScale={0.99}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 10,
                  paddingHorizontal: 14,
                  paddingVertical: 11,
                  borderTopWidth: 1,
                  borderTopColor: colors.outlineVariant,
                }}
              >
                <Ionicons name="time-outline" size={15} color={colors.ink300} />
                <AppText style={{ fontSize: 14, flex: 1 }}>{q}</AppText>
              </ScalePressable>
            ))}
          </View>
        ) : null}

        {/* Category quick-filter chips (shown in landing mode) */}
        {!isSearching && landingCategories.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginTop: 10 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {[null, ...landingCategories].map((cat) => {
              const active = filters.category === cat;
              return (
                <ScalePressable
                  key={cat ?? "all"}
                  onPress={() => {
                    triggerHaptic("selection");
                    setFilters({ ...filters, category: cat as MarketFilters["category"] });
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={cat ? categoryLabel(cat) : "All categories"}
                  style={{
                    paddingHorizontal: 14,
                    height: 32,
                    borderRadius: radius.full,
                    backgroundColor: active ? colors.ink800 : colors.surfaceContainer,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <AppText
                    weight={active ? "semibold" : "medium"}
                    style={{
                      fontSize: 13,
                      lineHeight: 17,
                      color: active ? colors.surface : colors.onSurfaceVariant,
                    }}
                  >
                    {cat ? categoryLabel(cat) : "All"}
                  </AppText>
                </ScalePressable>
              );
            })}
          </ScrollView>
        ) : null}

        {/* Category chip strip when in search mode (shows active category) */}
        {isSearching && filters.category ? (
          <View style={{ marginTop: 10, flexDirection: "row", gap: 8 }}>
            <ScalePressable
              onPress={() => {
                triggerHaptic("selection");
                setFilters({ ...filters, category: null });
              }}
              accessibilityRole="button"
              accessibilityLabel={`Remove category filter: ${categoryLabel(filters.category)}`}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 6,
                paddingHorizontal: 12,
                height: 32,
                borderRadius: radius.full,
                backgroundColor: colors.ink800,
              }}
            >
              <AppText
                weight="semibold"
                style={{ fontSize: 13, lineHeight: 17, color: colors.surface }}
              >
                {categoryLabel(filters.category)}
              </AppText>
              <Ionicons name="close" size={13} color={colors.surface} />
            </ScalePressable>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <MarketSkeleton gridItemWidth={gridItemWidth} />
      ) : error ? (
        <EmptyState
          icon="cloud-offline-outline"
          title="Couldn't load the marketplace"
          body="Check your connection and try again."
          ctaLabel="Retry"
          onCtaPress={() => refetch()}
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => i.id}
          numColumns={2}
          renderItem={({ item }) => <ItemGridCard item={item} width={gridItemWidth} />}
          columnWrapperStyle={{ gap: GRID_GAP, paddingHorizontal: H_PADDING }}
          contentContainerStyle={{ paddingBottom: 48, gap: GRID_GAP }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          ListEmptyComponent={
            isSearching ? (
              <View style={{ alignItems: "center", paddingTop: 16, gap: 12 }}>
                <EmptyState
                  icon="search-outline"
                  title="No matches"
                  body="Try adjusting your search or filters."
                  compact
                />
                <Button
                  label="Clear filters"
                  variant="secondary"
                  onPress={clearAll}
                />
              </View>
            ) : (
              <EmptyState
                icon="storefront-outline"
                title="No sales live right now"
                body="New moving sales appear here as soon as sellers publish them."
              />
            )
          }
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

      <FilterSheet
        visible={filterSheetVisible}
        filters={filters}
        onApply={(f) => {
          setFilters(f);
          setFilterSheetVisible(false);
        }}
        onClose={() => setFilterSheetVisible(false)}
      />
    </View>
  );
}
