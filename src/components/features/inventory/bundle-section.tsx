"use client";

import { useRef, useState } from "react";
import { Trash2, PlusCircle, Pencil, Check, X } from "lucide-react";
import { InventoryCard } from "./inventory-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { RoomBundle } from "@/lib/types";

interface BundleSectionProps {
  bundle: RoomBundle;
  allBundles: RoomBundle[];
  isLive: boolean;
  onDeleteBundle: (bundleId: string) => void;
  onRenameBundle: (bundleId: string, name: string) => void;
  onAddItem: (bundleId: string) => void;
  onSeek: (seconds: number) => void;
}

export function BundleSection({
  bundle,
  allBundles,
  isLive,
  onDeleteBundle,
  onRenameBundle,
  onAddItem,
  onSeek,
}: BundleSectionProps) {
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(bundle.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  function startRename() {
    setRenameValue(bundle.name);
    setIsRenaming(true);
    setTimeout(() => renameInputRef.current?.select(), 0);
  }

  function commitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== bundle.name) {
      onRenameBundle(bundle.id, trimmed);
    }
    setIsRenaming(false);
  }

  function cancelRename() {
    setRenameValue(bundle.name);
    setIsRenaming(false);
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Dialog open={isConfirmingDelete} onOpenChange={(v) => !v && setIsConfirmingDelete(false)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Room?</DialogTitle>
            <DialogDescription>
              &ldquo;{bundle.name}&rdquo; and all its items will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onDeleteBundle(bundle.id);
                setIsConfirmingDelete(false);
              }}
            >
              <Trash2 size={12} aria-hidden />
              Delete Room
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex items-end justify-between border-b border-outline-variant/10 pb-2 group/bundle">
        <div className="flex items-center gap-2">
          {isRenaming ? (
            <div className="flex items-center gap-1">
              <input
                ref={renameInputRef}
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") cancelRename();
                }}
                maxLength={80}
                autoFocus
                className="text-xl font-medium text-on-surface bg-transparent border-b border-primary outline-none w-auto min-w-[120px]"
                style={{ width: `${Math.max(renameValue.length, 8)}ch` }}
              />
              <button
                onClick={commitRename}
                aria-label="Confirm rename"
                className="p-1 text-moss-600 hover:text-moss-700 transition-colors"
              >
                <Check size={14} />
              </button>
              <button
                onClick={cancelRename}
                aria-label="Cancel rename"
                className="p-1 text-outline hover:text-on-surface transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-xl font-medium text-on-surface">{bundle.name}</h3>
              <button
                  onClick={startRename}
                  aria-label={`Rename room ${bundle.name}`}
                  className="opacity-0 group-hover/bundle:opacity-100 p-1 text-outline hover:text-on-surface transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:opacity-100"
                >
                  <Pencil size={12} aria-hidden />
                </button>
              <button
                  onClick={() => setIsConfirmingDelete(true)}
                  aria-label={`Delete room ${bundle.name}`}
                  className="opacity-0 group-hover/bundle:opacity-100 p-1 text-outline hover:text-error transition-all rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error/50 focus-visible:opacity-100"
                >
                  <Trash2 size={14} aria-hidden />
                </button>
            </>
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
            allBundles={allBundles}
            onSeek={onSeek}
          />
        ))}
        <button
            onClick={() => onAddItem(bundle.id)}
            aria-label={`Add item to ${bundle.name}`}
            className="flex items-center justify-center gap-3 py-8 rounded-xl border-2 border-dashed border-outline-variant/10 text-outline/40 hover:border-primary/40 hover:bg-primary/[0.02] hover:text-primary transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            <PlusCircle size={20} className="group-hover:scale-110 transition-transform" aria-hidden />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Add Manual Asset</span>
          </button>
      </div>
    </div>
  );
}
