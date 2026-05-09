"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { UserCircle, LogOut, LayoutDashboard } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";

function PublicHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleSignOut = async () => {
    setDropdownOpen(false);
    await signOut();
    router.push("/login");
  };

  const displayName =
    user?.displayName?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "Account";

  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/10 z-50 flex items-center justify-between px-8">
      <Link href="/marketplace" className="flex items-center gap-2.5">
        <span className="text-xs font-black uppercase tracking-[0.25em] text-primary">
          Shift<span className="text-on-surface">Ready</span>
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              className="flex items-center gap-2.5 text-outline hover:text-on-surface transition-colors"
              aria-label="User menu"
            >
              <span className="text-[10px] uppercase tracking-widest font-medium">{displayName}</span>
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={displayName}
                  width={26}
                  height={26}
                  className="rounded-full ring-1 ring-outline-variant/20"
                />
              ) : (
                <UserCircle size={22} strokeWidth={1.5} />
              )}
            </button>

            {dropdownOpen && (
              <>
                <button
                  className="fixed inset-0 z-40"
                  onClick={() => setDropdownOpen(false)}
                  aria-hidden
                />
                <div className="absolute right-0 top-10 w-52 z-50 bg-surface-container-high rounded-xl border border-outline-variant/10 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-4 py-2.5 border-b border-outline-variant/10">
                    <p className="text-[10px] uppercase tracking-widest text-outline font-black">Signed in as</p>
                    <p className="text-xs font-medium text-on-surface truncate mt-0.5">{user.email}</p>
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-outline hover:text-primary hover:bg-primary/5 transition-colors"
                  >
                    <LayoutDashboard size={15} />
                    My Sales
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-outline hover:text-error hover:bg-error/5 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="text-[10px] uppercase tracking-widest font-black text-primary hover:text-primary/80 transition-colors"
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
