import { useCallback, useState } from "react";
import { View, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import {
  patchItem,
  repriceItem,
  markItemSold,
  deleteItem,
  withdrawItem,
  relistItem,
  getItemImageUploadUrls,
  confirmItemImages,
  setItemImageCover,
  deleteItemImage,
} from "@myrio/api";
import type { InventoryItem } from "@myrio/types";
import { colors, radius } from "@/lib/theme";
import {
  AppText,
  Button,
  Chip,
  Field,
  ItemImage,
  PillRow,
  ScalePressable,
  SelectPill,
  Sheet,
  triggerHaptic,
} from "@/components/ui";

const PAY_METHODS = ["Cash", "Bank transfer", "PayID", "Other"];

interface ItemEditSheetProps {
  item: InventoryItem | null;
  eventId: string;
  bundleId: string | null;
  onClose: () => void;
}

export function ItemEditSheet({ item, eventId, bundleId, onClose }: ItemEditSheetProps) {
  const qc = useQueryClient();
  const [name, setName] = useState(item?.name ?? "");
  const [price, setPrice] = useState(
    String(item?.actual_listing_price ?? item?.predicted_listing_price ?? "")
  );
  const [soldPrice, setSoldPrice] = useState(String(item?.actual_listing_price ?? ""));
  const [payMethod, setPayMethod] = useState("Cash");
  const [mode, setMode] = useState<"edit" | "sold">("edit");
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [reasoning, setReasoning] = useState(item?.pricing_reasoning ?? null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["summary", eventId] });

  const patchMut = useMutation({
    mutationFn: () =>
      patchItem(eventId, bundleId!, item!.id, {
        name,
        actual_listing_price: price ? Number(price) : undefined,
      }),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Save failed", e.message),
  });

  const repriceMut = useMutation({
    mutationFn: () => repriceItem(eventId, bundleId!, item!.id),
    onSuccess: (res) => {
      setPrice(String(res.actual_listing_price));
      setReasoning(res.pricing_reasoning);
      triggerHaptic("success");
      invalidate();
    },
    onError: (e: Error) => Alert.alert("Reprice failed", e.message),
  });

  const soldMut = useMutation({
    mutationFn: () =>
      markItemSold(eventId, bundleId!, item!.id, {
        final_price: soldPrice ? Number(soldPrice) : null,
        payment_method: payMethod || null,
      }),
    onSuccess: () => {
      triggerHaptic("success");
      invalidate();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Failed", e.message),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteItem(eventId, bundleId!, item!.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Delete failed", e.message),
  });

  const withdrawMut = useMutation({
    mutationFn: () => withdrawItem(eventId, bundleId!, item!.id),
    onSuccess: () => {
      invalidate();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Withdraw failed", e.message),
  });

  const relistMut = useMutation({
    mutationFn: () => relistItem(eventId, bundleId!, item!.id),
    onSuccess: () => {
      triggerHaptic("success");
      invalidate();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Relist failed", e.message),
  });

  const coverMut = useMutation({
    mutationFn: (imageId: string) => setItemImageCover(eventId, bundleId!, item!.id, imageId),
    onSuccess: () => {
      triggerHaptic("selection");
      invalidate();
    },
    onError: (e: Error) => Alert.alert("Failed to set cover", e.message),
  });

  const deleteImageMut = useMutation({
    mutationFn: (imageId: string) => deleteItemImage(eventId, bundleId!, item!.id, imageId),
    onSuccess: invalidate,
    onError: (e: Error) => Alert.alert("Failed to remove photo", e.message),
  });

  const pickAndUploadPhoto = useCallback(async () => {
    if (!item || !bundleId) return;
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Allow photo library access to upload photos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.85,
      allowsMultipleSelection: false,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setUploadingPhoto(true);
    try {
      const filename = asset.fileName ?? `photo_${Date.now()}.jpg`;
      const contentType = asset.mimeType ?? "image/jpeg";
      const { urls } = await getItemImageUploadUrls(eventId, bundleId, item.id, [
        { filename, content_type: contentType },
      ]);
      const { upload_url, image_id, gcs_path } = urls[0];
      // RN fetch can't take a file URI as a body — round-trip through XHR blob.
      const localBlob: Blob = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.onload = () => resolve(xhr.response as Blob);
        xhr.onerror = reject;
        xhr.responseType = "blob";
        xhr.open("GET", asset.uri);
        xhr.send();
      });
      await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: localBlob,
      });
      await confirmItemImages(eventId, bundleId, item.id, [{ image_id, gcs_path }]);
      triggerHaptic("success");
      invalidate();
    } catch (err) {
      Alert.alert("Upload failed", (err as Error).message);
    } finally {
      setUploadingPhoto(false);
    }
  }, [eventId, bundleId, item]);

  if (!item || !bundleId) return null;

  const images = item.images ?? [];
  const isWithdrawn = item.sale_status === "withdrawn";
  const isSold = item.sale_status === "sold";

  return (
    <Sheet visible onClose={onClose} title={item.name} scroll>
      {/* Mode toggle */}
      {!isSold ? (
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Button
            label="Edit"
            size="sm"
            variant={mode === "edit" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => setMode("edit")}
          />
          <Button
            label="Mark sold"
            size="sm"
            variant={mode === "sold" ? "primary" : "secondary"}
            style={{ flex: 1 }}
            onPress={() => setMode("sold")}
          />
        </View>
      ) : (
        <Chip label="Sold" status="sold" />
      )}

      {mode === "edit" && !isSold ? (
        <>
          {/* Image strip: tap to set cover, add from library */}
          <View>
            <AppText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
              Photos{images.length > 0 ? " — tap to set cover" : ""}
            </AppText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {images.map((img) => (
                <View key={img.id}>
                  <ScalePressable
                    onPress={() => !img.is_cover && coverMut.mutate(img.id)}
                    accessibilityRole="imagebutton"
                    accessibilityLabel={img.is_cover ? "Cover photo" : "Set as cover photo"}
                  >
                    <ItemImage
                      uri={img.thumb_url ?? img.url}
                      width={72}
                      height={72}
                      borderRadius={radius.md}
                      recyclingKey={img.id}
                    />
                    {img.is_cover ? (
                      <View
                        style={{
                          position: "absolute",
                          bottom: 4,
                          left: 4,
                          backgroundColor: colors.clay600,
                          borderRadius: radius.sm,
                          paddingHorizontal: 5,
                          paddingVertical: 1,
                        }}
                      >
                        <AppText weight="semibold" style={{ color: colors.onPrimary, fontSize: 9, lineHeight: 13 }}>
                          COVER
                        </AppText>
                      </View>
                    ) : null}
                  </ScalePressable>
                  {images.length > 1 ? (
                    <ScalePressable
                      onPress={() =>
                        Alert.alert("Remove photo?", undefined, [
                          { text: "Cancel", style: "cancel" },
                          { text: "Remove", style: "destructive", onPress: () => deleteImageMut.mutate(img.id) },
                        ])
                      }
                      accessibilityRole="button"
                      accessibilityLabel="Remove photo"
                      style={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        backgroundColor: colors.ink800,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Ionicons name="close" size={13} color={colors.surface} />
                    </ScalePressable>
                  ) : null}
                </View>
              ))}
              <ScalePressable
                onPress={pickAndUploadPhoto}
                disabled={uploadingPhoto}
                accessibilityRole="button"
                accessibilityLabel="Add photo from library"
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: radius.md,
                  borderWidth: 1.5,
                  borderStyle: "dashed",
                  borderColor: colors.outline,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: colors.surfaceLow,
                }}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={colors.clay600} />
                ) : (
                  <Ionicons name="add" size={26} color={colors.clay600} />
                )}
              </ScalePressable>
            </ScrollView>
          </View>

          <Field label="Name" value={name} onChangeText={setName} />

          <View>
            <AppText variant="caption" tone="muted" style={{ marginBottom: 5 }}>
              Listing price (AUD)
            </AppText>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={{ flex: 1 }}>
                <Field value={price} onChangeText={setPrice} keyboardType="numeric" />
              </View>
              <Button
                label="AI reprice"
                variant="secondary"
                icon="sparkles"
                loading={repriceMut.isPending}
                onPress={() => repriceMut.mutate()}
              />
            </View>
            {reasoning ? (
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8, alignItems: "flex-start" }}>
                <Ionicons name="sparkles" size={12} color={colors.ink400} style={{ marginTop: 2 }} />
                <AppText variant="caption" tone="muted" style={{ flex: 1, fontSize: 12 }}>
                  {reasoning}
                </AppText>
              </View>
            ) : null}
          </View>

          <View style={{ flexDirection: "row", gap: 8, marginTop: 2 }}>
            <Button
              label="Save"
              style={{ flex: 1 }}
              loading={patchMut.isPending}
              onPress={() => patchMut.mutate()}
            />
            {isWithdrawn ? (
              <Button
                label="Relist"
                variant="secondary"
                loading={relistMut.isPending}
                onPress={() => relistMut.mutate()}
              />
            ) : (
              <Button
                label="Withdraw"
                variant="secondary"
                loading={withdrawMut.isPending}
                onPress={() =>
                  Alert.alert("Withdraw item?", "It will be hidden from buyers until you relist it.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Withdraw", onPress: () => withdrawMut.mutate() },
                  ])
                }
              />
            )}
            <Button
              label=""
              accessibilityLabel={`Delete ${item.name}`}
              variant="destructive"
              icon="trash-outline"
              loading={deleteMut.isPending}
              onPress={() =>
                Alert.alert("Delete item?", item.name, [
                  { text: "Cancel", style: "cancel" },
                  { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
                ])
              }
            />
          </View>
        </>
      ) : null}

      {mode === "sold" && !isSold ? (
        <>
          <Field
            label="Final price (AUD)"
            value={soldPrice}
            onChangeText={setSoldPrice}
            keyboardType="numeric"
            placeholder="e.g. 45"
          />
          <View>
            <AppText variant="caption" tone="muted" style={{ marginBottom: 6 }}>
              Payment method
            </AppText>
            <PillRow>
              {PAY_METHODS.map((m) => (
                <SelectPill key={m} label={m} selected={payMethod === m} onPress={() => setPayMethod(m)} />
              ))}
            </PillRow>
          </View>
          <Button
            label="Confirm sold"
            haptic="success"
            loading={soldMut.isPending}
            onPress={() => soldMut.mutate()}
          />
        </>
      ) : null}
    </Sheet>
  );
}
