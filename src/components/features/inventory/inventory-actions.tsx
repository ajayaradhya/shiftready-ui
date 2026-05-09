"use client";

import { useState } from "react";
import {
  Globe, ShieldCheck, Plus, X, Check, Send, Power, Loader2,
} from "lucide-react";

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
  onPublish: () => void;
  onUnpublish: () => void;
}

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

  return (
    <div className="flex items-center gap-4 ml-6 border-l border-outline-variant/20 pl-6">
      <div
        className={`flex items-center gap-2 px-3 py-1 rounded-full border ${
          isLive
            ? "bg-tertiary/10 border-tertiary/20 text-tertiary"
            : "bg-primary/10 border-primary/20 text-primary"
        }`}
      >
        {isLive ? <Globe size={12} /> : <ShieldCheck size={12} />}
        <span className="text-[10px] font-black uppercase tracking-widest">
          {isLive ? "Live Listing" : "Draft Review"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        {!isLive ? (
          <>
            {isAddingBundle ? (
              <div className="flex items-center gap-2 bg-surface-container-highest rounded-md px-2 py-1 animate-in slide-in-from-right-4">
                <input
                  autoFocus
                  placeholder="Room Name..."
                  className="bg-transparent border-none text-[10px] font-black uppercase tracking-widest outline-none w-32"
                  value={newBundleName}
                  onChange={(e) => onBundleNameChange(e.target.value)}
                  onKeyDown={(e) =>
                    e.key === "Enter" && newBundleName && onBundleSubmit()
                  }
                />
                <button
                  onClick={onAddBundleClose}
                  className="text-outline hover:text-on-surface"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={() => newBundleName && onBundleSubmit()}
                  className="text-primary hover:scale-110 transition-transform"
                >
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={onAddBundleOpen}
                className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-primary/10 hover:text-primary rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Plus size={14} /> Add Bundle
              </button>
            )}

            <button
              onClick={onPublish}
              disabled={isPublishing}
              className="flex items-center gap-2 px-4 py-1.5 bg-primary text-surface hover:opacity-90 rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
            >
              {isPublishing ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                <Send size={14} />
              )}
              Publish Sale
            </button>
          </>
        ) : (
          <div className="flex items-center gap-1">
            {isConfirmingUnpublish ? (
              <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                <button
                  onClick={() => setIsConfirmingUnpublish(false)}
                  className="p-1.5 text-outline"
                >
                  <X size={14} />
                </button>
                <button
                  onClick={() => {
                    onUnpublish();
                    setIsConfirmingUnpublish(false);
                  }}
                  disabled={isUnpublishing}
                  className="px-4 py-1.5 bg-error text-white rounded-md text-[10px] font-black uppercase tracking-widest shadow-lg shadow-error/20"
                >
                  Confirm Unpublish
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsConfirmingUnpublish(true)}
                className="flex items-center gap-2 px-4 py-1.5 bg-surface-container-highest hover:bg-error/10 hover:text-error rounded-md text-[10px] font-black uppercase tracking-widest transition-all"
              >
                <Power size={14} /> Unpublish
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
