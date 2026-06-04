import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useRef, useCallback } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions, type CameraViewRef } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { initCaptureSale, captureFrameNative } from "@shiftready/api";
import { captureStore, type CapturedItem } from "@/lib/capture-store";

function formatAUD(v: number) {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(v);
}

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraViewRef>(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [capturing, setCapturing] = useState(false);
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [pendingItem, setPendingItem] = useState<CapturedItem | null>(null);
  const [editName, setEditName] = useState("");
  const [showPendingModal, setShowPendingModal] = useState(false);
  const eventIdRef = useRef<string | null>(null);

  const doCapture = useCallback(async () => {
    if (capturing || !cameraRef.current) return;
    setCapturing(true);
    try {
      // Take photo
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error("No photo captured");

      // Resize to max 1200px
      const img = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.85, format: SaveFormat.JPEG }
      );

      // Initialise sale on first capture
      if (!eventIdRef.current) {
        const res = await initCaptureSale();
        eventIdRef.current = res.event_id;
        captureStore.reset();
        captureStore.setEventId(res.event_id);
      }

      // Upload frame → AI identify
      const result = await captureFrameNative(eventIdRef.current, img.uri);

      const tempId = `${Date.now()}-${Math.random()}`;
      const captured: CapturedItem = {
        tempId,
        name: result.name,
        brand: result.brand ?? undefined,
        predictedOriginalPrice: result.predicted_original_price,
        gcsUri: result.gcs_uri,
        nameSource: "ai",
      };

      setPendingItem(captured);
      setEditName(result.name);
      setShowPendingModal(true);
    } catch (err) {
      Alert.alert("Capture failed", (err as Error).message);
    } finally {
      setCapturing(false);
    }
  }, [capturing]);

  const confirmPending = useCallback(() => {
    if (!pendingItem) return;
    const finalItem = { ...pendingItem, name: editName, nameSource: "user" as const };
    captureStore.addItem(finalItem);
    setItems((prev) => [...prev, finalItem]);
    setPendingItem(null);
    setShowPendingModal(false);
  }, [pendingItem, editName]);

  const discardPending = useCallback(() => {
    setPendingItem(null);
    setShowPendingModal(false);
  }, []);

  const goReview = useCallback(() => {
    if (items.length === 0) return;
    router.push("/capture/review");
  }, [items.length, router]);

  // Permission screens
  if (!permission) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size="large" color="#B5604A" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        className="flex-1 bg-surface items-center justify-center p-8"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Ionicons name="camera-outline" size={56} color="#A09683" />
        <Text className="text-lg font-bold text-on-surface mt-4 mb-2 text-center">
          Camera access needed
        </Text>
        <Text className="text-sm text-on-surface-variant text-center mb-8">
          ShiftReady uses your camera to capture items for your sale listing.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-xl px-6 py-3 mb-3 w-full items-center"
          onPress={requestPermission}
        >
          <Text className="text-on-primary font-semibold">Allow camera</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.back()}>
          <Text className="text-on-surface-variant text-sm">Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      {/* Camera */}
      <CameraView
        ref={cameraRef}
        style={{ flex: 1 }}
        facing="back"
        mode="picture"
      />

      {/* Top bar */}
      <View
        style={{
          position: "absolute",
          top: insets.top + 8,
          left: 0,
          right: 0,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => {
            if (items.length > 0) {
              Alert.alert("Leave capture?", "Your captured items will be discarded.", [
                { text: "Keep capturing", style: "cancel" },
                {
                  text: "Leave",
                  style: "destructive",
                  onPress: () => {
                    captureStore.reset();
                    router.back();
                  },
                },
              ]);
            } else {
              router.back();
            }
          }}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {items.length > 0 && (
          <View
            style={{
              backgroundColor: "rgba(0,0,0,0.55)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 8,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom controls */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom + 16,
          paddingTop: 16,
          paddingHorizontal: 24,
          backgroundColor: "rgba(0,0,0,0.6)",
        }}
      >
        {/* Captured thumbnails strip */}
        {items.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {items.map((it) => (
              <View key={it.tempId} style={{ alignItems: "center", gap: 4 }}>
                <Image
                  source={{ uri: it.gcsUri }}
                  style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: "#333" }}
                  contentFit="cover"
                />
                <Text
                  style={{ color: "#fff", fontSize: 9, maxWidth: 52 }}
                  numberOfLines={1}
                >
                  {it.name}
                </Text>
              </View>
            ))}
          </ScrollView>
        )}

        <View
          style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}
        >
          {/* Review button placeholder or spacer */}
          <View style={{ width: 72 }}>
            {items.length > 0 && (
              <TouchableOpacity onPress={goReview}>
                <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600", textAlign: "left" }}>
                  Review{"\n"}&amp; Finalize
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Shutter */}
          <TouchableOpacity
            onPress={doCapture}
            disabled={capturing}
            style={{
              width: 74,
              height: 74,
              borderRadius: 37,
              borderWidth: 4,
              borderColor: "#fff",
              backgroundColor: capturing ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {capturing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View
                style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: "#fff" }}
              />
            )}
          </TouchableOpacity>

          {/* Finalize CTA */}
          <View style={{ width: 72, alignItems: "flex-end" }}>
            {items.length > 0 && (
              <TouchableOpacity
                onPress={goReview}
                style={{
                  backgroundColor: "#B5604A",
                  borderRadius: 12,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Done →</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, textAlign: "center", marginTop: 12 }}>
          Tap shutter to identify each item
        </Text>
      </View>

      {/* Pending item modal */}
      <Modal
        visible={showPendingModal}
        transparent
        animationType="slide"
        onRequestClose={discardPending}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
          activeOpacity={1}
          onPress={discardPending}
        />
        <View
          style={{
            backgroundColor: "#FAFAF7",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            padding: 20,
            gap: 12,
          }}
        >
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1c1917" }}>
            Item identified
          </Text>

          {pendingItem && (
            <View style={{ gap: 10 }}>
              <View>
                <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>Name</Text>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  style={{
                    borderWidth: 1,
                    borderColor: "#D6C9B0",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 15,
                    color: "#1c1917",
                    backgroundColor: "#fff",
                  }}
                  autoFocus
                />
              </View>
              {pendingItem.brand && (
                <Text style={{ fontSize: 13, color: "#78716c" }}>
                  Brand: {pendingItem.brand}
                </Text>
              )}
              {pendingItem.predictedOriginalPrice != null && (
                <Text style={{ fontSize: 13, color: "#78716c" }}>
                  Est. original price: {formatAUD(pendingItem.predictedOriginalPrice)}
                </Text>
              )}
            </View>
          )}

          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              onPress={discardPending}
              style={{
                flex: 1,
                borderWidth: 1,
                borderColor: "#D6C9B0",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#78716c", fontWeight: "600" }}>Discard</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={confirmPending}
              style={{
                flex: 2,
                backgroundColor: "#B5604A",
                borderRadius: 12,
                paddingVertical: 12,
                alignItems: "center",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Add to list</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
