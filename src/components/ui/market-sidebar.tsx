"use client";

import React from "react";
import { Store, Heart, MessageSquare, ShoppingBag, LifeBuoy, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-conversations";

const navItems = [
  { icon: Store,         label: "Browse",    href: "/market" },
  { icon: Heart,         label: "Saved",     href: "/market/saved" },
  { icon: MessageSquare, label: "Messages",  href: "/market/messages" },
  { icon: ShoppingBag,   label: "Purchases", href: "/market/purchases" },
  { icon: LifeBuoy,      label: "Help",      href: "/market/help" },
];

function isItemActive(href: string, pathname: string): boolean {
  if (href === "/market") return pathname === "/market";
  return pathname === href || pathname.startsWith(href + "/");
}

function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      style={{
        position: "absolute",
        top: 4,
        right: 4,
        minWidth: 14,
        height: 14,
        background: "var(--clay-500)",
        color: "#fff",
        borderRadius: 7,
        fontSize: 8,
        fontWeight: 700,
        display: "grid",
        placeItems: "center",
        padding: "0 3px",
        lineHeight: 1,
      }}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  active,
  unreadCount,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  href: string;
  active: boolean;
  unreadCount?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: "10px 8px",
        borderRadius: "var(--sr-radius-lg)",
        textDecoration: "none",
        transition: "all 140ms",
        background: "transparent",
        color: active ? "var(--clay-600)" : "var(--ink-400)",
        width: "100%",
        cursor: "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
          (e.currentTarget as HTMLElement).style.color = "var(--ink-700)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--ink-400)";
        }
      }}
    >
      <Icon size={18} strokeWidth={active ? 2 : 1.5} />
      {unreadCount !== undefined && <UnreadBadge count={unreadCount} />}
      <span
        style={{
          fontFamily: "var(--sr-font-sans)",
          fontSize: 9,
          fontWeight: active ? 600 : 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
    </Link>
  );
}

interface MarketSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MarketSidebar({ open, onClose }: MarketSidebarProps) {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <>
      {/* Desktop rail */}
      <nav
        aria-label="Marketplace navigation"
        className="hidden md:flex"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 72,
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 80,
          paddingBottom: 24,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 4,
          background: "var(--sr-bg-card)",
          borderRight: "1px solid var(--sr-border-subtle)",
          zIndex: 40,
        }}
      >
        {navItems.map((item) => (
          <NavItem
            key={item.label}
            icon={item.icon}
            label={item.label}
            href={item.href}
            active={isItemActive(item.href, pathname)}
            unreadCount={item.href === "/market/messages" ? unreadCount : undefined}
          />
        ))}
      </nav>

      {/* Mobile drawer */}
      {open && (
        <div className="md:hidden">
          <div
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(31,27,23,0.25)",
              zIndex: 70,
              backdropFilter: "blur(2px)",
            }}
          />
          <nav
            aria-label="Marketplace mobile navigation"
            style={{
              position: "fixed",
              left: 0,
              top: 0,
              bottom: 0,
              width: 240,
              background: "var(--sr-bg-card)",
              borderRight: "1px solid var(--sr-border-subtle)",
              zIndex: 80,
              display: "flex",
              flexDirection: "column",
              padding: "20px 16px",
              fontFamily: "var(--sr-font-sans)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 28,
              }}
            >
              <span
                style={{
                  fontFamily: "var(--sr-font-serif)",
                  fontSize: 17,
                  fontWeight: 600,
                  color: "var(--sr-text-primary)",
                }}
              >
                The Marketplace
              </span>
              <button
                onClick={onClose}
                aria-label="Close menu"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--sr-radius-md)",
                  border: "none",
                  background: "var(--cream-100)",
                  display: "grid",
                  placeItems: "center",
                  cursor: "pointer",
                  color: "var(--ink-500)",
                }}
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {navItems.map((item) => {
                const active = isItemActive(item.href, pathname);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    style={{
                      position: "relative",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 12px",
                      borderRadius: "var(--sr-radius-md)",
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: active ? 600 : 500,
                      color: active ? "var(--clay-600)" : "var(--ink-500)",
                      background: active ? "var(--clay-50)" : "transparent",
                    }}
                  >
                    <item.icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden />
                    <span>{item.label}</span>
                    {item.href === "/market/messages" && unreadCount > 0 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          background: "var(--clay-500)",
                          color: "#fff",
                          borderRadius: 10,
                          padding: "1px 6px",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {unreadCount > 99 ? "99+" : unreadCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
