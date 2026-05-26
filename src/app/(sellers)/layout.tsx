"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ShellSidebar } from "@/components/shell/sidebar";
import { ShellHeader } from "@/components/shell/header";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { SaleContextProvider } from "@/lib/sale-context";

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (!user && !loading) return null;

  return (
    <SaleContextProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:text-xs focus:font-black focus:uppercase focus:tracking-widest"
        style={{ background: "var(--clay-600)", color: "#fff" }}
      >
        Skip to content
      </a>
      {user && <ShellSidebar variant="seller" />}
      {user && <ShellHeader hasSidebar />}
      <main
        id="main-content"
        className="md:pl-[224px] min-h-screen relative pb-16 md:pb-0"
        style={{ paddingTop: 48, background: "var(--sr-bg-app)" }}
      >
        {children}
      </main>
      {user && <BottomTabBar variant="seller" />}
    </SaleContextProvider>
  );
}
