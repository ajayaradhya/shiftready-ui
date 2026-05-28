// ── Suburbs ─────────────────────────────────────────────────────────────────
// Full Greater Sydney suburb list now lives in src/lib/locations.ts (dataset-backed).

import { SYDNEY_SUBURB_NAMES } from "@/lib/locations";

export const NSW_SUBURBS_UNIQUE = SYDNEY_SUBURB_NAMES;

// ── Filter types ──────────────────────────────────────────────────────────────

export type CategoryFilter =
  | "furniture"
  | "appliance"
  | "electronics"
  | "decor"
  | "clothing"
  | "books_media"
  | "sports_fitness"
  | "garden_outdoor"
  | "kitchen_dining"
  | "baby_kids"
  | "tools_hardware"
  | "toys_games"
  | "lighting"
  | "storage"
  | "other";

export type ConditionFilter = "New" | "Like New" | "Good" | "Fair";

export type PriceRangeKey =
  | "under_50"
  | "50_200"
  | "200_500"
  | "500_plus";

export type SortKey =
  | "newest"
  | "price_asc"
  | "price_desc";

export interface FilterOption<T extends string> {
  value: T;
  label: string;
}

export interface PriceRangeOption extends FilterOption<PriceRangeKey> {
  min?: number;
  max?: number;
}

// ── Category options ──────────────────────────────────────────────────────────

export const CATEGORY_OPTIONS: FilterOption<CategoryFilter>[] = [
  { value: "furniture",       label: "Furniture" },
  { value: "appliance",       label: "Appliances" },
  { value: "electronics",     label: "Electronics" },
  { value: "kitchen_dining",  label: "Kitchen & Dining" },
  { value: "decor",           label: "Décor & Art" },
  { value: "lighting",        label: "Lighting" },
  { value: "storage",         label: "Storage" },
  { value: "clothing",        label: "Clothing" },
  { value: "books_media",     label: "Books & Media" },
  { value: "sports_fitness",  label: "Sports & Fitness" },
  { value: "garden_outdoor",  label: "Garden & Outdoor" },
  { value: "baby_kids",       label: "Baby & Kids" },
  { value: "tools_hardware",  label: "Tools & Hardware" },
  { value: "toys_games",      label: "Toys & Games" },
  { value: "other",           label: "Other" },
];

export const CATEGORY_LABELS: Record<CategoryFilter, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map(o => [o.value, o.label])
) as Record<CategoryFilter, string>;

// ── Other filter options ──────────────────────────────────────────────────────

export const CONDITION_OPTIONS: FilterOption<ConditionFilter>[] = [
  { value: "New",       label: "New" },
  { value: "Like New",  label: "Like New" },
  { value: "Good",      label: "Good" },
  { value: "Fair",      label: "Fair" },
];

export const PRICE_RANGE_OPTIONS: PriceRangeOption[] = [
  { value: "under_50",  label: "Under $50",    max: 50 },
  { value: "50_200",    label: "$50 – $200",   min: 50,  max: 200 },
  { value: "200_500",   label: "$200 – $500",  min: 200, max: 500 },
  { value: "500_plus",  label: "$500+",         min: 500 },
];

export const SORT_OPTIONS: FilterOption<SortKey>[] = [
  { value: "newest",     label: "Newest" },
  { value: "price_asc",  label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

export function priceRangeToParams(key: PriceRangeKey): { min?: number; max?: number } {
  const opt = PRICE_RANGE_OPTIONS.find(o => o.value === key);
  return opt ? { min: opt.min, max: opt.max } : {};
}
