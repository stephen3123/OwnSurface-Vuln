"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, MailCheck, RotateCw } from "lucide-react";
import { api } from "@/lib/api-client";
import { mutateSession } from "@/lib/dashboard-cache";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  useEffect(() => {
    const nextEmail = searchParams.get("email") || "";
    setEmail(nextEmail);
  }, [searchParams]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown]);

  async function handleVerify(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const res = await api.verifyRegistrationOtp(email, otp);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    if (res.data?.user) {
      await mutateSession({
        id: res.data.user.id,
        email: res.data.user.email,
        name: res.data.user.name || "",
      });
      router.replace("/dashboard");
      return;
    }

    setError("Unexpected error");
    setLoading(false);
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setResending(true);

    const res = await api.resendRegistrationOtp(email);
    if (res.error) {
      setError(res.error);
      setResending(false);
      return;
    }

    setCooldown(res.data?.retry_after_seconds || 60);
    setInfo("A fresh verification code has been sent.");
    setResending(false);
  }

  return (
    <>
      <div className="mb-8">
        <div className="section-kicker">Verify workspace email</div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">Finish your registration</h1>
        <p className="mt-3 text-sm leading-7 text-muted-foreground">
          Enter the 6-digit code sent to your email to activate the workspace and sign in.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <span className="platform-chip">email verification</span>
          <span className="platform-chip">6 digits</span>
          <span className="platform-chip">10 minute expiry</span>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-[1.2rem] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-5 rounded-[1.2rem] border border-teal-500/20 bg-teal-500/8 px-4 py-3 text-sm text-teal-700">
          {info}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">Work email</label>
          <div className="relative">
            <MailCheck className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@company.com"
              className="w-full rounded-[1rem] border border-border bg-card/50 py-3 pl-11 pr-4 text-sm outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-semibold text-foreground">Verification code</label>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            value={otp}
            onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="000000"
            className="w-full rounded-[1rem] border border-border bg-card/50 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] outline-none focus:border-teal-500 focus:ring-4 focus:ring-teal-500/15 placeholder:tracking-[0.2em] placeholder:text-muted-foreground"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-[1rem] bg-[hsl(var(--ink))] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-black/10 hover:bg-teal-600 disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          Verify and enter workspace
        </button>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[1.2rem] border border-border bg-card/50 p-4">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Need a fresh code?</div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Resend is available after the cooldown expires so the mailbox and API stay protected.
          </p>
        </div>
        <div className="rounded-[1.2rem] border border-border bg-card/50 p-4">
          <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Security rule</div>
          <p className="mt-2 text-sm leading-7 text-muted-foreground">
            Codes expire quickly and are required before the workspace can be used.
          </p>
        </div>
      </div>

      <div className="mt-5 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-600">
          Edit registration details
        </Link>
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="inline-flex items-center gap-2 font-semibold text-teal-700 hover:text-teal-600 disabled:cursor-not-allowed disabled:text-muted-foreground"
        >
          {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
          {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
        </button>
      </div>
    </>
  );
}

export default function VerifyRegistrationPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <VerifyContent />
    </Suspense>
  );
}
