"use client";

import { AppHeader } from "@/components/ui/app-header";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      <main style={{ paddingTop: 64, minHeight: "100vh", background: "var(--sr-bg-app)" }}>
        {children}
      </main>
    </>
  );
}
