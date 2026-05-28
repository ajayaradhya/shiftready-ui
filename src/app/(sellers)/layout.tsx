"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { ShellSidebar } from "@/components/shell/sidebar";
import { ShellHeader } from "@/components/shell/header";
import { BottomTabBar } from "@/components/shell/bottom-tab-bar";
import { SaleContextProvider } from "@/lib/sale-context";
import { MailWarning, X } from "lucide-react";

export default function SellersLayout({ children }: { children: React.ReactNode }) {
  const { user, loading, sendVerificationEmail } = useAuth();
  const router = useRouter();
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleResendVerification = async () => {
    setSendingVerification(true);
    try {
      await sendVerificationEmail();
      setVerificationSent(true);
    } catch {
      // ignore — user will retry
    } finally {
      setSendingVerification(false);
    }
  };

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
      {user && !user.emailVerified && !bannerDismissed && (
        <div
          className="fixed left-0 right-0 z-40 flex items-center gap-3 px-4 py-2 text-sm md:pl-[224px]"
          style={{ top: 48, background: "var(--warning, #f59e0b)", color: "#1c1917" }}
          role="alert"
        >
          <MailWarning size={16} className="shrink-0" aria-hidden />
          <span className="flex-1">
            Verify your email to create or publish listings.{" "}
            {verificationSent ? (
              <span className="font-semibold">Email sent — check your inbox.</span>
            ) : (
              <button
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="underline font-semibold disabled:opacity-60 cursor-pointer"
              >
                {sendingVerification ? "Sending…" : "Resend verification email"}
              </button>
            )}
          </span>
          <button
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 p-0.5 rounded opacity-70 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
      <main
        id="main-content"
        className="md:pl-[224px] min-h-screen relative pb-16 md:pb-0"
        style={{
          paddingTop: user && !user.emailVerified && !bannerDismissed ? 48 + 36 : 48,
          background: "var(--sr-bg-app)",
        }}
      >
        {children}
      </main>
      {user && <BottomTabBar variant="seller" />}
    </SaleContextProvider>
  );
}
