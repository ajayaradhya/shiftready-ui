"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Store, LayoutDashboard, MessageSquare, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useUsername } from "@/hooks/use-username";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function ProfileMenu() {
  const { user, signOut } = useAuth();
  const { profile } = useUsername();
  const router = useRouter();

  if (!user) return null;

  const displayName = profile?.username
    ? `@${profile.username}`
    : user.displayName?.split(" ")[0] ?? user.email?.split("@")[0] ?? "Account";

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const AvatarInner = ({ size }: { size: number }) =>
    user.photoURL ? (
      <Image
        src={user.photoURL}
        alt={displayName}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).style.display = "none";
        }}
      />
    ) : (
      <span
        className="font-bold leading-none text-[var(--clay-700)]"
        style={{
          fontFamily: "var(--sr-font-serif)",
          fontSize: size * 0.4,
        }}
      >
        {displayName.slice(0, 1).toUpperCase()}
      </span>
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={`User menu for ${displayName}`}
          className={cn(
            "w-11 h-11 rounded-full overflow-hidden flex-shrink-0 cursor-pointer",
            "grid place-items-center border border-[var(--sr-border-subtle)]",
            "bg-[var(--clay-100)] hover:ring-2 hover:ring-[var(--clay-200)]",
            "transition-all duration-150 outline-none",
          )}
        >
          <AvatarInner size={36} />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {/* Identity block */}
        <div
          className="flex items-center gap-2.5 px-3 py-3 mb-0.5"
          style={{ borderBottom: "1px solid var(--sr-border-subtle)" }}
        >
          <div
            className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden grid place-items-center border border-[var(--sr-border-subtle)] bg-[var(--clay-100)]"
          >
            <AvatarInner size={36} />
          </div>
          <div className="flex flex-col min-w-0">
            <span
              className="text-[13px] font-semibold truncate"
              style={{ color: "var(--sr-text-primary)" }}
            >
              {displayName}
            </span>
            {user.email && (
              <span
                className="text-[11px] truncate"
                style={{ color: "var(--sr-text-muted)" }}
              >
                {user.email}
              </span>
            )}
          </div>
        </div>

        <DropdownMenuItem asChild>
          <Link href="/seller-central" className="no-underline flex items-center gap-2.5">
            <LayoutDashboard size={15} strokeWidth={1.5} />
            Seller Central
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/market" className="no-underline flex items-center gap-2.5">
            <Store size={15} strokeWidth={1.5} />
            The Marketplace
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/messages" className="no-underline flex items-center gap-2.5">
            <MessageSquare size={15} strokeWidth={1.5} />
            Messages
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="no-underline flex items-center gap-2.5">
            <Settings size={15} strokeWidth={1.5} />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2.5 text-[var(--rust-500)] hover:text-[var(--rust-500)] hover:bg-[var(--rust-50)] focus:text-[var(--rust-500)] focus:bg-[var(--rust-50)]"
        >
          <LogOut size={15} strokeWidth={1.5} />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
