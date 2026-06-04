import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from "react-native";
import { useState, useCallback } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getSummary,
  patchItem,
  repriceItem,
  publishSale,
  unpublishSale,
  archiveSale,
  markItemSold,
  deleteItem,
  type PublishPayload,
} from "@shiftready/api";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import type { SaleSummary, InventoryItem, RoomBundle, SaleStatus } from "@shiftready/types";

const STATUS_LABEL: Partial<Record<SaleStatus, string>> = {
  pending_upload: "Pending",
  processing: "Processing…",
  ready_for_review: "Ready to publish",
  pricing_in_progress: "Pricing…",
  live: "Live",
  partially_sold: "Partially sold",
  sold: "Sold",
  failed: "Failed",
  archived: "Archived",
  expired: "Expired",
};

const STATUS_BG: Partial<Record<SaleStatus, string>> = {
  processing: "#fef3c7",
  pricing_in_progress: "#fef3c7",
  ready_for_review: "#fef3c7",
  live: "#dcfce7",
  partially_sold: "#dbeafe",
  sold: "#f3e8ff",
  failed: "#fee2e2",
  archived: "#f5f5f4",
};

const STATUS_FG: Partial<Record<SaleStatus, string>> = {
  processing: "#92400e",
  pricing_in_progress: "#92400e",
  ready_for_review: "#b45309",
  live: "#166534",
  partially_sold: "#1e40af",
  sold: "#6b21a8",
  failed: "#991b1b",
  archived: "#57534e",
};

const ITEM_STATUS_STYLE: Record<string, { bg: string; fg: string }> = {
  available: { bg: "#dcfce7", fg: "#166534" },
  reserved:  { bg: "#fef3c7", fg: "#92400e" },
  sold:      { bg: "#f3e8ff", fg: "#6b21a8" },
  withdrawn: { bg: "#f5f5f4", fg: "#57534e" },
};

const fmtAUD = (v: number | null | undefined) =>
  v == null
    ? "—"
    : new Intl.NumberFormat("en-AU", {
        style: "currency",
        currency: "AUD",
        maximumFractionDigits: 0,
      }).format(v);

// --- Item Edit Sheet ---
interface EditSheetProps {
  item: InventoryItem;
  eventId: string;
  bundleId: string;
  onClose: () => void;
  onUpdated: () => void;
}

function ItemEditSheet({ item, eventId, bundleId, onClose, onUpdated }: EditSheetProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.actual_listing_price ?? item.predicted_listing_price ?? ""));
  const [soldPrice, setSoldPrice] = useState(String(item.actual_listing_price ?? ""));
  const [payMethod, setPayMethod] = useState("Cash");
  const [mode, setMode] = useState<"edit" | "sold">("edit");

  const patchMut = useMutation({
    mutationFn: () =>
      patchItem(eventId, bundleId, item.id, {
        name,
        actual_listing_price: price ? Number(price) : undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      onUpdated();
      onClose();
    },
  });

  const repriceMut = useMutation({
    mutationFn: () => repriceItem(eventId, bundleId, item.id),
    onSuccess: (res) => {
      setPrice(String(res.actual_listing_price));
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
    },
  });

  const soldMut = useMutation({
    mutationFn: () =>
      markItemSold(eventId, bundleId, item.id, {
        final_price: soldPrice ? Number(soldPrice) : null,
        payment_method: payMethod || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      onUpdated();
      onClose();
    },
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteItem(eventId, bundleId, item.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      onUpdated();
      onClose();
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, justifyContent: "flex-end" }}
    >
      <View
        style={{
          backgroundColor: "#FAFAF7",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          gap: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#1c1917", flex: 1 }} numberOfLines={1}>
            {item.name}
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#A09683" />
          </TouchableOpacity>
        </View>

        {/* Mode toggle */}
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity
            onPress={() => setMode("edit")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: mode === "edit" ? "#B5604A" : "#EDE8DC",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 13, color: mode === "edit" ? "#fff" : "#57534e" }}>
              Edit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setMode("sold")}
            style={{
              flex: 1,
              paddingVertical: 8,
              borderRadius: 10,
              backgroundColor: mode === "sold" ? "#6b21a8" : "#EDE8DC",
              alignItems: "center",
            }}
          >
            <Text style={{ fontWeight: "600", fontSize: 13, color: mode === "sold" ? "#fff" : "#57534e" }}>
              Mark Sold
            </Text>
          </TouchableOpacity>
        </View>

        {mode === "edit" && (
          <>
            <View>
              <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>Name</Text>
              <TextInput
                value={name}
                onChangeText={setName}
                style={{
                  borderWidth: 1,
                  borderColor: "#D6C9B0",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: "#1c1917",
                  backgroundColor: "#fff",
                }}
              />
            </View>

            <View>
              <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>
                Listing price (AUD)
              </Text>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <TextInput
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="numeric"
                  style={{
                    flex: 1,
                    borderWidth: 1,
                    borderColor: "#D6C9B0",
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontSize: 14,
                    color: "#1c1917",
                    backgroundColor: "#fff",
                  }}
                />
                <TouchableOpacity
                  onPress={() => repriceMut.mutate()}
                  disabled={repriceMut.isPending}
                  style={{
                    paddingHorizontal: 14,
                    justifyContent: "center",
                    backgroundColor: "#EDE8DC",
                    borderRadius: 10,
                  }}
                >
                  {repriceMut.isPending ? (
                    <ActivityIndicator size="small" color="#B5604A" />
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: "600", color: "#B5604A" }}>
                      AI Reprice
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8, marginTop: 4 }}>
              <TouchableOpacity
                onPress={() => patchMut.mutate()}
                disabled={patchMut.isPending}
                style={{
                  flex: 1,
                  backgroundColor: "#B5604A",
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                {patchMut.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Delete item?", item.name, [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: () => deleteMut.mutate() },
                  ])
                }
                style={{
                  paddingHorizontal: 16,
                  backgroundColor: "#fee2e2",
                  borderRadius: 12,
                  paddingVertical: 13,
                  alignItems: "center",
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#991b1b" />
              </TouchableOpacity>
            </View>
          </>
        )}

        {mode === "sold" && (
          <>
            <View>
              <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>
                Final price (AUD)
              </Text>
              <TextInput
                value={soldPrice}
                onChangeText={setSoldPrice}
                keyboardType="numeric"
                placeholder="e.g. 45"
                placeholderTextColor="#A09683"
                style={{
                  borderWidth: 1,
                  borderColor: "#D6C9B0",
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  fontSize: 14,
                  color: "#1c1917",
                  backgroundColor: "#fff",
                }}
              />
            </View>
            <View>
              <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>
                Payment method
              </Text>
              <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                {["Cash", "Bank transfer", "PayID", "Other"].map((m) => (
                  <TouchableOpacity
                    key={m}
                    onPress={() => setPayMethod(m)}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 99,
                      backgroundColor: payMethod === m ? "#B5604A" : "#EDE8DC",
                    }}
                  >
                    <Text
                      style={{
                        fontSize: 12,
                        fontWeight: "600",
                        color: payMethod === m ? "#fff" : "#57534e",
                      }}
                    >
                      {m}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TouchableOpacity
              onPress={() => soldMut.mutate()}
              disabled={soldMut.isPending}
              style={{
                backgroundColor: "#6b21a8",
                borderRadius: 12,
                paddingVertical: 13,
                alignItems: "center",
                marginTop: 4,
              }}
            >
              {soldMut.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 14 }}>
                  Confirm Sold
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

// --- Publish Modal ---
function PublishModal({
  eventId,
  onClose,
  onPublished,
}: {
  eventId: string;
  onClose: () => void;
  onPublished: () => void;
}) {
  const queryClient = useQueryClient();
  const [moveOutDate, setMoveOutDate] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [suburb, setSuburb] = useState("");
  const [pincode, setPincode] = useState("");

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
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      onPublished();
      onClose();
    },
    onError: (e: Error) => Alert.alert("Publish failed", e.message),
  });

  const field = (label: string, value: string, onChange: (v: string) => void, opts?: object) => (
    <View>
      <Text style={{ fontSize: 12, color: "#78716c", marginBottom: 4 }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        style={{
          borderWidth: 1,
          borderColor: "#D6C9B0",
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          fontSize: 14,
          color: "#1c1917",
          backgroundColor: "#fff",
        }}
        {...opts}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1, justifyContent: "flex-end" }}
    >
      <ScrollView
        style={{ backgroundColor: "#FAFAF7", borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
        contentContainerStyle={{ padding: 20, gap: 14 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#1c1917", flex: 1 }}>
            Publish sale
          </Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={22} color="#A09683" />
          </TouchableOpacity>
        </View>

        {field("Move-out date (YYYY-MM-DD)", moveOutDate, setMoveOutDate, {
          placeholder: "2026-07-15",
          placeholderTextColor: "#A09683",
        })}
        {field("Street address", streetAddress, setStreetAddress, {
          placeholder: "12 Example St",
          placeholderTextColor: "#A09683",
        })}
        {field("Suburb", suburb, setSuburb, {
          placeholder: "Surry Hills",
          placeholderTextColor: "#A09683",
        })}
        {field("Postcode", pincode, setPincode, {
          placeholder: "2010",
          placeholderTextColor: "#A09683",
          keyboardType: "numeric",
        })}

        <TouchableOpacity
          onPress={() => publishMut.mutate()}
          disabled={publishMut.isPending || !moveOutDate || !suburb || !pincode}
          style={{
            backgroundColor:
              publishMut.isPending || !moveOutDate || !suburb || !pincode ? "#D6C9B0" : "#B5604A",
            borderRadius: 12,
            paddingVertical: 14,
            alignItems: "center",
            marginTop: 4,
            marginBottom: 20,
          }}
        >
          {publishMut.isPending ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 15 }}>
              Publish to marketplace
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// --- Main screen ---
export default function InventoryScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const queryClient = useQueryClient();

  const [selectedItem, setSelectedItem] = useState<{
    item: InventoryItem;
    bundleId: string;
  } | null>(null);
  const [showPublish, setShowPublish] = useState(false);

  const {
    data: summary,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery<SaleSummary>({
    queryKey: ["summary", eventId],
    queryFn: () => getSummary(eventId!),
    enabled: !!eventId,
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === "processing" || s === "pricing_in_progress" ? 3000 : false;
    },
  });

  const unpublishMut = useMutation({
    mutationFn: () => unpublishSale(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
    },
  });

  const archiveMut = useMutation({
    mutationFn: () => archiveSale(eventId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["summary", eventId] });
      queryClient.invalidateQueries({ queryKey: ["sales"] });
      router.back();
    },
  });

  const sections =
    summary?.bundles?.map((b: RoomBundle) => ({
      key: b.id,
      bundle: b,
      data: b.items,
    })) ?? [];

  const title =
    summary?.title ??
    (summary?.suburb ? `${summary.suburb} Sale` : "Untitled Sale");

  const status = summary?.status;
  const statusBg = status ? STATUS_BG[status] ?? "#f5f5f4" : "#f5f5f4";
  const statusFg = status ? STATUS_FG[status] ?? "#57534e" : "#57534e";
  const statusText = status ? STATUS_LABEL[status] ?? status : "";

  const canPublish = status === "ready_for_review";
  const isLive = status === "live" || status === "partially_sold";
  const isProcessing = status === "processing" || status === "pricing_in_progress";
  const isTerminal = status === "sold" || status === "archived" || status === "expired";

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center" style={{ paddingTop: insets.top }}>
        <ActivityIndicator size="large" color="#B5604A" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="px-4 pt-3 pb-3 border-b border-outline-variant bg-surface flex-row items-center gap-3">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={22} color="#1c1917" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-on-surface flex-1" numberOfLines={1}>
          {title}
        </Text>
        <View style={{ backgroundColor: statusBg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 }}>
          <Text style={{ color: statusFg, fontSize: 12, fontWeight: "600" }}>{statusText}</Text>
        </View>
      </View>

      {/* Status action banner */}
      {(canPublish || isLive || isProcessing) && (
        <View
          style={{
            backgroundColor: isProcessing ? "#fef3c7" : isLive ? "#dcfce7" : "#fff7ed",
            paddingHorizontal: 16,
            paddingVertical: 12,
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
          }}
        >
          {isProcessing && (
            <>
              <ActivityIndicator size="small" color="#92400e" />
              <Text style={{ color: "#92400e", fontSize: 13, flex: 1 }}>
                AI is analysing and pricing your items…
              </Text>
            </>
          )}
          {canPublish && (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#b45309" />
              <Text style={{ color: "#b45309", fontSize: 13, flex: 1 }}>
                Ready to go live on the marketplace
              </Text>
              <TouchableOpacity
                onPress={() => setShowPublish(true)}
                style={{
                  backgroundColor: "#B5604A",
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>Publish</Text>
              </TouchableOpacity>
            </>
          )}
          {isLive && (
            <>
              <Ionicons name="globe-outline" size={20} color="#166534" />
              <Text style={{ color: "#166534", fontSize: 13, flex: 1 }}>
                Live on the marketplace
              </Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Unpublish sale?", "It will be removed from the marketplace.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Unpublish", onPress: () => unpublishMut.mutate() },
                  ])
                }
                style={{
                  backgroundColor: "#fff",
                  borderWidth: 1,
                  borderColor: "#D6C9B0",
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 99,
                }}
              >
                <Text style={{ color: "#57534e", fontWeight: "600", fontSize: 13 }}>Unpublish</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Bundle + Item list */}
      <SectionList
        sections={sections}
        keyExtractor={(item: InventoryItem) => item.id}
        renderSectionHeader={({ section }) => {
          const b = section.bundle as RoomBundle;
          const available = b.items.filter((i) => i.sale_status === "available").length;
          return (
            <View
              style={{
                backgroundColor: "#F5EFE4",
                paddingHorizontal: 16,
                paddingVertical: 10,
                borderBottomWidth: 1,
                borderBottomColor: "#E0D5C0",
              }}
            >
              <Text style={{ fontWeight: "700", fontSize: 14, color: "#1c1917" }}>
                {b.name}
              </Text>
              <Text style={{ fontSize: 12, color: "#78716c", marginTop: 2 }}>
                {b.items.length} item{b.items.length !== 1 ? "s" : ""} · {available} available
              </Text>
            </View>
          );
        }}
        renderItem={({ item, section }: { item: InventoryItem; section: { bundle: RoomBundle } }) => {
          const { bg, fg } = ITEM_STATUS_STYLE[item.sale_status ?? "available"] ?? ITEM_STATUS_STYLE.available;
          const price = item.actual_listing_price ?? item.predicted_listing_price;
          return (
            <TouchableOpacity
              onPress={() =>
                setSelectedItem({ item, bundleId: section.bundle.id })
              }
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
                borderBottomWidth: 1,
                borderBottomColor: "#F0E9DA",
                backgroundColor: "#FAFAF7",
              }}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: "600", color: "#1c1917" }} numberOfLines={1}>
                  {item.name}
                </Text>
                <Text style={{ fontSize: 12, color: "#78716c", marginTop: 1 }}>
                  {[item.brand, item.condition].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end", gap: 4 }}>
                <Text style={{ fontSize: 14, fontWeight: "700", color: "#1c1917" }}>
                  {fmtAUD(price)}
                </Text>
                <View style={{ backgroundColor: bg, paddingHorizontal: 6, paddingVertical: 1, borderRadius: 99 }}>
                  <Text style={{ color: fg, fontSize: 10, fontWeight: "600" }}>
                    {(item.sale_status ?? "available").toUpperCase()}
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#A09683" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <Text style={{ color: "#A09683", fontSize: 14 }}>No items found</Text>
          </View>
        }
        ListFooterComponent={
          !isTerminal ? (
            <View style={{ padding: 16, paddingBottom: 32 }}>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert("Archive sale?", "This sale will be archived and removed from the marketplace.", [
                    { text: "Cancel", style: "cancel" },
                    { text: "Archive", style: "destructive", onPress: () => archiveMut.mutate() },
                  ])
                }
                style={{
                  borderWidth: 1,
                  borderColor: "#D6C9B0",
                  borderRadius: 12,
                  paddingVertical: 12,
                  alignItems: "center",
                }}
              >
                <Text style={{ color: "#78716c", fontWeight: "600", fontSize: 14 }}>
                  Archive sale
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ height: 32 }} />
          )
        }
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#B5604A" />
        }
      />

      {/* Item edit modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        />
        {selectedItem && (
          <ItemEditSheet
            item={selectedItem.item}
            eventId={eventId!}
            bundleId={selectedItem.bundleId}
            onClose={() => setSelectedItem(null)}
            onUpdated={() => {}}
          />
        )}
      </Modal>

      {/* Publish modal */}
      <Modal
        visible={showPublish}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPublish(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
          activeOpacity={1}
          onPress={() => setShowPublish(false)}
        />
        <PublishModal
          eventId={eventId!}
          onClose={() => setShowPublish(false)}
          onPublished={() => {}}
        />
      </Modal>
    </View>
  );
}
