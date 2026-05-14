"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail, RotateCw } from "lucide-react";
import { api } from "@/lib/api-client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [requested, setRequested] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = window.setInterval(() => {
      setCooldown((value) => (value > 0 ? value - 1 : 0));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown]);

  async function handleRequest(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const res = await api.requestPasswordReset(email);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    setRequested(true);
    setCooldown(res.data?.retry_after_seconds || 60);
    setInfo("If an account exists for this email, a reset code has been sent.");
    setLoading(false);
  }

  async function handleConfirm(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setInfo("");
    setLoading(true);

    const res = await api.confirmPasswordReset(email, otp, newPassword);
    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.push("/login?reset=success");
  }

  async function handleResend() {
    setError("");
    setInfo("");
    setResending(true);

    const res = await api.requestPasswordReset(email);
    if (res.error) {
      setError(res.error);
      setResending(false);
      return;
    }

    setCooldown(res.data?.retry_after_seconds || 60);
    setInfo("If an account exists for this email, a fresh reset code has been sent.");
    setResending(false);
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          {requested ? "Enter reset code" : "Recover account"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {requested
            ? "Check your email for the 6-digit code."
            : "We'll send a one-time reset code to your email."}
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      {info && (
        <div className="mb-6 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white">
          {info}
        </div>
      )}

      {!requested ? (
        <form onSubmit={handleRequest} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Work email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 placeholder:text-white/30 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-transform hover:scale-[1.01] shadow-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Send reset code
          </button>
        </form>
      ) : (
        <form onSubmit={handleConfirm} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Work email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 placeholder:text-white/30 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Reset code</label>
            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              className="w-full rounded-md border border-white/10 bg-black/40 px-4 py-3 text-center font-mono text-lg tracking-[0.35em] text-white outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 placeholder:tracking-[0.2em] placeholder:text-white/30 transition-colors shadow-inner"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">New password</label>
            <div className="relative">
              <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <input
                type="password"
                required
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 placeholder:text-white/30 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-transform hover:scale-[1.01] shadow-lg"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
            Update password
          </button>
        </form>
      )}

      {requested && (
        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            type="button"
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition-colors hover:text-muted-foreground disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {resending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCw className="h-4 w-4" />}
            {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
          </button>
        </div>
      )}

      {/* Vertical funnel stack for bottom link */}
      <div className={requested ? "mt-3 flex flex-col items-center gap-3" : "mt-6 flex flex-col items-center gap-3"}>
        {requested && <div className="h-px w-8 bg-white/10" />}
        <Link href="/login" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground tracking-wide">
          Return to sign in
        </Link>
      </div>
    </>
  );
}
