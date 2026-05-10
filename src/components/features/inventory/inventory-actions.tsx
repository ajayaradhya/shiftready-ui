"use client";

import { useState } from "react";
import { Globe, ShieldCheck, Plus, X, Check, Send, Power, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { PublishPayload } from "@/lib/api";

interface InventoryActionsProps {
  isLive: boolean;
  isAddingBundle: boolean;
  newBundleName: string;
  isPublishing: boolean;
  isUnpublishing: boolean;
  onAddBundleOpen: () => void;
  onAddBundleClose: () => void;
  onBundleNameChange: (name: string) => void;
  onBundleSubmit: () => void;
  onPublish: (payload: PublishPayload) => void;
  onUnpublish: () => void;
}

const today = new Date().toISOString().split("T")[0];

const emptyForm = (): PublishPayload => ({
  move_out_date: today,
  street_address: "",
  suburb: "",
  pincode: "",
  state: "NSW",
});

export function InventoryActions({
  isLive,
  isAddingBundle,
  newBundleName,
  isPublishing,
  isUnpublishing,
  onAddBundleOpen,
  onAddBundleClose,
  onBundleNameChange,
  onBundleSubmit,
  onPublish,
  onUnpublish,
}: InventoryActionsProps) {
  const [isConfirmingUnpublish, setIsConfirmingUnpublish] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [publishForm, setPublishForm] = useState<PublishPayload>(emptyForm);

  const setField = (field: keyof PublishPayload) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setPublishForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isFormValid =
    publishForm.street_address.trim() &&
    publishForm.suburb.trim() &&
    publishForm.pincode.trim() &&
    publishForm.move_out_date;

  const handlePublishSubmit = () => {
    if (!isFormValid) return;
    onPublish(publishForm);
    setIsPublishDialogOpen(false);
    setPublishForm(emptyForm());
  };

  return (
    <div className="flex items-center gap-4 ml-6 border-l border-outline-variant/20 pl-6">
      {/* Publish details dialog */}
      <Dialog
        open={isPublishDialogOpen}
        onOpenChange={(v) => {
          setIsPublishDialogOpen(v);
          if (!v) setPublishForm(emptyForm());
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publish Sale</DialogTitle>
            <DialogDescription>
              Buyers will see your address and move-out date on the marketplace.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                Street Address
              </label>
              <Input
                placeholder="12 Example St"
                value={publishForm.street_address}
                onChange={setField("street_address")}
              />
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Suburb
                </label>
                <Input
                  placeholder="Waterloo"
                  value={publishForm.suburb}
                  onChange={setField("suburb")}
                />
              </div>
              <div className="flex flex-col gap-1 w-28">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Postcode
                </label>
                <Input
                  placeholder="2017"
                  value={publishForm.pincode}
                  onChange={setField("pincode")}
                  maxLength={4}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <div className="flex flex-col gap-1 flex-1">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  Move-Out Date
                </label>
                <Input
                  type="date"
                  value={publishForm.move_out_date}
                  onChange={setField("move_out_date")}
                  min={today}
                />
              </div>
              <div className="flex flex-col gap-1 w-24">
                <label className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant">
                  State
                </label>
                <Input
                  placeholder="NSW"
                  value={publishForm.state}
                  onChange={setField("state")}
                  maxLength={3}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPublishDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={!isFormValid || isPublishing}
              aria-busy={isPublishing}
              onClick={handlePublishSubmit}
            >
              {isPublishing ? (
                <Loader2 className="animate-spin" size={12} aria-hidden />
              ) : (
                <Send size={12} aria-hidden />
              )}
              Publish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unpublish confirm dialog */}
      <Dialog
        open={isConfirmingUnpublish}
        onOpenChange={(v) => !v && setIsConfirmingUnpublish(false)}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Unpublish Sale?</DialogTitle>
            <DialogDescription>
              This listing will be removed from the marketplace immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsConfirmingUnpublish(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={isUnpublishing}
              aria-busy={isUnpublishing}
              onClick={() => {
                onUnpublish();
                setIsConfirmingUnpublish(false);
              }}
            >
              {isUnpublishing ? (
                <Loader2 className="animate-spin" size={12} aria-hidden />
              ) : (
                <Power size={12} aria-hidden />
              )}
              Unpublish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
          isLive
            ? "bg-tertiary/10 border-tertiary/20 text-tertiary"
            : "bg-primary/10 border-primary/20 text-primary"
        }`}
        aria-label={isLive ? "Status: Live listing" : "Status: Draft review"}
      >
        {isLive ? <Globe size={12} aria-hidden /> : <ShieldCheck size={12} aria-hidden />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isLive ? "Live Listing" : "Draft Review"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isLive ? (
          <>
            {isAddingBundle ? (
              <div
                role="group"
                aria-label="Add bundle input"
                className="flex items-center gap-2 bg-surface-container-highest rounded-md px-2 py-1 animate-in slide-in-from-right-4"
              >
                <Input
                  autoFocus
                  placeholder="Room Name..."
                  aria-label="New room name"
                  className="bg-transparent border-none h-auto p-0 text-[10px] font-black uppercase tracking-widest focus-visible:ring-0 w-32"
                  value={newBundleName}
                  onChange={(e) => onBundleNameChange(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && newBundleName && onBundleSubmit()}
                />
                <button
                  onClick={onAddBundleClose}
                  aria-label="Cancel adding bundle"
                  className="text-outline hover:text-on-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm"
                >
                  <X size={14} aria-hidden />
                </button>
                <button
                  onClick={() => newBundleName && onBundleSubmit()}
                  aria-label="Submit new bundle"
                  disabled={!newBundleName}
                  className="text-primary hover:scale-110 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm disabled:opacity-40"
                >
                  <Check size={14} aria-hidden />
                </button>
              </div>
            ) : (
              <Button variant="secondary" size="md" onClick={onAddBundleOpen}>
                <Plus size={14} aria-hidden />
                Add Bundle
              </Button>
            )}

            <Button
              variant="primary"
              size="md"
              onClick={() => setIsPublishDialogOpen(true)}
              disabled={isPublishing}
              aria-busy={isPublishing}
            >
              {isPublishing ? (
                <Loader2 className="animate-spin" size={14} aria-hidden />
              ) : (
                <Send size={14} aria-hidden />
              )}
              Publish Sale
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsConfirmingUnpublish(true)}
          >
            <Power size={14} aria-hidden />
            Unpublish
          </Button>
        )}
      </div>
    </div>
  );
}
