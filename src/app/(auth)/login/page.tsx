"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = z.infer<typeof loginSchema>;

const inputCls: React.CSSProperties = {
  width: "100%",
  background: "#fff",
  border: "1px solid var(--sr-border-default)",
  borderRadius: "var(--sr-radius-md)",
  padding: "10px 14px",
  fontSize: "0.875rem",
  color: "var(--sr-text-primary)",
  outline: "none",
  transition: "border-color 0.15s, box-shadow 0.15s",
};

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

  const emailReg = register("email");
  const passwordReg = register("password");

  const onSubmit = async (data: LoginFields) => {
    setServerError(null);
    try {
      await signIn(data.email, data.password);
      router.push("/create");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign in failed");
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await signInWithGoogle();
      router.push("/create");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: 420 }}>
      {/* Card */}
      <div
        style={{
          background: "#fff",
          borderRadius: "var(--sr-radius-xl)",
          border: "1px solid var(--sr-border-subtle)",
          boxShadow: "var(--sr-shadow-lg)",
          padding: "40px 40px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 600, color: "var(--sr-text-primary)", fontFamily: "var(--sr-font-serif)", letterSpacing: "-0.02em", margin: 0 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: "0.875rem", color: "var(--sr-text-secondary)", marginTop: 6 }}>
            Please enter your details to sign in.
          </p>
        </div>

        {/* Error */}
        {serverError && (
          <div
            role="alert"
            style={{
              padding: "10px 14px",
              background: "var(--rust-50)",
              border: "1px solid var(--rust-100)",
              borderRadius: "var(--sr-radius-md)",
              fontSize: "0.8125rem",
              color: "var(--rust-500)",
            }}
          >
            {serverError}
          </div>
        )}

        {/* Google button */}
        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          aria-busy={googleLoading}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "11px 16px",
            borderRadius: "var(--sr-radius-md)",
            border: "1px solid var(--sr-border-default)",
            background: "#fff",
            color: "var(--sr-text-primary)",
            fontSize: "0.9375rem",
            fontWeight: 500,
            cursor: googleLoading ? "not-allowed" : "pointer",
            opacity: googleLoading ? 0.6 : 1,
            transition: "border-color 0.15s, box-shadow 0.15s",
          }}
          onMouseEnter={e => { if (!googleLoading) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--sr-border-strong)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--sr-border-default)"; }}
        >
          {googleLoading ? (
            <Loader2 size={18} className="animate-spin" aria-hidden />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continue with Google
        </button>

        {/* OR divider */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }} aria-hidden>
          <div style={{ flex: 1, height: 1, background: "var(--sr-border-subtle)" }} />
          <span style={{ fontSize: "0.75rem", color: "var(--sr-text-muted)", fontWeight: 500 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "var(--sr-border-subtle)" }} />
        </div>

        {/* Email/password form */}
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: "flex", flexDirection: "column", gap: 16 }} noValidate>
          {/* Email */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--sr-text-primary)" }}>
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@example.com"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
              style={{
                ...inputCls,
                borderColor: errors.email ? "var(--rust-500)" : focusedField === "email" ? "var(--clay-500)" : "var(--sr-border-default)",
                boxShadow: focusedField === "email" ? "var(--sr-shadow-focus)" : "none",
              }}
              onFocus={() => setFocusedField("email")}
              {...emailReg}
              onBlur={(e) => { emailReg.onBlur(e); setFocusedField(null); }}
            />
            {errors.email && (
              <p id="email-error" role="alert" style={{ fontSize: "0.75rem", color: "var(--rust-500)", margin: 0 }}>
                {errors.email.message}
              </p>
            )}
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <label htmlFor="password" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--sr-text-primary)" }}>
                Password
              </label>
              <Link href="/forgot-password" style={{ fontSize: "0.8125rem", color: "var(--clay-600)", fontWeight: 500, textDecoration: "none" }}>
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              aria-invalid={!!errors.password}
              aria-describedby={errors.password ? "password-error" : undefined}
              style={{
                ...inputCls,
                borderColor: errors.password ? "var(--rust-500)" : focusedField === "password" ? "var(--clay-500)" : "var(--sr-border-default)",
                boxShadow: focusedField === "password" ? "var(--sr-shadow-focus)" : "none",
              }}
              onFocus={() => setFocusedField("password")}
              {...passwordReg}
              onBlur={(e) => { passwordReg.onBlur(e); setFocusedField(null); }}
            />
            {errors.password && (
              <p id="password-error" role="alert" style={{ fontSize: "0.75rem", color: "var(--rust-500)", margin: 0 }}>
                {errors.password.message}
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            style={{
              marginTop: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "12px 16px",
              borderRadius: "var(--sr-radius-md)",
              border: "none",
              background: isSubmitting ? "var(--clay-400)" : "var(--clay-600)",
              color: "#fff",
              fontSize: "1rem",
              fontWeight: 500,
              cursor: isSubmitting ? "not-allowed" : "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "var(--clay-700)"; }}
            onMouseLeave={e => { if (!isSubmitting) (e.currentTarget as HTMLButtonElement).style.background = "var(--clay-600)"; }}
          >
            {isSubmitting ? (
              <Loader2 size={16} className="animate-spin" aria-hidden />
            ) : (
              <ArrowRight size={16} aria-hidden />
            )}
            {isSubmitting ? "Signing in..." : "Login"}
          </button>
        </form>

        {/* Register link */}
        <p style={{ textAlign: "center", fontSize: "0.875rem", color: "var(--sr-text-secondary)", margin: 0 }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--clay-600)", fontWeight: 600, textDecoration: "none" }}>
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
