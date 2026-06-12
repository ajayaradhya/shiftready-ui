import { useState } from "react";
import { View, Alert, Modal, Share, Platform } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeIn, ZoomIn } from "@/lib/reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { publishSale, type PublishPayload } from "@myrio/api";
import { colors, radius } from "@/lib/theme";
import { AppText, Button, Field, Sheet, triggerHaptic } from "@/components/ui";

const WEB_BASE = "https://myrio.com.au";

export function PublishSheet({
  visible,
  eventId,
  saleTitle,
  onClose,
}: {
  visible: boolean;
  eventId: string;
  saleTitle: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [moveOutDate, setMoveOutDate] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [pincode, setPincode] = useState("");
  const [published, setPublished] = useState(false);

  const publishMut = useMutation({
    mutationFn: () =>
      publishSale(eventId, {
        move_out_date: moveOutDate,
        street_address: streetAddress,
        suburb,
        pincode,
        state: "NSW",
      } as PublishPayload),
    onSuccess: () => {
      triggerHaptic("success");
      qc.invalidateQueries({ queryKey: ["summary", eventId] });
      qc.invalidateQueries({ queryKey: ["sales"] });
      setPublished(true);
    },
    onError: (e: Error) => Alert.alert("Publish failed", e.message),
  });

  const insets = useSafeAreaInsets();
  const canSubmit = !!moveOutDate && !!suburb && !!pincode;

  async function shareSale() {
    const url = `${WEB_BASE}/sale/${eventId}`;
    try {
      await Share.share(
        Platform.OS === "ios"
          ? { message: `${saleTitle} — everything must go!`, url }
          : { message: `${saleTitle} — everything must go! ${url}` }
      );
    } catch {
      // user dismissed
    }
  }

  function finish() {
    setPublished(false);
    onClose();
  }

  // Full-screen success moment after publish
  if (published) {
    return (
      <Modal visible transparent={false} animationType="fade" onRequestClose={finish}>
        <View
          style={{
            flex: 1,
            backgroundColor: colors.surface,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
            paddingBottom: insets.bottom + 16,
          }}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(12)}
            style={{
              width: 112,
              height: 112,
              borderRadius: 56,
              backgroundColor: colors.successContainer,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Ionicons name="checkmark" size={64} color={colors.success} />
          </Animated.View>
          <Animated.View entering={FadeIn.delay(150)} style={{ alignItems: "center", gap: 8 }}>
            <AppText variant="title" style={{ textAlign: "center" }}>
              Your sale is live!
            </AppText>
            <AppText tone="muted" style={{ textAlign: "center", maxWidth: 300 }}>
              {saleTitle} is now on the marketplace. Buyers nearby can browse, save, and make
              offers.
            </AppText>
          </Animated.View>
          <Animated.View
            entering={FadeIn.delay(300)}
            style={{ alignSelf: "stretch", gap: 10, marginTop: 36 }}
          >
            <Button label="View live sale" size="lg" block onPress={finish} />
            <Button label="Share" icon="share-outline" variant="secondary" block onPress={shareSale} />
          </Animated.View>
        </View>
      </Modal>
    );
  }

  return (
    <Sheet visible={visible} onClose={onClose} title="Publish sale" scroll>
      <Field
        label="Move-out date (YYYY-MM-DD)"
        value={moveOutDate}
        onChangeText={setMoveOutDate}
        placeholder="2026-07-15"
      />
      <Field
        label="Street address"
        value={streetAddress}
        onChangeText={setStreetAddress}
        placeholder="12 Example St"
        hint="Never shown publicly — only the suburb is."
      />
      <Field label="Suburb" value={suburb} onChangeText={setSuburb} placeholder="Surry Hills" />
      <Field
        label="Postcode"
        value={pincode}
        onChangeText={setPincode}
        placeholder="2010"
        keyboardType="numeric"
      />
      <Button
        label="Publish to marketplace"
        size="lg"
        disabled={!canSubmit}
        loading={publishMut.isPending}
        haptic="light"
        onPress={() => publishMut.mutate()}
      />
      <View style={{ height: radius.sm }} />
    </Sheet>
  );
}
