import type { Metadata } from "next";
import SaleDetailClient from "./sale-detail-client";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiftready.com.au";

interface SaleData {
  title?: string | null;
  suburb?: string | null;
  state?: string | null;
  cover_image_url?: string | null;
  bundles?: Array<{ items: unknown[] }>;
}

async function fetchSaleData(eventId: string): Promise<SaleData | null> {
  try {
    const res = await fetch(`${API_BASE}/marketplace/sales/${eventId}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  const sale = await fetchSaleData(eventId);
  if (!sale) return { title: "Moving Sale" };

  const title =
    sale.title || (sale.suburb ? `${sale.suburb} Moving Sale` : "Moving Sale");
  const itemCount =
    sale.bundles?.reduce((s, b) => s + b.items.length, 0) ?? 0;
  const location = [sale.suburb, sale.state].filter(Boolean).join(", ");
  const description = `${itemCount} items for sale${location ? ` in ${location}` : ""}. AI-priced moving sale on ShiftReady.`;
  const url = `${SITE_URL}/market/sale/${eventId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(sale.cover_image_url
        ? { images: [{ url: sale.cover_image_url, width: 1200, height: 630 }] }
        : {}),
    },
    twitter: {
      card: sale.cover_image_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(sale.cover_image_url ? { images: [sale.cover_image_url] } : {}),
    },
  };
}

export default async function SalePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const sale = await fetchSaleData(eventId);
  const itemCount =
    sale?.bundles?.reduce((s, b) => s + b.items.length, 0) ?? 0;
  const location = [sale?.suburb, sale?.state].filter(Boolean).join(", ");
  const title =
    sale?.title || (sale?.suburb ? `${sale.suburb} Moving Sale` : "Moving Sale");
  const url = `${SITE_URL}/market/sale/${eventId}`;

  const jsonLd = sale
    ? {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: title,
        url,
        description: `Moving sale with ${itemCount} items${location ? ` in ${location}` : ""}.`,
        numberOfItems: itemCount,
        ...(sale.cover_image_url ? { image: sale.cover_image_url } : {}),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SaleDetailClient params={params} />
    </>
  );
}
