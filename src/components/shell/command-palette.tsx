"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard, Store, MessageSquare, Settings, Camera,
  Package, ArrowRight, Clock, Search, X,
} from "lucide-react";
import { Command } from "cmdk";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { cn } from "@/lib/utils";
import { useSalesList } from "@/hooks/use-sales";
import { useAuth } from "@/hooks/use-auth";

// ── Recent ring buffer (localStorage) ────────────────────────────────────────

const RECENT_KEY = "sr-cmd-recent";
const RECENT_MAX = 5;

interface RecentEntry {
  id: string;
  label: string;
  href: string;
  icon: string;
}

function getRecent(): RecentEntry[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function pushRecent(entry: RecentEntry) {
  const existing = getRecent().filter((r) => r.id !== entry.id);
  const next = [entry, ...existing].slice(0, RECENT_MAX);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

// ── Icon map (serialised name → component) ────────────────────────────────────

const ICON_MAP: Record<string, React.ComponentType<{ size: number; strokeWidth: number }>> = {
  LayoutDashboard, Store, MessageSquare, Settings, Camera, Package, ArrowRight,
};

// ── Static command definitions ────────────────────────────────────────────────

interface CommandDef {
  id: string;
  label: string;
  iconName: string;
  href: string;
  group: "navigate" | "actions";
  keywords?: string;
  requiresAuth?: boolean;
}

const STATIC_COMMANDS: CommandDef[] = [
  { id: "nav-seller",   label: "Seller Central",  iconName: "LayoutDashboard", href: "/seller-central",         group: "navigate", requiresAuth: true },
  { id: "nav-market",   label: "The Marketplace", iconName: "Store",           href: "/market",                  group: "navigate" },
  { id: "nav-messages", label: "Messages",         iconName: "MessageSquare",   href: "/messages",                group: "navigate", requiresAuth: true },
  { id: "nav-settings", label: "Settings",         iconName: "Settings",        href: "/settings",                group: "navigate", requiresAuth: true },
  { id: "act-capture",  label: "Start Capture",    iconName: "Camera",          href: "/seller-central/capture",  group: "actions",  keywords: "scan photo camera item",  requiresAuth: true },
  { id: "act-create",   label: "New Sale",         iconName: "Package",         href: "/seller-central/create",   group: "actions",  keywords: "upload video batch sale", requiresAuth: true },
];

// ── Palette UI ────────────────────────────────────────────────────────────────

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { data: sales } = useSalesList();
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load recent on open
  useEffect(() => {
    if (open) {
      setRecent(getRecent());
      setQuery("");
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [open]);

  const go = useCallback(
    (entry: RecentEntry) => {
      pushRecent(entry);
      setRecent(getRecent());
      onOpenChange(false);
      router.push(entry.href);
    },
    [onOpenChange, router]
  );

  // Filter statics by auth
  const visibleStatics = STATIC_COMMANDS.filter((c) => !c.requiresAuth || !!user);

  // Sale items for "jump to sale"
  const saleItems = (sales ?? []).slice(0, 8).map((s) => ({
    id: `sale-${s.id}`,
    label: s.title ?? `Sale ${s.id.slice(-6)}`,
    subtitle: s.suburb ?? s.street_address ?? undefined,
    href: `/seller-central/inventory/${s.id}`,
    iconName: "Package",
  }));

  const hasQuery = query.trim().length > 0;
  const hasRecent = !hasQuery && recent.length > 0;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Backdrop */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-black/30 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=closed]:animate-out data-[state=closed]:fade-out-0" />

        {/* Palette */}
        <DialogPrimitive.Content
          aria-label="Command palette"
          onOpenAutoFocus={(e) => { e.preventDefault(); setTimeout(() => inputRef.current?.focus(), 10); }}
          className={cn(
            "fixed z-[100] top-[18%] left-1/2 -translate-x-1/2 w-full max-w-[580px] mx-4",
            "rounded-2xl shadow-2xl overflow-hidden focus:outline-none",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
          )}
          style={{
            background: "var(--sr-bg-card)",
            border: "1px solid var(--sr-border-subtle)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.18), 0 4px 16px rgba(0,0,0,0.08)",
          }}
        >
          <DialogPrimitive.Title className="sr-only">Command palette</DialogPrimitive.Title>
          <DialogPrimitive.Description className="sr-only">Search pages, sales, and actions. Use arrow keys to navigate, Enter to select, Escape to close.</DialogPrimitive.Description>
        <Command label="Command palette" shouldFilter={hasQuery} loop>
          {/* Search row */}
          <div
            className="flex items-center gap-2.5 px-4"
            style={{ borderBottom: "1px solid var(--sr-border-subtle)", height: 52 }}
          >
            <Search size={15} strokeWidth={1.5} style={{ color: "var(--sr-text-muted)", flexShrink: 0 }} />
            <Command.Input
              ref={inputRef}
              value={query}
              onValueChange={setQuery}
              placeholder="Search pages, sales, actions…"
              className="flex-1 bg-transparent border-none outline-none text-[14px] placeholder:text-[var(--sr-text-muted)]"
              style={{
                color: "var(--sr-text-primary)",
                fontFamily: "var(--sr-font-sans)",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="w-5 h-5 rounded grid place-items-center cursor-pointer bg-transparent border-none transition-colors"
                style={{ color: "var(--sr-text-muted)" }}
                aria-label="Clear search"
              >
                <X size={12} strokeWidth={2} />
              </button>
            )}
            <kbd
              onClick={() => onOpenChange(false)}
              className="hidden sm:grid place-items-center px-1.5 py-0.5 rounded text-[11px] cursor-pointer select-none"
              style={{
                background: "var(--cream-200)",
                color: "var(--ink-400)",
                fontFamily: "var(--sr-font-mono)",
                border: "1px solid var(--sr-border-subtle)",
              }}
            >
              esc
            </kbd>
          </div>

          {/* Results */}
          <Command.List className="max-h-[380px] overflow-y-auto py-2">
            <Command.Empty className="py-10 text-center text-[13px]" style={{ color: "var(--sr-text-muted)" }}>
              No results for &ldquo;{query}&rdquo;
            </Command.Empty>

            {/* Recent (shown only when no query) */}
            {hasRecent && (
              <Command.Group heading="Recent" className={groupClass}>
                {recent.map((r) => (
                  <PaletteItem
                    key={r.id}
                    id={r.id}
                    icon={<Clock size={15} strokeWidth={1.5} />}
                    label={r.label}
                    onSelect={() => go(r)}
                  />
                ))}
              </Command.Group>
            )}

            {/* Navigate */}
            <Command.Group heading="Navigate" className={groupClass}>
              {visibleStatics
                .filter((c) => c.group === "navigate")
                .map((c) => {
                  const Icon = ICON_MAP[c.iconName] ?? ArrowRight;
                  return (
                    <PaletteItem
                      key={c.id}
                      id={c.id}
                      icon={<Icon size={15} strokeWidth={1.5} />}
                      label={c.label}
                      keywords={c.keywords}
                      onSelect={() => go({ id: c.id, label: c.label, href: c.href, icon: c.iconName })}
                    />
                  );
                })}
            </Command.Group>

            {/* Actions */}
            {visibleStatics.some((c) => c.group === "actions") && (
              <Command.Group heading="Actions" className={groupClass}>
                {visibleStatics
                  .filter((c) => c.group === "actions")
                  .map((c) => {
                    const Icon = ICON_MAP[c.iconName] ?? ArrowRight;
                    return (
                      <PaletteItem
                        key={c.id}
                        id={c.id}
                        icon={<Icon size={15} strokeWidth={1.5} />}
                        label={c.label}
                        keywords={c.keywords}
                        onSelect={() => go({ id: c.id, label: c.label, href: c.href, icon: c.iconName })}
                      />
                    );
                  })}
              </Command.Group>
            )}

            {/* Sales */}
            {user && saleItems.length > 0 && (
              <Command.Group heading="Your Sales" className={groupClass}>
                {saleItems.map((s) => (
                  <PaletteItem
                    key={s.id}
                    id={s.id}
                    icon={<Package size={15} strokeWidth={1.5} />}
                    label={s.label}
                    subtitle={s.subtitle}
                    onSelect={() => go({ id: s.id, label: s.label, href: s.href, icon: "Package" })}
                  />
                ))}
              </Command.Group>
            )}
          </Command.List>

          {/* Footer hint */}
          <div
            className="flex items-center gap-3 px-4 py-2.5"
            style={{
              borderTop: "1px solid var(--sr-border-subtle)",
              color: "var(--sr-text-muted)",
              fontSize: 11,
              fontFamily: "var(--sr-font-mono)",
            }}
          >
            <span><kbd style={kbdStyle}>↑↓</kbd> navigate</span>
            <span><kbd style={kbdStyle}>↵</kbd> open</span>
            <span><kbd style={kbdStyle}>esc</kbd> close</span>
          </div>
        </Command>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PaletteItem({
  id,
  icon,
  label,
  subtitle,
  keywords,
  onSelect,
}: {
  id: string;
  icon: React.ReactNode;
  label: string;
  subtitle?: string;
  keywords?: string;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      value={`${id} ${label} ${keywords ?? ""}`}
      onSelect={onSelect}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 mx-1 rounded-xl cursor-pointer select-none",
        "transition-colors duration-75 outline-none",
        "aria-selected:bg-[var(--cream-100)]"
      )}
      style={{ color: "var(--sr-text-primary)" }}
    >
      <span style={{ color: "var(--sr-text-muted)", flexShrink: 0 }}>{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="text-[13px] font-medium block truncate">{label}</span>
        {subtitle && (
          <span className="text-[11px] block truncate mt-px" style={{ color: "var(--sr-text-muted)" }}>
            {subtitle}
          </span>
        )}
      </span>
      <ArrowRight size={12} strokeWidth={1.5} style={{ color: "var(--sr-text-muted)", flexShrink: 0, opacity: 0.5 }} />
    </Command.Item>
  );
}

const groupClass = "px-1 pb-1";

const kbdStyle: React.CSSProperties = {
  background: "var(--cream-200)",
  border: "1px solid var(--sr-border-subtle)",
  borderRadius: 4,
  padding: "1px 4px",
  fontFamily: "var(--sr-font-mono)",
  fontSize: 10,
  marginRight: 3,
};
