"use client";

import { Keyboard } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ShortcutsCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const SECTIONS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["g", "s"], label: "Go to Seller Central" },
      { keys: ["g", "m"], label: "Go to Marketplace" },
      { keys: ["g", "i"], label: "Go to Inventory" },
    ],
  },
  {
    title: "Global",
    shortcuts: [
      { keys: ["⌘K"], label: "Open command palette" },
      { keys: ["?"], label: "Show this help" },
      { keys: ["Esc"], label: "Close modal / palette" },
    ],
  },
  {
    title: "Command palette",
    shortcuts: [
      { keys: ["↑", "↓"], label: "Navigate results" },
      { keys: ["↵"], label: "Open selected" },
      { keys: ["Esc"], label: "Close palette" },
    ],
  },
];

export function ShortcutsCheatsheet({ open, onOpenChange }: ShortcutsCheatsheetProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard size={14} strokeWidth={1.5} />
            Keyboard shortcuts
          </DialogTitle>
          <DialogDescription className="sr-only">
            All available keyboard shortcuts for ShiftReady.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-5 mt-1">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <p
                className="text-[10px] font-semibold uppercase tracking-[0.1em] mb-2"
                style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}
              >
                {section.title}
              </p>
              <div className="flex flex-col gap-1.5">
                {section.shortcuts.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-center justify-between gap-4"
                  >
                    <span
                      className="text-[13px]"
                      style={{ color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-sans)" }}
                    >
                      {s.label}
                    </span>
                    <div className="flex items-center gap-1 shrink-0">
                      {s.keys.map((k, i) => (
                        <span key={i} className="flex items-center gap-1">
                          <kbd
                            className="px-1.5 py-0.5 rounded text-[11px] leading-none"
                            style={{
                              background: "var(--cream-200)",
                              border: "1px solid var(--sr-border-subtle)",
                              color: "var(--ink-500)",
                              fontFamily: "var(--sr-font-mono)",
                            }}
                          >
                            {k}
                          </kbd>
                          {i < s.keys.length - 1 && (
                            <span
                              className="text-[10px]"
                              style={{ color: "var(--sr-text-muted)" }}
                            >
                              then
                            </span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
