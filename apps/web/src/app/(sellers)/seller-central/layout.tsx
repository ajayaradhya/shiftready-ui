import type { Metadata } from "next";

export const metadata: Metadata = { title: "Seller Central" };

export default function SellerCentralLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
