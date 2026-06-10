"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, MessageSquare, Tag, Zap } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  useNotifications,
  useMarkNotifRead,
  useMarkAllNotifsRead,
} from "@/hooks/use-notifications";
import { cn } from "@/lib/utils";
import type { Notification, NotifType } from "@myrio/types";

type Tab = "all" | "messages" | "offers" | "system";

const TABS: { key: Tab; label: string }[] = [
  { key: "all",      label: "All" },
  { key: "messages", label: "Messages" },
  { key: "offers",   label: "Offers" },
  { key: "system",   label: "System" },
];

function matchesTab(type: NotifType, tab: Tab): boolean {
  if (tab === "all") return true;
  if (tab === "messages") return type === "message.new";
  if (tab === "offers") return type === "offer.new" || type === "offer.accepted" || type === "offer.countered";
  if (tab === "system") return type === "sale.ready";
  return false;
}

function NotifIcon({ type }: { type: NotifType }) {
  const style = { flexShrink: 0, color: "var(--sr-text-muted)" } as React.CSSProperties;
  if (type === "message.new") return <MessageSquare size={15} strokeWidth={1.5} style={style} />;
  if (type === "offer.new" || type === "offer.countered" || type === "offer.accepted") return <Tag size={15} strokeWidth={1.5} style={style} />;
  return <Zap size={15} strokeWidth={1.5} style={style} />;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface NotificationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationsPanel({ open, onOpenChange }: NotificationsPanelProps) {
  const [tab, setTab] = useState<Tab>("all");
  const router = useRouter();
  const { data: notifs, isLoading } = useNotifications();
  const { mutate: markRead } = useMarkNotifRead();
  const { mutate: markAllRead } = useMarkAllNotifsRead();

  const filtered = (notifs ?? []).filter((n) => matchesTab(n.type, tab));

  const handleClick = (n: Notification) => {
    if (!n.readAt) markRead(n.id);
    onOpenChange(false);
    router.push(n.link);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:w-[380px] max-w-[100vw] flex flex-col p-0">
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3.5 shrink-0"
          style={{ borderBottom: "1px solid var(--sr-border-subtle)" }}
        >
          <SheetTitle
            className="not-sr-only text-[14px] font-semibold m-0 p-0 border-none"
            style={{ color: "var(--sr-text-primary)" }}
          >
            Notifications
          </SheetTitle>
          <button
            onClick={() => markAllRead()}
            className="text-[12px] font-medium bg-transparent border-none cursor-pointer transition-colors"
            style={{ color: "var(--clay-600)", fontFamily: "var(--sr-font-sans)" }}
          >
            Mark all read
          </button>
        </div>
        <SheetDescription className="sr-only">Your notifications list</SheetDescription>

        {/* Tabs */}
        <div
          role="tablist"
          aria-label="Filter notifications"
          className="flex gap-0.5 px-3 py-2 shrink-0"
          style={{ borderBottom: "1px solid var(--sr-border-subtle)" }}
        >
          {TABS.map((t) => (
            <button
              key={t.key}
              role="tab"
              aria-selected={tab === t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors cursor-pointer border-none",
                tab === t.key
                  ? "bg-[var(--clay-50)] text-[var(--clay-600)]"
                  : "bg-transparent text-[var(--ink-400)] hover:bg-[var(--cream-100)]"
              )}
              style={{ fontFamily: "var(--sr-font-sans)" }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <span className="text-[13px]" style={{ color: "var(--sr-text-muted)" }}>
                Loadingâ€¦
              </span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 px-6 py-12 text-center">
              <Bell size={32} strokeWidth={1.25} style={{ color: "var(--cream-400)" }} />
              <p className="text-[13px] m-0" style={{ color: "var(--sr-text-muted)", lineHeight: 1.5 }}>
                No notifications yet.
              </p>
              <p className="text-[12px] m-0" style={{ color: "var(--sr-text-muted)" }}>
                Messages, offers, and updates will appear here.
              </p>
            </div>
          ) : (
            filtered.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n)}
                className={cn(
                  "w-full flex items-start gap-3 px-5 py-3.5 text-left transition-colors cursor-pointer border-none",
                  "hover:bg-[var(--cream-50)]",
                  !n.readAt && "bg-[var(--clay-50)/30]"
                )}
                style={{ borderBottom: "1px solid var(--sr-border-subtle)" }}
              >
                <div className="mt-0.5">
                  <NotifIcon type={n.type} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <span
                      className="text-[13px] font-medium block leading-snug"
                      style={{ color: n.readAt ? "var(--sr-text-muted)" : "var(--sr-text-primary)" }}
                    >
                      {n.title}
                    </span>
                    {!n.readAt && (
                      <span
                        className="mt-1 shrink-0 w-1.5 h-1.5 rounded-full"
                        style={{ background: "var(--clay-500)" }}
                        aria-hidden
                      />
                    )}
                  </div>
                  <span
                    className="text-[12px] block mt-0.5 truncate"
                    style={{ color: "var(--sr-text-muted)" }}
                  >
                    {n.body}
                  </span>
                  <span
                    className="text-[11px] block mt-1"
                    style={{ color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-mono)" }}
                  >
                    {timeAgo(n.createdAt)}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
