import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getMySettings,
  updateProfile,
  updateLocation,
  updateNotifications,
  updatePreferences,
  updatePrivacy,
} from "@shiftready/api";
import type { NotifPrefs, SellerPrefs, PrivacyPrefs } from "@shiftready/types";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

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
    onError: (err: Error) => toast.error(err.message || "Failed to save profile"),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ suburb, state }: { suburb: string | null; state: string | null }) =>
      updateLocation(suburb, state),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
    onError: (err: Error) => toast.error(err.message || "Failed to save location"),
  });
}

export function useUpdateNotifications() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: NotifPrefs) => updateNotifications(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
    onError: (err: Error) => toast.error(err.message || "Failed to save notification preferences"),
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: SellerPrefs) => updatePreferences(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
    onError: (err: Error) => toast.error(err.message || "Failed to save preferences"),
  });
}

export function useUpdatePrivacy() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (prefs: PrivacyPrefs) => updatePrivacy(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: SETTINGS_KEY }),
    onError: (err: Error) => toast.error(err.message || "Failed to save privacy settings"),
  });
}
