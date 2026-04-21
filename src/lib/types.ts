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
  actual_original_price?: number;
  predicted_listing_price?: number;
  actual_listing_price?: number;
  pricing_reasoning?: string;
  
  // New Metadata from JSON
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
  status: 'processing' | 'ready_for_review' | 'live' | 'failed' | 'pricing_in_progress';
  videoUrl: string;
  bundles: RoomBundle[];
  moveOutDate?: string;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}