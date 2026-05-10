"use client";

import { Package, PlusCircle, MessageCircle, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const sellerNavItems = [
  { icon: Package, label: "Inventory", href: "/dashboard", disabled: false },
  { icon: PlusCircle, label: "New Sale", href: "/create", disabled: false },
  { icon: MessageCircle, label: "Buyers", href: "#", disabled: true },
];

function NavItem({
  icon: Icon,
  label,
  href,
  active,
  disabled,
  onClick,
}: {
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  href: string;
  active: boolean;
  disabled?: boolean;
  onClick?: () => void;
}) {
  return (
    <Link
      href={disabled ? "#" : href}
      onClick={disabled ? undefined : onClick}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 5,
        padding: "10px 8px",
        borderRadius: "var(--sr-radius-lg)",
        textDecoration: "none",
        transition: "all 140ms",
        background: active ? "var(--clay-50)" : "transparent",
        color: disabled
          ? "var(--ink-200)"
          : active
          ? "var(--clay-600)"
          : "var(--ink-400)",
        pointerEvents: disabled ? "none" : undefined,
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.4 : 1,
        width: "100%",
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
      <Icon size={22} strokeWidth={active ? 2 : 1.5} />
      <span
        style={{
          fontFamily: "var(--sr-font-sans)",
          fontSize: 10,
          fontWeight: active ? 600 : 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      {disabled && (
        <span
          style={{
            fontFamily: "var(--sr-font-mono)",
            fontSize: 8,
            textTransform: "uppercase",
            letterSpacing: "0.14em",
            color: "var(--ink-200)",
            lineHeight: 1,
          }}
        >
          Soon
        </span>
      )}
    </Link>
  );
}

function DesktopSellerSidebar({ pathname }: { pathname: string }) {
  function isActive(href: string) {
    if (href === "#") return false;
    if (href === "/create") return pathname === "/create";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav
      aria-label="Seller navigation"
      className="hidden md:flex fixed left-0 top-0 h-full w-20 flex-col items-center z-40"
      style={{
        paddingTop: 80,
        paddingBottom: 24,
        paddingLeft: 8,
        paddingRight: 8,
        gap: 4,
        background: "var(--sr-bg-card)",
        borderRight: "1px solid var(--sr-border-subtle)",
      }}
    >
      {sellerNavItems.map((item) => (
        <NavItem
          key={item.label}
          icon={item.icon}
          label={item.label}
          href={item.href}
          active={isActive(item.href)}
          disabled={item.disabled}
        />
      ))}
    </nav>
  );
}

function MobileSellerNav({ pathname }: { pathname: string }) {
  const [open, setOpen] = useState(false);

  function isActive(href: string) {
    if (href === "#") return false;
    if (href === "/create") return pathname === "/create";
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <>
      {/* Hamburger — only shows on mobile (below md) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open seller menu"
        style={{
          position: "fixed",
          left: 16,
          top: 14,
          zIndex: 60,
          width: 36,
          height: 36,
          borderRadius: "var(--sr-radius-md)",
          border: "1px solid var(--sr-border-subtle)",
          background: "var(--sr-bg-card)",
          display: "grid",
          placeItems: "center",
          cursor: "pointer",
          color: "var(--ink-500)",
        }}
        className="md:hidden"
      >
        <Menu size={18} strokeWidth={1.5} />
      </button>

      {/* Drawer */}
      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(31,27,23,0.3)",
              zIndex: 70,
              backdropFilter: "blur(2px)",
            }}
          />
          <nav
            aria-label="Mobile seller navigation"
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
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                style={{
                  width: 32,
                  height: 32,
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
              {sellerNavItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.disabled ? "#" : item.href}
                    onClick={() => !item.disabled && setOpen(false)}
                    aria-current={active ? "page" : undefined}
                    style={{
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
                    <span>{item.label}</span>
                    {item.disabled && (
                      <span
                        style={{
                          marginLeft: "auto",
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
                );
              })}
            </div>
          </nav>
        </>
      )}
    </>
  );
}

export function SellerSidebar() {
  const pathname = usePathname();
  return (
    <>
      <DesktopSellerSidebar pathname={pathname} />
      <MobileSellerNav pathname={pathname} />
    </>
  );
}
