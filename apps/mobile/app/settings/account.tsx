import { useState } from "react";
import { View, ScrollView, Alert } from "react-native";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
} from "firebase/auth";
import { Ionicons } from "@expo/vector-icons";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/contexts/auth-context";
import { colors, radius } from "@/lib/theme";
import { AppText, Button, Chip, Field, StackHeader, triggerHaptic } from "@/components/ui";

export default function AccountSettings() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const fbUser = auth?.currentUser;
  const hasPasswordProvider = !!fbUser?.providerData.some((p) => p.providerId === "password");
  const hasGoogle = !!fbUser?.providerData.some((p) => p.providerId === "google.com");

  async function changePassword() {
    if (!fbUser?.email) return;
    if (newPassword.length < 6) {
      Alert.alert("Weak password", "Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Mismatch", "New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const cred = EmailAuthProvider.credential(fbUser.email, currentPassword);
      await reauthenticateWithCredential(fbUser, cred);
      await updatePassword(fbUser, newPassword);
      triggerHaptic("success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      Alert.alert("Password updated", "Use your new password next time you sign in.");
    } catch (err) {
      const code = (err as { code?: string }).code;
      Alert.alert(
        "Couldn't change password",
        code === "auth/wrong-password" || code === "auth/invalid-credential"
          ? "Current password is incorrect."
          : "Something went wrong. Try again."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Account" />
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
        {/* Email */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            padding: 14,
            backgroundColor: colors.surfaceLow,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
          }}
        >
          <Ionicons name="mail-outline" size={18} color={colors.onSurfaceVariant} />
          <View style={{ flex: 1 }}>
            <AppText variant="micro" tone="faint">
              Email
            </AppText>
            <AppText weight="medium" numberOfLines={1} style={{ fontSize: 14.5 }}>
              {user?.email ?? "—"}
            </AppText>
          </View>
          {user?.emailVerified ? <Chip label="Verified" status="live" size="sm" /> : null}
        </View>

        {/* Sign-in methods */}
        <View
          style={{
            padding: 14,
            backgroundColor: colors.surfaceLow,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: colors.outlineVariant,
            gap: 10,
          }}
        >
          <AppText variant="micro" tone="faint">
            Sign-in methods
          </AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="logo-google" size={16} color={colors.onSurfaceVariant} />
            <AppText weight="medium" style={{ flex: 1, fontSize: 14 }}>
              Google
            </AppText>
            {hasGoogle ? (
              <Chip label="Connected" status="live" size="sm" />
            ) : (
              <Chip label="Not connected" size="sm" />
            )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="key-outline" size={16} color={colors.onSurfaceVariant} />
            <AppText weight="medium" style={{ flex: 1, fontSize: 14 }}>
              Email & password
            </AppText>
            {hasPasswordProvider ? (
              <Chip label="Enabled" status="live" size="sm" />
            ) : (
              <Chip label="Not set" size="sm" />
            )}
          </View>
        </View>

        {/* Password change */}
        {isFirebaseConfigured && hasPasswordProvider ? (
          <>
            <AppText variant="heading" style={{ fontSize: 15.5, marginTop: 4 }}>
              Change password
            </AppText>
            <Field
              label="Current password"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label="New password"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Field
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
            <Button
              label="Update password"
              disabled={!currentPassword || !newPassword || !confirmPassword}
              loading={saving}
              onPress={changePassword}
            />
          </>
        ) : !isFirebaseConfigured ? (
          <AppText variant="caption" tone="faint" style={{ textAlign: "center" }}>
            Password management unavailable in dev mode.
          </AppText>
        ) : null}
      </ScrollView>
    </View>
  );
}
