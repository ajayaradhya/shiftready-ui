import { TextInput, View, type TextInputProps } from "react-native";
import { colors, fonts, radius } from "@/lib/theme";
import { AppText } from "./AppText";

export interface FieldProps extends TextInputProps {
  label?: string;
  /** Helper or error line under the input. */
  hint?: string;
  hintTone?: "muted" | "error" | "success";
}

/** Labelled text input in the cream/clay look. */
export function Field({ label, hint, hintTone = "muted", style, ...rest }: FieldProps) {
  return (
    <View>
      {label ? (
        <AppText variant="caption" tone="muted" style={{ marginBottom: 5 }}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={colors.ink300}
        accessibilityLabel={label}
        style={[
          {
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            borderRadius: radius.md,
            paddingHorizontal: 12,
            paddingVertical: 10,
            fontFamily: fonts.regular,
            fontSize: 15,
            color: colors.onSurface,
            backgroundColor: colors.surfaceLowest,
          },
          style,
        ]}
        {...rest}
      />
      {hint ? (
        <AppText
          variant="caption"
          tone={hintTone === "muted" ? "muted" : hintTone}
          style={{ marginTop: 4, fontSize: 12 }}
        >
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}
