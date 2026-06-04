import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { markConversationRead, revealPhone, listConversations } from "@shiftready/api";
import { useAuth } from "@/contexts/auth-context";
import { useMessages } from "@/hooks/use-messages";
import { useMessagesWs } from "@/hooks/use-messages-ws";
import { useSendMessage } from "@/hooks/use-send-message";
import {
  useSendOffer,
  useAcceptOffer,
  useCounterOffer,
  useWithdrawOffer,
} from "@/hooks/use-offers";
import type { Message, ConversationSummary, OfferPayload } from "@shiftready/types";
import { formatAUD } from "@shiftready/core";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ts: string | null) {
  if (!ts) return "";
  return new Date(ts).toLocaleTimeString("en-AU", { hour: "2-digit", minute: "2-digit" });
}

function useConversationById(convId: string): ConversationSummary | undefined {
  const qc = useQueryClient();
  const convs = qc.getQueryData<ConversationSummary[]>(["conversations"]);
  return convs?.find((c) => c.id === convId);
}

// ---------------------------------------------------------------------------
// Offer card rendered inside the message list
// ---------------------------------------------------------------------------

function OfferCard({
  offer,
  isMine,
  myUid,
  convId,
  conv,
}: {
  offer: OfferPayload;
  isMine: boolean;
  myUid: string;
  convId: string;
  conv?: ConversationSummary;
}) {
  const accept = useAcceptOffer(convId);
  const counter = useCounterOffer(convId);
  const withdraw = useWithdrawOffer(convId);
  const [showCounter, setShowCounter] = useState(false);
  const [counterText, setCounterText] = useState("");

  const canAct = !isMine && offer.status === "pending";
  const canWithdraw = isMine && offer.status === "pending";

  const statusColor: Record<string, string> = {
    pending: "#92400E",
    countered: "#92400E",
    accepted: "#065F46",
    withdrawn: "#6B7280",
  };

  const statusLabel: Record<string, string> = {
    pending: "Pending",
    countered: "Countered",
    accepted: "Accepted",
    withdrawn: "Withdrawn",
  };

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
        borderRadius: 12,
        borderWidth: 1,
        borderColor: offer.status === "accepted" ? "#6EE7B7" : "#E0D5C0",
        backgroundColor: offer.status === "accepted" ? "#ECFDF5" : "#FBF8F3",
        padding: 14,
        gap: 8,
        minWidth: 220,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "#A09683", textTransform: "uppercase", letterSpacing: 0.5 }}>
          Offer
        </Text>
        <View
          style={{
            backgroundColor: offer.status === "accepted" ? "#D1FAE5" : "#FEF3C7",
            borderRadius: 4,
            paddingHorizontal: 6,
            paddingVertical: 2,
          }}
        >
          <Text
            style={{
              fontSize: 10,
              fontWeight: "700",
              color: statusColor[offer.status] ?? "#374151",
            }}
          >
            {statusLabel[offer.status] ?? offer.status}
          </Text>
        </View>
      </View>

      <Text style={{ fontSize: 24, fontWeight: "700", color: "#2C2416" }}>
        {formatAUD(offer.amount)}
      </Text>
      {offer.listPrice && (
        <Text style={{ fontSize: 12, color: "#A09683" }}>
          Listed at {formatAUD(offer.listPrice)}
        </Text>
      )}

      {showCounter ? (
        <View style={{ gap: 8 }}>
          <TextInput
            value={counterText}
            onChangeText={setCounterText}
            placeholder="Counter amount (AUD)"
            keyboardType="decimal-pad"
            style={{
              borderWidth: 1,
              borderColor: "#C8B99A",
              borderRadius: 8,
              paddingHorizontal: 12,
              paddingVertical: 8,
              fontSize: 14,
              color: "#2C2416",
              backgroundColor: "#FFFFFF",
            }}
            autoFocus
          />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => { setShowCounter(false); setCounterText(""); }}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
                borderWidth: 1, borderColor: "#C8B99A",
              }}
            >
              <Text style={{ fontSize: 13, color: "#7A6A58" }}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={doCounter}
              style={{
                flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
                backgroundColor: "#B5604A",
              }}
            >
              <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Send counter</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={{ flexDirection: "row", gap: 8 }}>
          {canAct && (
            <>
              <TouchableOpacity
                onPress={() => accept.mutate({ offerId: offer.offerId })}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
                  backgroundColor: "#B5604A",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#fff" }}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowCounter(true)}
                style={{
                  flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
                  borderWidth: 1, borderColor: "#B5604A",
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: "600", color: "#B5604A" }}>Counter</Text>
              </TouchableOpacity>
            </>
          )}
          {canWithdraw && (
            <TouchableOpacity
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
              style={{
                flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8,
                borderWidth: 1, borderColor: "#EF4444",
              }}
            >
              <Text style={{ fontSize: 13, color: "#EF4444" }}>Withdraw</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Single message bubble
// ---------------------------------------------------------------------------

function MessageBubble({
  msg,
  isMine,
  myUid,
  convId,
  conv,
}: {
  msg: Message;
  isMine: boolean;
  myUid: string;
  convId: string;
  conv?: ConversationSummary;
}) {
  if (msg.type === "system") {
    return (
      <View style={{ alignItems: "center", marginVertical: 6 }}>
        <View style={{ backgroundColor: "#EDE5D6", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 5 }}>
          <Text style={{ fontSize: 12, color: "#7A6A58", textAlign: "center" }}>{msg.text}</Text>
        </View>
      </View>
    );
  }

  if ((msg.type === "offer" || msg.type === "offer_accepted") && msg.offerPayload) {
    return (
      <View style={{ alignItems: isMine ? "flex-end" : "flex-start", marginVertical: 4, paddingHorizontal: 16 }}>
        <OfferCard
          offer={msg.offerPayload}
          isMine={isMine}
          myUid={myUid}
          convId={convId}
          conv={conv}
        />
        <Text style={{ fontSize: 10, color: "#A09683", marginTop: 3 }}>
          {formatTime(msg.createdAt)}
        </Text>
      </View>
    );
  }

  return (
    <View
      style={{
        alignItems: isMine ? "flex-end" : "flex-start",
        marginVertical: 2,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          maxWidth: "75%",
          backgroundColor: isMine ? "#B5604A" : "#EDE5D6",
          borderRadius: 16,
          borderBottomRightRadius: isMine ? 4 : 16,
          borderBottomLeftRadius: isMine ? 16 : 4,
          paddingHorizontal: 14,
          paddingVertical: 9,
        }}
      >
        <Text style={{ fontSize: 14, color: isMine ? "#fff" : "#2C2416", lineHeight: 20 }}>
          {msg.text}
        </Text>
      </View>
      <Text style={{ fontSize: 10, color: "#A09683", marginTop: 2, marginHorizontal: 4 }}>
        {formatTime(msg.createdAt)}
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Offer send modal
// ---------------------------------------------------------------------------

function OfferModal({
  visible,
  onClose,
  convId,
}: {
  visible: boolean;
  onClose: () => void;
  convId: string;
}) {
  const [amountText, setAmountText] = useState("");
  const sendOffer = useSendOffer(convId);

  function submit() {
    const amt = parseFloat(amountText.replace(/[^0-9.]/g, ""));
    if (!amt || amt <= 0) {
      Alert.alert("Invalid amount", "Enter a valid dollar amount.");
      return;
    }
    sendOffer.mutate({ amount: amt });
    onClose();
    setAmountText("");
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}
        activeOpacity={1}
        onPress={onClose}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#FAFAF7",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
          gap: 14,
        }}
      >
        <Text style={{ fontSize: 17, fontWeight: "700", color: "#2C2416" }}>Make an offer</Text>
        <TextInput
          value={amountText}
          onChangeText={setAmountText}
          placeholder="Amount (AUD)"
          keyboardType="decimal-pad"
          style={{
            borderWidth: 1,
            borderColor: "#C8B99A",
            borderRadius: 10,
            paddingHorizontal: 14,
            paddingVertical: 12,
            fontSize: 18,
            color: "#2C2416",
            backgroundColor: "#FFFFFF",
          }}
          autoFocus
        />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <TouchableOpacity
            onPress={onClose}
            style={{
              flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10,
              borderWidth: 1, borderColor: "#C8B99A",
            }}
          >
            <Text style={{ fontSize: 15, color: "#7A6A58" }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={submit}
            disabled={sendOffer.isPending}
            style={{
              flex: 2, alignItems: "center", paddingVertical: 12, borderRadius: 10,
              backgroundColor: "#B5604A",
              opacity: sendOffer.isPending ? 0.6 : 1,
            }}
          >
            <Text style={{ fontSize: 15, fontWeight: "700", color: "#fff" }}>Send offer</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Main screen
// ---------------------------------------------------------------------------

export default function ConversationScreen() {
  const { convId } = useLocalSearchParams<{ convId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, idToken } = useAuth();
  const myUid = user?.uid ?? "";

  const conv = useConversationById(convId);
  const { data, isLoading, fetchNextPage, hasNextPage } = useMessages(convId);
  useMessagesWs(idToken, convId);

  const sendMsg = useSendMessage(convId);
  const [text, setText] = useState("");
  const [offerModal, setOfferModal] = useState(false);
  const [revealedPhone, setRevealedPhone] = useState<string | null>(null);

  // Mark read on enter
  useEffect(() => {
    if (convId && idToken) {
      markConversationRead(convId).catch(() => undefined);
    }
  }, [convId, idToken]);

  const messages = data?.pages.flatMap((p) => p.messages) ?? [];
  // Inverted FlatList needs newest first
  const reversed = [...messages].reverse();

  function send() {
    const t = text.trim();
    if (!t) return;
    sendMsg.mutate({ text: t });
    setText("");
  }

  async function handleRevealPhone() {
    try {
      const res = await revealPhone(convId);
      setRevealedPhone(res.phoneE164);
    } catch {
      Alert.alert("Error", "Could not reveal phone number.");
    }
  }

  const otherName = conv?.otherUsername ?? "Conversation";
  const isDealAgreed = conv?.dealStatus === "agreed";

  return (
    <View style={{ flex: 1, backgroundColor: "#FAFAF7", paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingVertical: 12,
          borderBottomWidth: 1,
          borderBottomColor: "#E0D5C0",
          backgroundColor: "#FAFAF7",
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ fontSize: 17, color: "#B5604A" }}>‹ Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#2C2416" }}>
            @{otherName}
          </Text>
          {conv?.pinSnapshot?.name && (
            <Text style={{ fontSize: 12, color: "#7A6A58" }} numberOfLines={1}>
              {conv.pinSnapshot.name}
              {conv.pinSnapshot.price ? ` · ${formatAUD(conv.pinSnapshot.price)}` : ""}
            </Text>
          )}
        </View>
        {isDealAgreed && (
          <View style={{ backgroundColor: "#D1FAE5", borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#065F46" }}>
              {conv?.agreedPrice ? `Deal ${formatAUD(conv.agreedPrice)}` : "Deal agreed"}
            </Text>
          </View>
        )}
      </View>

      {/* Phone reveal banner */}
      {isDealAgreed && conv?.phoneRevealAvailable && !revealedPhone && (
        <TouchableOpacity
          onPress={handleRevealPhone}
          style={{
            backgroundColor: "#FFFBEB",
            borderBottomWidth: 1,
            borderBottomColor: "#FDE68A",
            paddingHorizontal: 16,
            paddingVertical: 10,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontSize: 13, color: "#92400E" }}>
            Seller shared their phone — tap to reveal
          </Text>
          <Text style={{ fontSize: 13, fontWeight: "600", color: "#B45309" }}>Reveal ›</Text>
        </TouchableOpacity>
      )}
      {revealedPhone && (
        <View
          style={{
            backgroundColor: "#ECFDF5",
            borderBottomWidth: 1,
            borderBottomColor: "#6EE7B7",
            paddingHorizontal: 16,
            paddingVertical: 10,
          }}
        >
          <Text style={{ fontSize: 13, color: "#065F46" }}>
            📞 {revealedPhone}
          </Text>
        </View>
      )}

      {/* Messages */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color="#B5604A" />
        </View>
      ) : (
        <FlatList
          data={reversed}
          inverted
          keyExtractor={(m) => m.id}
          renderItem={({ item }) => (
            <MessageBubble
              msg={item}
              isMine={item.senderId === myUid}
              myUid={myUid}
              convId={convId}
              conv={conv}
            />
          )}
          contentContainerStyle={{ paddingVertical: 12 }}
          onEndReached={() => { if (hasNextPage) fetchNextPage(); }}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={
            <View style={{ alignItems: "center", justifyContent: "center", padding: 40 }}>
              <Text style={{ fontSize: 13, color: "#A09683" }}>No messages yet. Say hello!</Text>
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
            paddingVertical: 10,
            paddingBottom: insets.bottom + 10,
            borderTopWidth: 1,
            borderTopColor: "#E0D5C0",
            backgroundColor: "#FAFAF7",
            gap: 8,
          }}
        >
          <TouchableOpacity
            onPress={() => setOfferModal(true)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: "#EDE5D6",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ fontSize: 16 }}>$</Text>
          </TouchableOpacity>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message…"
            multiline
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: "#C8B99A",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 9,
              fontSize: 14,
              color: "#2C2416",
              backgroundColor: "#FFFFFF",
              maxHeight: 100,
            }}
            placeholderTextColor="#A09683"
          />
          <TouchableOpacity
            onPress={send}
            disabled={!text.trim() || sendMsg.isPending}
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              backgroundColor: text.trim() ? "#B5604A" : "#E0D5C0",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: text.trim() ? "#fff" : "#A09683", fontSize: 16 }}>↑</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <OfferModal
        visible={offerModal}
        onClose={() => setOfferModal(false)}
        convId={convId}
      />
    </View>
  );
}
