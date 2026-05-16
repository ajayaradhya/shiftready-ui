"use client";

import { useState } from "react";
import { MarketSidebar } from "@/components/ui/market-sidebar";
import { AppHeader } from "@/components/ui/app-header";
import { SaleContextProvider } from "@/lib/sale-context";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <SaleContextProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:text-xs focus:font-black focus:uppercase focus:tracking-widest"
        style={{ background: "var(--clay-600)", color: "#fff" }}
      >
        Skip to content
      </a>
      <MarketSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader onMenuClick={() => setSidebarOpen(true)} />
      <main
        id="main-content"
        className="md:pl-[72px] min-h-screen relative"
        style={{ paddingTop: 64, background: "var(--sr-bg-app)" }}
      >
        {children}
      </main>
    </SaleContextProvider>
  );
}
