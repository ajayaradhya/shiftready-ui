"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Loader2, Mail, Lock, User, MoveRight } from "lucide-react";
import Link from "next/link";

const registerSchema = z
  .object({
    displayName: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type RegisterFields = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterFields) => {
    setServerError(null);
    try {
      await registerUser(data.displayName, data.email, data.password);
      router.push("/create");
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Registration failed");
    }
  };

  return (
    <div className="w-full max-w-md animate-in fade-in zoom-in duration-500">
      {/* Logo */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-black uppercase tracking-tighter text-on-surface">
          Shift<span className="text-primary">Ready</span>
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 font-medium">
          Create your account to start selling
        </p>
      </div>

      <div className="bg-surface-container-high rounded-2xl p-8 border border-outline-variant/10 shadow-2xl flex flex-col gap-5">
        {serverError && (
          <div className="px-4 py-3 bg-error/10 border border-error/20 rounded-xl text-error text-xs font-medium animate-in fade-in duration-200">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Full Name
            </label>
            <div className="relative">
              <User
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="text"
                autoComplete="name"
                placeholder="Alex Johnson"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                {...register("displayName")}
              />
            </div>
            {errors.displayName && (
              <p className="text-[11px] text-error">{errors.displayName.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Email
            </label>
            <div className="relative">
              <Mail
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                {...register("email")}
              />
            </div>
            {errors.email && (
              <p className="text-[11px] text-error">{errors.email.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Password
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                {...register("password")}
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-error">{errors.password.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-[0.2em] font-black text-outline">
              Confirm Password
            </label>
            <div className="relative">
              <Lock
                size={14}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-outline"
              />
              <input
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-xl pl-9 pr-4 py-3 text-sm text-on-surface placeholder:text-outline/40 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all"
                {...register("confirmPassword")}
              />
            </div>
            {errors.confirmPassword && (
              <p className="text-[11px] text-error">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 flex items-center justify-center gap-2 bg-primary text-surface py-3 rounded-xl font-black uppercase tracking-widest text-[11px] hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <MoveRight size={14} />
            )}
            {isSubmitting ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="text-center text-xs text-outline">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
