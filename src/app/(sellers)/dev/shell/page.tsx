"use client";

import { useState } from "react";
import { Keyboard, Bell, Search, Monitor, Smartphone } from "lucide-react";

const SHORTCUTS = [
  { keys: "⌘K",     label: "Open command palette" },
  { keys: "?",      label: "Show keyboard shortcuts" },
  { keys: "g → s",  label: "Go to Seller Central" },
  { keys: "g → m",  label: "Go to Marketplace" },
  { keys: "g → i",  label: "Go to Inventory" },
  { keys: "Esc",    label: "Close modal / palette" },
];

const SHELL_COMPONENTS = [
  { name: "ShellHeader",              file: "components/shell/header.tsx",                  notes: "48px glass bar. Cmd+K → palette. Bell → notifs. ? → shortcuts. Sale chip if in sale context." },
  { name: "ShellSidebar",             file: "components/shell/sidebar.tsx",                 notes: "224px fixed desktop. Seller + Market variants. Tooltips on disabled items." },
  { name: "BottomTabBar",             file: "components/shell/bottom-tab-bar.tsx",          notes: "Mobile only. 5-slot tab bar. Capture = FAB center." },
  { name: "CommandPalette",           file: "components/shell/command-palette.tsx",         notes: "cmdk + Radix Dialog (focus trap). Sections: Recent · Navigate · Actions · Sales." },
  { name: "ProfileMenu",              file: "components/shell/profile-menu.tsx",            notes: "Radix DropdownMenu. Avatar trigger. Identity block + nav links + sign out." },
  { name: "NotificationsPanel",       file: "components/shell/notifications-panel.tsx",     notes: "Radix Sheet side=right 380px. Tabs: All · Messages · Offers · System." },
  { name: "ShortcutsCheatsheet",      file: "components/shell/shortcuts-cheatsheet.tsx",    notes: "Radix Dialog. All keyboard shortcuts grouped by category." },
];

export default function DevShellPage() {
  const [activeView, setActiveView] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Title */}
      <div className="mb-8">
        <h1
          className="text-[22px] font-semibold mb-1"
          style={{ fontFamily: "var(--sr-font-serif)", color: "var(--sr-text-primary)" }}
        >
          Shell preview
        </h1>
        <p className="text-[13px]" style={{ color: "var(--sr-text-muted)" }}>
          Dev reference for shell components, interactions, and keyboard shortcuts.
        </p>
        <div
          className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium"
          style={{
            background: "var(--clay-50)",
            color: "var(--clay-600)",
            border: "1px solid var(--clay-200)",
            fontFamily: "var(--sr-font-mono)",
          }}
        >
          /dev/shell
        </div>
      </div>

      {/* Keyboard shortcuts */}
      <section className="mb-8">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}
        >
          <Keyboard size={11} strokeWidth={2} className="inline mr-1.5" />
          Keyboard shortcuts
        </h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--sr-border-subtle)" }}
        >
          {SHORTCUTS.map((s, i) => (
            <div
              key={s.keys}
              className="flex items-center justify-between px-4 py-2.5"
              style={{
                borderBottom: i < SHORTCUTS.length - 1 ? "1px solid var(--sr-border-subtle)" : "none",
                background: "var(--sr-bg-card)",
              }}
            >
              <span className="text-[13px]" style={{ color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-sans)" }}>
                {s.label}
              </span>
              <kbd
                className="px-2 py-0.5 rounded text-[11px]"
                style={{
                  background: "var(--cream-200)",
                  border: "1px solid var(--sr-border-subtle)",
                  color: "var(--ink-500)",
                  fontFamily: "var(--sr-font-mono)",
                }}
              >
                {s.keys}
              </kbd>
            </div>
          ))}
        </div>
      </section>

      {/* Component inventory */}
      <section className="mb-8">
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}
        >
          <Monitor size={11} strokeWidth={2} className="inline mr-1.5" />
          Shell components
        </h2>
        <div
          className="rounded-xl overflow-hidden"
          style={{ border: "1px solid var(--sr-border-subtle)" }}
        >
          {SHELL_COMPONENTS.map((c, i) => (
            <div
              key={c.name}
              className="px-4 py-3"
              style={{
                borderBottom: i < SHELL_COMPONENTS.length - 1 ? "1px solid var(--sr-border-subtle)" : "none",
                background: "var(--sr-bg-card)",
              }}
            >
              <div className="flex items-baseline gap-3 mb-0.5">
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-mono)" }}
                >
                  {c.name}
                </span>
                <span
                  className="text-[11px]"
                  style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-mono)" }}
                >
                  {c.file}
                </span>
              </div>
              <p className="text-[12px] m-0" style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
                {c.notes}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick trigger buttons */}
      <section>
        <h2
          className="text-[11px] font-semibold uppercase tracking-[0.1em] mb-3"
          style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}
        >
          <Smartphone size={11} strokeWidth={2} className="inline mr-1.5" />
          Quick test
        </h2>
        <p className="text-[12px] mb-3" style={{ color: "var(--sr-text-muted)" }}>
          Use the header controls above — bell, search, avatar, ? — to test each panel. Or trigger via keyboard shortcuts listed above.
        </p>
        <div className="flex flex-wrap gap-2">
          {[
            { label: "⌘K — Command palette", action: () => { const e = new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true }); window.dispatchEvent(e); } },
            { label: "? — Shortcuts", action: () => { const e = new KeyboardEvent("keydown", { key: "?", bubbles: true }); window.dispatchEvent(e); } },
            { label: "Bell — Notifications", action: () => { document.querySelector<HTMLButtonElement>('[aria-label^="Notifications"]')?.click(); } },
          ].map((btn) => (
            <button
              key={btn.label}
              onClick={btn.action}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium cursor-pointer border transition-colors"
              style={{
                background: "var(--cream-50)",
                borderColor: "var(--sr-border-subtle)",
                color: "var(--ink-500)",
                fontFamily: "var(--sr-font-sans)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-100)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--cream-50)"; }}
            >
              {btn.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
