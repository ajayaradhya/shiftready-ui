"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSaleContext } from "@/lib/sale-context";
import { cn } from "@/lib/utils";
import { ProfileMenu } from "./profile-menu";
import { NotificationsPanel } from "./notifications-panel";

interface ShellHeaderProps {
  /** When true, desktop header is offset left by sidebar width (224px) */
  hasSidebar?: boolean;
}

export function ShellHeader({ hasSidebar = false }: ShellHeaderProps) {
  const { user } = useAuth();
  const { sale, isProcessing } = useSaleContext();
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 right-0 z-50 h-12 flex items-center gap-3 px-4",
          hasSidebar ? "md:left-[224px] left-0" : "left-0"
        )}
        style={{
          background: "rgba(250,250,247,0.92)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
          borderBottom: "1px solid var(--sr-border-subtle)",
          fontFamily: "var(--sr-font-sans)",
        }}
      >
        {/* AI processing pulse bar */}
        {isProcessing && (
          <div className="absolute bottom-0 left-0 w-full h-0.5 overflow-hidden" aria-hidden>
            <div
              className="h-full w-[30%] bg-[var(--clay-500)]"
              style={{ animation: "pan 2s infinite linear", boxShadow: "0 0 8px var(--clay-400)" }}
            />
          </div>
        )}

        {/* Mobile logo (only when sidebar exists; sidebar hidden on mobile) */}
        {hasSidebar && (
          <Link
            href="/"
            className="md:hidden flex items-center gap-2 no-underline shrink-0"
            style={{ color: "var(--sr-text-primary)" }}
          >
            <Image src="/logo-mark.svg" alt="ShiftReady" width={20} height={20} priority />
            <span
              className="text-[16px] font-semibold leading-none"
              style={{ fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.015em" }}
            >
              ShiftReady
            </span>
          </Link>
        )}

        {/* Public logo (no sidebar pages — full-width header always shows logo) */}
        {!hasSidebar && (
          <Link
            href="/"
            className="flex items-center gap-2 no-underline shrink-0"
            style={{ color: "var(--sr-text-primary)" }}
          >
            <Image src="/logo-mark.svg" alt="ShiftReady" width={20} height={20} priority />
            <span
              className="hidden sm:inline text-[16px] font-semibold leading-none"
              style={{ fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.015em" }}
            >
              ShiftReady
            </span>
          </Link>
        )}

        {/* Sale context chip (desktop only) */}
        {sale && (
          <div className="hidden md:flex items-center gap-2.5 shrink-0">
            <div
              className="w-px h-[18px] shrink-0"
              style={{ background: "var(--sr-border-subtle)" }}
              aria-hidden
            />
            <div className="flex flex-col">
              <span
                className="text-[9px] uppercase leading-none"
                style={{
                  letterSpacing: "0.14em",
                  color: "var(--sr-text-muted)",
                  fontFamily: "var(--sr-font-mono)",
                }}
              >
                {sale.label}
              </span>
              <span
                className="text-[13px] font-medium mt-0.5"
                style={{ color: "var(--sr-text-primary)" }}
              >
                {sale.name}
              </span>
            </div>
          </div>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Command palette pill (desktop stub — Phase B wires cmdk) */}
        <button
          className={cn(
            "hidden md:flex items-center gap-2 h-8 px-3 rounded-lg cursor-pointer select-none",
            "border bg-[var(--cream-50)] transition-colors duration-150",
            "hover:border-[var(--sr-border-default)] hover:text-[var(--ink-600)]"
          )}
          style={{
            borderColor: "var(--sr-border-subtle)",
            color: "var(--ink-400)",
            fontSize: 12,
            fontFamily: "var(--sr-font-sans)",
          }}
          aria-label="Open command palette"
        >
          <Search size={12} strokeWidth={1.5} />
          <span>Search…</span>
          <kbd
            className="ml-1 px-1 rounded text-[10px]"
            style={{
              background: "var(--cream-200)",
              color: "var(--ink-400)",
              fontFamily: "var(--sr-font-mono)",
            }}
          >
            ⌘K
          </kbd>
        </button>

        {/* Notification bell */}
        <button
          onClick={() => setNotifOpen(true)}
          aria-label="Notifications"
          className="w-8 h-8 rounded-full grid place-items-center transition-colors duration-150 cursor-pointer border-none bg-transparent"
          style={{ color: "var(--ink-400)" }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--ink-700)";
            (e.currentTarget as HTMLElement).style.background = "var(--cream-100)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--ink-400)";
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <Bell size={17} strokeWidth={1.5} />
        </button>

        {/* Profile or auth */}
        {user ? (
          <ProfileMenu />
        ) : (
          <div className="flex items-center gap-2">
            <Link
              href="/login?tab=create"
              className="no-underline text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-[10px] transition-colors"
              style={{ background: "var(--clay-500)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-600)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-500)"; }}
            >
              Sign up free
            </Link>
            <Link
              href="/login"
              className="no-underline text-[13px] font-medium px-3.5 py-1.5 rounded-[10px] border transition-colors"
              style={{
                color: "var(--ink-500)",
                borderColor: "var(--sr-border-default)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
            >
              Sign in
            </Link>
          </div>
        )}
      </header>

      <NotificationsPanel open={notifOpen} onOpenChange={setNotifOpen} />
    </>
  );
}
