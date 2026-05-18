"use client";

import { useState } from "react";
import { MoreHorizontal, Archive, Trash2, RefreshCw, Loader2 } from "lucide-react";
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
  isArchiving: boolean;
  isDeleting: boolean;
  isRepublishing: boolean;
  onArchive: () => void;
  onDelete: () => void;
  onRepublish: () => void;
}

export function SaleLifecycleMenu({
  status,
  isArchiving,
  isDeleting,
  isRepublishing,
  onArchive,
  onDelete,
  onRepublish,
}: SaleLifecycleMenuProps) {
  const [confirmArchive, setConfirmArchive] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const canRepublish = status === "ready_for_review";
  const canArchive = !["processing", "pricing_in_progress", "archived"].includes(status);
  const canDelete = ["pending_upload", "failed"].includes(status);
  const isBusy = isArchiving || isDeleting || isRepublishing;

  if (!canRepublish && !canArchive && !canDelete) return null;

  return (
    <>
      {/* Archive confirm */}
      <Dialog open={confirmArchive} onOpenChange={(v) => !isArchiving && setConfirmArchive(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this sale?</DialogTitle>
            <DialogDescription>
              The listing will be removed from the marketplace and marked as archived. You can still view it but not edit it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setConfirmArchive(false)} disabled={isArchiving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={isArchiving}
              aria-busy={isArchiving}
              onClick={() => { onArchive(); setConfirmArchive(false); }}
            >
              {isArchiving ? <Loader2 className="animate-spin" size={12} aria-hidden /> : <Archive size={12} aria-hidden />}
              Archive
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
          {canRepublish && (canArchive || canDelete) && <DropdownMenuSeparator />}
          {canArchive && (
            <DropdownMenuItem onClick={() => setConfirmArchive(true)}>
              <Archive size={14} className="opacity-70" />
              Archive sale
            </DropdownMenuItem>
          )}
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
