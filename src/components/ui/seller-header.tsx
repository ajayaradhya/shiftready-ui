"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/use-auth";

export function SellerHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, []);

  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  return (
    <header
      className="px-6 pl-16 md:pl-28"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 64,
        background: "rgba(245,240,232,0.92)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        borderBottom: "1px solid var(--sr-border-subtle)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        gap: 0,
        fontFamily: "var(--sr-font-sans)",
      }}
    >
      {/* Brand */}
      <Link
        href="/dashboard"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          textDecoration: "none",
          color: "var(--sr-text-primary)",
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

      {/* Divider + section label */}
      <div
        style={{
          width: 1,
          height: 18,
          background: "var(--sr-border-default)",
          margin: "0 14px",
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontFamily: "var(--sr-font-mono)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.16em",
          color: "var(--sr-text-muted)",
        }}
      >
        Seller
      </span>

      <div style={{ flex: 1 }} />

      {/* Bell */}
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
          margin: "0 16px",
          flexShrink: 0,
        }}
      />

      {/* User menu */}
      <div ref={menuRef} style={{ position: "relative" }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
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
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--sr-text-secondary)",
            }}
          >
            {displayName}
          </span>
          {user?.photoURL ? (
            <Image
              src={user.photoURL}
              alt={displayName}
              width={28}
              height={28}
              style={{ borderRadius: "50%", border: "1px solid var(--sr-border-subtle)" }}
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
              minWidth: 190,
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
                padding: "8px 12px 8px",
                borderBottom: "1px solid var(--sr-border-subtle)",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--sr-text-muted)",
                  marginBottom: 3,
                  letterSpacing: "0.04em",
                }}
              >
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
                  maxWidth: 170,
                }}
              >
                {user?.email}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = "var(--rust-50)";
                (e.currentTarget as HTMLElement).style.color = "var(--rust-500)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--ink-500)";
              }}
              style={{
                width: "100%",
                padding: "8px 12px",
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
                transition: "all 120ms",
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
