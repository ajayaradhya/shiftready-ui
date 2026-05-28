import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "@/components/providers";

export const metadata: Metadata = {
  title: "ShiftReady",
  description:
    "AI-powered moving sale marketplace. Film a walkthrough, let Gemini price everything, sell before you move.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ShiftReady",
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
      </body>
    </html>
  );
}
