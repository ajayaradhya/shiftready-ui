import type {
  SaleSummary,
  InventoryItem,
  SaleListing,
  MarketplaceSearchResult,
  PublicSaleDetail,
  ActiveSaleSummary,
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

async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const existingHeaders = (options?.headers as Record<string, string>) ?? {};
  const headers: Record<string, string> = {
    ...existingHeaders,
    ...(_idToken ? { Authorization: `Bearer ${_idToken}` } : {}),
  };

  const res = await fetch(url, { ...options, headers });

  if (res.status === 204) {
    return {} as T;
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

export async function appendInitSale(
  eventId: string,
  filename: string
): Promise<{ upload_url: string; gcs_uri: string }> {
  return apiRequest<{ upload_url: string; gcs_uri: string }>(
    `${API_BASE}/sales/${eventId}/append-init`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    }
  );
}

export async function startAppendProcessing(
  eventId: string,
  gcsUri: string
): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/append-process`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gcs_uri: gcsUri }),
  });
}

export async function initCaptureSale(): Promise<{ event_id: string }> {
  return apiRequest<{ event_id: string }>(`${API_BASE}/sales/init-capture`, {
    method: "POST",
  });
}

export async function processFrames(
  eventId: string,
  files: File[]
): Promise<{ event_id: string; status: string }> {
  const form = new FormData();
  for (const file of files) {
    form.append("frames", file);
  }
  return apiRequest<{ event_id: string; status: string }>(
    `${API_BASE}/sales/${eventId}/process-frames`,
    { method: "POST", body: form }
  );
}

export async function startProcessing(eventId: string): Promise<{ message: string }> {
  return apiRequest<{ message: string }>(`${API_BASE}/sales/${eventId}/process`, {
    method: "POST",
  });
}

export async function triggerReestimation(eventId: string): Promise<{ status: string }> {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/estimate`, {
    method: "POST",
  });
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

// --- Seller Dashboard ---

export async function listSales(): Promise<SaleListing[]> {
  return apiRequest<SaleListing[]>(`${API_BASE}/sales/`);
}

// --- Marketplace ---

export async function searchMarketplace(
  q?: string,
  suburb?: string
): Promise<MarketplaceSearchResult> {
  const params = new URLSearchParams();
  if (q) params.set("q", q);
  if (suburb) params.set("suburb", suburb);
  const qs = params.toString();
  return apiRequest<MarketplaceSearchResult>(
    `${API_BASE}/marketplace/search${qs ? `?${qs}` : ""}`
  );
}

export async function getPublicSale(eventId: string): Promise<PublicSaleDetail> {
  return apiRequest<PublicSaleDetail>(`${API_BASE}/marketplace/sales/${eventId}`);
}

export async function getActiveSales(): Promise<ActiveSaleSummary[]> {
  return apiRequest<ActiveSaleSummary[]>(`${API_BASE}/marketplace/sales`);
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
