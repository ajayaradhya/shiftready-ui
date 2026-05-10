"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function SellersLayout({ children }: { children: React.ReactNode }) {
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

  return <>{children}</>;
}
