"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteItem, patchItem, PatchItemPayload } from "@/lib/api";
import { InventoryItem } from "@/lib/types";

// Sub-components
import { CardHeader } from "./card-header";
import { CardIdentity } from "./card-identity";
import { CardPricingGrid, CardAiReasoning } from "./card-pricing-grid";
import { CardDeleteOverlay } from "./card-delete-overlay";

interface InventoryCardProps {
  item: InventoryItem;
  bundleId: string;
  onSeek: (timestamp: number) => void;
}

export function InventoryCard({ item, bundleId, onSeek }: InventoryCardProps) {
  const { eventId } = useParams() as { eventId: string };
  const queryClient = useQueryClient();
  const [showReasoning, setShowReasoning] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const mutation = useMutation({
    mutationFn: (updates: PatchItemPayload) =>
      patchItem(eventId, bundleId, item.id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteItem(eventId, bundleId, item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["summary", eventId] }),
  });

  const handleNumberInput = (field: keyof InventoryItem, value: string) => {
    const cleanValue = value.replace(/[^0-9.]/g, "").slice(0, 7);
    const numValue = parseFloat(cleanValue);
    if (!isNaN(numValue) && item[field] !== numValue) {
      mutation.mutate({ [field]: numValue } as PatchItemPayload);
    }
  };

  return (
    <div
      className={`group relative flex flex-col gap-5 rounded-2xl p-6 transition-all duration-500 border ${
        isConfirmingDelete
          ? "border-error/50 scale-[0.98]"
          : item.confidence < 0.75
            ? "bg-amber-500/[0.02] border-amber-500/10 hover:border-amber-500/30"
            : "bg-surface-container-high border-transparent hover:border-primary/10"
      } ${mutation.isPending || deleteMutation.isPending ? "opacity-70 grayscale" : "opacity-100"}`}
    >
      {isConfirmingDelete && (
        <CardDeleteOverlay
          onCancel={() => setIsConfirmingDelete(false)}
          onConfirm={() => deleteMutation.mutate()}
        />
      )}

      <div
        className={`flex flex-col gap-5 transition-all duration-500 ${isConfirmingDelete ? "blur-sm grayscale" : ""}`}
      >
        <CardHeader
          isLowConfidence={item.confidence < 0.75}
          isSyncing={mutation.isPending}
          timestampLabel={item.timestamp_label}
          onSeek={() => onSeek(item.video_timestamp)}
          onDeleteInitiate={() => setIsConfirmingDelete(true)}
        />

        <CardIdentity
          name={item.name}
          brand={item.brand}
          year={item.actual_year_of_purchase ?? item.predicted_year_of_purchase}
          onUpdate={(field, val) => mutation.mutate({ [field]: val } as PatchItemPayload)}
          onNumberUpdate={handleNumberInput}
        />

        <CardPricingGrid
          retail={item.actual_original_price ?? item.predicted_original_price ?? undefined}
          listing={item.actual_listing_price ?? item.predicted_listing_price ?? undefined}
          onRetailUpdate={(val: string) => handleNumberInput("actual_original_price", val)}
          onListingUpdate={(val: string) => handleNumberInput("actual_listing_price", val)}
          hasReasoning={!!item.pricing_reasoning}
          isReasoningOpen={showReasoning}
          onToggleReasoning={() => setShowReasoning(!showReasoning)}
        />

        {showReasoning && item.pricing_reasoning && (
          <CardAiReasoning text={item.pricing_reasoning} />
        )}
      </div>
    </div>
  );
}
