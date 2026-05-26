import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMySettings,
  updateProfile,
  updateLocation,
  updateNotifications,
  updatePreferences,
  updatePrivacy,
} from "@/lib/api";
import type { NotifPrefs, SellerPrefs, PrivacyPrefs } from "@/lib/types";
import { useAuth } from "@/hooks/use-auth";

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

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ displayName, bio }: { displayName: string | null; bio: string | null }) =>
      updateProfile(displayName, bio),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ suburb, state }: { suburb: string | null; state: string | null }) =>
      updateLocation(suburb, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotifPrefs) => updateNotifications(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: SellerPrefs) => updatePreferences(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: PrivacyPrefs) => updatePrivacy(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
  });
}
