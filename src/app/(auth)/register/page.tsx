"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { registerSchema, type RegisterInput } from "@/lib/validations/user";
import PhoneInput from "@/components/ui/PhoneInput";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);
  const [otp, setOtp] = useState("");
  const [resending, setResending] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterInput>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterInput) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error ?? "Registration failed");
        return;
      }

      // Email must be verified before signing in
      toast.success("Account created! We've emailed you a verification code.");
      setPendingCreds({ email: data.email, password: data.password });
    } finally {
      setLoading(false);
    }
  };

  const verifyAndSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingCreds) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingCreds.email, otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }
      const result = await signIn("credentials", {
        email: pendingCreds.email,
        password: pendingCreds.password,
        redirect: false,
      });
      if (result?.error) {
        toast.success("Email verified! Please sign in.");
        window.location.href = "/login";
        return;
      }
      toast.success("Email verified! Welcome to Sanatani Community.");
      window.location.href = "/dashboard";
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!pendingCreds) return;
    setResending(true);
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: pendingCreds.email }),
      });
      const json = await res.json();
      if (!res.ok) toast.error(json.error ?? "Could not resend the code");
      else toast.success("A new code is on its way");
    } finally {
      setResending(false);
    }
  };

  const handleGoogle = async () => {
    localStorage.setItem("hp_last_provider", "google");
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard" });
  };

  if (pendingCreds) {
    return (
      <div className="w-full max-w-md">
        <div className="mb-8">
          <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-gray-900 mb-2">
            Verify your email
          </h1>
          <p className="text-gray-500">
            We sent a 6-digit code to <b className="text-[#FF5F15]">{pendingCreds.email}</b>.
            Enter it below to activate your account.
          </p>
        </div>

        <form onSubmit={verifyAndSignIn} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-gray-700 font-medium">6-digit code</Label>
            <Input
              id="otp"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="••••••"
              value={otp}
              autoFocus
              maxLength={6}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
              onPaste={(e) => {
                e.preventDefault();
                setOtp(e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6));
              }}
              className="bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20 text-center text-2xl tracking-[0.5em] font-semibold py-6"
            />
          </div>

          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white transition-all duration-300 py-5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify & Continue"}
          </Button>

          <button
            type="button"
            onClick={resendCode}
            disabled={resending}
            className="w-full text-sm text-gray-500 hover:text-[#FF5F15] disabled:opacity-50"
          >
            {resending ? "Sending…" : "Didn't get it? Resend code"}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-gray-900 mb-2">
          Create your account
        </h1>
        <p className="text-gray-500">Join Sanatani Community - find your home directly from owners</p>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2 border-gray-200 hover:border-[#FF5F15] transition-colors duration-200"
        onClick={handleGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-5">
        <Separator className="flex-1" />
        <span className="text-xs text-gray-400">or</span>
        <Separator className="flex-1" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-gray-700 font-medium">Full Name</Label>
          <Input
            id="name"
            placeholder="Raj Sharma"
            {...register("name")}
            className={`bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20 ${errors.name ? "border-red-500" : ""}`}
          />
          {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            {...register("email")}
            className={`bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20 ${errors.email ? "border-red-500" : ""}`}
          />
          {errors.email && <p className="text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone" className="text-gray-700 font-medium">
            Mobile Number <span className="text-gray-400 font-normal">(optional)</span>
          </Label>
          <Controller
            control={control}
            name="phone"
            defaultValue=""
            render={({ field }) => (
              <PhoneInput
                id="phone"
                value={field.value ?? ""}
                onChange={field.onChange}
                error={!!errors.phone}
              />
            )}
          />
          {errors.phone && <p className="text-xs text-red-500">{errors.phone.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              {...register("password")}
              className={`bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20 pr-10 ${errors.password ? "border-red-500" : ""}`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white transition-all duration-300 py-5"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already have an account?{" "}
        <Link href="/login" className="text-[#FF5F15] font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
