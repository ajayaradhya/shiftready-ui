import { Modal, KeyboardAvoidingView, Platform, View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, radius } from "@/lib/theme";
import { AppText } from "./AppText";
import { ScalePressable } from "./Pressable";
import { Ionicons } from "@expo/vector-icons";

export interface SheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Wrap content in a ScrollView (for tall sheets). */
  scroll?: boolean;
}

/** Standard bottom sheet: backdrop, grab handle, title row, keyboard avoidance. */
export function Sheet({ visible, onClose, title, children, scroll }: SheetProps) {
  const insets = useSafeAreaInsets();

  const body = (
    <View
      style={{
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: 20,
        paddingBottom: Math.max(insets.bottom, 16) + 12,
        gap: 14,
        maxHeight: "88%",
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
      {title ? (
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <AppText variant="title" numberOfLines={1} style={{ fontSize: 19, flex: 1 }}>
            {title}
          </AppText>
          <ScalePressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center", marginRight: -12 }}
          >
            <Ionicons name="close" size={22} color={colors.ink300} />
          </ScalePressable>
        </View>
      ) : null}
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 14 }}
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <ScalePressable
        style={{ flex: 1, backgroundColor: "rgba(20,17,13,0.4)" }}
        onPress={onClose}
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
      />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {body}
      </KeyboardAvoidingView>
    </Modal>
  );
}
