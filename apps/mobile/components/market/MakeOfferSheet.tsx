import { useState } from "react";
import { View, Alert } from "react-native";
import { sendOffer, setPin, startConversation } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Field,
  ItemImage,
  ScalePressable,
  Sheet,
  triggerHaptic,
} from "@/components/ui";

export interface MakeOfferTarget {
  sellerId: string;
  eventId: string;
  bundleId: string;
  itemId: string;
  itemName: string;
  imageUrl?: string | null;
  listPrice?: number | null;
}

/**
 * Contextual offer sheet for the item page. Starts (or reuses) the
 * conversation, pins the item, sends the offer, then hands back the convId.
 */
export function MakeOfferSheet({
  visible,
  target,
  onClose,
  onSent,
}: {
  visible: boolean;
  target: MakeOfferTarget;
  onClose: () => void;
  onSent: (convId: string) => void;
}) {
  const [amountText, setAmountText] = useState("");
  const [sending, setSending] = useState(false);
  const listPrice = target.listPrice;

  function pickPercent(pct: number) {
    if (!listPrice) return;
    triggerHaptic("selection");
    setAmountText(String(Math.max(1, Math.round(listPrice * (1 - pct / 100)))));
  }

  async function submit() {
    const amt = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid dollar amount.");
      return;
    }
    setSending(true);
    try {
      const res = await startConversation(target.sellerId, undefined, {
        saleEventId: target.eventId,
        bundleId: target.bundleId,
        itemId: target.itemId,
      });
      // Pin the item so the thread (and the offer card) carries context.
      // Non-fatal if it races — the offer still lands.
      await setPin(res.conversationId, {
        kind: "item",
        saleEventId: target.eventId,
        bundleId: target.bundleId,
        itemId: target.itemId,
      }).catch(() => {});
      await sendOffer(res.conversationId, amt);
      triggerHaptic("success");
      setAmountText("");
      onSent(res.conversationId);
    } catch (err) {
      triggerHaptic("error");
      Alert.alert("Offer failed", (err as Error).message);
    } finally {
      setSending(false);
    }
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Make an offer">
      {/* Item context */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          padding: 10,
          backgroundColor: colors.surfaceLow,
          borderRadius: radius.md,
          borderWidth: 1,
          borderColor: colors.outlineVariant,
        }}
      >
        <ItemImage uri={target.imageUrl} width={44} height={44} borderRadius={radius.sm} />
        <View style={{ flex: 1 }}>
          <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 14 }}>
            {target.itemName}
          </AppText>
          {listPrice != null ? (
            <AppText variant="caption" tone="muted">
              Listed at {formatAUD(listPrice)}
            </AppText>
          ) : null}
        </View>
      </View>

      {/* Quick picks */}
      {listPrice ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {[10, 20].map((pct) => (
            <ScalePressable
              key={pct}
              onPress={() => pickPercent(pct)}
              accessibilityRole="button"
              accessibilityLabel={`Offer ${pct} percent below listed price`}
              style={{
                paddingHorizontal: 14,
                height: 36,
                borderRadius: radius.full,
                backgroundColor: colors.surfaceContainer,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText weight="semibold" style={{ fontSize: 13 }}>
                −{pct}% · {formatAUD(Math.round(listPrice * (1 - pct / 100)))}
              </AppText>
            </ScalePressable>
          ))}
          <ScalePressable
            onPress={() => {
              triggerHaptic("selection");
              setAmountText("");
            }}
            accessibilityRole="button"
            accessibilityLabel="Enter a custom amount"
            style={{
              paddingHorizontal: 14,
              height: 36,
              borderRadius: radius.full,
              backgroundColor: colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AppText weight="semibold" style={{ fontSize: 13 }}>
              Custom
            </AppText>
          </ScalePressable>
        </View>
      ) : null}

      <Field
        value={amountText}
        onChangeText={setAmountText}
        placeholder="Amount (AUD)"
        keyboardType="decimal-pad"
        autoFocus
        accessibilityLabel="Offer amount in Australian dollars"
        style={{ fontFamily: fonts.semibold, fontSize: 20, paddingVertical: 12 }}
      />

      <View style={{ flexDirection: "row", gap: 10 }}>
        <Button label="Cancel" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
        <Button label="Send offer" style={{ flex: 2 }} loading={sending} haptic="light" onPress={submit} />
      </View>
    </Sheet>
  );
}
