"use client";

import { useRouter } from "next/navigation";
import { Bell, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isProcessing?: boolean;
  children?: React.ReactNode;
  section?: string;
}

export function Header({ isProcessing, children, section }: HeaderProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/5 z-50 flex items-center justify-between px-6 pl-16 md:pl-28">
      {isProcessing && (
        <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden" aria-hidden>
          <div className="h-full bg-primary animate-[pan_2s_infinite_linear] w-[30%] shadow-[0_0_8px_#adc6ff]" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-outline">
          {section ? (
            (() => {
              const parts = section.split(" ");
              const dim = parts.slice(0, -1).join(" ");
              const bright = parts[parts.length - 1];
              return dim ? <>{dim} <span className="text-on-surface">{bright}</span></> : <span className="text-on-surface">{bright}</span>;
            })()
          ) : (
            <>Inventory <span className="text-on-surface">Review</span></>
          )}
        </h1>
        {children}
      </div>

      <div className="flex items-center gap-6 text-outline">
        <button
          className="hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full p-1"
          aria-label="Notifications"
        >
          <Bell size={20} strokeWidth={1.5} />
        </button>
        <div className="h-4 w-[1px] bg-outline-variant/30" aria-hidden />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="flex items-center gap-3 hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full p-1"
              aria-label={`User menu for ${displayName}`}
            >
              <span className="text-xs font-medium uppercase tracking-widest hidden sm:block">
                {displayName}
              </span>
              <Image
                src={user?.photoURL ?? "/default-avatar.png"}
                alt={`${displayName} avatar`}
                width={28}
                height={28}
                className="rounded-full ring-1 ring-outline-variant/20"
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = "/default-avatar.png"; }}
              />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
            <div className="px-4 pb-2 text-xs font-medium text-on-surface truncate">
              {user?.email}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleSignOut}
              className="text-sm text-outline hover:!text-error hover:!bg-error/5"
            >
              <LogOut size={15} aria-hidden />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
