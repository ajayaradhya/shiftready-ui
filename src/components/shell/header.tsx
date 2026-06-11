"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useRouter } from "next/navigation";
import { useNotifUnreadCount } from "@/hooks/use-notifications";
import { useSaleContext } from "@/lib/sale-context";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { ProfileMenu } from "./profile-menu";
import { ShortcutsCheatsheet } from "./shortcuts-cheatsheet";

const CommandPalette = dynamic(() => import("./command-palette").then(m => ({ default: m.CommandPalette })));
const NotificationsPanel = dynamic(() => import("./notifications-panel").then(m => ({ default: m.NotificationsPanel })));

interface ShellHeaderProps {
  /** When true, desktop header is offset left by sidebar width (224px) */
  hasSidebar?: boolean;
}

export function ShellHeader({ hasSidebar = false }: ShellHeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const { sale, isProcessing } = useSaleContext();
  const { data: notifCount } = useNotifUnreadCount();
  const unreadNotifs = notifCount?.unread_count ?? 0;
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [cheatsheetOpen, setCheatsheetOpen] = useState(false);
  const gPending = useRef(false);
  const gTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPalette = useCallback(() => setPaletteOpen(true), []);

  useEffect(() => {
    const isInputFocused = () => {
      const el = document.activeElement as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
    };

    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen((v) => !v);
        return;
      }

      if (isInputFocused()) return;

      if (e.key === "?") {
        e.preventDefault();
        setCheatsheetOpen((v) => !v);
        return;
      }

      if (gPending.current) {
        gPending.current = false;
        if (gTimer.current) clearTimeout(gTimer.current);
        if (e.key === "s") { e.preventDefault(); router.push("/seller-central"); }
        else if (e.key === "m") { e.preventDefault(); router.push("/market"); }
        else if (e.key === "i") { e.preventDefault(); router.push("/seller-central"); }
        return;
      }

      if (e.key === "g" && !e.metaKey && !e.ctrlKey && !e.altKey) {
        gPending.current = true;
        gTimer.current = setTimeout(() => { gPending.current = false; }, 500);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => {
      window.removeEventListener("keydown", handler);
      if (gTimer.current) clearTimeout(gTimer.current);
    };
  }, [router]);

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
            <Image src="/logo-mark.svg" alt="" width={20} height={20} priority />
            <span
              className="text-[16px] font-semibold leading-none"
              style={{ fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.015em" }}
            >
              Myrio
            </span>
          </Link>
        )}

        {/* Public logo (no sidebar pages - full-width header always shows logo) */}
        {!hasSidebar && (
          <Link
            href="/"
            className="flex items-center gap-2 no-underline shrink-0"
            style={{ color: "var(--sr-text-primary)" }}
          >
            <Image src="/logo-mark.svg" alt="" width={20} height={20} priority />
            <span
              className="hidden sm:inline text-[16px] font-semibold leading-none"
              style={{ fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.015em" }}
            >
              Myrio
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

        {/* Command palette trigger */}
        <button
          onClick={openPalette}
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
          aria-label="Open command palette (⌘K)"
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

        {/* Shortcuts hint button (desktop) */}
        <button
          onClick={() => setCheatsheetOpen(true)}
          aria-label="Keyboard shortcuts (?)"
          className="hidden md:grid w-7 h-7 rounded-full place-items-center transition-colors duration-150 cursor-pointer border-none bg-transparent text-[12px] font-bold"
          style={{
            color: "var(--ink-300)",
            border: "1.5px solid var(--sr-border-subtle)",
            fontFamily: "var(--sr-font-mono)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--ink-600)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-default)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = "var(--ink-300)";
            (e.currentTarget as HTMLElement).style.borderColor = "var(--sr-border-subtle)";
          }}
        >
          ?
        </button>

        {/* Notification bell — only for signed-in users (no notifications exist when logged out) */}
        {user && (
          <button
            onClick={() => setNotifOpen(true)}
            aria-label={`Notifications${unreadNotifs > 0 ? ` (${unreadNotifs} unread)` : ""}`}
            className="relative w-11 h-11 rounded-full grid place-items-center transition-colors duration-150 cursor-pointer border-none bg-transparent"
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
            {unreadNotifs > 0 && (
              <span
                className="absolute top-0.5 right-0.5 min-w-[14px] h-[14px] rounded-full flex items-center justify-center text-white leading-none"
                style={{
                  background: "var(--clay-500)",
                  fontSize: 9,
                  fontWeight: 700,
                  fontFamily: "var(--sr-font-sans)",
                  padding: "0 3px",
                }}
                aria-hidden
              >
                {unreadNotifs > 99 ? "99+" : unreadNotifs}
              </span>
            )}
          </button>
        )}

        {/* Profile or auth */}
        {user ? (
          <ProfileMenu />
        ) : (
          <div className="flex items-center gap-2">
            {/* Sign-up CTA hidden on mobile to leave room for a single clear "Sign in" */}
            <Link
              href="/login?tab=create"
              className="hidden sm:inline-block no-underline text-[13px] font-semibold text-white px-3.5 py-1.5 rounded-[10px] transition-colors"
              style={{ background: "var(--clay-700)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-800)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--clay-700)"; }}
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
      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
      <ShortcutsCheatsheet open={cheatsheetOpen} onOpenChange={setCheatsheetOpen} />
    </>
  );
}
