"use client";

import { Trash2, RotateCcw } from "lucide-react";

interface CardDeleteOverlayProps {
  onCancel: () => void;
  onConfirm: () => void;
}

export function CardDeleteOverlay({ onCancel, onConfirm }: CardDeleteOverlayProps) {
  return (
    <div className="absolute inset-0 z-20 bg-error/10 backdrop-blur-md rounded-2xl flex flex-col items-center justify-center gap-4 animate-in fade-in zoom-in duration-300">
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-error">Permanent Removal?</p>
      <div className="flex items-center gap-3">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 px-4 py-2 bg-surface text-on-surface rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-surface-container-highest transition-all"
        >
          <RotateCcw size={12} /> Cancel
        </button>
        <button 
          onClick={onConfirm}
          className="flex items-center gap-2 px-4 py-2 bg-error text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 shadow-lg shadow-error/20 transition-all"
        >
          <Trash2 size={12} /> Confirm
        </button>
      </div>
    </div>
  );
}