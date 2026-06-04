import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Image } from "expo-image";
import { useState, useEffect } from "react";
import { useRouter } from "expo-router";
import { finalizeCaptureV2 } from "@shiftready/api";
import { captureStore, type CapturedItem } from "@/lib/capture-store";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const fmtAUD = (v: number | undefined) =>
  v == null
    ? ""
    : new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(v);

export default function CaptureReviewScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [finalizing, setFinalizing] = useState(false);

  useEffect(() => {
    setItems(captureStore.getItems());
  }, []);

  const saveName = (tempId: string) => {
    captureStore.updateItem(tempId, { name: editName, nameSource: "user" });
    setItems(captureStore.getItems());
    setEditingId(null);
  };

  const removeItem = (tempId: string) => {
    captureStore.removeItem(tempId);
    setItems(captureStore.getItems());
  };

  const finalize = async () => {
    const eventId = captureStore.getEventId();
    if (!eventId || items.length === 0) return;

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
      captureStore.reset();
      router.replace(`/seller/inventory/${eventId}`);
    } catch (err) {
      Alert.alert("Finalise failed", (err as Error).message);
      setFinalizing(false);
    }
  };

  if (items.length === 0) {
    return (
      <View
        className="flex-1 bg-surface items-center justify-center p-8"
        style={{ paddingTop: insets.top }}
      >
        <Text className="text-base text-on-surface-variant">No items captured.</Text>
        <TouchableOpacity className="mt-4" onPress={() => router.back()}>
          <Text className="text-primary font-medium">← Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
        {/* Header */}
        <View className="px-4 pt-3 pb-3 border-b border-outline-variant flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color="#1c1917" />
          </TouchableOpacity>
          <Text className="text-lg font-bold text-on-surface flex-1">
            Review items ({items.length})
          </Text>
        </View>

        <FlatList
          data={items}
          keyExtractor={(it) => it.tempId}
          renderItem={({ item }) => (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F0E9DA",
                backgroundColor: "#FAFAF7",
                gap: 12,
              }}
            >
              <Image
                source={{ uri: item.gcsUri }}
                style={{ width: 56, height: 56, borderRadius: 10, backgroundColor: "#EDE8DC" }}
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
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: "#1c1917",
                      borderBottomWidth: 1.5,
                      borderBottomColor: "#B5604A",
                      paddingBottom: 2,
                    }}
                  />
                ) : (
                  <TouchableOpacity
                    onPress={() => {
                      setEditingId(item.tempId);
                      setEditName(item.name);
                    }}
                    style={{ flexDirection: "row", alignItems: "center", gap: 4 }}
                  >
                    <Text
                      style={{ fontSize: 14, fontWeight: "600", color: "#1c1917" }}
                      numberOfLines={1}
                    >
                      {item.name}
                    </Text>
                    <Ionicons name="pencil-outline" size={13} color="#A09683" />
                  </TouchableOpacity>
                )}
                {item.brand && (
                  <Text style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                    {item.brand}
                  </Text>
                )}
                {item.predictedOriginalPrice != null && (
                  <Text style={{ fontSize: 12, color: "#78716c" }}>
                    ~{fmtAUD(item.predictedOriginalPrice)} orig.
                  </Text>
                )}
              </View>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Remove item?", item.name, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Remove", style: "destructive", onPress: () => removeItem(item.tempId) },
                  ])
                }
                style={{ padding: 6 }}
              >
                <Ionicons name="trash-outline" size={18} color="#A09683" />
              </TouchableOpacity>
            </View>
          )}
          ListFooterComponent={<View style={{ height: 120 }} />}
        />

        {/* Finalize CTA */}
        <View
          style={{
            position: "absolute",
            bottom: insets.bottom + 12,
            left: 16,
            right: 16,
          }}
        >
          <TouchableOpacity
            onPress={finalize}
            disabled={finalizing || items.length === 0}
            style={{
              backgroundColor: finalizing ? "#D6C9B0" : "#B5604A",
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: "center",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.15,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            {finalizing ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                <ActivityIndicator size="small" color="#fff" />
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                  Processing…
                </Text>
              </View>
            ) : (
              <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>
                Finalise {items.length} item{items.length !== 1 ? "s" : ""} →
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
