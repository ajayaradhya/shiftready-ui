import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/ui/sidebar";
import { Header } from "@/components/ui/header";
import Providers from "@/components/providers";

const inter = Inter({ subsets: ["latin"] });

// src/app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      {/* Added 'antialiased' for sharper Inter typography rendering */}
      <body className={`${inter.className} bg-surface-container-lowest antialiased text-on-surface`}>
        <Providers>
          <Sidebar />
          {/* In the future, you can pass a dynamic state to isProcessing */}
          <Header isProcessing={false} /> 
          
          {/* The main viewport: 
              pl-64 matches your Sidebar width 
              pt-16 matches your Header height 
          */}
          <main className="pl-64 pt-16 min-h-screen relative">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}