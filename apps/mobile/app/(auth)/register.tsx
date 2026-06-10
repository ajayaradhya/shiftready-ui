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
import { Link, useRouter } from "expo-router";
import { useAuth } from "@/contexts/auth-context";

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
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          <View className="mb-10">
            <Text className="text-3xl font-bold text-on-surface">Create account</Text>
            <Text className="mt-1 text-on-surface-variant text-base">
              Join Myrio to buy and sell
            </Text>
          </View>

          {error && (
            <View className="mb-4 rounded-xl bg-red-50 px-4 py-3 border border-red-200">
              <Text className="text-error text-sm">{error}</Text>
            </View>
          )}

          <View className="mb-4">
            <Text className="mb-1.5 text-sm font-medium text-on-surface">Full name</Text>
            <TextInput
              className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface text-base"
              placeholder="Alex Smith"
              placeholderTextColor="#A09683"
              autoCapitalize="words"
              autoComplete="name"
              value={displayName}
              onChangeText={setDisplayName}
            />
          </View>

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

          <View className="mb-6">
            <Text className="mb-1.5 text-sm font-medium text-on-surface">Password</Text>
            <TextInput
              className="rounded-xl border border-outline-variant bg-surface-container-low px-4 py-3 text-on-surface text-base"
              placeholder="At least 6 characters"
              placeholderTextColor="#A09683"
              secureTextEntry
              autoComplete="new-password"
              value={password}
              onChangeText={setPassword}
              onSubmitEditing={handleRegister}
              returnKeyType="go"
            />
          </View>

          <TouchableOpacity
            className="items-center rounded-xl bg-primary py-3.5"
            onPress={handleRegister}
            disabled={loading || googleLoading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-on-primary font-semibold text-base">Create account</Text>
            )}
          </TouchableOpacity>

          {/* Divider */}
          <View className="my-5 flex-row items-center gap-3">
            <View className="flex-1 h-px bg-outline-variant" />
            <Text className="text-on-surface-variant text-xs">or</Text>
            <View className="flex-1 h-px bg-outline-variant" />
          </View>

          {/* Google Sign-In */}
          <TouchableOpacity
            className="items-center flex-row justify-center rounded-xl border border-outline-variant bg-surface py-3.5 gap-2"
            onPress={handleGoogleSignIn}
            disabled={loading || googleLoading}
          >
            {googleLoading ? (
              <ActivityIndicator color="#4285F4" />
            ) : (
              <>
                <Text className="font-bold text-base" style={{ color: "#4285F4" }}>G</Text>
                <Text className="text-on-surface font-medium text-base">Continue with Google</Text>
              </>
            )}
          </TouchableOpacity>

          <View className="mt-6 flex-row justify-center">
            <Text className="text-on-surface-variant text-sm">
              Already have an account?{" "}
            </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text className="text-primary text-sm font-medium">Sign in</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
