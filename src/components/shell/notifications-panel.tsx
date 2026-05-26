"use client";

import { Bell } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[380px] flex flex-col p-0">
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--sr-border-subtle)" }}
        >
          <SheetTitle className="not-sr-only text-[14px] font-semibold m-0 p-0 border-none" style={{ color: "var(--sr-text-primary)" }}>
            Notifications
          </SheetTitle>
          <button
            className="text-[12px] font-medium bg-transparent border-none cursor-pointer transition-colors"
            style={{ color: "var(--clay-600)", fontFamily: "var(--sr-font-sans)" }}
          >
            Mark all read
          </button>
        </div>
        <SheetDescription className="sr-only">Your notifications list</SheetDescription>

        {/* Empty state */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
          <Bell size={32} strokeWidth={1.25} style={{ color: "var(--cream-400)" }} />
          <div className="flex flex-col gap-1">
            <p className="text-[13px] m-0" style={{ color: "var(--sr-text-muted)", lineHeight: 1.5 }}>
              No notifications yet.
            </p>
            <p className="text-[12px] m-0" style={{ color: "var(--sr-text-muted)" }}>
              Messages, offers, and updates will appear here.
            </p>
          </div>
          <span
            className="mt-1 text-[11px] font-medium px-3 py-1.5 rounded-full"
            style={{
              color: "var(--clay-600)",
              background: "var(--clay-50)",
            }}
          >
            Coming soon
          </span>
        </div>
      </SheetContent>
    </Sheet>
  );
}
