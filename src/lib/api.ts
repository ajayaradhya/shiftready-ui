const API_BASE = "http://localhost:8000/api/v1";

/**
 * UTILITY: Centralized fetch wrapper for cleaner error handling
 */
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || `API Request failed: ${res.status}`);
  }
  return res.json();
}

// --- Sale Core Operations ---

export async function getSummary(eventId: string) {
  return apiRequest<any>(`${API_BASE}/sales/${eventId}/summary`);
}

export async function getStatus(eventId: string) {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/status`);
}

export async function initSale(userId: string, filename: string) {
  return apiRequest<{ event_id: string; upload_url: string; gcs_uri: string }>(
    `${API_BASE}/sales/init`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, filename }),
    }
  );
}

export async function startProcessing(eventId: string) {
  return apiRequest<any>(`${API_BASE}/sales/${eventId}/process`, { method: "POST" });
}

export async function triggerReestimation(eventId: string) {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/estimate`, {
    method: "POST",
  });
}

export async function publishSale(eventId: string, moveOutDate: string) {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ move_out_date: moveOutDate }),
  });
}

// --- Bundle Management (CRUD) ---

export async function createBundle(eventId: string, name: string) {
  return apiRequest<{ bundle_id: string }>(`${API_BASE}/sales/${eventId}/bundles`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
}

export async function deleteBundle(eventId: string, bundleId: string) {
  // Use apiRequest to ensure we catch 404s or permission issues on delete
  return fetch(`${API_BASE}/sales/${eventId}/bundles/${bundleId}`, {
    method: "DELETE",
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to delete bundle");
  });
}

// --- Item Management (CRUD) ---

export async function createItem(eventId: string, bundleId: string, name: string) {
  // Matches backend ItemCreateRequest defaults
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
  updates: any
) {
  return apiRequest<{ status: string }>(
    `${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    }
  );
}

export async function deleteItem(eventId: string, bundleId: string, itemId: string) {
  return fetch(`${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`, {
    method: "DELETE",
  }).then((res) => {
    if (!res.ok) throw new Error("Failed to delete item");
  });
}