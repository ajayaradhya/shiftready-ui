"use client";

import { useState } from "react";
import { Trash2, X, PlusCircle } from "lucide-react";
import { InventoryCard } from "./inventory-card";
import type { RoomBundle } from "@/lib/types";

interface BundleSectionProps {
  bundle: RoomBundle;
  isLive: boolean;
  onDeleteBundle: (bundleId: string) => void;
  onAddItem: (bundleId: string) => void;
  onSeek: (seconds: number) => void;
}

export function BundleSection({
  bundle,
  isLive,
  onDeleteBundle,
  onAddItem,
  onSeek,
}: BundleSectionProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2 group/bundle">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
          {!isLive && (
            <div className="flex items-center">
              {isConfirmingDelete ? (
                <div className="flex items-center gap-2 animate-in zoom-in-95 duration-200">
                  <button
                    onClick={() => {
                      onDeleteBundle(bundle.id);
                      setIsConfirmingDelete(false);
                    }}
                    className="text-[9px] font-black uppercase text-error px-2 py-0.5 rounded border border-error/20 bg-error/5 hover:bg-error hover:text-white transition-all"
                  >
                    Confirm Delete?
                  </button>
                  <button
                    onClick={() => setIsConfirmingDelete(false)}
                    className="text-outline hover:text-on-surface"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsConfirmingDelete(true)}
                  className="opacity-0 group-hover/bundle:opacity-100 p-1 text-outline hover:text-error transition-all"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          )}
        </div>
        <span className="text-[10px] text-outline uppercase tracking-widest">
          {bundle.items.length} Assets Found
        </span>
      </div>

      <div className="grid gap-4">
        {bundle.items.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            bundleId={bundle.id}
            onSeek={onSeek}
          />
        ))}
        {!isLive && (
          <button
            onClick={() => onAddItem(bundle.id)}
            className="flex items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-outline-variant/10 text-outline/40 hover:border-primary/40 hover:bg-primary/[0.02] hover:text-primary transition-all group"
          >
            <PlusCircle
              size={20}
              className="group-hover:scale-110 transition-transform"
            />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">
              Add Manual Asset
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
