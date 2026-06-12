import { View, Platform } from "react-native";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "@/lib/reanimated";
import { useEffect } from "react";
import { colors } from "@/lib/theme";
import { AppText } from "@/components/ui/AppText";
import { ScalePressable, triggerHaptic } from "@/components/ui/Pressable";

type IconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { default: IconName; active: IconName; label: string }> = {
  index: { default: "storefront-outline", active: "storefront", label: "Market" },
  saved: { default: "heart-outline", active: "heart", label: "Saved" },
  sell: { default: "camera", active: "camera", label: "Sell" },
  messages: { default: "chatbubble-outline", active: "chatbubble", label: "Messages" },
  profile: { default: "person-outline", active: "person", label: "Profile" },
};

function TabIcon({ name, focused }: { name: { default: IconName; active: IconName }; focused: boolean }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, { damping: 14, stiffness: 250 });
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View style={style}>
      <Ionicons
        name={focused ? name.active : name.default}
        size={24}
        color={focused ? colors.clay600 : colors.ink300}
      />
    </Animated.View>
  );
}

export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === "ios" ? 0 : 8);

  return (
    <View
      style={{
        flexDirection: "row",
        backgroundColor: colors.surface,
        borderTopWidth: 1,
        borderTopColor: colors.outlineVariant,
        paddingBottom: bottomPad,
        paddingTop: 6,
        alignItems: "flex-end",
      }}
    >
      {state.routes.map((route, index) => {
        const icons = TAB_ICONS[route.name];
        if (!icons) return null;
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];
        const badge = options.tabBarBadge;
        const isFab = route.name === "sell";

        const onPress = () => {
          triggerHaptic("selection");
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        if (isFab) {
          return (
            <View key={route.key} style={{ flex: 1, alignItems: "center" }}>
              <ScalePressable
                onPress={onPress}
                pressScale={0.92}
                accessibilityRole="button"
                accessibilityLabel="Sell — capture items"
                accessibilityState={{ selected: isFocused }}
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: 28,
                  backgroundColor: colors.clay600,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -26,
                  borderWidth: 4,
                  borderColor: colors.surface,
                  boxShadow: "0 4px 12px rgba(74, 37, 25, 0.28)",
                }}
              >
                <Ionicons name="camera" size={26} color={colors.onPrimary} />
              </ScalePressable>
              <AppText
                variant="micro"
                style={{
                  marginTop: 3,
                  color: isFocused ? colors.clay600 : colors.ink300,
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                Sell
              </AppText>
            </View>
          );
        }

        return (
          <ScalePressable
            key={route.key}
            onPress={onPress}
            pressScale={0.95}
            accessibilityRole="tab"
            accessibilityLabel={icons.label}
            accessibilityState={{ selected: isFocused }}
            style={{ flex: 1, alignItems: "center", paddingVertical: 4, gap: 3 }}
          >
            <View>
              <TabIcon name={icons} focused={isFocused} />
              {badge != null ? (
                <View
                  style={{
                    position: "absolute",
                    top: -4,
                    right: -10,
                    minWidth: 17,
                    height: 17,
                    borderRadius: 9,
                    backgroundColor: colors.clay600,
                    alignItems: "center",
                    justifyContent: "center",
                    paddingHorizontal: 4,
                  }}
                >
                  <AppText
                    weight="bold"
                    style={{ color: colors.onPrimary, fontSize: 10, lineHeight: 13 }}
                  >
                    {String(badge)}
                  </AppText>
                </View>
              ) : null}
            </View>
            <AppText
              variant="micro"
              style={{
                color: isFocused ? colors.clay600 : colors.ink300,
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              {icons.label}
            </AppText>
          </ScalePressable>
        );
      })}
    </View>
  );
}
