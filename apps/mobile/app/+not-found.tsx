import { View } from "react-native";
import { useRouter } from "expo-router";
import { colors } from "@/lib/theme";
import { EmptyState } from "@/components/ui";

export default function NotFound() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.surface }}>
      <EmptyState
        icon="compass-outline"
        title="Page not found"
        body="This screen doesn't exist — let's get you back to the market."
        ctaLabel="Back to market"
        onCtaPress={() => router.replace("/(tabs)")}
      />
    </View>
  );
}
