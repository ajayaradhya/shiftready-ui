import { redirect } from "next/navigation";

export default async function InventoryRedirect({ params }: { params: Promise<{ eventId: string }> }) {
  const { eventId } = await params;
  redirect(`/seller-central/inventory/${eventId}`);
}
