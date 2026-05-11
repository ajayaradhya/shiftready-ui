"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

interface AppHeaderProps {
  isProcessing?: boolean;
  children?: React.ReactNode;
  onMenuClick?: () => void;
}

export function AppHeader({ isProcessing, children, onMenuClick }: AppHeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(250,250,247,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--sr-border-subtle)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        gap: 0,
        fontFamily: "var(--sr-font-sans)",
      }}
    >
      {/* AI processing pulse */}
      {isProcessing && (
        <div
          style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: 2, overflow: "hidden" }}
          aria-hidden
        >
          <div
            style={{
              height: "100%",
              background: "var(--clay-500)",
              width: "30%",
              animation: "pan 2s infinite linear",
              boxShadow: "0 0 8px var(--clay-400)",
            }}
          />
        </div>
      )}

      {/* Mobile hamburger — only when sidebar is present */}
      {onMenuClick && (
        <button
          onClick={onMenuClick}
          aria-label="Open navigation menu"
          className="md:hidden"
          style={{
            width: 36,
            height: 36,
            marginRight: 12,
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--sr-border-subtle)",
            background: "transparent",
            display: "grid",
            placeItems: "center",
            cursor: "pointer",
            color: "var(--ink-500)",
            flexShrink: 0,
          }}
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>
      )}

      {/* Logo — always at the same visual position */}
      <Link
        href="/"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
          color: "var(--sr-text-primary)",
          flexShrink: 0,
        }}
      >
        <Image src="/logo-mark.svg" alt="ShiftReady" width={28} height={28} priority />
        <span
          style={{
            fontFamily: "var(--sr-font-serif)",
            fontSize: 18,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            lineHeight: 1,
          }}
        >
          ShiftReady
        </span>
      </Link>

      {/* Page-level actions slot (e.g. InventoryActions) */}
      {children ? (
        <div style={{ flex: 1 }}>{children}</div>
      ) : (
        <div style={{ flex: 1 }} />
      )}

      {/* Right controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        <button
          aria-label="Notifications"
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            background: "transparent",
            border: "none",
            color: "var(--ink-400)",
            cursor: "pointer",
          }}
        >
          <Bell size={18} strokeWidth={1.5} />
        </button>

        <div
          style={{
            width: 1,
            height: 18,
            background: "var(--sr-border-subtle)",
            margin: "0 12px",
            flexShrink: 0,
          }}
        />

        {user ? (
          <div ref={menuRef} style={{ position: "relative" }}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={`User menu for ${displayName}`}
              aria-expanded={menuOpen}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: "6px 8px",
                borderRadius: "var(--sr-radius-md)",
              }}
            >
              <span
                className="hidden sm:inline"
                style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-secondary)" }}
              >
                {displayName}
              </span>
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={displayName}
                  width={28}
                  height={28}
                  style={{
                    borderRadius: "50%",
                    border: "1px solid var(--sr-border-subtle)",
                    flexShrink: 0,
                  }}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
              ) : (
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    background: "var(--clay-100)",
                    color: "var(--clay-700)",
                    display: "grid",
                    placeItems: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: "var(--sr-font-serif)",
                    flexShrink: 0,
                  }}
                >
                  {displayName.slice(0, 1).toUpperCase()}
                </div>
              )}
            </button>

            {menuOpen && (
              <div
                style={{
                  position: "absolute",
                  top: "calc(100% + 8px)",
                  right: 0,
                  minWidth: 200,
                  background: "var(--sr-bg-card)",
                  border: "1px solid var(--sr-border-subtle)",
                  borderRadius: "var(--sr-radius-lg)",
                  boxShadow: "var(--sr-shadow-md)",
                  padding: 6,
                  zIndex: 100,
                }}
              >
                <div
                  style={{
                    padding: "8px 12px",
                    borderBottom: "1px solid var(--sr-border-subtle)",
                    marginBottom: 4,
                  }}
                >
                  <div style={{ fontSize: 11, color: "var(--sr-text-muted)", marginBottom: 3 }}>
                    Signed in as
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "var(--sr-text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 180,
                    }}
                  >
                    {user.email}
                  </div>
                </div>

                <Link
                  href="/dashboard"
                  onClick={() => setMenuOpen(false)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "9px 12px",
                    borderRadius: "var(--sr-radius-sm)",
                    textDecoration: "none",
                    fontSize: 13,
                    color: "var(--ink-600)",
                    fontFamily: "var(--sr-font-sans)",
                    transition: "background 120ms",
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                >
                  My Listings
                </Link>

                <button
                  onClick={handleSignOut}
                  style={{
                    width: "100%",
                    padding: "9px 12px",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    borderRadius: "var(--sr-radius-sm)",
                    fontSize: 13,
                    color: "var(--ink-500)",
                    textAlign: "left",
                    fontFamily: "var(--sr-font-sans)",
                    transition: "background 120ms, color 120ms",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "var(--rust-50)";
                    (e.currentTarget as HTMLElement).style.color = "var(--rust-500)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "transparent";
                    (e.currentTarget as HTMLElement).style.color = "var(--ink-500)";
                  }}
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "var(--clay-600)",
              textDecoration: "none",
              padding: "6px 14px",
              borderRadius: "var(--sr-radius-md)",
              border: "1px solid var(--sr-border-default)",
              transition: "background 120ms",
            }}
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}
