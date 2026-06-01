"use client";

import { useState } from "react";
import { Globe, ShieldCheck, Send, Power, Loader2, Archive } from "lucide-react";
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
  status: string;
  isLive: boolean;
  isPublishing: boolean;
  isUnpublishing: boolean;
  isArchiving: boolean;
  emailVerified?: boolean;
  uncategorisedCount?: number;
  onPublish: (payload: PublishPayload) => void;
  onUnpublish: () => void;
  onArchive: () => void;
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
  status,
  isLive,
  isPublishing,
  isUnpublishing,
  isArchiving,
  emailVerified = true,
  uncategorisedCount = 0,
  onPublish,
  onUnpublish,
  onArchive,
}: InventoryActionsProps) {
  const [isConfirmingUnpublish, setIsConfirmingUnpublish] = useState(false);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);

  const canArchive = !["processing", "pricing_in_progress", "archived"].includes(status);
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
          <p className="text-[10px] text-on-surface-variant/60 leading-relaxed -mt-1">
            Peer-to-peer sales are typically GST-free. Sellers are responsible for any applicable tax obligations.
          </p>
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

      {/* Archive confirm dialog */}
      <Dialog open={isConfirmingArchive} onOpenChange={(v) => !isArchiving && setIsConfirmingArchive(v)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Archive this sale?</DialogTitle>
            <DialogDescription>
              The listing will be removed from the marketplace and marked as archived. You can still view it but not edit it.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="md" onClick={() => setIsConfirmingArchive(false)} disabled={isArchiving}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              size="md"
              disabled={isArchiving}
              aria-busy={isArchiving}
              onClick={() => { onArchive(); setIsConfirmingArchive(false); }}
            >
              {isArchiving ? <Loader2 className="animate-spin" size={12} aria-hidden /> : <Archive size={12} aria-hidden />}
              Archive
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
        {canArchive && (
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsConfirmingArchive(true)}
            disabled={isArchiving}
            aria-busy={isArchiving}
          >
            {isArchiving ? (
              <Loader2 className="animate-spin" size={14} aria-hidden />
            ) : (
              <Archive size={14} aria-hidden />
            )}
            Archive Sale
          </Button>
        )}
        {!isLive ? (
          <Button
            variant="primary"
            size="md"
            onClick={() => setIsPublishDialogOpen(true)}
            disabled={isPublishing || !emailVerified || uncategorisedCount > 0}
            aria-busy={isPublishing}
            title={
              !emailVerified
                ? "Verify your email to publish"
                : uncategorisedCount > 0
                  ? `${uncategorisedCount} item${uncategorisedCount > 1 ? "s" : ""} missing a category — set in inventory before publishing`
                  : undefined
            }
          >
            {isPublishing ? (
              <Loader2 className="animate-spin" size={14} aria-hidden />
            ) : (
              <Send size={14} aria-hidden />
            )}
            Publish Sale
          </Button>
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
