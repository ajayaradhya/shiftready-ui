const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://shiftready-api-12644234558.australia-southeast1.run.app";
const API_BASE = `${API_URL}/api/v1`;

console.log("Monolith Initialized at:", API_BASE); // Debugging line

/**
 * UTILITY: Centralized fetch wrapper.
 * Ensures all errors are parsed for FastAPI 'detail' messages to avoid generic alerts.
 */
async function apiRequest<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);

  // If the response is 204 No Content (often for DELETE), return empty object as T
  if (res.status === 204) {
    return {} as T;
  }

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    // Throwing the specific detail helps the UI show "Sale is already live" 
    // instead of "API Request failed: 400"
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
  return apiRequest<any>(`${API_BASE}/sales/${eventId}/process`, { 
    method: "POST" 
  });
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

export async function unpublishSale(eventId: string) {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/unpublish`, {
    method: "POST",
  });
}

export async function archiveSale(eventId: string) {
  return apiRequest<{ status: string }>(`${API_BASE}/sales/${eventId}/archive`, {
    method: "POST",
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
  return apiRequest<any>(`${API_BASE}/sales/${eventId}/bundles/${bundleId}`, {
    method: "DELETE",
  });
}

// --- Item Management (CRUD) ---

export async function createItem(eventId: string, bundleId: string, name: string) {
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
  return apiRequest<any>(`${API_BASE}/sales/${eventId}/bundles/${bundleId}/items/${itemId}`, {
    method: "DELETE",
  });
}