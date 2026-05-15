import { redirect } from "next/navigation";

export default async function MarketplaceDetailRedirect({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  redirect(`/sale/${eventId}`);
}
