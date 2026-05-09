"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-surface">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-[10px] uppercase tracking-[0.3em] text-outline font-black">
            Authenticating...
          </span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-on-primary focus:rounded-xl focus:text-xs focus:font-black focus:uppercase focus:tracking-widest"
      >
        Skip to content
      </a>
      <Sidebar />
      <Header />
      <main id="main-content" className="pt-16 pl-0 md:pl-20 min-h-screen relative">
        {children}
      </main>
    </>
  );
}
