import type { Metadata } from "next";
import type { LandingData } from "@shiftready/types";
import { BrowsePageContent } from "./BrowsePageContent";

export const metadata: Metadata = { title: "The Marketplace" };

const API_BASE = `${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/v1`;

export default async function BrowsePage() {
  let initialLanding: LandingData | null = null;
  try {
    const res = await fetch(`${API_BASE}/marketplace/landing`, {
      next: { revalidate: 30 },
    });
    if (res.ok) initialLanding = await res.json();
  } catch {
    // fall through - client will fetch on mount
  }

  // eslint-disable-next-line react-hooks/purity
  const fetchedAt = Date.now();
  return <BrowsePageContent initialLanding={initialLanding} fetchedAt={fetchedAt} />;
}
