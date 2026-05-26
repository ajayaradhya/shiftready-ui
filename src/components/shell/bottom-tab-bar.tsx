"use client";

import { LayoutDashboard, Store, Camera, MessageSquare, User, Heart, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useUnreadCount } from "@/hooks/use-conversations";
import { cn } from "@/lib/utils";

type TabItemDef = {
  icon: React.ComponentType<{ size: number; strokeWidth: number }>;
  label: string;
  href: string;
  showUnread?: boolean;
} | null;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/seller-central") return pathname.startsWith("/seller-central") && !pathname.includes("capture");
  if (href === "/market") return pathname === "/market";
  return pathname === href || pathname.startsWith(href + "/");
}

const SELLER_TABS: TabItemDef[] = [
  { icon: LayoutDashboard, label: "Sales",    href: "/seller-central" },
  { icon: Store,           label: "Market",   href: "/" },
  null,
  { icon: MessageSquare,   label: "Messages", href: "/messages", showUnread: true },
  { icon: User,            label: "Profile",  href: "/settings" },
];

const MARKET_TABS: TabItemDef[] = [
  { icon: Store,         label: "Browse",    href: "/market" },
  { icon: Heart,         label: "Saved",     href: "/market/saved" },
  { icon: MessageSquare, label: "Messages",  href: "/market/messages", showUnread: true },
  { icon: ShoppingBag,   label: "Purchases", href: "/market/purchases" },
  { icon: User,          label: "Profile",   href: "/settings" },
];

interface BottomTabBarProps {
  variant: "seller" | "market";
}

export function BottomTabBar({ variant }: BottomTabBarProps) {
  const pathname = usePathname();
  const { data: unreadData } = useUnreadCount();
  const unreadCount = unreadData?.unreadCount ?? 0;
  const tabs = variant === "seller" ? SELLER_TABS : MARKET_TABS;

  return (
    <nav
      aria-label="Mobile navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: "var(--sr-bg-card)",
        borderTop: "1px solid var(--sr-border-subtle)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="flex items-center">
        {tabs.map((tab, idx) => {
          if (tab === null) {
            const captureActive = pathname.includes("capture");
            return (
              <div key="fab" className="flex-1 flex justify-center items-center py-2">
                <Link
                  href="/seller-central/capture"
                  aria-label="Start capture"
                  className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center no-underline",
                    "-translate-y-3 shadow-lg transition-colors duration-150",
                    captureActive
                      ? "bg-[var(--clay-700)] ring-2 ring-[var(--clay-300)]"
                      : "bg-[var(--clay-500)] hover:bg-[var(--clay-600)]"
                  )}
                  style={{ color: "#fff" }}
                >
                  <Camera size={20} strokeWidth={1.75} />
                </Link>
              </div>
            );
          }

          const active = isActive(tab.href, pathname);
          const unread = tab.showUnread ? unreadCount : 0;

          return (
            <Link
              key={idx}
              href={tab.href}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 no-underline relative",
                "text-[10px] font-medium transition-colors duration-150",
                active ? "text-[var(--clay-600)]" : "text-[var(--ink-400)]"
              )}
            >
              <div className="relative">
                <tab.icon size={20} strokeWidth={active ? 2 : 1.5} />
                {unread > 0 && (
                  <span
                    className="absolute -top-1 -right-2.5 text-white rounded-full px-1 text-[8px] font-bold leading-[12px] min-w-3 text-center"
                    style={{ background: "var(--clay-500)" }}
                  >
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
