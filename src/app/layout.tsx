import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ShiftReady — Sell Everything. One Video. Done.",
  description:
    "AI-powered residential relocation marketplace. Record a walkthrough, let Gemini identify and price your items, then sell as a bundle.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-surface-container-lowest antialiased text-on-surface`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
