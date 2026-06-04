"use client";

import { Trash2, RotateCcw } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface CardDeleteOverlayProps {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  itemName?: string;
}

export function CardDeleteOverlay({ open, onCancel, onConfirm, itemName }: CardDeleteOverlayProps) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Permanent Removal?</DialogTitle>
          <DialogDescription>
            {itemName
              ? `"${itemName}" will be permanently deleted and cannot be recovered.`
              : "This item will be permanently deleted and cannot be recovered."}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" size="md" onClick={onCancel}>
            <RotateCcw size={12} aria-hidden />
            Cancel
          </Button>
          <Button variant="destructive" size="md" onClick={onConfirm}>
            <Trash2 size={12} aria-hidden />
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
