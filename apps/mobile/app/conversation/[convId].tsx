import {
  View,
  FlatList,
  TextInput,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect } from "react";
import { Ionicons } from "@expo/vector-icons";
import { markConversationRead, revealPhone } from "@myrio/api";
import { useAuth } from "@/contexts/auth-context";
import { useConversations } from "@/hooks/use-conversations";
import { useMessages } from "@/hooks/use-messages";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import { useSendMessage, useRemoveLocalMessage, type LocalMessage } from "@/hooks/use-send-message";
import {
  useSendOffer,
  useAcceptOffer,
  useCounterOffer,
  useWithdrawOffer,
} from "@/hooks/use-offers";
import type { Message, OfferPayload, PinSnapshot } from "@myrio/types";
import { formatAUD } from "@myrio/core";
import { colors, fonts, radius } from "@/lib/theme";
import {
  AppText,
  Avatar,
  Button,
  Chip,
  EmptyState,
  ItemImage,
  ScalePressable,
  Skeleton,
  StackHeader,
  triggerHaptic,
  type StatusVariant,
} from "@/components/ui";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: string | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function dayLabel(ts: string | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" });
}

// ---------------------------------------------------------------------------
// Offer card
// ---------------------------------------------------------------------------

const OFFER_STATUS_CHIP: Record<string, { label: string; status: StatusVariant }> = {
  pending: { label: "Pending", status: "processing" },
  countered: { label: "Countered", status: "processing" },
  accepted: { label: "Accepted", status: "deal" },
  withdrawn: { label: "Withdrawn", status: "sold" },
};

function OfferCard({
  offer,
  isMine,
  convId,
  itemName,
}: {
  offer: OfferPayload;
  isMine: boolean;
  convId: string;
  itemName?: string | null;
}) {
  const accept = useAcceptOffer(convId);
  const counter = useCounterOffer(convId);
  const withdraw = useWithdrawOffer(convId);
  const [showCounter, setShowCounter] = useState(false);
  const [counterText, setCounterText] = useState("");

  const canAct = !isMine && offer.status === "pending";
  const canWithdraw = isMine && offer.status === "pending";
  const isAccepted = offer.status === "accepted";
  const chip = OFFER_STATUS_CHIP[offer.status] ?? { label: offer.status, status: "neutral" as StatusVariant };

  function doCounter() {
    const amt = parseFloat(counterText.replace(/[^0-9.]/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid dollar amount.");
      return;
    }
    counter.mutate({ offerId: offer.offerId, amount: amt });
    setShowCounter(false);
    setCounterText("");
  }

  return (
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: isAccepted ? colors.success : colors.outlineVariant,
        backgroundColor: isAccepted ? colors.successContainer : colors.surfaceLow,
        padding: 14,
        gap: 8,
        minWidth: 230,
        maxWidth: 290,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="micro" tone="faint" numberOfLines={1} style={{ flexShrink: 1, marginRight: 6 }}>
          {(isMine ? "Your offer" : "Offer") + (itemName ? ` · ${itemName}` : "")}
        </AppText>
        <Chip label={chip.label} status={chip.status} size="sm" />
      </View>

      <AppText
        style={{
          fontFamily: fonts.bold,
          fontSize: 26,
          lineHeight: 32,
          color: isAccepted ? colors.onSuccessContainer : colors.onSurface,
          fontVariant: ["tabular-nums"],
        }}
      >
        {formatAUD(offer.amount)}
      </AppText>
      {offer.listPrice ? (
        <AppText variant="caption" tone="faint">
          Listed at {formatAUD(offer.listPrice)}
        </AppText>
      ) : null}

      {showCounter ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={counterText}
            onChangeText={setCounterText}
            placeholder="Counter amount (AUD)"
            placeholderTextColor={colors.ink300}
            keyboardType="decimal-pad"
            autoFocus
            accessibilityLabel="Counter offer amount"
            style={{
              borderWidth: 1,
              borderColor: colors.outline,
              borderRadius: radius.sm,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontFamily: fonts.regular,
              fontSize: 15,
              color: colors.onSurface,
              backgroundColor: colors.surfaceLowest,
            }}
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Button
              label="Cancel"
              variant="ghost"
              size="sm"
              style={{ flex: 1 }}
              onPress={() => {
                setShowCounter(false);
                setCounterText("");
              }}
            />
            <Button label="Send counter" size="sm" style={{ flex: 1 }} onPress={doCounter} />
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {canAct ? (
            <>
              <Button
                label="Accept"
                size="sm"
                haptic="success"
                style={{ flex: 1 }}
                loading={accept.isPending}
                onPress={() => accept.mutate({ offerId: offer.offerId })}
              />
              <Button
                label="Counter"
                variant="secondary"
                size="sm"
                style={{ flex: 1 }}
                onPress={() => setShowCounter(true)}
              />
            </>
          ) : null}
          {canWithdraw ? (
            <Button
              label="Withdraw"
              variant="ghost"
              size="sm"
              style={{ flex: 1 }}
              onPress={() =>
                Alert.alert("Withdraw offer?", "This will cancel your offer.", [
                  { text: "Cancel", style: "cancel" },
                  {
                    text: "Withdraw",
                    style: "destructive",
                    onPress: () => withdraw.mutate({ offerId: offer.offerId }),
                  },
                ])
              }
            />
          ) : null}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  isMine,
  convId,
  showTime,
  onToggleTime,
  pinName,
  onRetry,
}: {
  msg: LocalMessage;
  isMine: boolean;
  convId: string;
  showTime: boolean;
  onToggleTime: () => void;
  pinName?: string | null;
  onRetry?: (msg: LocalMessage) => void;
}) {
  if (msg.type === "system") {
    return (
      <View style={{ alignItems: "center", marginVertical: 6, paddingHorizontal: 16 }}>
        <View
          style={{
            backgroundColor: colors.surfaceHigh,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 5,
          }}
        >
          <AppText variant="caption" tone="muted" style={{ textAlign: "center" }}>
            {msg.text}
          </AppText>
        </View>
      </View>
    );
  }

  if ((msg.type === "offer" || msg.type === "offer_accepted") && msg.offerPayload) {
    return (
      <View
        style={{
          alignItems: isMine ? "flex-end" : "flex-start",
          marginVertical: 4,
          paddingHorizontal: 16,
        }}
      >
        <OfferCard offer={msg.offerPayload} isMine={isMine} convId={convId} itemName={pinName} />
        <AppText variant="caption" tone="faint" style={{ fontSize: 10, marginTop: 3 }}>
          {formatTime(msg.createdAt)}
        </AppText>
      </View>
    );
  }

  const isFailed = msg._local === "failed";
  const isSending = msg._local === "sending";

  return (
    <View
      style={{
        alignItems: isMine ? "flex-end" : "flex-start",
        marginVertical: 2,
        paddingHorizontal: 16,
      }}
    >
      <ScalePressable
        pressScale={0.99}
        onPress={isFailed && onRetry ? () => onRetry(msg) : onToggleTime}
        accessibilityRole={isFailed ? "button" : "text"}
        accessibilityLabel={isFailed ? "Message failed to send, tap to retry" : undefined}
      >
        <View
          style={{
            maxWidth: 290,
            backgroundColor: isMine ? colors.clay600 : colors.surfaceHigh,
            borderRadius: 18,
            borderBottomRightRadius: isMine ? 4 : 18,
            borderBottomLeftRadius: isMine ? 18 : 4,
            paddingHorizontal: 14,
            paddingVertical: 9,
            opacity: isSending ? 0.65 : 1,
            borderWidth: isFailed ? 1 : 0,
            borderColor: isFailed ? colors.error : undefined,
          }}
        >
          <AppText
            style={{
              fontSize: 14.5,
              lineHeight: 20,
              color: isMine ? colors.onPrimary : colors.onSurface,
            }}
          >
            {msg.text}
          </AppText>
        </View>
      </ScalePressable>
      {isFailed ? (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 }}>
          <Ionicons name="alert-circle" size={12} color={colors.error} />
          <AppText variant="caption" style={{ fontSize: 11, color: colors.error }}>
            Failed — tap to retry
          </AppText>
        </View>
      ) : isSending ? (
        <AppText variant="caption" tone="faint" style={{ fontSize: 10, marginTop: 2, marginHorizontal: 4 }}>
          Sending…
        </AppText>
      ) : showTime ? (
        <AppText variant="caption" tone="faint" style={{ fontSize: 10, marginTop: 2, marginHorizontal: 4 }}>
          {formatTime(msg.createdAt)}
        </AppText>
      ) : null}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Offer modal
// ---------------------------------------------------------------------------

function OfferModal({
  visible,
  onClose,
  convId,
  pin,
}: {
  visible: boolean;
  onClose: () => void;
  convId: string;
  pin?: PinSnapshot | null;
}) {
  const [amountText, setAmountText] = useState("");
  const sendOffer = useSendOffer(convId);
  const listPrice = pin?.price;

  function pickPercent(pct: number) {
    if (!listPrice) return;
    triggerHaptic("selection");
    setAmountText(String(Math.max(1, Math.round(listPrice * (1 - pct / 100)))));
  }

  function submit() {
    const amt = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid dollar amount.");
      return;
    }
    triggerHaptic("light");
    sendOffer.mutate({ amount: amt });
    onClose();
    setAmountText("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScalePressable
        style={{ flex: 1, backgroundColor: "rgba(20,17,13,0.4)" }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close offer sheet"
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: radius.xl,
          borderTopRightRadius: radius.xl,
          padding: 20,
          paddingBottom: 28,
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
        <AppText variant="title" style={{ fontSize: 19 }}>
          Make an offer
        </AppText>

        {/* Item context */}
        {pin?.name ? (
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
              marginTop: -4,
            }}
          >
            <ItemImage uri={pin.imageUrl} width={40} height={40} borderRadius={radius.sm} />
            <View style={{ flex: 1 }}>
              <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 13.5 }}>
                {pin.name}
              </AppText>
              {listPrice != null ? (
                <AppText variant="caption" tone="muted">
                  Listed at {formatAUD(listPrice)}
                </AppText>
              ) : null}
            </View>
          </View>
        ) : null}

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
          </View>
        ) : null}

        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="Amount (AUD)"
          placeholderTextColor={colors.ink300}
          keyboardType="decimal-pad"
          autoFocus
          accessibilityLabel="Offer amount in Australian dollars"
          style={{
            borderWidth: 1,
            borderColor: colors.outline,
            borderRadius: radius.md,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontFamily: fonts.semibold,
            fontSize: 20,
            color: colors.onSurface,
            backgroundColor: colors.surfaceLowest,
          }}
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <Button label="Cancel" variant="ghost" style={{ flex: 1 }} onPress={onClose} />
          <Button
            label="Send offer"
            style={{ flex: 2 }}
            loading={sendOffer.isPending}
            haptic="light"
            onPress={submit}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ConversationScreen() {
  const {
    convId,
    name: nameParam,
    pinName: pinNameParam,
    pinImage: pinImageParam,
    pinPrice: pinPriceParam,
  } = useLocalSearchParams<{
    convId: string;
    name?: string;
    pinName?: string;
    pinImage?: string;
    pinPrice?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, idToken } = useAuth();
  const myUid = user?.uid ?? "";

  const { data: convs } = useConversations();
  const conv = convs?.find((c) => c.id === convId);
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(convId);
  useMessagesWs(idToken, convId);

  const sendMsg = useSendMessage(convId, myUid);
  const removeLocal = useRemoveLocalMessage(convId);
  const [text, setText] = useState("");
  const [offerModal, setOfferModal] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);
  const [timeShownFor, setTimeShownFor] = useState<string | null>(null);

  useEffect(() => {
    if (convId && idToken) {
      markConversationRead(convId).catch(() => undefined);
    }
  }, [convId, idToken]);

  const messages = (data?.pages.flatMap((p) => p.messages) ?? []) as LocalMessage[];
  const reversed = [...messages].reverse();

  // Day separators for the inverted list: attach a label to the OLDEST message of each day.
  const daySeparatorIds = new Set<string>();
  {
    let lastDay = "";
    for (const m of messages) {
      const label = dayLabel(m.createdAt);
      if (label !== lastDay) {
        daySeparatorIds.add(m.id);
        lastDay = label;
      }
    }
  }

  function send() {
    const t = text.trim();
    if (!t) return;
    triggerHaptic("selection");
    sendMsg.mutate({ text: t });
    setText("");
  }

  function retryMessage(msg: LocalMessage) {
    triggerHaptic("selection");
    sendMsg.mutate({ text: msg.text, tempId: msg.id });
  }

  async function handleRevealPhone() {
    try {
      const res = await revealPhone(convId);
      setRevealedPhone(res.phoneE164);
      triggerHaptic("success");
    } catch {
      Alert.alert("Error", "Could not reveal phone number.");
    }
  }

  // B2: prefer route-passed name so a brand-new conversation renders instantly;
  // fall back to a skeleton until the counterpart resolves.
  const otherName = conv?.otherUsername ?? nameParam ?? null;
  const isDealAgreed = conv?.dealStatus === "agreed";
  // B3: optimistic pinned card from route params until the server snapshot lands.
  const pin: PinSnapshot | null =
    conv?.pinSnapshot ??
    (pinNameParam
      ? {
          name: pinNameParam,
          imageUrl: pinImageParam ?? null,
          price: pinPriceParam ? Number(pinPriceParam) : null,
        }
      : null);
  const pinRef = conv?.pin;

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      {/* Header */}
      <StackHeader
        title=""
        right={
          isDealAgreed ? (
            <Chip
              label={conv?.agreedPrice ? `Deal ${formatAUD(conv.agreedPrice)}` : "Deal agreed"}
              status="deal"
            />
          ) : undefined
        }
        style={{ paddingBottom: 10 }}
      />
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: 16,
          paddingBottom: 10,
          marginTop: -44,
          marginLeft: 44,
        }}
      >
        {otherName ? (
          <>
            <Avatar name={otherName} size={34} />
            <AppText variant="heading" numberOfLines={1} style={{ fontSize: 16 }}>
              @{otherName}
            </AppText>
          </>
        ) : (
          <>
            <Skeleton width={34} height={34} borderRadius={17} />
            <Skeleton width={120} height={16} borderRadius={6} />
          </>
        )}
      </View>

      {/* Pinned item card */}
      {pin?.name ? (
        <ScalePressable
          onPress={(() => {
            if (!pinRef?.saleEventId) return undefined;
            const { saleEventId, bundleId, itemId } = pinRef;
            if (bundleId && itemId) {
              return () =>
                router.push({
                  pathname: "/item/[eventId]/[bundleId]/[itemId]",
                  params: { eventId: saleEventId, bundleId, itemId },
                });
            }
            return () =>
              router.push({ pathname: "/sale/[eventId]", params: { eventId: saleEventId } });
          })()}
          haptic="selection"
          accessibilityRole="button"
          accessibilityLabel={`About: ${pin.name}`}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 10,
            marginHorizontal: 16,
            marginBottom: 8,
            padding: 10,
            backgroundColor: colors.surfaceLow,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}
        >
          <ItemImage uri={pin.imageUrl} width={40} height={40} borderRadius={radius.sm} />
          <View style={{ flex: 1 }}>
            <AppText weight="semibold" numberOfLines={1} style={{ fontSize: 13.5 }}>
              {pin.name}
            </AppText>
            {pin.price != null ? (
              <AppText variant="caption" weight="semibold" style={{ color: colors.clay600 }}>
                {formatAUD(pin.price)}
              </AppText>
            ) : null}
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.ink300} />
        </ScalePressable>
      ) : null}

      {/* Phone reveal */}
      {isDealAgreed && conv?.phoneRevealAvailable && !revealedPhone ? (
        <ScalePressable
          onPress={handleRevealPhone}
          haptic="light"
          accessibilityRole="button"
          accessibilityLabel="Reveal seller phone number"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginHorizontal: 16,
            marginBottom: 8,
            paddingHorizontal: 14,
            paddingVertical: 11,
            backgroundColor: colors.successContainer,
            borderRadius: radius.lg,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="call-outline" size={16} color={colors.onSuccessContainer} />
            <AppText variant="caption" weight="medium" style={{ color: colors.onSuccessContainer }}>
              Phone number unlocked — tap to reveal
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={15} color={colors.onSuccessContainer} />
        </ScalePressable>
      ) : null}
      {revealedPhone ? (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            marginHorizontal: 16,
            marginBottom: 8,
            paddingHorizontal: 14,
            paddingVertical: 11,
            backgroundColor: colors.successContainer,
            borderRadius: radius.lg,
          }}
        >
          <Ionicons name="call" size={16} color={colors.onSuccessContainer} />
          <AppText weight="semibold" style={{ color: colors.onSuccessContainer, fontSize: 15 }}>
            {revealedPhone}
          </AppText>
        </View>
      ) : null}

      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.clay600} />
        </View>
      ) : (
        <FlatList
          data={reversed}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <View>
              {daySeparatorIds.has(item.id) ? (
                <View style={{ alignItems: "center", marginVertical: 10 }}>
                  <AppText variant="micro" tone="faint">
                    {dayLabel(item.createdAt)}
                  </AppText>
                </View>
              ) : null}
              <MessageBubble
                msg={item}
                isMine={item.senderId === myUid}
                convId={convId}
                pinName={pin?.name}
                showTime={timeShownFor === item.id}
                onToggleTime={() => setTimeShownFor(timeShownFor === item.id ? null : item.id)}
                onRetry={(m) => {
                  Alert.alert("Message not sent", m.text, [
                    { text: "Delete", style: "destructive", onPress: () => removeLocal(m.id) },
                    { text: "Retry", onPress: () => retryMessage(m) },
                    { text: "Cancel", style: "cancel" },
                  ]);
                }}
              />
            </View>
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={{ transform: [{ scaleY: -1 }] }}>
              <EmptyState
                icon="chatbubble-ellipses-outline"
                title="No messages yet"
                body="Say hello — or open with an offer."
                compact
              />
            </View>
          }
        />
      )}

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={insets.bottom}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-end",
            paddingHorizontal: 12,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            borderTopWidth: 1,
            borderTopColor: colors.outlineVariant,
            backgroundColor: colors.surface,
            gap: 8,
          }}
        >
          <ScalePressable
            onPress={() => setOfferModal(true)}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Make an offer"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: colors.surfaceContainer,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons name="pricetag-outline" size={19} color={colors.clay600} />
          </ScalePressable>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            placeholderTextColor={colors.ink300}
            multiline
            accessibilityLabel="Message input"
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              borderRadius: 22,
              paddingHorizontal: 14,
              paddingVertical: 11,
              fontFamily: fonts.regular,
              fontSize: 14.5,
              color: colors.onSurface,
              backgroundColor: colors.surfaceLowest,
              maxHeight: 100,
            }}
          />
          <ScalePressable
            onPress={send}
            disabled={!text.trim()}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Send message"
            accessibilityState={{ disabled: !text.trim() }}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: text.trim() ? colors.clay600 : colors.surfaceHighest,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Ionicons
              name="arrow-up"
              size={19}
              color={text.trim() ? colors.onPrimary : colors.outline}
            />
          </ScalePressable>
        </View>
      </KeyboardAvoidingView>

      <OfferModal
        visible={offerModal}
        onClose={() => setOfferModal(false)}
        convId={convId}
        pin={pin}
      />
    </View>
  );
}
