import { useEffect, useState } from "react";
import { View, ScrollView } from "react-native";
import { useMySettings, useUpdateProfile, useUpdateUsername, useUsernameAvailability } from "@/hooks/use-settings";
import { useAuth } from "@/contexts/auth-context";
import { colors } from "@/lib/theme";
import { AppText, Avatar, Button, Field, Skeleton, StackHeader } from "@/components/ui";

function cooldownDaysLeft(changedAt: string | null): number {
  if (!changedAt) return 0;
  const elapsed = Date.now() - new Date(changedAt).getTime();
  return Math.max(0, Math.ceil(7 - elapsed / 86400000));
}

export default function ProfileSettings() {
  const { user } = useAuth();
  const { data: settings, isLoading } = useMySettings();
  const updateProfile = useUpdateProfile();
  const updateUsername = useUpdateUsername();

  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [username, setUsername] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (settings && !hydrated) {
      setDisplayName(settings.displayName ?? "");
      setBio(settings.bio ?? "");
      setUsername(settings.username ?? "");
      setHydrated(true);
    }
  }, [settings, hydrated]);

  const availability = useUsernameAvailability(username, settings?.username);
  const cooldown = cooldownDaysLeft(settings?.usernameChangedAt ?? null);
  const usernameChanged = hydrated && username.trim().toLowerCase() !== (settings?.username ?? "");

  const usernameHint =
    availability === "checking"
      ? "Checking availability…"
      : availability === "available"
      ? "Available!"
      : availability === "taken"
      ? "Already taken."
      : availability === "invalid"
      ? "3–20 characters, lowercase letters, numbers and _ only."
      : cooldown > 0
      ? `You can change your username again in ${cooldown} day${cooldown !== 1 ? "s" : ""}.`
      : "Changing your username locks it for 7 days.";

  const profileDirty =
    hydrated &&
    (displayName !== (settings?.displayName ?? "") || bio !== (settings?.bio ?? ""));

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <StackHeader title="Profile" />
      {isLoading || !settings ? (
        <View style={{ padding: 16, gap: 12 }}>
          <Skeleton width={72} height={72} borderRadius={36} />
          <Skeleton width="100%" height={44} borderRadius={12} />
          <Skeleton width="100%" height={88} borderRadius={12} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 8 }}>
            <Avatar name={settings.username ?? displayName} uri={user?.photoURL} size={72} />
            <AppText variant="caption" tone="faint">
              Profile photo comes from your sign-in account
            </AppText>
          </View>

          <Field label="Display name" value={displayName} onChangeText={setDisplayName} placeholder="Your name" />
          <Field
            label="Seller bio"
            value={bio}
            onChangeText={setBio}
            placeholder="A line or two buyers will see on your sales"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: "top" }}
          />
          <Button
            label="Save profile"
            disabled={!profileDirty}
            loading={updateProfile.isPending}
            onPress={() =>
              updateProfile.mutate({ displayName: displayName.trim() || null, bio: bio.trim() || null })
            }
          />

          <View style={{ height: 1, backgroundColor: colors.outlineVariant, marginVertical: 4 }} />

          <Field
            label="Username"
            value={username}
            onChangeText={(t) => setUsername(t.toLowerCase())}
            autoCapitalize="none"
            autoCorrect={false}
            hint={usernameHint}
            hintTone={
              availability === "available" ? "success" : availability === "taken" || availability === "invalid" ? "error" : "muted"
            }
          />
          <Button
            label="Change username"
            variant="secondary"
            disabled={!usernameChanged || availability !== "available" || cooldown > 0}
            loading={updateUsername.isPending}
            onPress={() => updateUsername.mutate(username.trim().toLowerCase())}
          />
        </ScrollView>
      )}
    </View>
  );
}
