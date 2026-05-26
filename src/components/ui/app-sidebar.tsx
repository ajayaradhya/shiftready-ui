"use client";

import React from "react";
import { LayoutDashboard, Package, Store, CreditCard, LifeBuoy, MessageSquare, Settings, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-conversations";

const navItems = [
  { icon: LayoutDashboard, label: "Sales",     href: "/seller-central", disabled: false },
  { icon: Package,         label: "Inventory", href: "#",               disabled: true },
  { icon: Store,           label: "Market",    href: "/",               disabled: false },
  { icon: MessageSquare,   label: "Messages",  href: "/messages",       disabled: false },
  // divider before index 4
  { icon: CreditCard,      label: "Finances",  href: "#",               disabled: true },
  { icon: Settings,        label: "Settings",  href: "/settings",       disabled: false },
  { icon: LifeBuoy,        label: "Help",      href: "#",               disabled: true },
];

const DIVIDER_BEFORE = 4;

function isItemActive(href: string, pathname: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  if (href === "/seller-central") return pathname.startsWith("/seller-central");
  return pathname === href || pathname.startsWith(href + "/");
}

function NavDivider() {
  return (
    <div
      aria-hidden
      style={{
        width: "calc(100% - 28px)",
        height: 1,
        background: "var(--sr-border-subtle)",
        margin: "6px 14px",
      }}
    />
  );
}

function NavItem({
  icon: Icon,
  label,
  href,
  active,
  disabled,
  unreadCount,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  href: string;
  active: boolean;
  disabled?: boolean;
  unreadCount?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={disabled ? "#" : href}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        padding: "9px 14px",
        borderRadius: "var(--sr-radius-md)",
        textDecoration: "none",
        transition: "all 140ms",
        background: active ? "var(--clay-50)" : "transparent",
        color: disabled ? "var(--ink-200)" : active ? "var(--clay-600)" : "var(--ink-400)",
        pointerEvents: disabled ? "none" : undefined,
        opacity: disabled ? 0.45 : 1,
        width: "100%",
        cursor: disabled ? "default" : "pointer",
      }}
      onMouseEnter={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
          (e.currentTarget as HTMLElement).style.color = "var(--ink-700)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active && !disabled) {
          (e.currentTarget as HTMLElement).style.background = "transparent";
          (e.currentTarget as HTMLElement).style.color = "var(--ink-400)";
        }
      }}
    >
      <Icon size={17} strokeWidth={active ? 2 : 1.5} />
      <span
        style={{
          fontFamily: "var(--sr-font-sans)",
          fontSize: 13,
          fontWeight: active ? 600 : 500,
          lineHeight: 1,
          flex: 1,
        }}
      >
        {label}
      </span>
      {unreadCount !== undefined && unreadCount > 0 && (
        <span
          style={{
            background: "var(--clay-500)",
            color: "#fff",
            borderRadius: 10,
            padding: "1px 6px",
            fontSize: 10,
            fontWeight: 700,
            lineHeight: "14px",
          }}
        >
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </Link>
  );
}

interface AppSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function AppSidebar({ open, onClose }: AppSidebarProps) {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;

  return (
    <>
      {/* Desktop sidebar */}
      <nav
        aria-label="Main navigation"
        className="hidden md:flex"
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          bottom: 0,
          width: 200,
          flexDirection: "column",
          paddingTop: 72,
          paddingBottom: 24,
          paddingLeft: 8,
          paddingRight: 8,
          gap: 2,
          background: "var(--sr-bg-card)",
          borderRight: "1px solid var(--sr-border-subtle)",
          zIndex: 40,
        }}
      >
        {navItems.map((item, idx) => (
          <React.Fragment key={item.label}>
            {idx === DIVIDER_BEFORE && <NavDivider />}
            <NavItem
              icon={item.icon}
              label={item.label}
              href={item.href}
              active={isItemActive(item.href, pathname)}
              disabled={item.disabled}
              unreadCount={item.href === "/messages" ? unreadCount : undefined}
            />
          </React.Fragment>
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
            aria-label="Mobile navigation"
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
                ShiftReady
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
              {navItems.map((item, idx) => {
                const active = isItemActive(item.href, pathname);
                return (
                  <React.Fragment key={item.label}>
                    {idx === DIVIDER_BEFORE && (
                      <div
                        aria-hidden
                        style={{
                          width: "100%",
                          height: 1,
                          background: "var(--sr-border-subtle)",
                          margin: "6px 0",
                        }}
                      />
                    )}
                    <Link
                      href={item.disabled ? "#" : item.href}
                      onClick={() => !item.disabled && onClose()}
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
                        color: item.disabled
                          ? "var(--ink-200)"
                          : active
                          ? "var(--clay-600)"
                          : "var(--ink-500)",
                        background: active ? "var(--clay-50)" : "transparent",
                        opacity: item.disabled ? 0.4 : 1,
                        pointerEvents: item.disabled ? "none" : undefined,
                      }}
                    >
                      <item.icon size={18} strokeWidth={active ? 2 : 1.5} aria-hidden />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.href === "/messages" && unreadCount > 0 && (
                        <span
                          style={{
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
                      {item.disabled && (
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: "var(--sr-font-mono)",
                            textTransform: "uppercase",
                            letterSpacing: "0.12em",
                            color: "var(--ink-300)",
                          }}
                        >
                          Soon
                        </span>
                      )}
                    </Link>
                  </React.Fragment>
                );
              })}
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
