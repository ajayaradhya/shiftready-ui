import { z } from "zod";

export const SaleStatusSchema = z.enum([
  "pending_upload",
  "processing",
  "ready_for_review",
  "pricing_in_progress",
  "live",
  "partially_sold",
  "expired",
  "failed",
  "archived",
]);

export const InventoryItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  brand: z.string(),
  condition: z.string(),
  timestamp_label: z.string(),
  confidence: z.number(),

  predicted_original_price: z.number().optional(),
  actual_original_price: z.number().nullable().optional(),
  predicted_listing_price: z.number().optional(),
  actual_listing_price: z.number().nullable().optional(),
  pricing_reasoning: z.string().optional(),

  predicted_year_of_purchase: z.number().optional(),
  actual_year_of_purchase: z.number().nullable().optional(),
});

export const RoomBundleSchema = z.object({
  id: z.string(),
  name: z.string(),
  items: z.array(InventoryItemSchema),
  suggestedPrice: z.number(),
  isPublished: z.boolean(),
  createdAt: z.string(),
  bundleDiscountPercent: z.number().nullable().optional(),
});

export const SaleSummarySchema = z.object({
  id: z.string(),
  status: SaleStatusSchema,
  bundles: z.array(RoomBundleSchema),
  moveOutDate: z.string().optional(),
  sellerId: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string().optional(),
});
