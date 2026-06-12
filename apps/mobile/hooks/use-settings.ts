import { Alert } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMySettings,
  updateProfile,
  updateLocation,
  updateNotifications,
  updatePreferences,
  updatePrivacy,
  updateMyPhone,
  updateUsername,
  checkUsernameAvailable,
} from "@myrio/api";
import type { NotifPrefs, SellerPrefs, PrivacyPrefs, UserSettings } from "@myrio/types";
import { useAuth } from "@/contexts/auth-context";
import { useEffect, useState } from "react";

const SETTINGS_KEY = ["settings", "me"];

export function useMySettings() {
  const { idToken } = useAuth();
  return useQuery({
    queryKey: SETTINGS_KEY,
    queryFn: getMySettings,
    staleTime: 5 * 60 * 1000,
    enabled: !!idToken,
  });
}

function useSettingsMutation<TVars>(
  fn: (vars: TVars) => Promise<unknown>,
  errorTitle: string,
  optimistic?: (old: UserSettings, vars: TVars) => UserSettings
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onMutate: optimistic
      ? async (vars: TVars) => {
          await qc.cancelQueries({ queryKey: SETTINGS_KEY });
          const prev = qc.getQueryData<UserSettings>(SETTINGS_KEY);
          if (prev) qc.setQueryData(SETTINGS_KEY, optimistic(prev, vars));
          return { prev };
        }
      : undefined,
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
    onError: (err: Error, _vars, ctx) => {
      const c = ctx as { prev?: UserSettings } | undefined;
      if (c?.prev) qc.setQueryData(SETTINGS_KEY, c.prev);
      Alert.alert(errorTitle, err.message);
    },
  });
}

export function useUpdateProfile() {
  return useSettingsMutation(
    ({ displayName, bio }: { displayName: string | null; bio: string | null }) =>
      updateProfile(displayName, bio),
    "Failed to save profile"
  );
}

export function useUpdateLocation() {
  return useSettingsMutation(
    ({ suburb, state }: { suburb: string | null; state: string | null }) =>
      updateLocation(suburb, state),
    "Failed to save location"
  );
}

export function useUpdatePhone() {
  return useSettingsMutation(
    ({ phoneE164, shareOptIn }: { phoneE164: string; shareOptIn: boolean }) =>
      updateMyPhone(phoneE164, shareOptIn),
    "Failed to save phone number"
  );
}

export function useUpdateNotifications() {
  return useSettingsMutation(
    (prefs: NotifPrefs) => updateNotifications(prefs),
    "Failed to save notifications",
    (old, prefs) => ({ ...old, notifPrefs: prefs })
  );
}

export function useUpdatePreferences() {
  return useSettingsMutation(
    (prefs: SellerPrefs) => updatePreferences(prefs),
    "Failed to save preferences",
    (old, prefs) => ({ ...old, sellerPrefs: prefs })
  );
}

export function useUpdatePrivacy() {
  return useSettingsMutation(
    (prefs: PrivacyPrefs) => updatePrivacy(prefs),
    "Failed to save privacy settings",
    (old, prefs) => ({ ...old, privacyPrefs: prefs })
  );
}

export function useUpdateUsername() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (username: string) => updateUsername(username),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SETTINGS_KEY });
      qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (err: Error) => Alert.alert("Username change failed", err.message),
  });
}

export type UsernameCheck = "idle" | "checking" | "available" | "taken" | "invalid";

/** Debounced live availability check while the user types. */
export function useUsernameAvailability(username: string, current: string | undefined) {
  const [state, setState] = useState<UsernameCheck>("idle");

  useEffect(() => {
    const u = username.trim().toLowerCase();
    if (!u || u === current) {
      setState("idle");
      return;
    }
    if (!/^[a-z0-9_]{3,20}$/.test(u)) {
      setState("invalid");
      return;
    }
    setState("checking");
    let cancelled = false;
    const t = setTimeout(async () => {
      try {
        const res = await checkUsernameAvailable(u);
        if (!cancelled) setState(res.available ? "available" : "taken");
      } catch {
        if (!cancelled) setState("idle");
      }
    }, 450);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [username, current]);

  return state;
}
