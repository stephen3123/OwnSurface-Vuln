"use client";

import { Suspense, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const didRedirect = useRef(false);

  const resetSucceeded = searchParams.get("reset") === "success";
  const nextPath = searchParams.get("next") || "/dashboard";

  // If already authenticated, redirect to dashboard (replaces server-side proxy check)
  useEffect(() => {
    if (isAuthenticated && !authLoading && !didRedirect.current) {
      didRedirect.current = true;
      router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
    }
  }, [isAuthenticated, authLoading, nextPath, router]);

  if (isAuthenticated && !authLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const res = await login(email, password);

    if (res.error) {
      if (res.errorCode === "email_not_verified") {
        router.push(`/register/verify?email=${encodeURIComponent(email.trim())}`);
        return;
      }
      setError(res.error);
      setLoading(false);
      return;
    }

    router.replace(nextPath.startsWith("/") ? nextPath : "/dashboard");
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Welcome back</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Enter your email and password to sign in.
        </p>
      </div>

      {resetSucceeded && (
        <div className="mb-6 rounded-md border border-white/10 bg-white/5 px-4 py-3 text-center text-sm text-white">
          Password updated. Sign in with your new password.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-md border border-red-500/20 bg-red-500/10 px-4 py-3 text-center text-sm text-red-500">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Password</label>
          <div className="relative">
            <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Enter your password"
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
          Enter workspace
        </button>
      </form>

      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href="/reset-password" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
          Forgot your password?
        </Link>
        <div className="h-px w-8 bg-white/10" />
        <Link href="/register" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground tracking-wide">
          Create a workspace
        </Link>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
      <LoginContent />
    </Suspense>
  );
}
