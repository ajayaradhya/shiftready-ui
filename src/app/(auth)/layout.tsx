import { AppHeader } from "@/components/ui/app-header";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--sr-bg-app)",
        fontFamily: "var(--sr-font-sans)",
      }}
    >
      <AppHeader />

      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 16px 32px",
        }}
      >
        {children}
      </main>

      <footer
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "20px 32px",
          fontSize: 12,
          color: "var(--sr-text-muted)",
          borderTop: "1px solid var(--sr-border-subtle)",
        }}
      >
        <span>© 2024 ShiftReady. All rights reserved.</span>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <a href="#" style={{ color: "var(--sr-text-muted)", textDecoration: "none" }}>
            Privacy Policy
          </a>
          <a href="#" style={{ color: "var(--sr-text-muted)", textDecoration: "none" }}>
            Terms of Service
          </a>
          <a href="#" style={{ color: "var(--sr-text-muted)", textDecoration: "none" }}>
            Help Center
          </a>
        </div>
      </footer>
    </div>
  );
}
