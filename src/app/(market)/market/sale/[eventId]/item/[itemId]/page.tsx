import type { Metadata } from "next";
import ItemDetailClient from "./item-detail-client";

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1`;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiftready.com.au";

interface ItemData {
  name?: string | null;
  brand?: string | null;
  condition?: string | null;
  price?: number | null;
  image_url?: string | null;
  suburb?: string | null;
}

async function fetchItemData(
  eventId: string,
  bundleId: string,
  itemId: string
): Promise<ItemData | null> {
  try {
    const res = await fetch(
      `${API_BASE}/marketplace/items/${eventId}/${bundleId}/${itemId}`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; itemId: string }>;
  searchParams: Promise<{ bundle?: string }>;
}): Promise<Metadata> {
  const { eventId, itemId } = await params;
  const { bundle: bundleId } = await searchParams;
  if (!bundleId) return { title: "Item" };

  const item = await fetchItemData(eventId, bundleId, itemId);
  if (!item) return { title: "Item" };

  const title = item.name ?? "Item";
  const parts = [
    item.brand,
    item.condition,
    item.price != null
      ? item.price.toLocaleString("en-AU", {
          style: "currency",
          currency: "AUD",
          maximumFractionDigits: 0,
        })
      : null,
    item.suburb ? `Pickup in ${item.suburb}` : null,
  ].filter(Boolean);
  const description = parts.length
    ? parts.join(" · ")
    : "Item for sale on ShiftReady.";
  const url = `${SITE_URL}/market/sale/${eventId}/item/${itemId}?bundle=${bundleId}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      type: "website",
      ...(item.image_url
        ? { images: [{ url: item.image_url, width: 800, height: 800 }] }
        : {}),
    },
    twitter: {
      card: item.image_url ? "summary_large_image" : "summary",
      title,
      description,
      ...(item.image_url ? { images: [item.image_url] } : {}),
    },
  };
}

export default async function ItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ eventId: string; itemId: string }>;
  searchParams: Promise<{ bundle?: string }>;
}) {
  const { eventId, itemId } = await params;
  const { bundle: bundleId } = await searchParams;
  const item = bundleId ? await fetchItemData(eventId, bundleId, itemId) : null;

  const jsonLd =
    item?.name
      ? {
          "@context": "https://schema.org",
          "@type": "Product",
          name: item.name,
          ...(item.brand ? { brand: { "@type": "Brand", name: item.brand } } : {}),
          ...(item.condition
            ? {
                itemCondition: `https://schema.org/${
                  item.condition.toLowerCase().includes("new")
                    ? "NewCondition"
                    : "UsedCondition"
                }`,
              }
            : {}),
          ...(item.image_url ? { image: item.image_url } : {}),
          offers: {
            "@type": "Offer",
            priceCurrency: "AUD",
            ...(item.price != null ? { price: item.price } : {}),
            availability: "https://schema.org/InStock",
            ...(item.suburb ? { availableAtOrFrom: item.suburb } : {}),
          },
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
      <ItemDetailClient params={params} />
    </>
  );
}
