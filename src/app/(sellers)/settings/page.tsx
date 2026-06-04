"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";
import { SYDNEY_SUBURBS, suburbsForPostcode, isValidPostcode, type Suburb } from "@/lib/locations";
import { useAuth } from "@/hooks/use-auth";
import { useUsername, useUsernameAvailability } from "@/hooks/use-username";
import { useUpdateMyPhone } from "@/hooks/use-phone";
import {
  useMySettings,
  useUpdateProfile,
  useUpdateLocation,
  useUpdateNotifications,
  useUpdatePreferences,
  useUpdatePrivacy,
  useUploadAvatar,
  useRemoveAvatar,
} from "@/hooks/use-settings";
import type { NotifPrefs, SellerPrefs, PrivacyPrefs } from "@/lib/types";

// ── Icons ──────────────────────────────────────────────────────────────────
const IcUser = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5.5" r="2.5"/><path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5"/>
  </svg>
);
const IcLock = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="7" width="10" height="7" rx="1.5"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>
  </svg>
);
const IcPhone = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3.5 2h3l1.5 3.5-2 1.2a7 7 0 0 0 3.3 3.3L10.5 8 14 9.5v3c0 .8-.7 1.5-1.5 1.5C6 14 2 10 2 3.5A1.5 1.5 0 0 1 3.5 2Z"/>
  </svg>
);
const IcNotif = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 6.5A3 3 0 0 1 11 6.5c0 4 2 5 2 5H3s2-1 2-5"/><path d="M7 11.5a1 1 0 0 0 2 0"/>
  </svg>
);
const IcSliders = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M2 8h12M2 12h12"/><circle cx="5" cy="4" r="1.5" fill="var(--sr-bg-card)" stroke="currentColor"/><circle cx="11" cy="8" r="1.5" fill="var(--sr-bg-card)" stroke="currentColor"/><circle cx="7" cy="12" r="1.5" fill="var(--sr-bg-card)" stroke="currentColor"/>
  </svg>
);
const IcShield = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2L3 4v4c0 3.3 2.2 5.8 5 6.8C10.8 13.8 13 11.3 13 8V4L8 2Z"/>
  </svg>
);
const IcCam = () => (
  <svg width="18" height="18" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 16V8a1 1 0 0 1 1-1h2l1.5-2.5h5L13 7h6a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1Z"/><circle cx="11" cy="11" r="2.5"/>
  </svg>
);
const IcCheck = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m2 6 3 3 5-5"/>
  </svg>
);
const IcWarn = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2L2 14h12L8 2Z"/><path d="M8 7v3"/><circle cx="8" cy="12" r=".75" fill="currentColor"/>
  </svg>
);
const IcTrash = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 3.5h9M5.5 3.5V2h3v1.5M12 3.5l-.7 8a1.5 1.5 0 0 1-1.5 1H4.2a1.5 1.5 0 0 1-1.5-1l-.7-8"/>
  </svg>
);
const IcUnblock = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="7" cy="7" r="5.5"/><path d="m4 10 6-6"/>
  </svg>
);
const IcExport = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 1v8M4 4 7 1l3 3"/><path d="M2 9v3h10V9"/>
  </svg>
);
const IcMap = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M7 12S2.5 8 2.5 5a4.5 4.5 0 0 1 9 0C11.5 8 7 12 7 12Z"/><circle cx="7" cy="5" r="1.5"/>
  </svg>
);
const IcEmail = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1.5" y="3.5" width="13" height="9" rx="1.5"/><path d="m1.5 4.5 6.5 5 6.5-5"/>
  </svg>
);
const IcKey = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5.5" cy="8" r="3"/><path d="M8.5 8h6M12 6.5v3"/>
  </svg>
);
const IcGoogle = () => (
  <svg width="14" height="14" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.48h4.844a4.14 4.14 0 0 1-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615Z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z"/>
  </svg>
);

// ── Shared primitives ───────────────────────────────────────────────────────
type Toast = { type: "ok" | "err"; msg: string } | null;

function useSave(delay = 1600) {
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<Toast>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const save = useCallback((ok = true) => {
    setSaving(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSaving(false);
      setToast(ok ? { type: "ok", msg: "Changes saved" } : { type: "err", msg: "Something went wrong" });
      timerRef.current = setTimeout(() => setToast(null), delay);
    }, 700);
  }, [delay]);

  return { saving, toast, save };
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      style={{
        width: 36, height: 20, borderRadius: 10, cursor: "pointer", flexShrink: 0,
        background: on ? "var(--moss-500)" : "var(--cream-400)",
        border: "none", outline: "none", padding: 0, position: "relative", transition: "background 160ms",
      }}
      aria-checked={on}
      role="switch"
    >
      <span style={{
        position: "absolute", top: 2, left: 2, width: 16, height: 16,
        borderRadius: "50%", background: "white",
        boxShadow: "0 1px 3px rgba(0,0,0,.18)",
        transition: "transform 160ms", pointerEvents: "none",
        transform: on ? "translateX(16px)" : "translateX(0)",
      }}/>
    </button>
  );
}

function SaveFooter({ toast, onSave, saving, label = "Save changes" }: {
  toast: Toast; onSave: () => void; saving: boolean; label?: string;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      paddingTop: 16, borderTop: "1px solid var(--sr-border-subtle)", marginTop: 20,
    }}>
      <div>
        {toast && (
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "7px 12px", borderRadius: "var(--sr-radius-md)",
            fontSize: 12, fontWeight: 500,
            ...(toast.type === "ok"
              ? { background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)" }
              : { background: "var(--rust-50)", color: "var(--rust-500)", border: "1px solid var(--rust-100)" }),
          }}>
            {toast.type === "ok" ? <IcCheck /> : <IcWarn />}
            {toast.msg}
          </span>
        )}
      </div>
      <button
        onClick={onSave}
        disabled={saving}
        className="s-btn-primary"
      >
        {saving ? "Saving…" : label}
      </button>
    </div>
  );
}

function SCard({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-subtle)",
      borderRadius: "var(--sr-radius-lg)", padding: "22px 24px",
      boxShadow: "var(--sr-shadow-xs)",
    }}>
      {label && (
        <span style={{
          fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const,
          letterSpacing: ".14em", color: "var(--sr-text-muted)", display: "block", marginBottom: 16,
        }}>
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

function SField({ label, hint, hintType, children }: {
  label?: string; hint?: string; hintType?: "ok" | "warn" | "err"; children: React.ReactNode;
}) {
  const hintColor = hintType === "ok" ? "var(--moss-600)" : hintType === "warn" ? "var(--honey-600)" : hintType === "err" ? "var(--rust-500)" : "var(--sr-text-muted)";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
      {label && (
        <label style={{
          fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase" as const,
          letterSpacing: ".14em", color: "var(--sr-text-muted)",
        }}>
          {label}
        </label>
      )}
      {children}
      {hint && (
        <span style={{ fontSize: 11.5, color: hintColor, marginTop: 4, lineHeight: 1.4, display: "flex", alignItems: "center", gap: 5 }}>
          {hintType === "warn" && <IcWarn />}
          {hint}
        </span>
      )}
    </div>
  );
}

function TRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "flex-start", justifyContent: "space-between",
      gap: 20, padding: "12px 0", borderBottom: "1px solid var(--sr-border-subtle)",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>{label}</div>
        {desc && <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 2, lineHeight: 1.4 }}>{desc}</div>}
      </div>
      {children}
    </div>
  );
}

function MethodRow({ icon, label, sub, right }: { icon: React.ReactNode; label: string; sub?: string; right: React.ReactNode }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "11px 0", borderBottom: "1px solid var(--sr-border-subtle)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7, display: "grid", placeItems: "center",
          background: "var(--cream-100)", border: "1px solid var(--sr-border-subtle)", flexShrink: 0,
        }}>
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>{label}</div>
          {sub && <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 1 }}>{sub}</div>}
        </div>
      </div>
      {right}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: "var(--cream-50)", borderWidth: 1, borderStyle: "solid", borderColor: "var(--sr-border-default)",
  borderRadius: "var(--sr-radius-md)", padding: "10px 14px",
  fontFamily: "var(--sr-font-sans)", fontSize: 14,
  color: "var(--sr-text-primary)", width: "100%",
  outline: "none", transition: "border-color 120ms, box-shadow 120ms",
};

function SInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...(focused ? {
          borderColor: "var(--clay-500)",
          background: "var(--sr-bg-card)",
          boxShadow: "var(--sr-shadow-focus)",
        } : {}),
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function STextarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        resize: "none",
        lineHeight: 1.55,
        ...(focused ? {
          borderColor: "var(--clay-500)",
          background: "var(--sr-bg-card)",
          boxShadow: "var(--sr-shadow-focus)",
        } : {}),
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

function SSelect(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  const [focused, setFocused] = useState(false);
  return (
    <select
      {...props}
      style={{
        ...inputStyle,
        cursor: "pointer",
        ...(focused ? {
          borderColor: "var(--clay-500)",
          background: "var(--sr-bg-card)",
          boxShadow: "var(--sr-shadow-focus)",
        } : {}),
        ...props.style,
      }}
      onFocus={e => { setFocused(true); props.onFocus?.(e); }}
      onBlur={e => { setFocused(false); props.onBlur?.(e); }}
    />
  );
}

// ── Section: Profile ────────────────────────────────────────────────────────
function ProfileSection({ userEmail, photoURL }: { userEmail?: string | null; photoURL?: string | null }) {
  const { data: settings } = useMySettings();
  const { profile, isLoading, update, isUpdating } = useUsername();
  const { check, available, isChecking } = useUsernameAvailability();
  const profileMutation = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [displayName, setDisplayName] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [bio, setBio] = useState("");
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { saving, toast, save } = useSave();
  const [usernameSaved, setUsernameSaved] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);

  useEffect(() => {
    if (settings) {
      setDisplayName(settings.displayName ?? "");
      setBio(settings.bio ?? "");
    }
  }, [settings]);

  const handleUsernameChange = (v: string) => {
    const cleaned = v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    setUsernameInput(cleaned);
    setUsernameSaved(false);
    setUsernameError(null);
    if (cleaned.length >= 4 && cleaned !== profile?.username) {
      if (checkTimer.current) clearTimeout(checkTimer.current);
      checkTimer.current = setTimeout(() => check(cleaned), 400);
    }
  };

  const canSaveUsername = usernameInput.length >= 4 && /^[a-zA-Z]/.test(usernameInput)
    && usernameInput !== profile?.username && available && !isUpdating;

  const handleSaveUsername = async () => {
    setUsernameError(null);
    try {
      await update(usernameInput);
      setUsernameSaved(true);
    } catch (err: unknown) {
      setUsernameError(err instanceof Error ? err.message : "Failed to update username");
    }
  };

  const unStatus = isChecking ? "checking"
    : available === true ? "available"
    : available === false ? "taken"
    : null;

  const initials = (profile?.username ?? userEmail ?? "?").slice(0, 2).toUpperCase();
  const [avatarError, setAvatarError] = useState(false);
  const avatarSrc = settings?.avatarUrl ?? photoURL ?? null;

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(false);
    uploadAvatar.mutate(file);
    e.target.value = "";
  };

  const joinedLabel = (() => {
    if (!settings?.joinedAt) return null;
    const d = new Date(settings.joinedAt);
    return `Member since ${d.toLocaleDateString("en-AU", { month: "long", year: "numeric" })}`;
  })();

  if (isLoading) return <div style={{ padding: 24, color: "var(--sr-text-muted)", fontSize: 13 }}>Loading…</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Profile</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>Your public-facing identity on ShiftReady - shown on sale listings and in buyer conversations.</p>
      </div>

      {/* Avatar + identity */}
      <SCard label="Identity">
        <div style={{
          display: "flex", alignItems: "center", gap: 18, padding: 18,
          background: "var(--cream-50)", borderRadius: "var(--sr-radius-md)",
          border: "1px solid var(--sr-border-subtle)", marginBottom: 20,
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: avatarSrc && !avatarError ? undefined : "linear-gradient(135deg, var(--clay-300), var(--clay-600))",
            display: "grid", placeItems: "center",
            color: "var(--cream-50)", fontFamily: "var(--sr-font-serif)",
            fontSize: 26, fontWeight: 600, cursor: "pointer", position: "relative", overflow: "hidden",
          }}
            className="av-lg"
          >
            {avatarSrc && !avatarError ? (
              <Image
                src={avatarSrc}
                alt={initials}
                width={72}
                height={72}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                onError={() => setAvatarError(true)}
              />
            ) : initials}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span style={{ fontSize: 15, fontWeight: 600, color: "var(--ink-800)" }}>{displayName || profile?.username || "-"}</span>
            <span style={{ fontSize: 12, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-mono)" }}>@{profile?.username ?? "-"}</span>
            {joinedLabel && <span style={{ fontSize: 11, color: "var(--sr-text-muted)", marginTop: 4 }}>{joinedLabel}</span>}
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleAvatarFile}/>
              <button
                className="s-btn-secondary s-btn-sm"
                style={{ display: "flex", alignItems: "center", gap: 6 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadAvatar.isPending}
              >
                <IcCam /> {uploadAvatar.isPending ? "Uploading…" : "Upload photo"}
              </button>
              {avatarSrc && !avatarError && (
                <button
                  className="s-btn-ghost s-btn-sm"
                  style={{ color: "var(--sr-text-muted)" }}
                  onClick={() => removeAvatarMutation.mutate()}
                  disabled={removeAvatarMutation.isPending}
                >
                  {removeAvatarMutation.isPending ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
          </div>
        </div>

        <SField label="Display name" hint="Shown alongside your @username in messages and on your sale page.">
          <SInput value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="Your name"/>
        </SField>

        <SaveFooter
          toast={toast}
          onSave={() => profileMutation.mutate({ displayName: displayName || null, bio: bio || null }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={profileMutation.isPending}
        />
      </SCard>

      {/* Username */}
      <SCard>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>@Username</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>
          Your unique handle on ShiftReady. 4–20 characters, letters and numbers only, must start with a letter.
        </p>

        <SField label="Handle" hint={profile?.usernameChangedAt ? `Last changed ${new Date(profile.usernameChangedAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}` : undefined}>
          <div style={{
            display: "flex", alignItems: "center",
            background: "var(--cream-50)", border: "1px solid var(--sr-border-default)",
            borderRadius: "var(--sr-radius-md)", overflow: "hidden",
          }}>
            <span style={{ padding: "0 8px 0 13px", fontFamily: "var(--sr-font-mono)", fontSize: 15, color: "var(--sr-text-muted)", flexShrink: 0, marginTop: 1 }}>@</span>
            <input
              value={usernameInput}
              onChange={e => handleUsernameChange(e.target.value)}
              placeholder={profile?.username ?? ""}
              maxLength={20}
              spellCheck={false}
              style={{ flex: 1, padding: "10px 12px 10px 0", fontSize: 14, fontFamily: "var(--sr-font-mono)", color: "var(--sr-text-primary)", background: "transparent", border: "none", outline: "none" }}
            />
            {unStatus && (
              <span style={{
                padding: "0 12px", fontSize: 11, fontWeight: 600, flexShrink: 0, fontFamily: "var(--sr-font-mono)",
                color: unStatus === "available" ? "var(--moss-600)" : unStatus === "taken" ? "var(--rust-500)" : "var(--sr-text-muted)",
              }}>
                {unStatus === "checking" ? "Checking…" : unStatus === "available" ? "Available" : "Taken"}
              </span>
            )}
          </div>
        </SField>

        {usernameError && (
          <div style={{ padding: "8px 12px", borderRadius: "var(--sr-radius-md)", background: "var(--rust-50)", color: "var(--rust-500)", fontSize: 12, marginBottom: 12 }}>
            {usernameError}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--sr-border-subtle)", marginTop: 20 }}>
          <div>
            {usernameSaved && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: "var(--sr-radius-md)", fontSize: 12, fontWeight: 500, background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)" }}>
                <IcCheck /> Username saved
              </span>
            )}
          </div>
          {!canSaveUsername ? (
            <span
              title={
                usernameInput.length < 4 ? "Username must be at least 4 characters" :
                !/^[a-zA-Z]/.test(usernameInput) ? "Username must start with a letter" :
                usernameInput === profile?.username ? "Same as your current username" :
                available === false ? "That username is already taken" :
                "Check username availability first"
              }
              style={{ cursor: "not-allowed" }}
            >
              <button onClick={handleSaveUsername} disabled className="s-btn-primary" style={{ pointerEvents: "none" }}>
                {isUpdating ? "Saving…" : "Save username"}
              </button>
            </span>
          ) : (
            <button onClick={handleSaveUsername} className="s-btn-primary">
              {isUpdating ? "Saving…" : "Save username"}
            </button>
          )}
        </div>
      </SCard>

      {/* Bio */}
      <SCard>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Seller bio</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>
          A short note shown at the top of your sale listing. Helps buyers understand context - moving circumstances, item quality, availability.
        </p>
        <SField label="Bio">
          <STextarea value={bio} onChange={e => setBio(e.target.value)} rows={3} maxLength={240} placeholder="E.g. Moving from Newtown - quality furniture, appliances, books. Available for pickup from June 5."/>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
            <span style={{ fontSize: 11.5, color: "var(--sr-text-muted)" }}>Optional · shown publicly on your sale page.</span>
            <span style={{ fontSize: 11.5, color: "var(--sr-text-muted)", flexShrink: 0 }}>{bio.length}/240</span>
          </div>
        </SField>
        <SaveFooter
          toast={toast}
          onSave={() => profileMutation.mutate({ displayName: displayName || null, bio: bio || null }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={profileMutation.isPending}
        />
      </SCard>
    </div>
  );
}

// ── Section: Account ────────────────────────────────────────────────────────
function AccountSection({ userEmail }: { userEmail?: string | null }) {
  const [emailEdit, setEmailEdit] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [pwEdit, setPwEdit] = useState(false);
  const { saving, toast, save } = useSave();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Account</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>Manage your login credentials and connected sign-in methods.</p>
      </div>

      <SCard label="Login details">
        <MethodRow
          icon={<IcEmail/>}
          label="Email address"
          sub={userEmail ?? "-"}
          right={
            <button className="s-btn-secondary s-btn-sm" onClick={() => setEmailEdit(v => !v)}>
              {emailEdit ? "Cancel" : "Change"}
            </button>
          }
        />
        {emailEdit && (
          <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <SInput value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="New email address" type="email"/>
            <SInput placeholder="Confirm password" type="password"/>
            <div style={{ display: "flex", gap: 8, marginTop: 2 }}>
              <button className="s-btn-primary s-btn-sm" onClick={() => save()} disabled={!newEmail}>
                {saving ? "Sending…" : "Send confirmation"}
              </button>
              {toast && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: "var(--sr-radius-md)", fontSize: 12, fontWeight: 500, background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)" }}>
                  <IcCheck/> {toast.msg}
                </span>
              )}
            </div>
          </div>
        )}

        <div style={{ height: 1, background: "var(--sr-border-subtle)", margin: "18px 0" }}/>

        <MethodRow
          icon={<IcKey/>}
          label="Password"
          sub="Last changed 4 months ago"
          right={
            <button className="s-btn-secondary s-btn-sm" onClick={() => setPwEdit(v => !v)}>
              {pwEdit ? "Cancel" : "Change"}
            </button>
          }
        />
        {pwEdit && (
          <div style={{ paddingTop: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <SInput placeholder="Current password" type="password"/>
            <SInput placeholder="New password" type="password"/>
            <SInput placeholder="Confirm new password" type="password"/>
            <button className="s-btn-primary s-btn-sm" style={{ alignSelf: "flex-start" }}>Update password</button>
          </div>
        )}
      </SCard>

      <SCard>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Sign-in methods</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>Accounts connected for one-tap sign in.</p>
        <MethodRow
          icon={<IcGoogle/>}
          label="Google"
          sub={userEmail ?? undefined}
          right={
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: "var(--sr-radius-sm)", background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)", fontSize: 11, fontWeight: 600 }}>
              <IcCheck/> Connected
            </span>
          }
        />
      </SCard>

      <div style={{ background: "var(--cream-50)", border: "1px solid var(--rust-100)", borderRadius: "var(--sr-radius-lg)", padding: "20px 24px" }}>
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--rust-500)", margin: "0 0 4px" }}>Danger zone</p>
        <p style={{ fontSize: 12, color: "var(--rust-500)", lineHeight: 1.55, margin: "0 0 14px" }}>
          Deleting your account removes all your sales, inventory, and messages permanently.
          Active sales will be unpublished immediately and buyers will be notified.
          This action cannot be undone.
        </p>
        <button style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "7px 13px", borderRadius: "var(--sr-radius-sm)",
          background: "var(--rust-50)", color: "var(--rust-500)",
          border: "1px solid var(--rust-100)", fontSize: 12, fontWeight: 500,
          cursor: "pointer",
        }}>
          <IcTrash/> Delete account…
        </button>
      </div>
    </div>
  );
}

// ── SuburbCombobox ──────────────────────────────────────────────────────────
function SuburbCombobox({ value, onChange, onStateChange }: {
  value: string;
  onChange: (suburb: string) => void;
  onStateChange: (state: string) => void;
}) {
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setInput(value); }, [value]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const trimmed = input.trim();
  const results: Suburb[] = trimmed.length >= 2
    ? (isValidPostcode(trimmed)
        ? suburbsForPostcode(trimmed).slice(0, 8)
        : SYDNEY_SUBURBS.filter(s => s.name.toLowerCase().startsWith(trimmed.toLowerCase())).slice(0, 8)
      )
    : [];

  function select(sub: Suburb) {
    setInput(sub.name);
    onChange(sub.name);
    onStateChange("NSW");
    setOpen(false);
    setHoveredIdx(-1);
  }

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--sr-text-muted)", pointerEvents: "none", zIndex: 1 }}>
        <IcMap />
      </span>
      <SInput
        value={input}
        onChange={e => { setInput(e.target.value); onChange(e.target.value); setOpen(true); setHoveredIdx(-1); }}
        onFocus={() => setOpen(true)}
        placeholder="Suburb or postcode"
        style={{ paddingLeft: 30 }}
        autoComplete="off"
      />
      {open && results.length > 0 && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 50,
          background: "var(--sr-bg-card)", border: "1px solid var(--sr-border-default)",
          borderRadius: "var(--sr-radius-md)", boxShadow: "0 4px 16px rgba(0,0,0,.10)",
          overflow: "hidden",
        }}>
          {results.map((sub, i) => (
            <button
              key={`${sub.name}-${sub.postcode}`}
              type="button"
              onMouseDown={e => { e.preventDefault(); select(sub); }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(-1)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                width: "100%", padding: "9px 14px", textAlign: "left",
                background: hoveredIdx === i ? "var(--cream-50)" : "transparent",
                border: "none", borderBottom: i < results.length - 1 ? "1px solid var(--sr-border-subtle)" : "none",
                cursor: "pointer", fontSize: 13.5, color: "var(--sr-text-primary)",
              }}
            >
              <span>{sub.name}</span>
              <span style={{ fontSize: 11, fontFamily: "var(--sr-font-mono)", color: "var(--sr-text-muted)" }}>{sub.postcode} NSW</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Section: Contact & Pickup ───────────────────────────────────────────────
function formatAULocal(e164: string): string {
  if (e164.startsWith("+61") && e164.length === 12) return "0" + e164.slice(3);
  return e164.replace(/^\+/, "");
}
function toE164AU(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+61" + digits.slice(1);
  if (digits.startsWith("61") && digits.length === 11) return "+" + digits;
  return "+" + digits;
}

function ContactSection() {
  const { data: settings } = useMySettings();
  const phoneMutation = useUpdateMyPhone();
  const locationMutation = useUpdateLocation();
  const [phoneInput, setPhoneInput] = useState("");
  const [autoShare, setAutoShare] = useState(true);
  const [suburb, setSuburb] = useState("");
  const [state, setState] = useState("NSW");
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const { saving: locSaving, toast: locToast, save: locSave } = useSave();

  useEffect(() => {
    if (settings) {
      if (settings.phoneE164) setPhoneInput(formatAULocal(settings.phoneE164));
      setAutoShare(settings.phoneShareOptIn);
      setSuburb(settings.suburb ?? "");
      setState(settings.state ?? "NSW");
    }
  }, [settings]);

  const STATES = ["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"];

  const canSavePhone = phoneInput.replace(/\D/g, "").length >= 10 && !phoneMutation.isPending;

  const handleSavePhone = async () => {
    setPhoneError(null);
    setPhoneSaved(false);
    const e164 = toE164AU(phoneInput);
    if (!/^\+[1-9]\d{9,14}$/.test(e164)) {
      setPhoneError("Enter a valid Australian mobile (e.g. 0412 345 678)");
      return;
    }
    try {
      await phoneMutation.mutateAsync({ phoneE164: e164, shareOptIn: autoShare });
      setPhoneSaved(true);
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Failed to save phone number");
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Contact &amp; Pickup</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>How buyers reach you after a deal is agreed, and where your items are located.</p>
      </div>

      <SCard label="Phone">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Mobile number</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>
          Shared privately with buyers only after a deal is agreed and accepted by both parties. Used to coordinate pickup logistics.
        </p>

        <SField label="Australian mobile">
          <div style={{
            display: "flex", alignItems: "center", background: "var(--cream-50)",
            border: "1px solid var(--sr-border-default)", borderRadius: "var(--sr-radius-md)", overflow: "hidden",
          }}>
            <span style={{ padding: "0 10px 0 13px", fontSize: 15, flexShrink: 0, borderRight: "1px solid var(--sr-border-subtle)", height: 40, display: "flex", alignItems: "center" }}>🇦🇺</span>
            <input
              value={phoneInput}
              onChange={e => { setPhoneInput(e.target.value); setPhoneSaved(false); setPhoneError(null); }}
              type="tel"
              placeholder="0412 345 678"
              style={{ flex: 1, padding: "10px 14px", fontSize: 14, fontFamily: "var(--sr-font-mono)", color: "var(--sr-text-primary)", background: "transparent", border: "none", outline: "none" }}
            />
          </div>
        </SField>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20, paddingTop: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>Auto-share after deal accepted</div>
            <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 2, lineHeight: 1.4 }}>Automatically reveal your number when both parties accept an offer. You can always share manually from the conversation too.</div>
          </div>
          <Toggle on={autoShare} onChange={setAutoShare}/>
        </div>

        {phoneError && <div style={{ padding: "8px 12px", borderRadius: "var(--sr-radius-md)", background: "var(--rust-50)", color: "var(--rust-500)", fontSize: 12, marginTop: 12 }}>{phoneError}</div>}

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingTop: 16, borderTop: "1px solid var(--sr-border-subtle)", marginTop: 20 }}>
          <div>
            {phoneSaved && (
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "7px 12px", borderRadius: "var(--sr-radius-md)", fontSize: 12, fontWeight: 500, background: "var(--moss-50)", color: "var(--moss-700)", border: "1px solid var(--moss-100)" }}>
                <IcCheck/> Phone saved
              </span>
            )}
          </div>
          <button onClick={handleSavePhone} disabled={!canSavePhone} className="s-btn-primary">
            {phoneMutation.isPending ? "Saving…" : "Save phone"}
          </button>
        </div>
      </SCard>

      <SCard label="Location">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Pickup area</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>
          Your general suburb is displayed on sale listings to help buyers assess travel distance. Your full address is never shown publicly.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <SField label="Suburb">
            <SuburbCombobox value={suburb} onChange={setSuburb} onStateChange={setState} />
          </SField>
          <SField label="State">
            <SSelect value={state} onChange={e => setState(e.target.value)}>
              {STATES.map(s => <option key={s} value={s}>{s}</option>)}
            </SSelect>
          </SField>
        </div>

        <SaveFooter
          toast={locToast}
          onSave={() => locationMutation.mutate({ suburb: suburb || null, state: state || null }, { onSuccess: () => locSave(), onError: () => locSave(false) })}
          saving={locationMutation.isPending}
        />
      </SCard>
    </div>
  );
}

// ── Section: Notifications ──────────────────────────────────────────────────
const SELLING_NOTIFS = [
  { id: "msg",     label: "New message",          desc: "A buyer sends you a message in any conversation." },
  { id: "offer",   label: "Offer received",        desc: "A buyer makes an offer on one of your items or bundles." },
  { id: "counter", label: "Counter-offer",         desc: "A buyer responds to your counter with a new amount." },
  { id: "deal",    label: "Deal agreed",           desc: "Both parties accept an offer - ready to arrange pickup." },
  { id: "ready",   label: "Sale ready to review",  desc: "Your sale has finished processing and is ready to publish." },
  { id: "viewed",  label: "Sale milestones",       desc: "Your sale reaches 10, 50, and 100 views." },
];
const BUYING_NOTIFS = [
  { id: "buy_msg",    label: "Reply from seller",        desc: "A seller responds in a conversation you started." },
  { id: "buy_offer",  label: "Offer accepted",            desc: "A seller accepts your offer on their item." },
  { id: "price_drop", label: "Price drop on saved item",  desc: "A saved item's listing price is reduced." },
];

const DEFAULT_NOTIF: NotifPrefs = { msg: true, offer: true, counter: true, deal: true, ready: true, viewed: false, buy_msg: true, buy_offer: true, price_drop: false };

function NotificationsSection() {
  const { data: settings } = useMySettings();
  const notifMutation = useUpdateNotifications();
  const [prefs, setPrefs] = useState<NotifPrefs>(DEFAULT_NOTIF);
  const toggle = (id: keyof NotifPrefs) => {
    const next = { ...prefs, [id]: !prefs[id] };
    setPrefs(next);
    notifMutation.mutate(next);
  };

  useEffect(() => {
    if (settings) setPrefs(settings.notifPrefs);
  }, [settings]);

  const grpHdrStyle: React.CSSProperties = {
    fontFamily: "var(--sr-font-mono)", fontSize: 9, textTransform: "uppercase",
    letterSpacing: ".14em", color: "var(--sr-text-muted)",
    paddingBottom: 10, borderBottom: "1px solid var(--sr-border-subtle)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Notifications</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>Email alerts for activity on your account. Changes save automatically.</p>
      </div>

      <SCard>
        <div style={grpHdrStyle}>Selling</div>
        {SELLING_NOTIFS.map(n => (
          <TRow key={n.id} label={n.label} desc={n.desc}>
            <Toggle on={prefs[n.id as keyof NotifPrefs]} onChange={() => toggle(n.id as keyof NotifPrefs)}/>
          </TRow>
        ))}
      </SCard>

      <SCard>
        <div style={grpHdrStyle}>Buying &amp; Watchlist</div>
        {BUYING_NOTIFS.map(n => (
          <TRow key={n.id} label={n.label} desc={n.desc}>
            <Toggle on={prefs[n.id as keyof NotifPrefs]} onChange={() => toggle(n.id as keyof NotifPrefs)}/>
          </TRow>
        ))}
      </SCard>
    </div>
  );
}

// ── Section: Preferences ────────────────────────────────────────────────────
const PAYMENT_OPTS = [
  { id: "cash",     label: "Cash" },
  { id: "bank",     label: "Bank transfer" },
  { id: "payid",    label: "PayID" },
  { id: "afterpay", label: "Afterpay" },
];
const PICKUP_DAYS  = ["Weekdays", "Weekends", "By appointment"];
const PICKUP_TIMES = ["Morning (8–12)", "Afternoon (12–5)", "Evening (5–8)"];

function PreferencesSection() {
  const { data: settings } = useMySettings();
  const prefsMutation = useUpdatePreferences();
  const [payments,    setPayments]    = useState(new Set(["cash", "bank", "payid"]));
  const [pickupDays,  setPickupDays]  = useState(new Set(["Weekdays", "Weekends"]));
  const [pickupTimes, setPickupTimes] = useState(new Set(["Afternoon (12–5)"]));
  const [minOffer,    setMinOffer]    = useState(70);
  const { saving, toast, save } = useSave();

  useEffect(() => {
    if (settings) {
      setPayments(new Set(settings.sellerPrefs.paymentMethods));
      setPickupDays(new Set(settings.sellerPrefs.pickupDays));
      setPickupTimes(new Set(settings.sellerPrefs.pickupTimes));
      setMinOffer(settings.sellerPrefs.minOfferPercent);
    }
  }, [settings]);

  const toggleSet = (set: Set<string>, setFn: React.Dispatch<React.SetStateAction<Set<string>>>, val: string) =>
    setFn(prev => { const n = new Set(prev); n.has(val) ? n.delete(val) : n.add(val); return n; });

  const tagStyle = (sel: boolean): React.CSSProperties => ({
    display: "inline-flex", alignItems: "center", gap: 7,
    padding: "7px 13px", borderRadius: "var(--sr-radius-full)",
    border: sel ? "1px solid var(--clay-400)" : "1px solid var(--sr-border-default)",
    background: sel ? "var(--clay-50)" : "var(--cream-50)",
    fontSize: 12.5, fontWeight: 500,
    color: sel ? "var(--clay-700)" : "var(--sr-text-secondary)",
    cursor: "pointer", userSelect: "none" as const, transition: "all 120ms",
  });

  const pillStyle = (sel: boolean): React.CSSProperties => ({
    padding: "7px 15px", borderRadius: "var(--sr-radius-full)",
    border: sel ? "1px solid var(--ink-800)" : "1px solid var(--sr-border-default)",
    background: sel ? "var(--ink-800)" : "var(--cream-50)",
    fontSize: 12.5, fontWeight: 500,
    color: sel ? "var(--cream-50)" : "var(--sr-text-secondary)",
    cursor: "pointer", userSelect: "none" as const, transition: "all 120ms",
  });

  const offerHint = minOffer >= 90 ? "Very strict - most offers will be declined."
    : minOffer >= 75 ? "Moderate - filters out lowball offers."
    : "Flexible - allows significant discounts.";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Preferences</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>Default settings applied to all your sales. You can override these per-listing.</p>
      </div>

      <SCard label="Transaction">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Accepted payment methods</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>Shown to buyers on your sale listing. Select all that apply.</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {PAYMENT_OPTS.map(opt => {
            const sel = payments.has(opt.id);
            return (
              <button key={opt.id} style={tagStyle(sel)} onClick={() => toggleSet(payments, setPayments, opt.id)}>
                <span style={{
                  width: 14, height: 14, borderRadius: 3,
                  border: `1.5px solid ${sel ? "transparent" : "currentColor"}`,
                  background: sel ? "var(--clay-500)" : "transparent",
                  display: "grid", placeItems: "center",
                  color: "white", opacity: sel ? 1 : 0.6, flexShrink: 0, transition: "all 120ms",
                }}>
                  {sel && <IcCheck/>}
                </span>
                {opt.label}
              </button>
            );
          })}
        </div>
        <SaveFooter
          toast={toast}
          onSave={() => prefsMutation.mutate({ paymentMethods: [...payments], pickupDays: [...pickupDays], pickupTimes: [...pickupTimes], minOfferPercent: minOffer }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={prefsMutation.isPending}
        />
      </SCard>

      <SCard label="Availability">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Pickup schedule</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>When you&apos;re generally available for buyers to collect items.</p>
        <SField label="Days">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PICKUP_DAYS.map(d => (
              <button key={d} style={pillStyle(pickupDays.has(d))} onClick={() => toggleSet(pickupDays, setPickupDays, d)}>{d}</button>
            ))}
          </div>
        </SField>
        <SField label="Times">
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {PICKUP_TIMES.map(t => (
              <button key={t} style={pillStyle(pickupTimes.has(t))} onClick={() => toggleSet(pickupTimes, setPickupTimes, t)}>{t}</button>
            ))}
          </div>
        </SField>
        <SaveFooter
          toast={toast}
          onSave={() => prefsMutation.mutate({ paymentMethods: [...payments], pickupDays: [...pickupDays], pickupTimes: [...pickupTimes], minOfferPercent: minOffer }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={prefsMutation.isPending}
        />
      </SCard>

      <SCard label="Offers">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Minimum offer threshold</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>
          Offers below this percentage of your listing price will be automatically declined. Buyers won&apos;t see the threshold.
        </p>
        <SField label="Minimum accepted offer" hint={offerHint}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <input
              type="range" min={40} max={95} step={5} value={minOffer}
              onChange={e => setMinOffer(+e.target.value)}
              style={{ flex: 1, height: 4, borderRadius: 2, accentColor: "var(--clay-500)", cursor: "pointer" }}
            />
            <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 13, fontWeight: 600, color: "var(--clay-600)", minWidth: 36, textAlign: "right" }}>{minOffer}%</span>
          </div>
        </SField>
        <SaveFooter
          toast={toast}
          onSave={() => prefsMutation.mutate({ paymentMethods: [...payments], pickupDays: [...pickupDays], pickupTimes: [...pickupTimes], minOfferPercent: minOffer }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={prefsMutation.isPending}
        />
      </SCard>
    </div>
  );
}

// ── Section: Privacy ────────────────────────────────────────────────────────
const BLOCKED_USERS = [
  { initials: "JK", username: "jake_k",      since: "3 weeks ago" },
  { initials: "MR", username: "marketrunner", since: "2 months ago" },
];

function PrivacySection() {
  const { data: settings } = useMySettings();
  const privacyMutation = useUpdatePrivacy();
  const [msgPref,        setMsgPref]        = useState("anyone");
  const [profileVisible, setProfileVisible] = useState(true);
  const [blocked,        setBlocked]        = useState(BLOCKED_USERS);
  const { saving, toast, save } = useSave();

  useEffect(() => {
    if (settings) {
      setMsgPref(settings.privacyPrefs.messagingFilter);
      setProfileVisible(settings.privacyPrefs.profileVisible);
    }
  }, [settings]);

  const pillStyle = (sel: boolean): React.CSSProperties => ({
    padding: "7px 15px", borderRadius: "var(--sr-radius-full)",
    border: sel ? "1px solid var(--ink-800)" : "1px solid var(--sr-border-default)",
    background: sel ? "var(--ink-800)" : "var(--cream-50)",
    fontSize: 12.5, fontWeight: 500,
    color: sel ? "var(--cream-50)" : "var(--sr-text-secondary)",
    cursor: "pointer", userSelect: "none" as const, transition: "all 120ms",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 4px" }}>Privacy</h2>
        <p style={{ fontSize: 13, color: "var(--sr-text-muted)", lineHeight: 1.5, margin: 0 }}>Control your visibility and who can contact you on the platform.</p>
      </div>

      <SCard label="Messaging">
        <p style={{ fontSize: 13.5, fontWeight: 600, color: "var(--sr-text-primary)", margin: "0 0 3px" }}>Who can send you messages</p>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", margin: "0 0 18px", lineHeight: 1.55 }}>Apply a filter to incoming conversation requests.</p>

        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 0 }}>
          {[
            { id: "anyone",   label: "Anyone" },
            { id: "verified", label: "Verified users only" },
            { id: "buyers",   label: "Active buyers only" },
          ].map(opt => (
            <button key={opt.id} style={pillStyle(msgPref === opt.id)} onClick={() => setMsgPref(opt.id)}>
              {opt.label}
            </button>
          ))}
        </div>

        <div style={{ height: 1, background: "var(--sr-border-subtle)", margin: "18px 0" }}/>

        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>Show profile on marketplace</div>
            <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 2, lineHeight: 1.4 }}>When disabled, your name and bio won&apos;t appear on sale listings - items are still purchasable.</div>
          </div>
          <Toggle on={profileVisible} onChange={setProfileVisible}/>
        </div>

        <SaveFooter
          toast={toast}
          onSave={() => privacyMutation.mutate({ messagingFilter: msgPref, profileVisible }, { onSuccess: () => save(), onError: () => save(false) })}
          saving={privacyMutation.isPending}
        />
      </SCard>

      <SCard label="Blocked users">
        {blocked.length === 0 ? (
          <div style={{ padding: "16px 0", color: "var(--sr-text-muted)", fontSize: 13 }}>No blocked users.</div>
        ) : (
          blocked.map(u => (
            <div key={u.username} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
              padding: "9px 0", borderBottom: "1px solid var(--sr-border-subtle)",
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, var(--ink-300), var(--ink-500))",
                display: "grid", placeItems: "center", color: "var(--cream-50)", fontSize: 10, fontWeight: 600,
              }}>
                {u.initials}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-mono)" }}>@{u.username}</div>
                <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 1 }}>Blocked {u.since}</div>
              </div>
              <button
                className="s-btn-ghost s-btn-sm"
                style={{ color: "var(--sr-text-muted)", display: "flex", alignItems: "center", gap: 5 }}
                onClick={() => setBlocked(b => b.filter(x => x.username !== u.username))}
              >
                <IcUnblock/> Unblock
              </button>
            </div>
          ))
        )}
      </SCard>

      <SCard label="Your data">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0", borderBottom: "1px solid var(--sr-border-subtle)" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>Download your data</div>
            <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 2 }}>A copy of your account info, sale history, and messages.</div>
          </div>
          <button className="s-btn-secondary s-btn-sm" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <IcExport/> Request export
          </button>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 0" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 500, color: "var(--sr-text-primary)" }}>Connected apps</div>
            <div style={{ fontSize: 11.5, color: "var(--sr-text-muted)", marginTop: 2 }}>No third-party apps connected.</div>
          </div>
          <button className="s-btn-secondary s-btn-sm" disabled style={{ opacity: 0.4 }}>Manage</button>
        </div>
      </SCard>
    </div>
  );
}

// ── Nav config ──────────────────────────────────────────────────────────────
const NAV_SECTIONS = [
  { id: "profile",       label: "Profile",           Icon: IcUser,    dividerBefore: false },
  { id: "account",       label: "Account",           Icon: IcLock,    dividerBefore: false },
  { id: "contact",       label: "Contact & Pickup",  Icon: IcPhone,   dividerBefore: true  },
  { id: "notifications", label: "Notifications",     Icon: IcNotif,   dividerBefore: false },
  { id: "preferences",   label: "Preferences",       Icon: IcSliders, dividerBefore: true  },
  { id: "privacy",       label: "Privacy",           Icon: IcShield,  dividerBefore: false },
] as const;

type SectionId = typeof NAV_SECTIONS[number]["id"];

// ── Root ────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState<SectionId>("profile");
  useEffect(() => { document.title = "Settings - ShiftReady"; }, []);

  const sections: Record<SectionId, React.ReactNode> = {
    profile:       <ProfileSection userEmail={user?.email} photoURL={user?.photoURL ?? null}/>,
    account:       <AccountSection userEmail={user?.email}/>,
    contact:       <ContactSection/>,
    notifications: <NotificationsSection/>,
    preferences:   <PreferencesSection/>,
    privacy:       <PrivacySection/>,
  };

  return (
    <>
      <style>{`
        .s-btn-primary {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 9px 18px;
          font-family: var(--sr-font-sans); font-size: 13px; font-weight: 500;
          border-radius: var(--sr-radius-md); border: none; cursor: pointer;
          background: var(--clay-500); color: var(--cream-50);
          transition: background 120ms, opacity 120ms;
          white-space: nowrap;
        }
        .s-btn-primary:hover { background: var(--clay-600); }
        .s-btn-primary:disabled { cursor: not-allowed; opacity: 0.45; }

        .s-btn-secondary {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 9px 18px;
          font-family: var(--sr-font-sans); font-size: 13px; font-weight: 500;
          border-radius: var(--sr-radius-md);
          border: 1px solid var(--sr-border-default);
          background: var(--sr-bg-card); color: var(--sr-text-primary);
          cursor: pointer; transition: background 120ms; white-space: nowrap;
          box-shadow: var(--sr-shadow-xs);
        }
        .s-btn-secondary:hover { background: var(--cream-50); border-color: var(--sr-border-strong); }
        .s-btn-secondary:disabled { cursor: not-allowed; opacity: 0.45; }

        .s-btn-ghost {
          display: inline-flex; align-items: center; justify-content: center;
          gap: 8px; padding: 9px 18px;
          font-family: var(--sr-font-sans); font-size: 13px; font-weight: 500;
          border-radius: var(--sr-radius-md); border: none;
          background: transparent; color: var(--sr-text-secondary);
          cursor: pointer; transition: background 120ms; white-space: nowrap;
        }
        .s-btn-ghost:hover { background: var(--cream-200); color: var(--sr-text-primary); }

        .s-btn-sm { padding: 7px 13px !important; font-size: 12px !important; border-radius: var(--sr-radius-sm) !important; }

        .snav-item {
          display: flex; align-items: center; gap: 9px;
          padding: 8px 11px; border-radius: var(--sr-radius-md);
          font-size: 13px; font-weight: 500; color: var(--sr-text-secondary);
          cursor: pointer; transition: all 120ms;
          border: none; background: transparent; text-align: left; width: 100%;
          line-height: 1.1;
        }
        .snav-item:hover { background: var(--cream-100); color: var(--sr-text-primary); }
        .snav-item.active { background: var(--clay-50); color: var(--clay-700); font-weight: 600; }
        .snav-item svg { flex-shrink: 0; opacity: 0.65; }
        .snav-item.active svg { opacity: 1; }

        .av-lg:hover .av-lg-ov { opacity: 1 !important; }

        @keyframes secIn {
          from { opacity: 0.01; transform: translateY(6px); }
          to   { opacity: 1;    transform: translateY(0); }
        }
        .sec-anim { animation: secIn 200ms ease both; }
      `}</style>

      <div className="flex flex-col md:flex-row px-5 pt-8 pb-20 md:px-10 md:pt-10 md:gap-11 overflow-x-hidden" style={{ maxWidth: 920, margin: "0 auto", gap: 24, alignItems: "flex-start", width: "100%" }}>

        {/* Left nav */}
        <nav className="w-full md:w-44 md:shrink-0 md:sticky md:top-10" style={{ flexShrink: 0 }}>
          <h1 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 26, fontWeight: 500, letterSpacing: "-.02em", color: "var(--ink-800)", margin: "0 0 22px", lineHeight: 1.1 }}>
            Settings
          </h1>
          <ul style={{ display: "flex", flexDirection: "column", gap: 1, listStyle: "none", margin: 0, padding: 0 }}>
            {NAV_SECTIONS.map(s => (
              <li key={s.id}>
                {s.dividerBefore && <div style={{ height: 1, background: "var(--sr-border-subtle)", margin: "6px 0" }}/>}
                <button
                  className={`snav-item${activeId === s.id ? " active" : ""}`}
                  onClick={() => setActiveId(s.id)}
                >
                  <s.Icon/>
                  {s.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div key={activeId} className="sec-anim" style={{ flex: 1, minWidth: 0, width: "100%" }}>
          {sections[activeId]}
        </div>

      </div>
    </>
  );
}
