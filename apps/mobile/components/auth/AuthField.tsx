import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius } from "@/lib/theme";
import { AppText } from "@/components/ui";

export interface AuthFieldProps extends TextInputProps {
  label: string;
}

export function AuthField({ label, ...rest }: AuthFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="caption" weight="medium">
        {label}
      </AppText>
      <TextInput
        placeholderTextColor={colors.ink300}
        accessibilityLabel={label}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          borderWidth: focused ? 1.5 : 1,
          borderColor: focused ? colors.clay600 : colors.outlineVariant,
          borderRadius: radius.md,
          paddingHorizontal: 14,
          paddingVertical: 12,
          fontFamily: fonts.regular,
          fontSize: 15,
          color: colors.onSurface,
          backgroundColor: colors.surfaceLowest,
        }}
        {...rest}
      />
    </View>
  );
}

export function GoogleLogo({ size = 18 }: { size?: number }) {
  // Text-free four-color G built from positioned views is overkill in RN;
  // use the official "G" glyph colors on a white disc.
  return (
    <View
      style={{
        width: size + 6,
        height: size + 6,
        borderRadius: (size + 6) / 2,
        backgroundColor: colors.surfaceLowest,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: colors.outlineVariant,
      }}
    >
      {/* Google brand blue — intentional external brand color */}
      <AppText weight="bold" style={{ fontSize: size - 4, lineHeight: size, color: "#4285F4" }}>
        G
      </AppText>
    </View>
  );
}
