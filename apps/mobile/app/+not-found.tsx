import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";

export default function NotFound() {
  const router = useRouter();
  return (
    <View className="flex-1 items-center justify-center bg-surface px-6">
      <Text className="text-lg font-semibold text-on-surface mb-2">Page not found</Text>
      <Text className="text-sm text-on-surface-variant mb-6 text-center">
        This screen doesn&apos;t exist.
      </Text>
      <TouchableOpacity
        className="rounded-xl bg-primary px-6 py-3"
        onPress={() => router.replace("/(tabs)")}
      >
        <Text className="text-on-primary font-medium">Go home</Text>
      </TouchableOpacity>
    </View>
  );
}
