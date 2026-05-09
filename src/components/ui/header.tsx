"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, UserCircle, LogOut } from "lucide-react";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";

interface HeaderProps {
  isProcessing?: boolean;
  children?: React.ReactNode;
}

export function Header({ isProcessing, children }: HeaderProps) {
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
    <header className="fixed top-0 right-0 left-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/5 z-50 flex items-center justify-between px-8 pl-72">
      {/* AI Pulse Line: visual feedback for backend activity */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden">
          <div className="h-full bg-primary animate-[pan_2s_infinite_linear] w-[30%] shadow-[0_0_8px_#adc6ff]" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-outline">
          Inventory <span className="text-on-surface">Review</span>
        </h1>
        {children}
      </div>

      <div className="flex items-center gap-6 text-outline">
        <button className="hover:text-primary transition-colors" aria-label="Notifications">
          <Bell size={20} strokeWidth={1.5} />
        </button>
        <div className="h-4 w-[1px] bg-outline-variant/30" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((o) => !o)}
            className="flex items-center gap-3 hover:text-on-surface transition-colors"
            aria-label="User menu"
          >
            <span className="text-xs font-medium uppercase tracking-widest">{displayName}</span>
            {user?.photoURL ? (
              <Image
                src={user.photoURL}
                alt={displayName}
                width={28}
                height={28}
                className="rounded-full ring-1 ring-outline-variant/20"
              />
            ) : (
              <UserCircle size={24} strokeWidth={1.5} />
            )}
          </button>

          {dropdownOpen && (
            <>
              {/* Backdrop to close on outside click */}
              <button
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
                aria-hidden
              />
              <div className="absolute right-0 top-11 w-52 z-50 bg-surface-container-high rounded-xl border border-outline-variant/10 shadow-2xl py-2 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-4 py-2.5 border-b border-outline-variant/10">
                  <p className="text-[10px] uppercase tracking-widest text-outline font-black">
                    Signed in as
                  </p>
                  <p className="text-xs font-medium text-on-surface truncate mt-0.5">
                    {user?.email}
                  </p>
                </div>
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
      </div>
    </header>
  );
}
