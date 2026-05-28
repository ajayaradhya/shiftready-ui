import { APIRequestContext } from '@playwright/test';

const BASE = process.env.E2E_API_URL ?? 'http://localhost:8080';

/** Thin wrapper around Playwright's request context for backend API calls. */
export function makeApi(request: APIRequestContext, token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };

  return {
    async post(path: string, body: unknown) {
      return request.post(`${BASE}/api/v1${path}`, { headers, data: body });
    },
    async get(path: string) {
      return request.get(`${BASE}/api/v1${path}`, { headers });
    },
    async patch(path: string, body: unknown) {
      return request.patch(`${BASE}/api/v1${path}`, { headers, data: body });
    },
  };
}

/** Create a published sale with one item and return { eventId, bundleId, itemId }. */
export async function seedLiveSale(
  request: APIRequestContext,
  sellerToken: string,
): Promise<{ eventId: string; bundleId: string; itemId: string }> {
  const api = makeApi(request, sellerToken);

  const initRes = await api.post('/sales/init-capture', {});
  const { event_id: eventId } = await initRes.json();

  const bundleRes = await api.post(`/sales/${eventId}/bundles`, { name: 'Living Room' });
  const { bundle_id: bundleId } = await bundleRes.json();

  const itemRes = await api.post(`/sales/${eventId}/bundles/${bundleId}/items`, {
    name: 'Velvet Sofa',
    brand: 'West Elm',
    condition: 'Excellent',
    actual_listing_price: 450.0,
    actual_original_price: 1200.0,
    actual_year_of_purchase: 2022,
  });
  const { item_id: itemId } = await itemRes.json();

  await api.post(`/sales/${eventId}/publish`, {
    move_out_date: '2026-08-30',
    street_address: '10 King St',
    suburb: 'Newtown',
    pincode: '2042',
    state: 'NSW',
  });

  return { eventId, bundleId, itemId };
}
