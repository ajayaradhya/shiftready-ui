import {
  View,
  FlatList,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import { Swipeable } from "react-native-gesture-handler";
import { finalizeCaptureV2 } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { captureStore, type CapturedItem } from "@/lib/capture-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeOutDown } from "@/lib/reanimated";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  EmptyState,
  ScalePressable,
  StackHeader,
  triggerHaptic,
} from "@/components/ui";

interface PendingRemoval {
  item: CapturedItem;
  index: number;
}

export default function CaptureReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [finalizing, setFinalizing] = useState(false);
  const [pendingRemoval, setPendingRemoval] = useState<PendingRemoval | null>(null);
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(captureStore.getItems());
  }, []);

  const estValue = items.reduce((sum, it) => sum + (it.predictedOriginalPrice ?? 0), 0);

  const saveName = (tempId: string) => {
    captureStore.updateItem(tempId, { name: editName, nameSource: "user" });
    setItems(captureStore.getItems());
    setEditingId(null);
  };

  const removeItem = useCallback((item: CapturedItem, index: number) => {
    triggerHaptic("light");
    setItems((prev) => prev.filter((it) => it.tempId !== item.tempId));
    if (undoTimer.current) clearTimeout(undoTimer.current);
    setPendingRemoval({ item, index });
    undoTimer.current = setTimeout(() => {
      captureStore.removeItem(item.tempId);
      setPendingRemoval(null);
    }, 3500);
  }, []);

  const undoRemoval = useCallback(() => {
    if (!pendingRemoval) return;
    if (undoTimer.current) clearTimeout(undoTimer.current);
    triggerHaptic("selection");
    setItems((prev) => {
      const next = [...prev];
      next.splice(pendingRemoval.index, 0, pendingRemoval.item);
      return next;
    });
    setPendingRemoval(null);
  }, [pendingRemoval]);

  const finalize = async () => {
    const eventId = captureStore.getEventId();
    if (!eventId || items.length === 0) return;
    // Flush any pending removal
    if (undoTimer.current) clearTimeout(undoTimer.current);
    if (pendingRemoval) {
      captureStore.removeItem(pendingRemoval.item.tempId);
      setPendingRemoval(null);
    }

    setFinalizing(true);
    try {
      const payload = items.map((it) => ({
        temp_id: it.tempId,
        name: it.name,
        brand: it.brand,
        predicted_original_price: it.predictedOriginalPrice,
        gcs_uri: it.gcsUri,
        needs_review: it.nameSource === "ai",
        name_source: it.nameSource ?? "ai",
      }));

      await finalizeCaptureV2(eventId, payload);
      triggerHaptic("success");
      captureStore.reset();
      router.replace(`/seller/inventory/${eventId}`);
    } catch (err) {
      triggerHaptic("error");
      Alert.alert("Finalise failed", (err as Error).message);
      setFinalizing(false);
    }
  };

  if (items.length === 0 && !pendingRemoval) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <StackHeader title="Review items" />
        <EmptyState
          icon="camera-outline"
          title="No items captured"
          body="Go back to the camera and snap your first item."
          ctaLabel="Back to camera"
          onCtaPress={() => router.back()}
        />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <StackHeader
          title={`Review items (${items.length})`}
          right={
            estValue > 0 ? (
              <View style={{ alignItems: "flex-end", justifyContent: "center" }}>
                <AppText variant="micro" tone="faint">
                  Est. RRP
                </AppText>
                <AppText weight="bold" style={{ fontSize: 14, color: colors.clay600 }}>
                  ~{formatAUD(estValue)}
                </AppText>
              </View>
            ) : undefined
          }
        />

        <FlatList
          data={items}
          keyExtractor={(it) => it.tempId}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item, index }) => (
            <Swipeable
              renderRightActions={() => (
                <ScalePressable
                  onPress={() => removeItem(item, index)}
                  accessibilityRole="button"
                  accessibilityLabel={`Delete ${item.name}`}
                  style={{
                    width: 72,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.error,
                    borderRadius: radius.lg,
                    marginLeft: 8,
                  }}
                >
                  <Ionicons name="trash" size={20} color="#fff" />
                </ScalePressable>
              )}
              overshootRight={false}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  padding: 12,
                  gap: 12,
                  backgroundColor: colors.surfaceLow,
                  borderRadius: radius.lg,
                  borderWidth: 1,
                  borderColor: colors.outlineVariant,
                }}
              >
                <Image
                  source={{ uri: item.localUri ?? undefined }}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: radius.md,
                    backgroundColor: colors.surfaceHigh,
                  }}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  {editingId === item.tempId ? (
                    <TextInput
                      value={editName}
                      onChangeText={setEditName}
                      onBlur={() => saveName(item.tempId)}
                      onSubmitEditing={() => saveName(item.tempId)}
                      autoFocus
                      accessibilityLabel="Edit item name"
                      style={{
                        fontFamily: fonts.semibold,
                        fontSize: 14.5,
                        color: colors.onSurface,
                        borderBottomWidth: 1.5,
                        borderBottomColor: colors.clay600,
                        paddingBottom: 2,
                      }}
                    />
                  ) : (
                    <ScalePressable
                      onPress={() => {
                        setEditingId(item.tempId);
                        setEditName(item.name);
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit name: ${item.name}`}
                      style={{ flexDirection: "row", alignItems: "center", gap: 5 }}
                    >
                      <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 14.5, flexShrink: 1 }}>
                        {item.name}
                      </AppText>
                      <Ionicons name="pencil-outline" size={13} color={colors.outline} />
                    </ScalePressable>
                  )}
                  {item.brand || item.predictedOriginalPrice != null ? (
                    <AppText variant="caption" tone="muted" numberOfLines={1} style={{ marginTop: 2 }}>
                      {[
                        item.brand,
                        item.predictedOriginalPrice != null
                          ? `~${formatAUD(item.predictedOriginalPrice)} RRP`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </AppText>
                  ) : null}
                </View>
              </View>
            </Swipeable>
          )}
          ListFooterComponent={<View style={{ height: 110 }} />}
        />

        {/* Undo snackbar */}
        {pendingRemoval ? (
          <Animated.View
            entering={FadeInDown.duration(200)}
            exiting={FadeOutDown.duration(150)}
            style={{
              position: "absolute",
              bottom: Math.max(insets.bottom, 12) + 80,
              left: 16,
              right: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: colors.ink800,
              borderRadius: radius.lg,
              paddingHorizontal: 16,
              paddingVertical: 13,
            }}
          >
            <AppText style={{ color: colors.surface, fontSize: 14 }} numberOfLines={1}>
              "{pendingRemoval.item.name}" removed
            </AppText>
            <ScalePressable
              onPress={undoRemoval}
              accessibilityRole="button"
              accessibilityLabel="Undo remove"
              style={{ paddingHorizontal: 8, paddingVertical: 4 }}
            >
              <AppText weight="bold" style={{ color: colors.clay200, fontSize: 14 }}>
                Undo
              </AppText>
            </ScalePressable>
          </Animated.View>
        ) : null}

        {/* Sticky finalize bar */}
        <View
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant,
          }}
        >
          <Button
            label={
              finalizing
                ? "Processing…"
                : `List ${items.length} item${items.length !== 1 ? "s" : ""} →`
            }
            icon={finalizing ? undefined : "sparkles"}
            size="lg"
            block
            loading={finalizing}
            haptic="light"
            onPress={finalize}
          />
          <AppText variant="caption" tone="faint" style={{ textAlign: "center", marginTop: 8 }}>
            AI groups them into room bundles and prices everything
          </AppText>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
