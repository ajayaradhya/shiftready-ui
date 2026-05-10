"use client";

import { Package, PlusCircle, MessageCircle, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
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
  icon: React.ComponentType<{ size: number; strokeWidth: number; className?: string }>;
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
      className={`flex flex-col items-center gap-1.5 group transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-xl p-2 ${
        disabled
          ? "opacity-35 cursor-not-allowed pointer-events-none"
          : active
          ? "text-primary"
          : "text-outline hover:text-primary"
      }`}
    >
      <Icon
        size={24}
        strokeWidth={active ? 2.5 : 1.5}
        className="transition-transform group-hover:scale-110"
      />
      <span
        className={`text-[10px] uppercase tracking-widest font-medium ${active ? "font-bold" : ""}`}
      >
        {label}
      </span>
      {disabled && (
        <span className="text-[8px] uppercase tracking-[0.15em] text-outline/50">Soon</span>
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
    <TooltipProvider delayDuration={400}>
      <nav
        aria-label="Seller navigation"
        className="hidden md:flex fixed left-0 top-0 h-full w-20 flex-col items-center py-8 gap-10 bg-surface-container-lowest border-r border-outline-variant/10 z-50"
      >
        <Link href="/dashboard" aria-label="ShiftReady home">
          <Image src="/logo-mark.svg" alt="ShiftReady" width={36} height={36} priority />
        </Link>
        {sellerNavItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <NavItem
                  icon={item.icon}
                  label={item.label}
                  href={item.href}
                  active={active}
                  disabled={item.disabled}
                />
              </TooltipTrigger>
              <TooltipContent side="right">
                {item.label}
                {item.disabled ? " — coming soon" : ""}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </nav>
    </TooltipProvider>
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
      <button
        onClick={() => setOpen(true)}
        aria-label="Open seller menu"
        className="md:hidden fixed left-4 top-4 z-50 rounded-xl p-2 text-outline hover:text-on-surface hover:bg-surface-container-high transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        <Menu size={20} strokeWidth={1.5} />
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left">
          <SheetTitle className="flex items-center gap-3">
            <Image src="/logo-mark.svg" alt="ShiftReady" width={28} height={28} />
            ShiftReady — Seller
          </SheetTitle>
          <SheetDescription className="sr-only">Seller navigation links</SheetDescription>
          <nav
            aria-label="Mobile seller navigation"
            className="flex flex-col items-start pt-8 px-4 gap-2"
          >
            {sellerNavItems.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.label}
                  href={item.disabled ? "#" : item.href}
                  onClick={() => !item.disabled && setOpen(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    item.disabled
                      ? "opacity-35 pointer-events-none text-outline"
                      : active
                      ? "text-primary bg-primary/5"
                      : "text-outline hover:text-on-surface hover:bg-surface-container-high"
                  }`}
                >
                  <item.icon size={20} strokeWidth={active ? 2.5 : 1.5} aria-hidden />
                  <span>{item.label}</span>
                  {item.disabled && (
                    <span className="text-[10px] uppercase tracking-widest text-outline/50 ml-auto">
                      Soon
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
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
