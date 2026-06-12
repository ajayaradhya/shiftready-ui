import {
  View,
  ActivityIndicator,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  KeyboardAvoidingView,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  ZoomIn,
} from "@/lib/reanimated";
import { initCaptureSale, captureFrameNative } from "@myrio/api";
import { formatAUD } from "@myrio/core";
import { captureStore, type CapturedItem } from "@/lib/capture-store";
import { colors, fonts, radius } from "@/lib/theme";
import { AppText, Button, ScalePressable, triggerHaptic } from "@/components/ui";

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (Platform.OS === "web") return;
    activateKeepAwakeAsync().catch(() => {});
    return () => { deactivateKeepAwake(); };
  }, []);

  const [capturing, setCapturing] = useState(false);
  const [torch, setTorch] = useState(false);
  const [items, setItems] = useState<CapturedItem[]>([]);
  const [pendingItem, setPendingItem] = useState<CapturedItem | null>(null);
  const [editName, setEditName] = useState("");
  const [showSheet, setShowSheet] = useState(false);
  const eventIdRef = useRef<string | null>(null);

  const estValue = items.reduce((sum, it) => sum + (it.predictedOriginalPrice ?? 0), 0);

  // Spinning progress ring during capture
  const captureSpin = useSharedValue(0);
  useEffect(() => {
    if (capturing) {
      captureSpin.value = withRepeat(
        withTiming(1, { duration: 900, easing: Easing.linear }),
        -1
      );
    } else {
      cancelAnimation(captureSpin);
      captureSpin.value = 0;
    }
  }, [capturing]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${captureSpin.value * 360}deg` }],
  }));

  const doCapture = useCallback(async () => {
    if (capturing || !cameraRef.current) return;
    triggerHaptic("medium");
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      if (!photo?.uri) throw new Error("No photo captured");

      const img = await manipulateAsync(
        photo.uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.85, format: SaveFormat.JPEG }
      );

      if (!eventIdRef.current) {
        const res = await initCaptureSale();
        eventIdRef.current = res.event_id;
        captureStore.reset();
        captureStore.setEventId(res.event_id);
      }

      const result = await captureFrameNative(eventIdRef.current, img.uri);

      const tempId = `${Date.now()}-${Math.random()}`;
      const captured: CapturedItem = {
        tempId,
        name: result.name,
        brand: result.brand ?? undefined,
        predictedOriginalPrice: result.predicted_original_price,
        gcsUri: result.gcs_uri,
        localUri: img.uri,
        nameSource: "ai",
      };

      triggerHaptic("light");
      setPendingItem(captured);
      setEditName(result.name);
      setShowSheet(true);
    } catch (err) {
      triggerHaptic("error");
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
    setShowSheet(false);
    triggerHaptic("success");
  }, [pendingItem, editName]);

  const discardPending = useCallback(() => {
    setPendingItem(null);
    setShowSheet(false);
  }, []);

  const goReview = useCallback(() => {
    if (items.length === 0) return;
    router.push("/capture/review");
  }, [items.length, router]);

  if (!permission) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.surface, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color={colors.clay600} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.surface,
          paddingTop: insets.top + 16,
          paddingHorizontal: 28,
        }}
      >
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 8 }}>
          <View
            style={{
              width: 96,
              height: 96,
              borderRadius: 48,
              backgroundColor: colors.clay100,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Ionicons name="camera" size={44} color={colors.clay600} />
          </View>
          <AppText variant="title" style={{ textAlign: "center" }}>
            Point. Snap. Sold.
          </AppText>
          <AppText tone="muted" style={{ textAlign: "center", maxWidth: 300 }}>
            Myrio uses your camera to identify and price your items in seconds. One tap
            per item — we do the rest.
          </AppText>
        </View>
        <View style={{ paddingBottom: insets.bottom + 24, gap: 12 }}>
          <Button label="Allow camera" size="lg" block onPress={requestPermission} />
          <Button label="Not now" variant="ghost" block onPress={() => router.back()} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        mode="picture"
        enableTorch={torch}
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
          justifyContent: "space-between",
          paddingHorizontal: 16,
        }}
      >
        <ScalePressable
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
          accessibilityRole="button"
          accessibilityLabel="Close camera"
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="close" size={22} color="#fff" />
        </ScalePressable>

        {/* Running HUD chip */}
        {items.length > 0 ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(0,0,0,0.6)",
              borderRadius: radius.full,
              paddingHorizontal: 14,
              paddingVertical: 9,
            }}
          >
            <Ionicons name="cube" size={13} color="#fff" />
            <AppText weight="bold" style={{ color: "#fff", fontSize: 14, lineHeight: 18 }}>
              {items.length} item{items.length !== 1 ? "s" : ""}
            </AppText>
            {estValue > 0 ? (
              <AppText style={{ color: "rgba(255,255,255,0.75)", fontSize: 13, lineHeight: 18 }}>
                · ~{formatAUD(estValue)} RRP
              </AppText>
            ) : null}
          </Animated.View>
        ) : (
          <View style={{ width: 100 }} />
        )}

        <ScalePressable
          onPress={() => {
            triggerHaptic("selection");
            setTorch((t) => !t);
          }}
          accessibilityRole="button"
          accessibilityLabel={torch ? "Turn torch off" : "Turn torch on"}
          accessibilityState={{ selected: torch }}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: torch ? "rgba(255,255,255,0.92)" : "rgba(0,0,0,0.55)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name={torch ? "flash" : "flash-outline"} size={20} color={torch ? "#1F1B17" : "#fff"} />
        </ScalePressable>
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
          backgroundColor: "rgba(0,0,0,0.55)",
        }}
      >
        {/* Captured thumbnails stack */}
        {items.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginBottom: 16 }}
            contentContainerStyle={{ gap: 8 }}
          >
            {items.map((it) => (
              <Animated.View
                key={it.tempId}
                entering={ZoomIn.duration(280).springify()}
                style={{ alignItems: "center", gap: 4 }}
              >
                <Image
                  source={{ uri: it.localUri ?? undefined }}
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    backgroundColor: "#333",
                    borderWidth: 1,
                    borderColor: "rgba(255,255,255,0.25)",
                  }}
                  contentFit="cover"
                />
                <AppText
                  numberOfLines={1}
                  style={{ color: "#fff", fontSize: 9, lineHeight: 12, maxWidth: 52 }}
                >
                  {it.name}
                </AppText>
              </Animated.View>
            ))}
          </ScrollView>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
          <View style={{ width: 84 }} />

          {/* 72pt shutter with spinning capture ring */}
          <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
            {capturing ? (
              <Animated.View
                style={[
                  spinStyle,
                  {
                    position: "absolute",
                    width: 84,
                    height: 84,
                    borderRadius: 42,
                    borderWidth: 3,
                    borderTopColor: colors.clay600,
                    borderRightColor: colors.clay600,
                    borderBottomColor: "transparent",
                    borderLeftColor: "transparent",
                  },
                ]}
              />
            ) : null}
            <ScalePressable
              onPress={doCapture}
              disabled={capturing}
              pressScale={0.9}
              accessibilityRole="button"
              accessibilityLabel="Capture item"
              accessibilityState={{ busy: capturing }}
              style={{
                width: 72,
                height: 72,
                borderRadius: 36,
                borderWidth: 4,
                borderColor: "#fff",
                backgroundColor: capturing
                  ? "rgba(255,255,255,0.3)"
                  : "rgba(255,255,255,0.15)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <View
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: capturing ? "rgba(255,255,255,0.5)" : "#fff",
                }}
              />
            </ScalePressable>
          </View>

          {/* Done CTA */}
          <View style={{ width: 84, alignItems: "flex-end" }}>
            {items.length > 0 ? (
              <ScalePressable
                onPress={goReview}
                haptic="selection"
                accessibilityRole="button"
                accessibilityLabel={`Review ${items.length} items and finish`}
                style={{
                  backgroundColor: colors.clay600,
                  borderRadius: radius.lg,
                  paddingHorizontal: 16,
                  paddingVertical: 11,
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 5,
                }}
              >
                <AppText weight="bold" style={{ color: "#fff", fontSize: 13, lineHeight: 17 }}>
                  Done
                </AppText>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </ScalePressable>
            ) : null}
          </View>
        </View>

        <AppText
          style={{
            color: "rgba(255,255,255,0.6)",
            fontSize: 12,
            lineHeight: 16,
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {items.length === 0
            ? "Point at an item and tap the shutter — AI identifies it"
            : "Keep snapping, or tap Done to review"}
        </AppText>
      </View>

      {/* Identify result sheet — overlaid so camera never hides */}
      {showSheet ? (
        <View style={StyleSheet.absoluteFill}>
          <ScalePressable
            style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
            onPress={discardPending}
            accessibilityRole="button"
            accessibilityLabel="Dismiss"
          />
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
            <View
              style={{
                backgroundColor: colors.surface,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                padding: 20,
                paddingBottom: insets.bottom + 20,
                gap: 14,
              }}
            >
              <View
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: colors.surfaceHighest,
                  alignSelf: "center",
                  marginTop: -8,
                }}
              />
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {pendingItem?.localUri ? (
                  <Image
                    source={{ uri: pendingItem.localUri }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: radius.md,
                      backgroundColor: colors.surfaceHigh,
                    }}
                    contentFit="cover"
                  />
                ) : null}
                <View style={{ flex: 1 }}>
                  <AppText variant="micro" tone="faint">
                    AI identified
                  </AppText>
                  <AppText variant="heading" numberOfLines={1}>
                    {pendingItem?.name}
                  </AppText>
                  {pendingItem?.brand || pendingItem?.predictedOriginalPrice != null ? (
                    <AppText variant="caption" tone="muted" numberOfLines={1}>
                      {[
                        pendingItem?.brand,
                        pendingItem?.predictedOriginalPrice != null
                          ? `~${formatAUD(pendingItem.predictedOriginalPrice)} RRP`
                          : null,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </AppText>
                  ) : null}
                </View>
              </View>

              <View>
                <AppText variant="caption" tone="muted" style={{ marginBottom: 5 }}>
                  Name (edit if needed)
                </AppText>
                <TextInput
                  value={editName}
                  onChangeText={setEditName}
                  accessibilityLabel="Item name"
                  style={{
                    borderWidth: 1,
                    borderColor: colors.outlineVariant,
                    borderRadius: radius.md,
                    paddingHorizontal: 12,
                    paddingVertical: 10,
                    fontFamily: fonts.regular,
                    fontSize: 15,
                    color: colors.onSurface,
                    backgroundColor: colors.surfaceLowest,
                  }}
                />
              </View>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <Button label="Discard" variant="ghost" style={{ flex: 1 }} onPress={discardPending} />
                <Button label="Add to list" style={{ flex: 2 }} haptic="success" onPress={confirmPending} />
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      ) : null}
    </View>
  );
}
