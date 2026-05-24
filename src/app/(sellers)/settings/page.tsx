"use client";

import { useState } from "react";
import { useUsername, useUsernameAvailability } from "@/hooks/use-username";
import { useUpdateMyPhone } from "@/hooks/use-phone";

function formatAULocal(e164: string): string {
  if (e164.startsWith("+61") && e164.length === 12) {
    return "0" + e164.slice(3);
  }
  return e164.replace(/^\+/, "");
}

function toE164AU(local: string): string {
  const digits = local.replace(/\D/g, "");
  if (digits.startsWith("0") && digits.length === 10) return "+61" + digits.slice(1);
  if (digits.startsWith("61") && digits.length === 11) return "+" + digits;
  return "+" + digits;
}

export default function SettingsPage() {
  const { profile, isLoading, update, isUpdating, updateError } = useUsername();
  const { check, available, isChecking } = useUsernameAvailability();
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const phoneMutation = useUpdateMyPhone();
  const [phoneInput, setPhoneInput] = useState("");
  const [shareOptIn, setShareOptIn] = useState(true);
  const [phoneSaved, setPhoneSaved] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const handleChange = (v: string) => {
    const cleaned = v.replace(/[^a-zA-Z0-9]/g, "").slice(0, 20);
    setInput(cleaned);
    setSaved(false);
    setSaveError(null);
    if (cleaned.length >= 4) check(cleaned);
  };

  const handleSave = async () => {
    setSaveError(null);
    try {
      await update(input);
      setSaved(true);
    } catch (err: unknown) {
      setSaveError(err instanceof Error ? err.message : "Failed to update username");
    }
  };

  const isSame = profile?.username === input;
  const canSave = input.length >= 4 && /^[a-zA-Z]/.test(input) && available && !isSame && !isUpdating;

  const handleSavePhone = async () => {
    setPhoneError(null);
    setPhoneSaved(false);
    const e164 = toE164AU(phoneInput);
    if (!/^\+[1-9]\d{9,14}$/.test(e164)) {
      setPhoneError("Enter a valid Australian mobile (e.g. 0412 345 678)");
      return;
    }
    try {
      await phoneMutation.mutateAsync({ phoneE164: e164, shareOptIn });
      setPhoneSaved(true);
    } catch (err: unknown) {
      setPhoneError(err instanceof Error ? err.message : "Failed to save phone number");
    }
  };

  const canSavePhone = phoneInput.replace(/\D/g, "").length >= 10 && !phoneMutation.isPending;

  if (isLoading) {
    return (
      <div style={{ padding: 40, color: "var(--sr-text-muted)", fontFamily: "var(--sr-font-sans)" }}>
        Loading…
      </div>
    );
  }

  return (
    <div
      style={{
        maxWidth: 560,
        margin: "40px auto",
        padding: "0 24px",
        fontFamily: "var(--sr-font-sans)",
      }}
    >
      <h1
        style={{
          fontSize: 22,
          fontWeight: 700,
          fontFamily: "var(--sr-font-serif)",
          color: "var(--sr-text-primary)",
          marginBottom: 32,
        }}
      >
        Settings
      </h1>

      <section
        style={{
          background: "var(--sr-bg-card)",
          border: "1px solid var(--sr-border-subtle)",
          borderRadius: "var(--sr-radius-lg)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "var(--sr-text-primary)",
            marginBottom: 4,
          }}
        >
          Platform username
        </h2>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", marginBottom: 20 }}>
          Your @username is shown to buyers instead of your real name. 4–20 chars, letters and numbers only, must start with a letter. Can change every 7 days.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="username-input"
            style={{ fontSize: 12, color: "var(--sr-text-muted)", display: "block", marginBottom: 6 }}
          >
            Current: @{profile?.username ?? "—"}
          </label>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 15, color: "var(--sr-text-muted)" }}>@</span>
            <input
              id="username-input"
              type="text"
              value={input}
              onChange={(e) => handleChange(e.target.value)}
              placeholder={profile?.username ?? ""}
              style={{
                flex: 1,
                padding: "9px 12px",
                borderRadius: "var(--sr-radius-md)",
                border: "1px solid var(--sr-border-subtle)",
                fontSize: 14,
                color: "var(--sr-text-primary)",
                fontFamily: "var(--sr-font-mono)",
                background: "var(--cream-50)",
                outline: "none",
              }}
            />
            {isChecking && (
              <span style={{ fontSize: 11, color: "var(--sr-text-muted)" }}>Checking…</span>
            )}
            {!isChecking && input.length >= 3 && (
              <span
                style={{
                  fontSize: 11,
                  color: available ? "var(--green-600, #16a34a)" : "var(--rust-500)",
                  fontWeight: 600,
                }}
              >
                {available ? "Available" : "Taken"}
              </span>
            )}
          </div>
        </div>

        {(updateError || saveError) && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--rust-50, #fff1f0)",
              color: "var(--rust-600, #dc2626)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {updateError ?? saveError}
          </div>
        )}

        {saved && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--green-50, #f0fdf4)",
              color: "var(--green-700, #15803d)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Username updated successfully.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={!canSave}
          style={{
            padding: "9px 20px",
            borderRadius: "var(--sr-radius-md)",
            border: "none",
            background: canSave ? "var(--clay-500)" : "var(--cream-200)",
            color: canSave ? "#fff" : "var(--ink-300)",
            fontSize: 13,
            fontWeight: 600,
            cursor: canSave ? "pointer" : "default",
            transition: "background 140ms",
          }}
        >
          {isUpdating ? "Saving…" : "Save username"}
        </button>
      </section>

      {/* Phone for post-deal pickup */}
      <section
        style={{
          background: "var(--sr-bg-card)",
          border: "1px solid var(--sr-border-subtle)",
          borderRadius: "var(--sr-radius-lg)",
          padding: 24,
          marginBottom: 24,
        }}
      >
        <h2 style={{ fontSize: 14, fontWeight: 600, color: "var(--sr-text-primary)", marginBottom: 4 }}>
          Phone number
        </h2>
        <p style={{ fontSize: 12, color: "var(--sr-text-muted)", marginBottom: 20 }}>
          Shared privately with buyers only after a deal is agreed. Used to arrange pickup.
        </p>

        <div style={{ marginBottom: 16 }}>
          <label
            htmlFor="phone-input"
            style={{ fontSize: 12, color: "var(--sr-text-muted)", display: "block", marginBottom: 6 }}
          >
            Mobile number
          </label>
          <input
            id="phone-input"
            type="tel"
            value={phoneInput}
            onChange={(e) => {
              setPhoneInput(e.target.value);
              setPhoneSaved(false);
              setPhoneError(null);
            }}
            placeholder="0412 345 678"
            style={{
              width: "100%",
              padding: "9px 12px",
              borderRadius: "var(--sr-radius-md)",
              border: "1px solid var(--sr-border-subtle)",
              fontSize: 14,
              color: "var(--sr-text-primary)",
              fontFamily: "var(--sr-font-mono)",
              background: "var(--cream-50)",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        <label
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 16,
            cursor: "pointer",
            fontSize: 13,
            color: "var(--sr-text-secondary)",
            fontFamily: "var(--sr-font-sans)",
          }}
        >
          <input
            type="checkbox"
            checked={shareOptIn}
            onChange={(e) => setShareOptIn(e.target.checked)}
            style={{ width: 15, height: 15, accentColor: "var(--clay-500)", cursor: "pointer" }}
          />
          Automatically share with buyers after deal accepted
        </label>

        {phoneError && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--rust-50, #fff1f0)",
              color: "var(--rust-600, #dc2626)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            {phoneError}
          </div>
        )}

        {phoneSaved && (
          <div
            style={{
              padding: "8px 12px",
              borderRadius: "var(--sr-radius-md)",
              background: "var(--green-50, #f0fdf4)",
              color: "var(--green-700, #15803d)",
              fontSize: 12,
              marginBottom: 12,
            }}
          >
            Phone number saved.
          </div>
        )}

        <button
          onClick={handleSavePhone}
          disabled={!canSavePhone}
          style={{
            padding: "9px 20px",
            borderRadius: "var(--sr-radius-md)",
            border: "none",
            background: canSavePhone ? "var(--clay-500)" : "var(--cream-200)",
            color: canSavePhone ? "#fff" : "var(--ink-300)",
            fontSize: 13,
            fontWeight: 600,
            cursor: canSavePhone ? "pointer" : "default",
            transition: "background 140ms",
          }}
        >
          {phoneMutation.isPending ? "Saving…" : "Save phone"}
        </button>
      </section>
    </div>
  );
}
