"use client";

import { ShellSidebar } from "@/components/shell/sidebar";
import { ShellHeader } from "@/components/shell/header";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { SaleContextProvider } from "@/lib/sale-context";

export default function MarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <SaleContextProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:text-xs focus:font-black focus:uppercase focus:tracking-widest"
        style={{ background: "var(--clay-600)", color: "#fff" }}
      >
        Skip to content
      </a>
      <ShellSidebar variant="market" />
      <ShellHeader hasSidebar />
      <main
        id="main-content"
        className="md:pl-[224px] min-h-screen relative pb-16 md:pb-0"
        style={{ paddingTop: 48, background: "var(--sr-bg-app)" }}
      >
        {children}
      </main>
      <BottomTabBar variant="market" />
    </SaleContextProvider>
  );
}
