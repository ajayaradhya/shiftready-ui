import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";
import { GaScript } from "@/components/GaScript";
import { CookieBanner } from "@/components/CookieBanner";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://shiftready.com.au";
const GA_ID = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

export const metadata: Metadata = {
  title: {
    default: "ShiftReady",
    template: "%s | ShiftReady",
  },
  description:
    "AI-powered moving sale marketplace. Film a walkthrough, let Gemini price everything, sell before you move.",
  metadataBase: new URL(SITE_URL),
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftReady",
  },
  openGraph: {
    type: "website",
    siteName: "ShiftReady",
    title: "ShiftReady — AI-Powered Moving Sales",
    description:
      "AI-powered moving sale marketplace. Film a walkthrough, let Gemini price everything, sell before you move.",
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: "ShiftReady — AI-Powered Moving Sales",
    description:
      "AI-powered moving sale marketplace. Film a walkthrough, let Gemini price everything, sell before you move.",
  },
};

export const viewport: Viewport = {
  themeColor: "#C87755",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,400;1,8..60,500&family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap"
        />
      </head>
      <body className="bg-surface antialiased text-on-surface">
        <Providers>{children}</Providers>
        {GA_ID && <GaScript gaId={GA_ID} />}
        <CookieBanner />
      </body>
    </html>
  );
}
