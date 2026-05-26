"use client";

import { ShellHeader } from "@/components/shell/header";
import { SaleContextProvider } from "@/lib/sale-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaleContextProvider>
      <ShellHeader hasSidebar={false} />
      <main style={{ paddingTop: 48, minHeight: "100vh", background: "var(--sr-bg-app)" }}>
        {children}
      </main>
    </SaleContextProvider>
  );
}
