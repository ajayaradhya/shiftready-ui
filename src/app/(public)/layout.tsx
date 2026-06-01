"use client";

import { ShellHeader } from "@/components/shell/header";
import { LegalFooter } from "@/components/shell/legal-footer";
import { SaleContextProvider } from "@/lib/sale-context";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaleContextProvider>
      <ShellHeader hasSidebar={false} />
      <main style={{ paddingTop: 48, minHeight: "calc(100dvh - 60px)", background: "var(--sr-bg-app)" }}>
        {children}
      </main>
      <LegalFooter />
    </SaleContextProvider>
  );
}
