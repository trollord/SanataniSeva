"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Loader2, MailCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "reset">("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  async function requestCode(isResend = false) {
    if (!email.trim()) {
      toast.error("Enter your email address");
      return;
    }
    if (isResend) setResending(true);
    else setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Something went wrong");
        return;
      }
      toast.success("If an account exists, a reset code is on its way");
      setStep("reset");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
      setResending(false);
    }
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Could not reset password");
        return;
      }
      toast.success("Password reset! Sign in with your new password.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-[#FF5F15] mb-2">
          {step === "email" ? "Forgot password?" : "Check your email"}
        </h1>
        <p className="text-gray-500">
          {step === "email"
            ? "Enter your account email and we'll send you a 6-digit reset code."
            : (
              <>
                We sent a code to <b className="text-[#FF5F15]">{email.trim()}</b>.
                Enter it below with your new password.
              </>
            )}
        </p>
      </div>

      {step === "email" ? (
        <form
          onSubmit={(e) => { e.preventDefault(); requestCode(); }}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-[#FF5F15] font-medium">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              className="bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20"
            />
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white transition-all duration-300 py-5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Send Reset Code"}
          </Button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="otp" className="text-[#FF5F15] font-medium">6-digit code</Label>
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

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-[#FF5F15] font-medium">New password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              At least 8 characters, one uppercase letter and one number.
            </p>
          </div>

          <Button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full bg-[#FF5F15] hover:bg-[#FF5F15]/90 text-white transition-all duration-300 py-5"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reset Password"}
          </Button>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={() => requestCode(true)}
              disabled={resending}
              className="text-gray-500 hover:text-[#FF5F15] inline-flex items-center gap-1.5 disabled:opacity-50"
            >
              {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
              Resend code
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setPassword(""); }}
              className="text-gray-500 hover:text-[#FF5F15]"
            >
              Change email
            </button>
          </div>
        </form>
      )}

      <p className="text-center text-sm text-gray-500 mt-6">
        Remembered it?{" "}
        <Link href="/login" className="text-[#FF5F15] font-medium hover:underline">
          Back to Sign In
        </Link>
      </p>
    </div>
  );
}
