import { http, HttpResponse } from "msw";
import type { SaleSummary, SaleListing, MarketplaceSearchResult } from "@/lib/types";

const API_BASE = "http://localhost:8080/api/v1";

export const mockSummary: SaleSummary = {
  id: "event-1",
  status: "ready_for_review",
  videoUrl: "https://example.com/video.mp4",
  sellerId: "user-1",
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
  bundles: [
    {
      id: "bundle-1",
      name: "Living Room",
      suggestedPrice: 500,
      isPublished: false,
      createdAt: "2026-01-01T00:00:00Z",
      items: [
        {
          id: "item-1",
          name: "Sofa",
          brand: "IKEA",
          condition: "Good",
          video_timestamp: 10,
          timestamp_label: "0:10",
          confidence: 0.9,
          predicted_original_price: 800,
          predicted_listing_price: 400,
        },
      ],
    },
  ],
};

export const mockSales: SaleListing[] = [
  {
    id: "event-1",
    status: "ready_for_review",
    sellerId: "user-1",
    suburb: "Newtown",
    street_address: null,
    pincode: null,
    state: "NSW",
    createdAt: "2026-01-01T00:00:00Z",
    itemCount: 5,
    totalValue: 1200,
  },
];

export const mockMarketplace: MarketplaceSearchResult = {
  count: 1,
  is_authenticated: false,
  items: [
    {
      id: "item-1",
      name: "Sofa",
      brand: "IKEA",
      condition: "Good",
      price: 400,
      bundleName: "Living Room",
      eventId: "event-1",
      metadata: { year: 2020, originalPrice: 800, confidence: 0.9 },
    },
  ],
};

export const handlers = [
  http.get(`${API_BASE}/sales/event-1/summary`, () => HttpResponse.json(mockSummary)),
  http.get(`${API_BASE}/sales/event-1/status`, () => HttpResponse.json({ status: "ready_for_review" })),
  http.get(`${API_BASE}/sales/`, () => HttpResponse.json(mockSales)),
  http.get(`${API_BASE}/marketplace/search`, () => HttpResponse.json(mockMarketplace)),
  http.post(`${API_BASE}/sales/event-1/publish`, () => HttpResponse.json({ status: "live" })),
  http.post(`${API_BASE}/sales/event-1/unpublish`, () => HttpResponse.json({ status: "ready_for_review" })),
  http.post(`${API_BASE}/sales/event-1/bundles`, () =>
    HttpResponse.json({ bundle_id: "bundle-new" })
  ),
  http.delete(`${API_BASE}/sales/event-1/bundles/bundle-1`, () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.delete(`${API_BASE}/sales/event-1/bundles/bundle-1/items/item-1`, () =>
    new HttpResponse(null, { status: 204 })
  ),
  http.patch(`${API_BASE}/sales/event-1/bundles/bundle-1/items/item-1`, () =>
    HttpResponse.json({ status: "ok" })
  ),
];
