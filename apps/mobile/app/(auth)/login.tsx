import { useState } from "react";
import {
  View,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/contexts/auth-context";
import { colors, fonts, radius } from "@/lib/theme";
import { AppText, Button, ScalePressable } from "@/components/ui";
import { AuthField, GoogleLogo } from "@/components/auth/AuthField";

export default function LoginScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleSignIn() {
    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signIn(email.trim(), password);
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
          {/* Wordmark */}
          <View style={{ marginBottom: 36 }}>
            <AppText style={{ fontFamily: fonts.displayBold, fontSize: 38, lineHeight: 46, color: colors.onSurface }}>
              Myrio
            </AppText>
            <AppText tone="muted" style={{ marginTop: 6, fontSize: 16 }}>
              Moving out? Everything must go.
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
              placeholder="••••••••"
              secureTextEntry
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
            />
          </View>

          <Button
            label="Sign in"
            size="lg"
            block
            loading={loading}
            disabled={googleLoading}
            onPress={handleSignIn}
            style={{ marginTop: 22 }}
          />

          {/* Divider */}
          <View style={{ marginVertical: 20, flexDirection: "row", alignItems: "center", gap: 12 }}>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
            <AppText variant="caption" tone="faint">
              or
            </AppText>
            <View style={{ flex: 1, height: 1, backgroundColor: colors.outlineVariant }} />
          </View>

          {/* Google */}
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

          {/* Register link */}
          <View style={{ marginTop: 28, flexDirection: "row", justifyContent: "center", gap: 4 }}>
            <AppText variant="caption" tone="muted">
              Don't have an account?
            </AppText>
            <Link href="/(auth)/register" asChild>
              <ScalePressable accessibilityRole="link" accessibilityLabel="Create an account">
                <AppText variant="caption" weight="semibold" style={{ color: colors.clay600 }}>
                  Create one
                </AppText>
              </ScalePressable>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
