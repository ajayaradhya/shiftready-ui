import { View, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1 bg-surface" style={{ paddingTop: insets.top }}>
      <View className="px-4 pt-4 pb-3 border-b border-outline-variant bg-surface">
        <Text className="text-2xl font-bold text-on-surface">Messages</Text>
      </View>
      <View className="flex-1 items-center justify-center">
        <Text className="text-on-surface-variant">Your conversations — Phase 3</Text>
      </View>
    </View>
  );
}
