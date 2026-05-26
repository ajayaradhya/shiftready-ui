"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { AppSidebar } from "@/components/ui/app-sidebar";
import { AppHeader } from "@/components/ui/app-header";
import { SaleContextProvider } from "@/lib/sale-context";

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      {user && <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
      {user && <AppHeader onMenuClick={() => setSidebarOpen(true)} />}
      <main
        id="main-content"
        className="md:pl-[200px] min-h-screen relative"
        style={{ paddingTop: 64, background: "var(--sr-bg-app)" }}
      >
        {children}
      </main>
    </SaleContextProvider>
  );
}
