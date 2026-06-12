import { View, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useMySettings } from "@/hooks/use-settings";
import { colors, radius } from "@/lib/theme";
import { AppText, ScalePressable, StackHeader } from "@/components/ui";

const SECTIONS: {
  route: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  caption: string;
}[] = [
  { route: "/settings/profile", icon: "person-outline", label: "Profile", caption: "Name, bio, username" },
  { route: "/settings/account", icon: "key-outline", label: "Account", caption: "Email, password, sign-in" },
  { route: "/settings/contact", icon: "call-outline", label: "Contact & pickup", caption: "Phone, suburb" },
  { route: "/settings/notifications", icon: "notifications-outline", label: "Notifications", caption: "What we ping you about" },
  { route: "/settings/preferences", icon: "options-outline", label: "Preferences", caption: "Payments, pickup times, offers" },
  { route: "/settings/privacy", icon: "shield-checkmark-outline", label: "Privacy", caption: "Who can message you" },
];

export default function SettingsIndex() {
  const router = useRouter();
  const { data: settings } = useMySettings();

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Settings" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        <View
          style={{
            backgroundColor: colors.surfaceLow,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            overflow: "hidden",
          }}
        >
          {SECTIONS.map((s, i) => (
            <ScalePressable
              key={s.route}
              onPress={() => router.push(s.route as never)}
              haptic="selection"
              pressScale={0.99}
              accessibilityRole="button"
              accessibilityLabel={s.label}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 14,
                paddingVertical: 14,
                borderBottomWidth: i === SECTIONS.length - 1 ? 0 : 1,
                borderBottomColor: colors.outlineVariant,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 17,
                  backgroundColor: colors.surfaceContainer,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name={s.icon} size={17} color={colors.onSurfaceVariant} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText weight="medium" style={{ fontSize: 14.5 }}>
                  {s.label}
                </AppText>
                <AppText variant="caption" tone="faint">
                  {s.caption}
                </AppText>
              </View>
              <Ionicons name="chevron-forward" size={15} color={colors.ink300} />
            </ScalePressable>
          ))}
        </View>

        {settings?.username ? (
          <AppText variant="caption" tone="faint" style={{ textAlign: "center", marginTop: 8 }}>
            Signed in as @{settings.username}
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}
