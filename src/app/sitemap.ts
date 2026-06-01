import type { MetadataRoute } from "next";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiftready.com.au";

interface ActiveSale {
  eventId: string;
  publishedAt?: string | null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/market`, changeFrequency: "hourly", priority: 1 },
    { url: `${SITE_URL}/login`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/register`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${SITE_URL}/help`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/terms`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const res = await fetch(`${API_BASE}/marketplace/sales`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return staticRoutes;
    const sales: ActiveSale[] = await res.json();
    const saleRoutes: MetadataRoute.Sitemap = sales.map((s) => ({
      url: `${SITE_URL}/market/sale/${s.eventId}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
      lastModified: s.publishedAt ? new Date(s.publishedAt) : undefined,
    }));
    return [...staticRoutes, ...saleRoutes];
  } catch {
    return staticRoutes;
  }
}
