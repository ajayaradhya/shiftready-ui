import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { colors, fonts, radius } from "@/lib/theme";
import { AppText, Button, ScalePressable } from "@/components/ui";
import { AuthField, GoogleLogo } from "@/components/auth/AuthField";

export default function RegisterScreen() {
  const { register, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleRegister() {
    if (!displayName || !email || !password) {
      setError("Please fill in all fields.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await register(displayName.trim(), email.trim(), password);
      router.replace("/(tabs)");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setGoogleLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.surface }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={{ flex: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 48 }}>
          <View style={{ marginBottom: 36 }}>
            <AppText style={{ fontFamily: fonts.displayBold, fontSize: 38, lineHeight: 46, color: colors.onSurface }}>
              Myrio
            </AppText>
            <AppText tone="muted" style={{ marginTop: 6, fontSize: 16 }}>
              Create your account — sell a whole home in minutes.
            </AppText>
          </View>

          {error ? (
            <View
              style={{
                marginBottom: 16,
                borderRadius: radius.md,
                backgroundColor: colors.errorContainer,
                paddingHorizontal: 14,
                paddingVertical: 11,
              }}
            >
              <AppText variant="caption" style={{ color: colors.onErrorContainer }}>
                {error}
              </AppText>
            </View>
          ) : null}

          <View style={{ gap: 14 }}>
            <AuthField
              label="Display name"
              placeholder="Jane Citizen"
              autoComplete="name"
              value={displayName}
              onChangeText={setDisplayName}
            />
            <AuthField
              label="Email"
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
            <AuthField
              label="Password"
              placeholder="At least 6 characters"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />
          </View>

          <Button
            label="Create account"
            size="lg"
            block
            loading={loading}
            disabled={googleLoading}
            onPress={handleRegister}
            style={{ marginTop: 22 }}
          />

          <View style={{ marginVertical: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            <AppText variant="caption" tone="faint">
              or
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
          </View>

          <ScalePressable
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
            haptic="selection"
            accessibilityRole="button"
            accessibilityLabel="Continue with Google"
            style={{
              height: 52,
              borderRadius: radius.lg,
              borderWidth: 1,
              borderColor: colors.outlineVariant,
              backgroundColor: colors.surfaceLowest,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: googleLoading ? 0.6 : 1,
            }}
          >
            <GoogleLogo />
            <AppText weight="medium" style={{ fontSize: 15 }}>
              {googleLoading ? "Connecting…" : "Continue with Google"}
            </AppText>
          </ScalePressable>

          <AppText
            variant="caption"
            tone="faint"
            style={{ textAlign: "center", marginTop: 16, paddingHorizontal: 12 }}
          >
            By creating an account you agree to Myrio's terms of service and privacy policy.
          </AppText>

          <View style={{ marginTop: 24, flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <AppText variant="caption" tone="muted">
              Already have an account?
            </AppText>
            <Link href="/(auth)/login" asChild>
              <ScalePressable accessibilityRole="link" accessibilityLabel="Sign in">
                <AppText variant="caption" weight="semibold" style={{ color: colors.clay600 }}>
                  Sign in
                </AppText>
              </ScalePressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
