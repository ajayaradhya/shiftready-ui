"use client";

import Image from "next/image";
import { Bell, UserCircle } from "lucide-react";

interface HeaderProps {
  isProcessing?: boolean;
}

export function Header({ isProcessing = false }: HeaderProps) {
  return (
    <header className="fixed top-0 right-0 left-0 h-16 bg-surface-container-lowest/80 backdrop-blur-md border-b border-outline-variant/5 z-50 flex items-center justify-between px-8 pl-72">
      {/* 2026 AI Pulse Line: Visual feedback for backend activity */}
      {isProcessing && (
        <div className="absolute bottom-0 left-0 w-full h-[1px] overflow-hidden">
          <div className="h-full bg-primary animate-[pan_2s_infinite_linear] w-[30%] shadow-[0_0_8px_#adc6ff]" />
        </div>
      )}

      <div className="flex items-center gap-4">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-outline">
          Inventory <span className="text-on-surface">Review</span>
        </h1>
      </div>

      <div className="flex items-center gap-6 text-outline">
        <button className="hover:text-primary transition-colors">
          <Bell size={20} strokeWidth={1.5} />
        </button>
        <div className="h-4 w-[1px] bg-outline-variant/30" />
        <button className="flex items-center gap-3 hover:text-on-surface transition-colors">
          <span className="text-xs font-medium uppercase tracking-widest">Account</span>
          <UserCircle size={24} strokeWidth={1.5} />
        </button>
      </div>

      <style jsx global>{`
        @keyframes pan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </header>
  );
}