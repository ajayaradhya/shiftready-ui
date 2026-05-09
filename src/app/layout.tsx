import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import "./globals.css";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShiftReady — Sell Everything. One Video. Done.",
  description:
    "AI-powered residential relocation marketplace. Record a walkthrough, let Gemini identify and price your items, then sell as a bundle.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShiftReady",
  },
};

export const viewport: Viewport = {
  themeColor: "#adc6ff",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const messages = await getMessages();

  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-surface-container-lowest antialiased text-on-surface`}
      >
        <NextIntlClientProvider messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
