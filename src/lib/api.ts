import type {
  SaleSummary,
  InventoryItem,
  SaleListing,
  MarketplaceSearchResult,
  LandingData,
  PublicSaleDetail,
  PublicItemDetail,
  ActiveSaleSummary,
  UserProfile,
  UsernameAvailable,
  ConversationSummary,
  ConversationStartResponse,
  MessagesListResponse,
  MessageContext,
  SavedListResponse,
  PhoneRevealResponse,
  UserSettings,
  NotifPrefs,
  SellerPrefs,
  PrivacyPrefs,
  Notification,
  UnreadNotifCount,
  MarkSoldPayload,
  MarkBundleSoldPayload,
  TransactionRecord,
} from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
const API_BASE = `${API_URL}/api/v1`;

// Module-level token store. AuthProvider calls _setIdToken on every token change
// (sign-in, sign-out, and automatic refresh via onIdTokenChanged).
let _idToken: string | null = null;

export function _setIdToken(token: string | null): void {
  _idToken = token;
}

type EmptyResponse = Record<string, never>;

export type PatchItemPayload = Partial<InventoryItem>;

async function apiRequest<T>(url: string, options?: RequestInit, _retried = false): Promise<T> {
  const existingHeaders = (options?.headers as Record<string, string>) ?? {};
  const headers: Record<string, string> = {
    ...(options?.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}),
    ...existingHeaders,
    ...(_idToken ? { Authorization: `Bearer ${_idToken}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) {
    return {} as T;
  }

  if (res.status === 401 && !_retried) {
    const { auth } = await import("./firebase");
    if (auth?.currentUser) {
      _idToken = await auth.currentUser.getIdToken(true);
      return apiRequest<T>(url, options, true);
    }
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Request failed: ${res.status}`);
  }

  return res.json();
}

// --- Sale Core Operations ---

export async function getSummary(eventId: string): Promise<SaleSummary> {
  return apiRequest<SaleSummary>(`${API_BASE}/sales/${eventId}/summary`);
}

export async function getStatus(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/status`);
}

export async function initSale(
  userId: string,
  filename: string
): Promise<{ event_id: string; upload_url: string; gcs_uri: string }> {
  return apiRequest<{ event_id: string; upload_url: string; gcs_uri: string }>(
    `${API_BASE}/sales/init`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, filename }),
    }
  );
}

export async function initCaptureSale(): Promise<{ event_id: string }> {
  return apiRequest<{ event_id: string }>(`${API_BASE}/sales/init-capture`, {
    method: "POST",
  });
}

export interface CaptureFrameResult {
  name: string;
  brand?: string | null;
  predicted_original_price: number;
  gcs_uri: string;
  confidence?: "high" | "medium" | "low";
}

export async function captureFrame(eventId: string, file: File): Promise<CaptureFrameResult> {
  const form = new FormData();
  form.append("frame", file);
  return apiRequest<CaptureFrameResult>(
    `${API_BASE}/sales/${eventId}/capture/frame`,
    { method: "POST", body: form }
  );
}

export interface CapturedItemForFinalize {
  temp_id: string;
  name: string;
  brand?: string;
  predicted_original_price?: number;
  gcs_uri: string;
  needs_review?: boolean;
  name_source?: "ai" | "user";
}

export async function finalizeCaptureV2(
  eventId: string,
  items: CapturedItemForFinalize[],
  saleTitle?: string
): Promise<{ event_id: string; status: string; item_count: number }> {
  return apiRequest<{ event_id: string; status: string; item_count: number }>(
    `${API_BASE}/sales/${eventId}/capture/finalize-v2`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items, sale_title: saleTitle || null }),
    }
  );
}

export async function startProcessing(eventId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${API_BASE}/sales/${eventId}/process`, {
    method: "POST",
  });
}

export async function suggestSaleTitle(
  eventId: string,
  itemNames: string[]
): Promise<{ title: string }> {
  return apiRequest<{ title: string }>(`${API_BASE}/sales/${eventId}/suggest-title`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ item_names: itemNames }),
  });
}

export async function retryFinalize(
  eventId: string
): Promise<{ event_id: string; status: string; item_count: number }> {
  return apiRequest<{ event_id: string; status: string; item_count: number }>(
    `${API_BASE}/sales/${eventId}/retry-finalize`,
    { method: "POST" }
  );
}


export interface PublishPayload {
  move_out_date: string;
  street_address: string;
  suburb: string;
  pincode: string;
  state?: string;
}

export async function publishSale(
  eventId: string,
  payload: PublishPayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ state: "NSW", ...payload }),
  });
}

export async function unpublishSale(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/unpublish`, {
    method: "POST",
  });
}

export async function archiveSale(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/archive`, {
    method: "POST",
  });
}

export async function deleteSale(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}`, {
    method: "DELETE",
  });
}

export async function republishSale(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/republish`, {
    method: "POST",
  });
}

// --- Sale Metadata Update ---

export interface SaleUpdatePayload {
  title?: string;
  description?: string;
  move_out_date?: string;
  street_address?: string;
  suburb?: string;
  pincode?: string;
  state?: string;
}

export async function updateSale(
  eventId: string,
  patch: SaleUpdatePayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
}

// --- Sale Cover Image ---

export async function getCoverUploadUrl(
  eventId: string
): Promise<{ image_id: string; upload_url: string; gcs_path: string }> {
  return apiRequest<{ image_id: string; upload_url: string; gcs_path: string }>(
    `${API_BASE}/sales/${eventId}/cover/upload-url`,
    { method: "POST" }
  );
}

export async function confirmCover(
  eventId: string,
  imageId: string,
  gcsPath: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/cover/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_id: imageId, gcs_path: gcsPath }),
  });
}

export async function coverFromItem(
  eventId: string,
  bundleId: string,
  itemId: string,
  imageId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/cover/from-item`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ bundle_id: bundleId, item_id: itemId, image_id: imageId }),
  });
}

export async function deleteCover(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/cover`, {
    method: "DELETE",
  });
}

// --- Bundle Management (CRUD) ---

export async function createBundle(
  eventId: string,
  name: string
): Promise<{ bundle_id: string }> {
  return apiRequest<{ bundle_id: string }>(`${API_BASE}/sales/${eventId}/bundles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteBundle(
  eventId: string,
  bundleId: string
): Promise<EmptyResponse> {
  return apiRequest<EmptyResponse>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}`,
    { method: "DELETE" }
  );
}

export async function renameBundle(
  eventId: string,
  bundleId: string,
  name: string
): Promise<{ status: string }> {
  return patchBundle(eventId, bundleId, { name });
}

export async function patchBundle(
  eventId: string,
  bundleId: string,
  updates: { name?: string; bundle_discount_percent?: number | null }
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
}

// --- Item Management (CRUD) ---

export async function createItem(
  eventId: string,
  bundleId: string,
  name: string
): Promise<{ item_id: string }> {
  return apiRequest<{ item_id: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        brand: "Unknown",
        actual_listing_price: 0,
        condition: "Good",
      }),
    }
  );
}

export interface CreateItemFullPayload {
  name: string;
  brand?: string;
  condition?: string;
  actual_listing_price?: number;
  actual_original_price?: number;
  actual_year_of_purchase?: number;
  dimensions?: string | null;
  material?: string | null;
  is_fragile?: boolean;
  disassembly_required?: boolean;
  description?: string | null;
  category?: string | null;
  quantity?: number | null;
}

export async function createItemFull(
  eventId: string,
  bundleId: string,
  payload: CreateItemFullPayload
): Promise<{ item_id: string }> {
  return apiRequest<{ item_id: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );
}

export async function patchItem(
  eventId: string,
  bundleId: string,
  itemId: string,
  updates: PatchItemPayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
}

export interface ItemRepriceResult {
  predicted_listing_price: number;
  actual_listing_price: number;
  pricing_reasoning: string;
}

export async function repriceItem(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<ItemRepriceResult> {
  return apiRequest<ItemRepriceResult>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/reprice`,
    { method: "POST" }
  );
}

// --- Seller Dashboard ---

export async function listSales(): Promise<SaleListing[]> {
  return apiRequest<SaleListing[]>(`${API_BASE}/sales/`);
}

// --- Marketplace ---

export interface MarketplaceSearchParams {
  q?: string;
  suburb?: string;
  category?: string;
  condition?: string;
  min_price?: number;
  max_price?: number;
  sort?: string;
}

export async function searchMarketplace(
  params: MarketplaceSearchParams = {}
): Promise<MarketplaceSearchResult> {
  const p = new URLSearchParams();
  if (params.q)           p.set("q", params.q);
  if (params.suburb)      p.set("suburb", params.suburb);
  if (params.category)    p.set("category", params.category);
  if (params.condition)   p.set("condition", params.condition);
  if (params.min_price != null) p.set("min_price", String(params.min_price));
  if (params.max_price != null) p.set("max_price", String(params.max_price));
  if (params.sort)        p.set("sort", params.sort);
  const qs = p.toString();
  return apiRequest<MarketplaceSearchResult>(
    `${API_BASE}/marketplace/search${qs ? `?${qs}` : ""}`
  );
}

export async function getPublicSale(eventId: string): Promise<PublicSaleDetail> {
  return apiRequest<PublicSaleDetail>(`${API_BASE}/marketplace/sales/${eventId}`);
}

export async function getPublicItem(eventId: string, bundleId: string, itemId: string): Promise<PublicItemDetail> {
  return apiRequest<PublicItemDetail>(`${API_BASE}/marketplace/items/${eventId}/${bundleId}/${itemId}`);
}

export async function getActiveSales(): Promise<ActiveSaleSummary[]> {
  return apiRequest<ActiveSaleSummary[]>(`${API_BASE}/marketplace/sales`);
}

export async function getLandingData(suburb?: string): Promise<LandingData> {
  const qs = suburb ? `?suburb=${encodeURIComponent(suburb)}` : "";
  return apiRequest<LandingData>(`${API_BASE}/marketplace/landing${qs}`);
}

// --- Item Image Management ---

export interface ImageUploadUrlItem {
  image_id: string;
  upload_url: string;
  gcs_path: string;
}

export async function getItemImageUploadUrls(
  eventId: string,
  bundleId: string,
  itemId: string,
  files: { filename: string; content_type: string }[]
): Promise<{ urls: ImageUploadUrlItem[] }> {
  return apiRequest<{ urls: ImageUploadUrlItem[] }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/images/upload-urls`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ files }),
    }
  );
}

export async function confirmItemImages(
  eventId: string,
  bundleId: string,
  itemId: string,
  images: { image_id: string; gcs_path: string }[]
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/images/confirm`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ images }),
    }
  );
}

export async function deleteItemImage(
  eventId: string,
  bundleId: string,
  itemId: string,
  imageId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/images/${imageId}`,
    { method: "DELETE" }
  );
}

export async function setItemImageCover(
  eventId: string,
  bundleId: string,
  itemId: string,
  imageId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/images/${imageId}/cover`,
    { method: "PATCH" }
  );
}

// --- Item Management (CRUD) ---

export async function deleteItem(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<EmptyResponse> {
  return apiRequest<EmptyResponse>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`,
    { method: "DELETE" }
  );
}

export async function moveItem(
  eventId: string,
  bundleId: string,
  itemId: string,
  toBundleId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/move`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_bundle_id: toBundleId }),
    }
  );
}

export async function reorderItemImages(
  eventId: string,
  bundleId: string,
  itemId: string,
  imageIds: string[]
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/images/order`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image_ids: imageIds }),
    }
  );
}

// --- User / Username ---

export async function getMe(): Promise<UserProfile> {
  return apiRequest<UserProfile>(`${API_BASE}/users/me`);
}

export async function checkUsernameAvailable(username: string): Promise<UsernameAvailable> {
  return apiRequest<UsernameAvailable>(
    `${API_BASE}/users/username-available?u=${encodeURIComponent(username)}`
  );
}

export async function updateUsername(username: string): Promise<UserProfile> {
  return apiRequest<UserProfile>(`${API_BASE}/users/me/username`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username }),
  });
}

export async function getMySettings(): Promise<UserSettings> {
  return apiRequest<UserSettings>(`${API_BASE}/users/me/settings`);
}

export async function updateProfile(displayName: string | null, bio: string | null): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/profile`, {
    method: "PATCH",
    body: JSON.stringify({ displayName, bio }),
  });
}

export async function updateLocation(suburb: string | null, state: string | null): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/location`, {
    method: "PATCH",
    body: JSON.stringify({ suburb, state }),
  });
}

export async function updateNotifications(prefs: NotifPrefs): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/notifications`, {
    method: "PATCH",
    body: JSON.stringify({ prefs }),
  });
}

export async function updatePreferences(prefs: SellerPrefs): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/preferences`, {
    method: "PATCH",
    body: JSON.stringify({ prefs }),
  });
}

export async function updatePrivacy(prefs: PrivacyPrefs): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/privacy`, {
    method: "PATCH",
    body: JSON.stringify({ prefs }),
  });
}

// --- Messaging ---

export async function startConversation(
  otherUserId: string,
  initialMessage?: string,
  context?: MessageContext
): Promise<ConversationStartResponse> {
  return apiRequest<ConversationStartResponse>(`${API_BASE}/messages/conversations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ otherUserId, initialMessage, context }),
  });
}

export async function listConversations(): Promise<ConversationSummary[]> {
  return apiRequest<ConversationSummary[]>(`${API_BASE}/messages/conversations`);
}

export async function getUnreadCount(): Promise<{ unreadCount: number }> {
  return apiRequest<{ unreadCount: number }>(`${API_BASE}/messages/conversations/unread`);
}

export async function getMessages(
  convId: string,
  before?: string,
  limit = 50
): Promise<MessagesListResponse> {
  const params = new URLSearchParams();
  if (before) params.set("before", before);
  params.set("limit", String(limit));
  return apiRequest<MessagesListResponse>(
    `${API_BASE}/messages/conversations/${convId}/messages?${params}`
  );
}

export async function sendMessage(
  convId: string,
  text: string,
  context?: MessageContext
): Promise<import("./types").Message> {
  return apiRequest<import("./types").Message>(
    `${API_BASE}/messages/conversations/${convId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
    }
  );
}

export async function markConversationRead(convId: string): Promise<void> {
  await apiRequest<unknown>(`${API_BASE}/messages/conversations/${convId}/read`, {
    method: "POST",
  });
}

export async function blockConversation(convId: string): Promise<void> {
  await apiRequest<unknown>(`${API_BASE}/messages/conversations/${convId}/block`, {
    method: "POST",
  });
}

export async function unblockConversation(convId: string): Promise<void> {
  await apiRequest<unknown>(`${API_BASE}/messages/conversations/${convId}/unblock`, {
    method: "POST",
  });
}

export async function setPin(
  convId: string,
  body: {
    kind: "item" | "bundle" | "sale";
    saleEventId: string;
    bundleId?: string | null;
    itemId?: string | null;
  }
): Promise<void> {
  await apiRequest<unknown>(`${API_BASE}/messages/conversations/${convId}/pin`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export async function clearPin(convId: string): Promise<void> {
  await apiRequest<unknown>(`${API_BASE}/messages/conversations/${convId}/pin`, {
    method: "PATCH",
    body: JSON.stringify({ kind: null }),
  });
}

export async function sendOffer(
  convId: string,
  amount: number,
  parentOfferId?: string | null
): Promise<import("./types").Message> {
  return apiRequest<import("./types").Message>(
    `${API_BASE}/messages/conversations/${convId}/offers`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, parentOfferId: parentOfferId ?? null }),
    }
  );
}

export async function acceptOffer(
  convId: string,
  offerId: string
): Promise<import("./types").Message> {
  return apiRequest<import("./types").Message>(
    `${API_BASE}/messages/conversations/${convId}/offers/${offerId}/accept`,
    { method: "POST" }
  );
}

export async function counterOffer(
  convId: string,
  offerId: string,
  amount: number
): Promise<import("./types").Message> {
  return apiRequest<import("./types").Message>(
    `${API_BASE}/messages/conversations/${convId}/offers/${offerId}/counter`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount }),
    }
  );
}

export async function withdrawOffer(
  convId: string,
  offerId: string
): Promise<import("./types").Message> {
  return apiRequest<import("./types").Message>(
    `${API_BASE}/messages/conversations/${convId}/offers/${offerId}/withdraw`,
    { method: "POST" }
  );
}

// --- Phone Reveal ---

export async function updateMyPhone(phoneE164: string, shareOptIn: boolean): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/users/me/phone`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phoneE164, shareOptIn }),
  });
}

export async function sharePhone(convId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/messages/conversations/${convId}/phone/share`,
    { method: "POST" }
  );
}

export async function revealPhone(convId: string): Promise<PhoneRevealResponse> {
  return apiRequest<PhoneRevealResponse>(
    `${API_BASE}/messages/conversations/${convId}/phone`
  );
}

// --- Saved / Watchlist ---

export async function saveSale(eventId: string): Promise<{ saved: boolean }> {
  return apiRequest<{ saved: boolean }>(
    `${API_BASE}/marketplace/sales/${eventId}/save`,
    { method: "POST" }
  );
}

export async function unsaveSale(eventId: string): Promise<{ saved: boolean }> {
  return apiRequest<{ saved: boolean }>(
    `${API_BASE}/marketplace/sales/${eventId}/save`,
    { method: "DELETE" }
  );
}

export async function saveItem(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<{ saved: boolean }> {
  return apiRequest<{ saved: boolean }>(
    `${API_BASE}/marketplace/items/${eventId}/${bundleId}/${itemId}/save`,
    { method: "POST" }
  );
}

export async function unsaveItem(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<{ saved: boolean }> {
  return apiRequest<{ saved: boolean }>(
    `${API_BASE}/marketplace/items/${eventId}/${bundleId}/${itemId}/save`,
    { method: "DELETE" }
  );
}

export async function getSaved(): Promise<SavedListResponse> {
  return apiRequest<SavedListResponse>(`${API_BASE}/users/me/saved`);
}

// --- Sold Lifecycle ---

export async function markItemSold(
  eventId: string,
  bundleId: string,
  itemId: string,
  payload: MarkSoldPayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/mark-sold`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function withdrawItem(
  eventId: string,
  bundleId: string,
  itemId: string,
  notes?: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/withdraw`,
    { method: "POST", body: JSON.stringify({ notes: notes ?? null }) }
  );
}

export async function releaseItemReservation(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/release-reservation`,
    { method: "POST" }
  );
}

export async function relistItem(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}/relist`,
    { method: "POST" }
  );
}

export async function markBundleSold(
  eventId: string,
  bundleId: string,
  payload: MarkBundleSoldPayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/mark-sold`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function withdrawBundle(
  eventId: string,
  bundleId: string,
  notes?: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/withdraw`,
    { method: "POST", body: JSON.stringify({ notes: notes ?? null }) }
  );
}

export async function markSaleSold(
  eventId: string,
  payload: MarkSoldPayload
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/mark-sold`,
    { method: "POST", body: JSON.stringify(payload) }
  );
}

export async function withdrawSale(
  eventId: string,
  notes?: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/withdraw`,
    { method: "POST", body: JSON.stringify({ notes: notes ?? null }) }
  );
}

export async function listTransactions(eventId: string): Promise<TransactionRecord[]> {
  return apiRequest<TransactionRecord[]>(`${API_BASE}/sales/${eventId}/transactions`);
}

// --- Notifications ---

export async function getNotifications(): Promise<Notification[]> {
  return apiRequest<Notification[]>(`${API_BASE}/notifications`);
}

export async function getNotifUnreadCount(): Promise<UnreadNotifCount> {
  return apiRequest<UnreadNotifCount>(`${API_BASE}/notifications/unread-count`);
}

export async function markNotifRead(notifId: string): Promise<void> {
  await apiRequest<Record<string, never>>(`${API_BASE}/notifications/${notifId}/read`, { method: "POST" });
}

export async function markAllNotifsRead(): Promise<void> {
  await apiRequest<Record<string, never>>(`${API_BASE}/notifications/mark-all-read`, { method: "POST" });
}
