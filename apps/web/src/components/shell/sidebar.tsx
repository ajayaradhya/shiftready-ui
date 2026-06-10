"use client";

import {
  LayoutDashboard, Store,
  MessageSquare, Settings, Heart, ShoppingBag, LifeBuoy,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";

type NavItemDef = {
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  href: string;
  showUnread?: boolean;
};

const SELLER_NAV: NavItemDef[] = [
  { icon: LayoutDashboard, label: "Sales",    href: "/seller-central" },
  { icon: Store,           label: "Market",   href: "/market" },
  { icon: MessageSquare,   label: "Messages", href: "/messages", showUnread: true },
  { icon: Settings,        label: "Settings", href: "/settings" },
];

const MARKET_NAV: NavItemDef[] = [
  { icon: Store,         label: "Browse",    href: "/market" },
  { icon: Heart,         label: "Saved",     href: "/market/saved" },
  { icon: MessageSquare, label: "Messages",  href: "/market/messages", showUnread: true },
  { icon: ShoppingBag,   label: "Purchases", href: "/market/purchases" },
  { icon: LifeBuoy,      label: "Help",      href: "/market/help" },
];

function isActive(href: string, pathname: string): boolean {
  if (href === "#") return false;
  if (href === "/") return pathname === "/";
  if (href === "/seller-central") return pathname.startsWith("/seller-central");
  if (href === "/market") return pathname === "/market";
  return pathname === href || pathname.startsWith(href + "/");
}

function NavItem({
  item,
  pathname,
  unreadCount,
}: {
  item: NavItemDef;
  pathname: string;
  unreadCount: number;
}) {
  const active = isActive(item.href, pathname);
  const unread = item.showUnread ? unreadCount : 0;

  const linkEl = (
    <Link
      href={item.href}
      aria-label={item.label}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] transition-all duration-[140ms] no-underline select-none w-full",
        active
          ? "font-semibold bg-[var(--clay-50)] text-[var(--clay-600)]"
          : "font-medium text-[var(--ink-400)] hover:bg-[var(--cream-100)] hover:text-[var(--ink-700)] cursor-pointer"
      )}
    >
      {active && (
        <span
          className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-full bg-[var(--clay-500)]"
          aria-hidden
        />
      )}
      <item.icon size={16} strokeWidth={active ? 2 : 1.5} />
      <span className="flex-1 leading-none">{item.label}</span>
      {unread > 0 && (
        <span className="bg-[var(--clay-500)] text-white rounded-[10px] px-1.5 py-px text-[10px] font-bold leading-[14px]" aria-label={`${unread} unread`}>
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );

  return linkEl;
}

interface ShellSidebarProps {
  variant: "seller" | "market";
}

export function ShellSidebar({ variant }: ShellSidebarProps) {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const items = variant === "seller" ? SELLER_NAV : MARKET_NAV;
  const logoHref = variant === "seller" ? "/seller-central" : "/market";

  return (
    <nav
      aria-label="Main navigation"
      className="hidden md:flex fixed left-0 top-0 bottom-0 w-[224px] flex-col z-40"
      style={{ background: "var(--sr-bg-card)", borderRight: "1px solid var(--sr-border-subtle)" }}
    >
      {/* Logo - sits in the header-height zone at top */}
      <Link
        href={logoHref}
        className="flex items-center gap-2.5 px-4 no-underline shrink-0"
        style={{
          height: 48,
          borderBottom: "1px solid var(--sr-border-subtle)",
          color: "var(--sr-text-primary)",
        }}
      >
        <Image src="/logo-mark.svg" alt="" width={22} height={22} priority />
        <span
          className="text-[17px] font-semibold leading-none"
          style={{ fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.015em" }}
        >
          Myrio
        </span>
      </Link>

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-0.5">
        {items.map((item) => (
          <NavItem key={item.label} item={item} pathname={pathname} unreadCount={unreadCount} />
        ))}
      </div>
    </nav>
  );
}
