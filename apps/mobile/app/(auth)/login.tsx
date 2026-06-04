import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Link } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Wordmark */}
          <View className="mb-10">
            <Text className="text-3xl font-bold text-on-surface">ShiftReady</Text>
            <Text className="mt-1 text-on-surface-variant text-base">
              Sign in to your account
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3 border border-red-200">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          {/* Email */}
          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-on-surface">Email</Text>
            <TextInput
              className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface text-base"
              placeholder="you@example.com"
              placeholderTextColor="#A09683"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          {/* Password */}
          <View className="mb-6">
            <Text className="mb-1.5 text-sm font-medium text-on-surface">Password</Text>
            <TextInput
              className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface text-base"
              placeholder="••••••••"
              placeholderTextColor="#A09683"
              secureTextEntry
              autoComplete="current-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleSignIn}
              returnKeyType="go"
            />
          </View>

          {/* Sign in button */}
          <TouchableOpacity
            className="items-center rounded-xl bg-primary py-3.5"
            onPress={handleSignIn}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-on-primary font-semibold text-base">Sign in</Text>
            )}
          </TouchableOpacity>

          {/* Register link */}
          <View className="mt-6 flex-row justify-center">
            <Text className="text-on-surface-variant text-sm">
              Don&apos;t have an account?{" "}
            </Text>
            <Link href="/(auth)/register" asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-medium">Create one</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
