"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, MailCheck } from "lucide-react";

function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const autoSent = useRef(false);

  async function sendCode(isAuto = false) {
    if (!email.trim()) {
      if (!isAuto) toast.error("Enter your email address");
      return;
    }
    setResending(true);
    try {
      const res = await fetch("/api/auth/verify-email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (!isAuto) toast.error(json.error ?? "Could not send the code");
      } else if (!isAuto) {
        toast.success("If this email needs verification, a code is on its way");
      }
    } finally {
      setResending(false);
    }
  }

  // Arriving from login with an email → send the code automatically
  useEffect(() => {
    if (searchParams.get("email") && !autoSent.current) {
      autoSent.current = true;
      sendCode(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirm(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-email/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), otp }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? "Verification failed");
        return;
      }
      toast.success("Email verified! You can sign in now.");
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-8">
        <h1 className="font-[family-name:var(--font-playfair)] text-3xl font-bold text-gray-900 mb-2">
          Verify your email
        </h1>
        <p className="text-gray-500">
          Enter the 6-digit code we sent to your email to activate your account.
        </p>
      </div>

      <form onSubmit={confirm} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-white border-gray-200 focus:border-[#FF5F15] focus:ring-[#FF5F15]/20"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="otp" className="text-gray-700 font-medium">6-digit code</Label>
          <Input
            id="otp"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="••••••"
            value={otp}
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
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify Email"}
        </Button>

        <button
          type="button"
          onClick={() => sendCode()}
          disabled={resending}
          className="w-full text-sm text-gray-500 hover:text-[#FF5F15] inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
        >
          {resending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MailCheck className="h-3.5 w-3.5" />}
          Send / resend code
        </button>
      </form>

      <p className="text-center text-sm text-gray-500 mt-6">
        Already verified?{" "}
        <Link href="/login" className="text-[#FF5F15] font-medium hover:underline">
          Sign In
        </Link>
      </p>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="w-full max-w-md h-96 bg-white rounded-xl animate-pulse" />}>
      <VerifyEmailForm />
    </Suspense>
  );
}
