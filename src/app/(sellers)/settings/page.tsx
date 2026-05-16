"use client";

import { useState } from "react";
import { useUsername, useUsernameAvailability } from "@/hooks/use-username";

export default function SettingsPage() {
  const { profile, isLoading, update, isUpdating, updateError } = useUsername();
  const { check, available, isChecking } = useUsernameAvailability();
  const [input, setInput] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleChange = (v: string) => {
    setInput(v.toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 20));
    setSaved(false);
    setSaveError(null);
    if (v.length >= 3) check(v);
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
  const canSave = input.length >= 3 && available && !isSame && !isUpdating;

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
          Your @username is shown to buyers instead of your real name. 3–20 chars, letters, numbers, underscores. Can change every 7 days.
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
    </div>
  );
}
