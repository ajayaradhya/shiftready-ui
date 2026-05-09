"use client";

import {
  LayoutDashboard,
  Box,
  ShoppingBag,
  CreditCard,
  Headphones,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Box, label: "Inventory", href: "/create" },
  { icon: ShoppingBag, label: "Marketplace", href: "/marketplace" },
  { icon: CreditCard, label: "Finances", href: "#" },
  { icon: Headphones, label: "Concierge", href: "#" },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "#") return false;
    if (href === "/create") return pathname === "/create" || pathname.startsWith("/inventory");
    return pathname === href || pathname.startsWith(href + "/");
  }

  return (
    <nav className="fixed left-0 top-0 h-full w-20 flex flex-col items-center py-8 gap-10 bg-surface-container-lowest border-r border-outline-variant/10 z-50">
      {navItems.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center gap-2 group transition-all ${
              active ? "text-primary" : "text-outline hover:text-primary"
            }`}
          >
            <item.icon
              size={24}
              strokeWidth={active ? 2.5 : 1.5}
              className="transition-transform group-hover:scale-110"
            />
            <span
              className={`text-[10px] uppercase tracking-widest font-medium ${
                active ? "font-bold" : ""
              }`}
            >
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
