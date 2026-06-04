"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import Link from "next/link";

const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const createSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  ageConfirm: z.literal(true, { message: "You must be 18 or older to use ShiftReady." }),
  termsAccept: z.literal(true, { message: "You must accept the Terms of Service and Privacy Policy." }),
});

type SignInFields = z.infer<typeof signInSchema>;
type CreateFields = z.infer<typeof createSchema>;

function passwordStrength(pw: string): number {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

function StrengthBar({ password }: { password: string }) {
  const score = passwordStrength(password);
  const pct = password ? (score / 5) * 100 : 0;
  const color = score <= 1 ? "#B14F3B" : score <= 3 ? "#C99935" : "#6B8A4E";
  return (
    <div style={{ height: 2, background: "#E0D5C0", borderRadius: 1, marginTop: 5, overflow: "hidden" }}>
      <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 1, transition: "width 300ms ease, background 300ms ease" }} />
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
      <label style={{ fontSize: 12.5, fontWeight: 500, color: "#3A3528" }}>{label}</label>
      {children}
      {error && <p role="alert" style={{ fontSize: 12, color: "#B14F3B", margin: 0 }}>{error}</p>}
    </div>
  );
}

const inputStyle = (hasError: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "11px 14px",
  background: "#FBF8F3",
  border: `1px solid ${hasError ? "#B14F3B" : "#C9BBA1"}`,
  borderRadius: 10,
  fontFamily: "var(--sr-font-sans)",
  fontSize: 14,
  color: "#1F1B17",
  transition: "border-color 120ms, box-shadow 120ms, background 120ms",
  outline: "none",
});

const toggleBtnStyle: React.CSSProperties = {
  position: "absolute",
  right: 12,
  top: "50%",
  transform: "translateY(-50%)",
  background: "none",
  border: "none",
  color: "#756B5A",
  cursor: "pointer",
  padding: 2,
  display: "flex",
  alignItems: "center",
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "13px 18px",
  background: disabled ? "#D58A6B" : "#CC785C",
  color: "#fff",
  border: "none",
  borderRadius: 10,
  fontFamily: "var(--sr-font-sans)",
  fontSize: 14.5,
  fontWeight: 600,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "background 130ms, box-shadow 130ms",
  letterSpacing: "-.005em",
  boxShadow: "0 1px 0 rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.12)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
});

const KEYFRAMES = `
@keyframes float1 { 0%,100% { transform:rotate(-4deg) translateY(0); } 50% { transform:rotate(-4deg) translateY(-8px); } }
@keyframes float2 { 0%,100% { transform:rotate(3deg) translateY(0); } 50% { transform:rotate(3deg) translateY(-10px); } }
@keyframes float3 { 0%,100% { transform:rotate(-2deg) translateY(0); } 50% { transform:rotate(-2deg) translateY(-6px); } }
@media (max-width: 860px) { .sr-login-left { display: none !important; } .sr-login-mobile-logo { display: flex !important; } }
`;

export default function LoginPage() {
  const { signIn, signInWithGoogle, register: registerUser } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<"signin" | "create">(() => {
    if (typeof window === "undefined") return "signin";
    return new URLSearchParams(window.location.search).get("tab") === "create" ? "create" : "signin";
  });
  const [showPw, setShowPw] = useState(false);
  const [showCreatePw, setShowCreatePw] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [createPwValue, setCreatePwValue] = useState("");

  const signInForm = useForm<SignInFields>({ resolver: zodResolver(signInSchema) });
  const createForm = useForm<CreateFields>({ resolver: zodResolver(createSchema) });

  const handleSignIn = signInForm.handleSubmit(async (data) => {
    setServerError(null);
    try {
      await signIn(data.email, data.password);
      router.push("/seller-central");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Sign in failed");
    }
  });

  const handleCreate = createForm.handleSubmit(async (data) => {
    setServerError(null);
    try {
      await registerUser(data.name, data.email, data.password);
      router.push("/seller-central");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    }
  });

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError(null);
    try {
      await signInWithGoogle();
      router.push("/seller-central");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Google sign in failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const switchTab = (next: "signin" | "create") => {
    setTab(next);
    setServerError(null);
  };

  return (
    <>
      <style>{KEYFRAMES}</style>
      <div style={{ display: "flex", height: "100dvh", overflow: "hidden", fontFamily: "var(--sr-font-sans)" }}>

        {/* ── LEFT PANEL ── */}
        <div
          className="sr-login-left"
          style={{
            width: "56%",
            flexShrink: 0,
            background: "#6E3829",
            position: "relative",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            padding: "40px 48px 36px",
          }}
        >
          {/* Layered radial gradient texture */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: [
              "radial-gradient(ellipse 70% 60% at 80% 20%, rgba(204,120,92,.30) 0%, transparent 60%)",
              "radial-gradient(ellipse 50% 50% at 10% 90%, rgba(201,153,53,.14) 0%, transparent 55%)",
              "radial-gradient(ellipse 80% 80% at 50% 50%, rgba(110,56,41,.60) 0%, transparent 70%)",
            ].join(","),
          }} />
          {/* Diagonal stripe overlay */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "repeating-linear-gradient(115deg, transparent 0 80px, rgba(255,255,255,.02) 80px 82px, transparent 82px 160px)",
          }} />

          {/* Content layer */}
          <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>

            {/* Wordmark */}
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: "rgba(255,255,255,.15)", border: "1px solid rgba(255,255,255,.20)",
                display: "grid", placeItems: "center",
                color: "#fff", fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 600,
                backdropFilter: "blur(8px)",
              }}>S</div>
              <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 20, fontWeight: 600, color: "rgba(255,255,255,.90)", letterSpacing: "-.015em" }}>
                ShiftReady
              </span>
            </div>

            {/* Headline */}
            <div style={{ marginTop: "auto", marginBottom: "auto", padding: "24px 0" }}>
              <h1 style={{
                margin: 0, padding: 0,
                fontFamily: "var(--sr-font-serif)", fontSize: 48, fontWeight: 500,
                lineHeight: 1.06, letterSpacing: "-.03em",
                color: "rgba(255,255,255,.94)", maxWidth: "54%",
              }}>
                Everything you&apos;re<br />leaving behind,<br />
                <em style={{ fontStyle: "italic", color: "#E0A285" }}>finds its person.</em>
              </h1>
              <p style={{ margin: "16px 0 0", fontSize: 16, lineHeight: 1.6, color: "rgba(255,255,255,.55)", maxWidth: "50%" }}>
                Australia&apos;s residential moving marketplace. List a whole house sale in minutes - AI does the pricing.
              </p>
            </div>

            {/* Social proof strip */}
            <div style={{
              display: "flex", flexShrink: 0, marginTop: "auto",
              position: "relative", zIndex: 2,
              background: "rgba(0,0,0,.30)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,.12)", borderRadius: 14, overflow: "hidden",
            }}>
              {[
                { val: "AI-priced", label: "Every item, automatically" },
                { val: "< 5 min", label: "From walkthrough to listing" },
                { val: "Free", label: "To start, always" },
              ].map((s, i) => (
                <div key={i} style={{
                  flex: 1, display: "flex", flexDirection: "column", gap: 3, padding: "16px 20px",
                  borderRight: i < 2 ? "1px solid rgba(255,255,255,.08)" : "none",
                }}>
                  <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 22, fontWeight: 500, color: "#fff", letterSpacing: "-.02em", lineHeight: 1 }}>
                    <em style={{ fontStyle: "italic", color: "#E0A285" }}>{s.val}</em>
                  </div>
                  <div style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(255,255,255,.55)", marginTop: 2 }}>
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom scrim - keeps stats readable over cards */}
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 180,
            background: "linear-gradient(to top, #6E3829 40%, transparent)",
            zIndex: 0, pointerEvents: "none",
          }} />

          {/* Floating listing cards */}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>

            {/* Card 1 - sofa */}
            <div style={{
              position: "absolute", top: "10%", left: "64%",
              background: "#fff", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.14)",
              width: 190, overflow: "hidden",
              animation: "float1 6s ease-in-out infinite",
            }}>
              <div style={{ height: 120, background: "repeating-linear-gradient(135deg, #F5DDCF 0 8px, #FBF1EC 8px 16px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(74,37,25,.35)" }}>
                sofa photo
              </div>
              <div style={{ padding: "10px 12px 13px" }}>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 13.5, fontWeight: 500, color: "#1F1B17", marginBottom: 3, lineHeight: 1.25 }}>3-seat linen sofa, oat</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1F1B17" }}>$420</span>
                  <span style={{ fontSize: 10.5, color: "#756B5A" }}>Surry Hills · 0.4 km</span>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE5D6", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#756B5A" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#E0A285,#CC785C)", display: "grid", placeItems: "center", color: "#fff", fontSize: 8, fontWeight: 600, flexShrink: 0 }}>JL</div>
                  Jamie&apos;s moving sale
                </div>
              </div>
            </div>

            {/* Card 2 - dining table */}
            <div style={{
              position: "absolute", top: "40%", left: "60%",
              background: "#fff", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.14)",
              width: 190, overflow: "hidden",
              animation: "float2 7s ease-in-out infinite",
            }}>
              <div style={{ height: 120, background: "repeating-linear-gradient(135deg, #F2DCAA 0 8px, #FAF0DC 8px 16px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(74,37,25,.35)" }}>
                dining table
              </div>
              <div style={{ padding: "10px 12px 13px" }}>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 13.5, fontWeight: 500, color: "#1F1B17", marginBottom: 3, lineHeight: 1.25 }}>Solid oak dining table</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1F1B17" }}>$650</span>
                  <span style={{ fontSize: 10.5, color: "#756B5A" }}>Bondi · 3.2 km</span>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE5D6", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#756B5A" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#F2DCAA,#C99935)", display: "grid", placeItems: "center", color: "#fff", fontSize: 8, fontWeight: 600, flexShrink: 0 }}>AK</div>
                  Ajay&apos;s clearance
                </div>
              </div>
            </div>

            {/* Card 3 - floor lamp */}
            <div style={{
              position: "absolute", top: "56%", left: "66%",
              background: "#fff", borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,.22), 0 2px 6px rgba(0,0,0,.14)",
              width: 190, overflow: "hidden",
              animation: "float3 8s ease-in-out infinite",
            }}>
              <div style={{ height: 120, background: "repeating-linear-gradient(135deg, #DAE2C7 0 8px, #EFF2E8 8px 16px)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--sr-font-mono)", fontSize: 10, textTransform: "uppercase", letterSpacing: ".14em", color: "rgba(74,37,25,.35)" }}>
                floor lamp
              </div>
              <div style={{ padding: "10px 12px 13px" }}>
                <div style={{ fontFamily: "var(--sr-font-serif)", fontSize: 13.5, fontWeight: 500, color: "#1F1B17", marginBottom: 3, lineHeight: 1.25 }}>Brass arc floor lamp</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1F1B17" }}>$140</span>
                  <span style={{ fontSize: 10.5, color: "#756B5A" }}>Paddington · 1.1 km</span>
                </div>
                <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EDE5D6", display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#756B5A" }}>
                  <div style={{ width: 16, height: 16, borderRadius: "50%", background: "linear-gradient(135deg,#DAE2C7,#6B8A4E)", display: "grid", placeItems: "center", color: "#fff", fontSize: 8, fontWeight: 600, flexShrink: 0 }}>MR</div>
                  Mei&apos;s moving sale
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{
          flex: 1,
          background: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px 40px",
          position: "relative",
          overflowY: "auto",
        }}>
          {/* Subtle top radial tint */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 80% 60% at 50% 0%, #FBF1EC 0%, transparent 60%)",
          }} />

          <div style={{ width: "100%", maxWidth: 360, position: "relative", zIndex: 1 }}>

            {/* Mobile-only logo */}
            <div className="sr-login-mobile-logo" style={{ display: "none", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: "#CC785C", display: "grid", placeItems: "center", color: "#fff", fontFamily: "var(--sr-font-serif)", fontSize: 16, fontWeight: 600 }}>S</div>
              <span style={{ fontFamily: "var(--sr-font-serif)", fontSize: 18, fontWeight: 600, color: "#1F1B17" }}>ShiftReady</span>
            </div>

            {/* Heading */}
            <div style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: "var(--sr-font-serif)", fontSize: 32, fontWeight: 500, letterSpacing: "-.02em", color: "#1F1B17", margin: "0 0 6px", lineHeight: 1.1 }}>
                {tab === "signin"
                  ? <>Welcome <em style={{ fontStyle: "italic", color: "#B5604A" }}>back</em></>
                  : <>Create an <em style={{ fontStyle: "italic", color: "#B5604A" }}>account</em></>}
              </h2>
              <p style={{ fontSize: 14, color: "#756B5A", lineHeight: 1.45, margin: 0 }}>
                {tab === "signin"
                  ? "Sign in to browse and manage your moving sales."
                  : "Join ShiftReady and start listing your items today."}
              </p>
            </div>

            {/* Tab toggle */}
            <div style={{ display: "flex", background: "#F5F0E8", borderRadius: 10, padding: 3, marginBottom: 28, gap: 2 }} role="tablist" aria-label="Authentication mode">
              {(["signin", "create"] as const).map((t) => (
                <button
                  key={t}
                  role="tab"
                  aria-selected={tab === t}
                  onClick={() => switchTab(t)}
                  style={{
                    flex: 1, padding: 9, border: "none", cursor: "pointer",
                    borderRadius: 8, fontFamily: "var(--sr-font-sans)", fontSize: 13.5, fontWeight: 500,
                    transition: "all 160ms", lineHeight: 1,
                    background: tab === t ? "#fff" : "transparent",
                    color: tab === t ? "#1F1B17" : "#756B5A",
                    boxShadow: tab === t ? "0 1px 2px rgba(74,37,25,.05), 0 2px 4px rgba(74,37,25,.04)" : "none",
                  }}
                >
                  {t === "signin" ? "Sign in" : "Create account"}
                </button>
              ))}
            </div>

            {/* Error banner */}
            {serverError && (
              <div role="alert" style={{ padding: "10px 14px", background: "#FAEDE8", border: "1px solid #F2D0C5", borderRadius: 10, fontSize: 13, color: "#B14F3B", marginBottom: 16 }}>
                {serverError}
              </div>
            )}

            {/* Google button */}
            <button
              onClick={handleGoogle}
              disabled={googleLoading}
              aria-busy={googleLoading}
              style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                padding: "12px 18px", background: "#fff", border: "1px solid #C9BBA1", borderRadius: 10,
                fontFamily: "var(--sr-font-sans)", fontSize: 14, fontWeight: 500, color: "#2A2620",
                cursor: googleLoading ? "not-allowed" : "pointer",
                opacity: googleLoading ? 0.6 : 1,
                boxShadow: "0 1px 2px rgba(74,37,25,.05), 0 2px 4px rgba(74,37,25,.04)",
                transition: "border-color 140ms, box-shadow 140ms",
              }}
            >
              {googleLoading ? (
                <Loader2 size={18} className="animate-spin" aria-hidden />
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335" />
                </svg>
              )}
              Continue with Google
            </button>

            {/* OR divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
              <div style={{ flex: 1, height: 1, background: "#E0D5C0" }} />
              <span style={{ fontFamily: "var(--sr-font-mono)", fontSize: 10.5, textTransform: "uppercase", letterSpacing: ".12em", color: "#C9C0AF" }}>or</span>
              <div style={{ flex: 1, height: 1, background: "#E0D5C0" }} />
            </div>

            {/* ── Sign in form ── */}
            {tab === "signin" && (
              <form onSubmit={handleSignIn} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 4 }}>
                  <Field label="Email address" error={signInForm.formState.errors.email?.message}>
                    <input
                      id="si-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={!!signInForm.formState.errors.email}
                      style={inputStyle(!!signInForm.formState.errors.email)}
                      {...signInForm.register("email")}
                    />
                  </Field>
                  <Field label="Password" error={signInForm.formState.errors.password?.message}>
                    <div style={{ position: "relative" }}>
                      <input
                        id="si-pass"
                        type={showPw ? "text" : "password"}
                        autoComplete="current-password"
                        placeholder="••••••••"
                        aria-invalid={!!signInForm.formState.errors.password}
                        style={{ ...inputStyle(!!signInForm.formState.errors.password), paddingRight: 40 }}
                        {...signInForm.register("password")}
                      />
                      <button type="button" onClick={() => setShowPw((v) => !v)} style={toggleBtnStyle} aria-label={showPw ? "Hide password" : "Show password"}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </Field>
                </div>

                <Link href="/forgot-password" style={{ display: "block", textAlign: "right", fontSize: 12.5, color: "#B5604A", textDecoration: "none", marginTop: 8, marginBottom: 16 }}>
                  Forgot password?
                </Link>

                <button type="submit" disabled={signInForm.formState.isSubmitting} style={primaryBtnStyle(signInForm.formState.isSubmitting)}>
                  {signInForm.formState.isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden />}
                  {signInForm.formState.isSubmitting ? "Signing in…" : "Sign in to ShiftReady"}
                </button>

                <p style={{ textAlign: "center", fontSize: 13.5, color: "#756B5A", marginTop: 20, marginBottom: 0 }}>
                  Don&apos;t have an account?{" "}
                  <button type="button" onClick={() => switchTab("create")} style={{ background: "none", border: "none", cursor: "pointer", color: "#B5604A", fontWeight: 500, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>
                    Create one →
                  </button>
                </p>
              </form>
            )}

            {/* ── Create account form ── */}
            {tab === "create" && (
              <form onSubmit={handleCreate} noValidate>
                <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 20 }}>
                  <Field label="Full name" error={createForm.formState.errors.name?.message}>
                    <input
                      id="ca-name"
                      type="text"
                      autoComplete="name"
                      placeholder="Jamie Lee"
                      aria-invalid={!!createForm.formState.errors.name}
                      style={inputStyle(!!createForm.formState.errors.name)}
                      {...createForm.register("name")}
                    />
                  </Field>
                  <Field label="Email address" error={createForm.formState.errors.email?.message}>
                    <input
                      id="ca-email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      aria-invalid={!!createForm.formState.errors.email}
                      style={inputStyle(!!createForm.formState.errors.email)}
                      {...createForm.register("email")}
                    />
                  </Field>
                  <Field label="Password" error={createForm.formState.errors.password?.message}>
                    <div style={{ position: "relative" }}>
                      <input
                        id="ca-pass"
                        type={showCreatePw ? "text" : "password"}
                        autoComplete="new-password"
                        placeholder="At least 8 characters"
                        aria-invalid={!!createForm.formState.errors.password}
                        style={{ ...inputStyle(!!createForm.formState.errors.password), paddingRight: 40 }}
                        {...createForm.register("password", {
                          onChange: (e) => setCreatePwValue(e.target.value),
                        })}
                      />
                      <button type="button" onClick={() => setShowCreatePw((v) => !v)} style={toggleBtnStyle} aria-label={showCreatePw ? "Hide password" : "Show password"}>
                        {showCreatePw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                    <StrengthBar password={createPwValue} />
                  </Field>
                </div>

                {/* Age gate */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 10 }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: 2, accentColor: "#CC785C", flexShrink: 0 }}
                    {...createForm.register("ageConfirm")}
                  />
                  <span style={{ fontSize: 12.5, color: "#756B5A", lineHeight: 1.5 }}>
                    I confirm I am 18 years of age or older.
                  </span>
                </label>
                {createForm.formState.errors.ageConfirm && (
                  <p role="alert" style={{ fontSize: 12, color: "#B14F3B", margin: "0 0 10px" }}>
                    {createForm.formState.errors.ageConfirm.message}
                  </p>
                )}

                {/* ToS + Privacy */}
                <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", marginBottom: 18 }}>
                  <input
                    type="checkbox"
                    style={{ marginTop: 2, accentColor: "#CC785C", flexShrink: 0 }}
                    {...createForm.register("termsAccept")}
                  />
                  <span style={{ fontSize: 12.5, color: "#756B5A", lineHeight: 1.5 }}>
                    I agree to the{" "}
                    <a href="/terms" target="_blank" rel="noreferrer" style={{ color: "#B5604A", textDecoration: "none" }}>Terms of Service</a>
                    {" "}and{" "}
                    <a href="/privacy" target="_blank" rel="noreferrer" style={{ color: "#B5604A", textDecoration: "none" }}>Privacy Policy</a>.
                  </span>
                </label>
                {createForm.formState.errors.termsAccept && (
                  <p role="alert" style={{ fontSize: 12, color: "#B14F3B", margin: "-10px 0 12px" }}>
                    {createForm.formState.errors.termsAccept.message}
                  </p>
                )}

                <button type="submit" disabled={createForm.formState.isSubmitting} style={{ ...primaryBtnStyle(createForm.formState.isSubmitting), marginBottom: 16 }}>
                  {createForm.formState.isSubmitting && <Loader2 size={15} className="animate-spin" aria-hidden />}
                  {createForm.formState.isSubmitting ? "Creating account…" : "Create account"}
                </button>

                <p style={{ textAlign: "center", fontSize: 13.5, color: "#756B5A", marginTop: 0, marginBottom: 0 }}>
                  Already have an account?{" "}
                  <button type="button" onClick={() => switchTab("signin")} style={{ background: "none", border: "none", cursor: "pointer", color: "#B5604A", fontWeight: 500, padding: 0, fontFamily: "inherit", fontSize: "inherit" }}>
                    Sign in →
                  </button>
                </p>
              </form>
            )}

          </div>
        </div>

      </div>
    </>
  );
}
