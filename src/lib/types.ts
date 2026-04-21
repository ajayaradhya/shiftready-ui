export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  condition: string;
  video_timestamp: number;
  timestamp_label: string;
  predicted_original_price?: number;
  actual_original_price?: number;
  predicted_listing_price?: number;
  actual_listing_price?: number;
  pricing_reasoning?: string;
  confidence: number;
}

export interface RoomBundle {
  id: string;
  name: string;
  items: InventoryItem[];
}

export interface SaleSummary {
  id: string;
  status: 'processing' | 'ready_for_review' | 'live' | 'failed';
  videoUrl: string;
  bundles: RoomBundle[];
  moveOutDate?: string;
}