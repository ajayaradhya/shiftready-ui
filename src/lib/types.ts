// --- Notifications ---

export type NotifType = "message.new" | "offer.new" | "offer.accepted" | "offer.countered" | "sale.ready";

export interface Notification {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  link: string;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadNotifCount {
  unread_count: number;
}

// --- Marketplace & Dashboard types ---

export interface ActiveSaleSummary {
  eventId: string;
  suburb: string | null;
  state: string | null;
  title?: string | null;
  description?: string | null;
  itemCount: number;
  minPrice: number | null;
  publishedAt: string | null;
  preview_images: string[];
  cover_image_url?: string | null;
}


export interface MarketplaceItem {
  id: string;
  name: string;
  brand: string;
  condition: string;
  category?: string | null;
  price: number | null;
  bundleName: string | null;
  eventId: string;
  image_url?: string | null;
  thumb_url?: string | null;
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

export interface LandingData {
  items: MarketplaceItem[];
  cheapest: MarketplaceItem[];
  active_sales: ActiveSaleSummary[];
}

export interface PublicBundleItem {
  id: string;
  name: string | null;
  brand: string | null;
  condition: string | null;
  price: number;
  image_url?: string | null;
  sale_status?: ItemSaleStatus;
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
  sellerId: string | null;
  sellerUsername: string | null;
  suburb: string | null;
  state: string | null;
  title?: string | null;
  description?: string | null;
  cover_image_url?: string | null;
  moveOutDate: string | null;
  publishedAt: string | null;
  bundles: PublicBundle[];
  is_authenticated: boolean;
  is_saved: boolean | null;
}

export interface PublicItemImage {
  url: string | null;
  thumb_url: string | null;
  is_cover: boolean;
}

export interface PublicItemDetail {
  name: string | null;
  brand: string | null;
  condition: string | null;
  price: number | null;
  original_price: number | null;
  year: number | null;
  // Legacy single-image (still populated for compat)
  image_url: string | null;
  thumb_url: string | null;
  // Full gallery
  images: PublicItemImage[];
  // Availability
  sale_status: "available" | "reserved" | "sold";
  // Physical details
  dimensions: string | null;
  material: string | null;
  is_fragile: boolean;
  disassembly_required: boolean;
  // Context
  bundle_id: string;
  bundle_name: string | null;
  suburb: string | null;
  sale_title: string | null;
  move_out_date: string | null;
  seller_id: string | null;
  pricing_reasoning?: string | null;
  is_saved: boolean | null;
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
  preview_images: string[];
  title?: string | null;
  description?: string | null;
  coverImage?: CoverImage | null;
}

// --- Core sale types ---

export type SaleStatus =
  | "pending_upload"
  | "processing"
  | "ready_for_review"
  | "pricing_in_progress"
  | "live"
  | "partially_sold"
  | "sold"
  | "expired"
  | "failed"
  | "archived";

export type ItemSaleStatus = "available" | "reserved" | "sold" | "withdrawn";
export type BundleSaleStatus = "available" | "partially_sold" | "reserved" | "sold" | "withdrawn";

export interface InventoryImage {
  id: string;
  gcs_path: string;
  url?: string;
  thumb_url?: string;
  medium_url?: string;
  is_cover: boolean;
  source: "user_upload" | "frame_extract";
  uploaded_at: string;
}

export interface CoverImage {
  id: string;
  gcs_path: string;
  url?: string;
  thumb_url?: string;
  source: "user_upload" | "frame_extract";
}

export type ItemCategory = "furniture" | "appliance" | "decor" | "electronics" | "other";

export interface InventoryItem {
  id: string;
  name: string;
  brand: string;
  condition: string;
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

  // Extended fields (Phase 1)
  description?: string | null;
  category?: ItemCategory | null;
  quantity?: number | null;
  dimensions?: string | null;
  material?: string | null;
  is_fragile?: boolean;
  disassembly_required?: boolean;

  // Media
  images?: InventoryImage[];

  // Sold lifecycle
  sale_status?: ItemSaleStatus;
  reserved_for_uid?: string | null;
  reserved_at?: string | null;
  sold_to_uid?: string | null;
  sold_at?: string | null;
  final_price?: number | null;
  sold_payment_method?: string | null;
  sold_as?: "item" | "bundle" | "sale" | null;
  buyer_label?: string | null;
}

export interface RoomBundle {
  id: string;
  name: string;
  items: InventoryItem[];
  suggestedPrice: number;
  isPublished: boolean;
  createdAt: string;
  bundleDiscountPercent?: number | null;
  sale_status?: BundleSaleStatus;
  sold_count?: number;
  total_count?: number;
}

export interface MarkSoldPayload {
  final_price?: number | null;
  buyer_uid?: string | null;
  buyer_label?: string | null;
  conversation_id?: string | null;
  offer_id?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface MarkBundleSoldPayload {
  scope?: "bundle_as_unit" | "all_items";
  final_price?: number | null;
  buyer_uid?: string | null;
  buyer_label?: string | null;
  conversation_id?: string | null;
  payment_method?: string | null;
  notes?: string | null;
}

export interface TransactionRecord {
  id: string;
  type: string;
  granularity: string;
  amount?: number | null;
  paymentMethod?: string | null;
  buyerUid?: string | null;
  buyerLabel?: string | null;
  sellerUid?: string | null;
  notes?: string | null;
  bundleId?: string | null;
  itemId?: string | null;
  createdAt?: string | null;
}

export interface SaleSummary {
  id: string;
  status: SaleStatus;
  bundles: RoomBundle[];
  moveOutDate?: string | null;
  sellerId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  // Phase 2 metadata
  title?: string | null;
  description?: string | null;
  streetAddress?: string | null;
  suburb?: string | null;
  pincode?: string | null;
  state?: string | null;
  coverImage?: CoverImage | null;
}

// --- User / Username types ---

export interface UserProfile {
  id: string;
  username: string;
  usernameSetByUser: boolean;
  usernameChangedAt: string | null;
}

export interface NotifPrefs {
  msg: boolean;
  offer: boolean;
  counter: boolean;
  deal: boolean;
  ready: boolean;
  viewed: boolean;
  buy_msg: boolean;
  buy_offer: boolean;
  price_drop: boolean;
}

export interface SellerPrefs {
  paymentMethods: string[];
  pickupDays: string[];
  pickupTimes: string[];
  minOfferPercent: number;
}

export interface PrivacyPrefs {
  messagingFilter: string;
  profileVisible: boolean;
}

export interface UserSettings {
  id: string;
  username: string;
  usernameSetByUser: boolean;
  usernameChangedAt: string | null;
  displayName: string | null;
  bio: string | null;
  phoneE164: string | null;
  phoneShareOptIn: boolean;
  suburb: string | null;
  state: string | null;
  joinedAt: string | null;
  notifPrefs: NotifPrefs;
  sellerPrefs: SellerPrefs;
  privacyPrefs: PrivacyPrefs;
}

export interface UsernameAvailable {
  available: boolean;
  username: string;
}

export interface PublicUser {
  username: string;
  joinedAt: string | null;
}

// --- Messaging types ---

export type PinKind = "item" | "bundle" | "sale";

export interface PinRef {
  kind: PinKind;
  saleEventId: string;
  bundleId?: string | null;
  itemId?: string | null;
}

export interface PinSnapshot {
  name?: string | null;
  imageUrl?: string | null;
  price?: number | null;
  rrp?: number | null;
  condition?: string | null;
  itemCount?: number | null;
  suburb?: string | null;
}

export interface MessageContext {
  saleEventId: string;
  bundleId?: string | null;
  itemId?: string | null;
}

export type OfferStatus = "pending" | "countered" | "accepted" | "withdrawn";

export interface OfferPayload {
  offerId: string;
  amount: number;
  currency: string;
  listPrice?: number | null;
  parentOfferId?: string | null;
  status: OfferStatus;
  pinTarget?: PinRef | null;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: string | null;
  type: "text" | "system" | "offer" | "offer_accepted";
  subtype?: string | null;
  context?: MessageContext | null;
  pinSnapshot?: PinSnapshot | null;
  offerPayload?: OfferPayload | null;
}

export type DealStatus = "none" | "negotiating" | "agreed";

export interface ConversationSummary {
  id: string;
  otherUserId: string | null;
  otherUsername: string | null;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
  status: "active" | "blocked";
  updatedAt: string | null;
  pin?: PinRef | null;
  pinSnapshot?: PinSnapshot | null;
  activeOfferId?: string | null;
  dealStatus?: DealStatus;
  phoneSharedByMe?: boolean;
  phoneRevealAvailable?: boolean;
  otherLastSeenAt?: string | null;
  otherVerified?: boolean;
}

export interface PhoneRevealResponse {
  phoneE164: string;
}

export interface ConversationStartResponse {
  conversationId: string;
  created: boolean;
}

export interface MessagesListResponse {
  messages: Message[];
  conversationId: string;
}

// --- Saved / Watchlist types ---

export interface SavedSale {
  eventId: string;
  suburb: string | null;
  state: string | null;
  itemCount: number;
  moveOutDate: string | null;
  savedAt: string | null;
}

export interface SavedItem {
  itemId: string;
  bundleId: string | null;
  eventId: string | null;
  name: string | null;
  brand: string | null;
  condition: string | null;
  price: number | null;
  suburb: string | null;
  image_url: string | null;
  savedAt: string | null;
}

export interface SavedListResponse {
  saved_sales: SavedSale[];
  saved_items: SavedItem[];
}
