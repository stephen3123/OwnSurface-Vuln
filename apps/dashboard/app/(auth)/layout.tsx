import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center bg-background bg-dot-grid text-foreground overflow-hidden">
      {/* Ambient monochrome glows behind the auth card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[40rem] w-[40rem] bg-white-[0.02] rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/3 -translate-x-1/2 -translate-y-1/2 h-[30rem] w-[30rem] bg-white/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Top Left Back Navigation */}
      <div className="absolute top-8 left-8 z-20">
        <Link
          href="/"
          className="flex items-center gap-1.5 rounded-full border border-border/50 bg-background/50 px-4 py-2 text-xs font-medium text-muted-foreground backdrop-blur-md transition-colors hover:border-border hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to home
        </Link>
      </div>

      <div className="relative z-10 w-full max-w-[28rem] px-4">
        {/* Centered brand wordmark */}
        <div className="mb-10 flex justify-center">
          <Link href="/" className="text-center transition-opacity hover:opacity-90">
            <span className="block text-[2.9rem] font-black tracking-[-0.06em] leading-none sm:text-[3.5rem] [background-image:linear-gradient(90deg,hsl(var(--foreground))_0%,hsl(var(--foreground))_76%,rgba(94,234,212,0.92)_100%)] bg-clip-text text-transparent drop-shadow-[0_0_18px_rgba(45,212,191,0.08)]">
              OwnSurface
            </span>
          </Link>
        </div>

        {/* Floating Auth Form */}
        <div className="sm:mx-auto sm:w-full sm:max-w-[400px]">
          <div className="dark">
            {children}
          </div>
        </div>

        <div className="mt-8 text-center text-xs text-muted-foreground/60">
          <p>Protected by OwnSurface Security</p>
        </div>
      </div>
    </div>
  );
}
