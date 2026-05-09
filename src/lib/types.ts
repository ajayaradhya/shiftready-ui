export type SaleStatus =
  | "pending_upload"
  | "processing"
  | "ready_for_review"
  | "pricing_in_progress"
  | "live"
  | "partially_sold"
  | "expired"
  | "failed"
  | "archived";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  condition: string;
  video_timestamp: number;
  timestamp_label: string;
  confidence: number;

  // Pricing Fields
  predicted_original_price?: number;
  actual_original_price?: number | null;
  predicted_listing_price?: number;
  actual_listing_price?: number | null;
  pricing_reasoning?: string;

  // Purchase Metadata
  predicted_year_of_purchase?: number;
  actual_year_of_purchase?: number | null;
}

export interface RoomBundle {
  id: string;
  name: string;
  items: InventoryItem[];
  suggestedPrice: number;
  isPublished: boolean;
  createdAt: string;
}

export interface SaleSummary {
  id: string;
  status: SaleStatus;
  videoUrl: string;
  bundles: RoomBundle[];
  moveOutDate?: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}
