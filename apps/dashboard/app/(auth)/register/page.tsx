"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, LockKeyhole, Mail, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    const res = await register(email, password, name);

    if (res.error) {
      setError(res.error);
      setLoading(false);
      return;
    }

    router.push(`/register/verify?email=${encodeURIComponent((res.email || email).trim())}`);
  }

  return (
    <>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Create workspace</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign up to run 3 completely free scans per day.
        </p>
      </div>

      {error && (
        <div className="mb-5 rounded-[1.2rem] border border-red-500/20 bg-red-500/8 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-muted-foreground">Full name</label>
          <div className="relative">
            <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className="w-full rounded-md border border-white/10 bg-black/40 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-white/20 focus:ring-1 focus:ring-white/20 placeholder:text-white/30 transition-colors"
            />
          </div>
        </div>

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
          Send verification code
        </button>
      </form>


      <div className="mt-6 flex flex-col items-center gap-3">
        <Link href="/login" className="text-sm font-medium text-foreground transition-colors hover:text-muted-foreground tracking-wide">
          Return to sign in
        </Link>
      </div>
    </>
  );
}
