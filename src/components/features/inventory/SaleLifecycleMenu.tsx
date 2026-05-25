"use client";

import { useState } from "react";
import { MoreHorizontal, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface SaleLifecycleMenuProps {
  status: string;
  isLive: boolean;
  isDeleting: boolean;
  isRepublishing: boolean;
  onDelete: () => void;
  onRepublish: () => void;
}

export function SaleLifecycleMenu({
  status,
  isDeleting,
  isRepublishing,
  onDelete,
  onRepublish,
}: SaleLifecycleMenuProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canRepublish = status === "ready_for_review";
  const canDelete = ["pending_upload", "failed"].includes(status);
  const isBusy = isDeleting || isRepublishing;

  if (!canRepublish && !canDelete) return null;

  return (
    <>
      {/* Delete confirm */}
      <Dialog open={confirmDelete} onOpenChange={(v) => !isDeleting && setConfirmDelete(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Permanently delete this sale?</DialogTitle>
            <DialogDescription>
              This will permanently delete the sale and all its data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={isDeleting}
              aria-busy={isDeleting}
              onClick={() => { onDelete(); setConfirmDelete(false); }}
            >
              {isDeleting ? <Loader2 className="animate-spin" size={12} aria-hidden /> : <Trash2 size={12} aria-hidden />}
              Delete permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="md" disabled={isBusy} aria-label="Sale settings">
            {isBusy ? (
              <Loader2 className="animate-spin" size={14} aria-hidden />
            ) : (
              <MoreHorizontal size={14} aria-hidden />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {canRepublish && (
            <DropdownMenuItem onClick={onRepublish} disabled={isRepublishing}>
              <RefreshCw size={14} className="opacity-70" />
              Republish
            </DropdownMenuItem>
          )}
          {canRepublish && canDelete && <DropdownMenuSeparator />}
          {canDelete && (
            <DropdownMenuItem
              onClick={() => setConfirmDelete(true)}
              className="text-[var(--rust-600)] focus:text-[var(--rust-600)]"
            >
              <Trash2 size={14} />
              Delete permanently
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
