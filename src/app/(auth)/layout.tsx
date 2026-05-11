import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--sr-bg-app)", fontFamily: "var(--sr-font-sans)" }}>
      {/* Top bar */}
      <header className="flex items-center justify-between px-8 py-5 border-b" style={{ borderColor: "var(--sr-border-subtle)" }}>
        <Link href="/" className="text-xl font-semibold" style={{ fontFamily: "var(--sr-font-serif)", color: "var(--sr-text-primary)", letterSpacing: "-0.01em" }}>
          Shift<span style={{ color: "var(--clay-600)" }}>Ready</span>
        </Link>
        <a href="#" className="text-sm" style={{ color: "var(--sr-text-secondary)" }}>Help Center</a>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        {children}
      </main>

      {/* Footer */}
      <footer className="flex items-center justify-between px-8 py-5 text-xs" style={{ color: "var(--sr-text-muted)" }}>
        <span>© 2024 ShiftReady. All rights reserved.</span>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:underline" style={{ color: "var(--sr-text-muted)" }}>Privacy Policy</a>
          <a href="#" className="hover:underline" style={{ color: "var(--sr-text-muted)" }}>Terms of Service</a>
          <a href="#" className="hover:underline" style={{ color: "var(--sr-text-muted)" }}>Help Center</a>
          <a href="#" className="hover:underline" style={{ color: "var(--sr-text-muted)" }}>Contact Us</a>
        </div>
      </footer>
    </div>
  );
}
