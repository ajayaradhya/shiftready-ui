"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Mail, Lock, MoveRight } from "lucide-react";
import Link from "next/link";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFields = z.infer<typeof loginSchema>;

const inputCls =
  "w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder:text-outline/40 outline-none focus-visible:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/20 transition-all aria-[invalid=true]:border-error/40";

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFields>({ resolver: zodResolver(loginSchema) });

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
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-on-surface">
          Shift<span className="text-primary">Ready</span>
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 font-medium">
          Sign in to manage your move
        </p>
      </div>

      <div className="bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10 shadow-2xl flex flex-col gap-6">
        {serverError && (
          <div
            role="alert"
            className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium animate-in fade-in duration-200"
          >
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Email
            </label>
            <div className="relative">
              <Mail size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                className={inputCls}
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p id="email-error" role="alert" className="text-[11px] text-error">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="password" className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Password
            </label>
            <div className="relative">
              <Lock size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline" aria-hidden />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
                className={inputCls}
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p id="password-error" role="alert" className="text-[11px] text-error">
                {errors.password.message}
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            aria-busy={isSubmitting}
            className="mt-2 flex items-center justify-center gap-2 bg-primary text-surface py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" aria-hidden />
            ) : (
              <MoveRight size={14} aria-hidden />
            )}
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="flex items-center gap-3" aria-hidden>
          <div className="flex-1 h-px bg-outline-variant/20" />
          <span className="text-[10px] uppercase tracking-widest text-outline font-black">or</span>
          <div className="flex-1 h-px bg-outline-variant/20" />
        </div>

        <button
          onClick={handleGoogle}
          disabled={googleLoading}
          aria-busy={googleLoading}
          className="flex items-center justify-center gap-3 w-full py-3 rounded-xl border border-outline-variant/20 bg-surface-container-lowest text-on-surface text-sm font-medium hover:border-primary/30 hover:bg-primary/5 active:scale-[0.98] transition-all disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin" aria-hidden />
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Continue with Google
        </button>

        <p className="text-center text-xs text-outline">
          No account?{" "}
          <Link href="/register" className="text-primary font-bold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-sm">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}
