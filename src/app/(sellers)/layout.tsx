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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--sr-bg-app)",
          fontFamily: "var(--sr-font-sans)",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <div
            className="animate-spin"
            style={{
              width: 40,
              height: 40,
              border: "2px solid var(--clay-200)",
              borderTopColor: "var(--clay-500)",
              borderRadius: "50%",
            }}
          />
          <span
            style={{
              fontSize: 10,
              textTransform: "uppercase",
              letterSpacing: "0.3em",
              color: "var(--ink-400)",
              fontWeight: 700,
            }}
          >
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SaleContextProvider>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-xl focus:text-xs focus:font-black focus:uppercase focus:tracking-widest"
        style={{ background: "var(--clay-600)", color: "#fff" }}
      >
        Skip to content
      </a>
      <AppSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <AppHeader />
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
