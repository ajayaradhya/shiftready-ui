"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserCircle, LogOut, LayoutDashboard } from "lucide-react";
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

function PublicHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/10 z-50 flex items-center justify-between px-8">
      <Link
        href="/marketplace"
        className="flex items-center gap-2.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md"
      >
        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
          Shift<span className="text-on-surface">Ready</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className="flex items-center gap-2.5 text-outline hover:text-on-surface transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-full p-1"
                aria-label={`User menu for ${displayName}`}
              >
                <span className="text-[10px] uppercase tracking-widest font-medium hidden sm:block">
                  {displayName}
                </span>
                {user.photoURL ? (
                  <Image
                    src={user.photoURL}
                    alt={`${displayName} avatar`}
                    width={26}
                    height={26}
                    className="rounded-full ring-1 ring-outline-variant/20"
                  />
                ) : (
                  <UserCircle size={22} strokeWidth={1.5} aria-hidden />
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Signed in as</DropdownMenuLabel>
              <div className="px-4 pb-2 text-xs font-medium text-on-surface truncate">
                {user.email}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard size={15} aria-hidden />
                  My Sales
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleSignOut}
                className="hover:!text-error hover:!bg-error/5"
              >
                <LogOut size={15} aria-hidden />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-widest font-black text-primary hover:text-primary/80 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
          >
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
}

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="pt-14 min-h-screen bg-surface">{children}</main>
    </>
  );
}
