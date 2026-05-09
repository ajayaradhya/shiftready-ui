// --- Marketplace & Dashboard types ---

export interface MarketplaceItem {
  id: string;
  name: string;
  brand: string;
  condition: string;
  price: number | null;
  bundleName: string | null;
  eventId: string;
  metadata: {
    year: number | null;
    originalPrice: number | null;
    confidence: number | null;
  };
}

export interface MarketplaceSearchResult {
  count: number;
  items: MarketplaceItem[];
  is_authenticated: boolean;
}

export interface PublicBundleItem {
  id: string;
  name: string | null;
  brand: string | null;
  condition: string | null;
  price: number;
}

export interface PublicBundle {
  id: string;
  name: string | null;
  items: PublicBundleItem[];
  itemTotal: number;
  bundlePrice: number;
  discountPct: number;
}

export interface PublicSaleDetail {
  eventId: string;
  suburb: string | null;
  state: string | null;
  moveOutDate: string | null;
  publishedAt: string | null;
  bundles: PublicBundle[];
  is_authenticated: boolean;
}

export interface SaleListing {
  id: string;
  status: SaleStatus;
  sellerId: string;
  suburb: string | null;
  street_address: string | null;
  pincode: string | null;
  state: string | null;
  createdAt: string;
  itemCount: number;
  totalValue: number;
}

// --- Core sale types ---

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
