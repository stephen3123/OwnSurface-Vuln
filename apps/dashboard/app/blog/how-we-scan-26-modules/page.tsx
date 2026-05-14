import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell, PublicPageSection } from "@/components/public/public-page-shell";
import { ArrowLeft, ArrowRight, Zap, Clock, Cpu, Globe, Shield, Search, BarChart3, Code, Eye } from "lucide-react";
import { ShareButtons } from "@/components/blog/share-buttons";

export const metadata: Metadata = buildPageMetadata({
  title: "How We Scan 26 Modules in 30 Seconds — OwnSurface Architecture",
  description:
    "A technical deep dive into how OwnSurface runs 26 parallel scanner modules in under 30 seconds using Rust, Playwright, NATS message queues, and a custom browser pool.",
  path: "/blog/how-we-scan-26-modules",
});

const phases = [
  {
    icon: Globe,
    name: "Phase 1 — Browser Launch",
    time: "0-2s",
    description: "A headless Chromium instance from our browser pool navigates to the target URL. We wait for network idle (no pending requests for 500ms) to ensure the page is fully rendered — including JavaScript-rendered content that basic HTTP fetchers miss.",
  },
  {
    icon: Code,
    name: "Phase 2 — Core Extraction",
    time: "2-8s",
    modules: ["Tech stack (Wappalyzer engine)", "Meta/SEO tags", "Social media links", "Business signals", "HTTP headers", "SSL/TLS analysis"],
    description: "Six core modules run simultaneously against the loaded page. Tech stack detection uses pattern matching against 3,000+ technology signatures. SEO extraction parses meta tags, structured data, canonical URLs, and Open Graph properties. SSL analysis checks certificate chain, protocol versions, and cipher suites.",
  },
  {
    icon: Shield,
    name: "Phase 3 — Security Audit",
    time: "8-15s",
    modules: ["Security headers grading", "Cookie security flags", "CORS configuration", "DNS security (DNSSEC, SPF, DMARC)", "Sensitive file exposure", "CVE matching"],
    description: "The security phase runs in parallel with intelligence gathering. We check 15+ HTTP security headers, analyze every cookie for HttpOnly/Secure/SameSite flags, test CORS headers for misconfigurations, and match detected technologies against the CVE database for known vulnerabilities.",
  },
  {
    icon: Search,
    name: "Phase 4 — Intelligence",
    time: "15-22s",
    modules: ["Traffic estimation (Tranco ranking)", "Competitor detection", "Cost estimation", "Clone/template detection", "Admin panel discovery"],
    description: "Intelligence modules analyze the page content and external signals. Traffic estimation cross-references the Tranco top-list ranking. Competitor detection finds similar sites. Cost estimation analyzes the tech stack to approximate hosting and SaaS costs. Clone detection identifies if the site uses a known template.",
  },
  {
    icon: BarChart3,
    name: "Phase 5 — AI Summary",
    time: "22-28s",
    description: "All scan results are passed to Claude on AWS Bedrock, which generates a concise, human-readable summary highlighting the most important findings — security risks, technology choices, SEO opportunities, and competitive positioning. This runs asynchronously while final results are being assembled.",
  },
  {
    icon: Zap,
    name: "Phase 6 — Cache & Deliver",
    time: "28-30s",
    description: "Results are cached in Dragonfly (Redis-compatible) with a 24-hour TTL and persisted to PostgreSQL for history. The scan result is published back to the API via NATS message queue, which immediately returns it to the user. Subsequent requests for the same URL within 24 hours return instantly from cache.",
  },
];

export default function HowWeScanPost() {
  return (
    <PublicPageShell
      eyebrow="Blog"
      title="How We Scan 26 Modules in 30 Seconds"
      description="A technical deep dive into OwnSurface's parallel scanning architecture — from browser launch to cached result — and why we built it with Rust, Playwright, and NATS."
    >
      {/* Back to blog + share */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Link href="/blog" className="flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>
          <span className="text-muted-foreground">March 17, 2026</span>
          <span className="text-muted-foreground">10 min read</span>
        </div>
        <ShareButtons title="How We Scan 26 Modules in 30 Seconds" path="/blog/how-we-scan-26-modules" />
      </div>

      {/* Architecture overview */}
      <PublicPageSection title="The Problem: 6 Tools, 6 Tabs, 6 Minutes">
        <p>
          Before OwnSurface, checking a website&apos;s tech stack meant opening BuiltWith. Checking security headers meant SecurityHeaders.com. Traffic data? SimilarWeb. SSL certificate? Yet another tool. Each one takes 30-60 seconds, and none of them talk to each other.
        </p>
        <p>
          We asked: what if one scan could run all of these checks simultaneously and return a unified result in the time it takes to check one tool? That question led us to build a parallel scanning engine that runs <strong>26 modules in under 30 seconds</strong>.
        </p>
      </PublicPageSection>

      <PublicPageSection title="The Stack">
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { label: "API Server", value: "Rust (Axum) — handles authentication, caching, rate limiting, and result delivery", icon: Cpu },
            { label: "Scan Worker", value: "Node.js + Playwright — browser automation, tech detection, content extraction", icon: Globe },
            { label: "Message Queue", value: "NATS JetStream — async scan requests and results between API and workers", icon: Zap },
            { label: "Cache", value: "Dragonfly (Redis-compatible) — 24-hour result caching, rate limit counters", icon: Clock },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon className="h-4 w-4 text-teal-600" />
                <span className="font-semibold text-sm">{label}</span>
              </div>
              <p className="text-sm text-muted-foreground">{value}</p>
            </div>
          ))}
        </div>
      </PublicPageSection>

      {/* Timeline */}
      <PublicPageSection title="The 30-Second Timeline">
        <p>Here&apos;s exactly what happens when you click &quot;Scan&quot;:</p>
        <div className="space-y-6 mt-4">
          {phases.map((phase) => {
            const Icon = phase.icon;
            return (
              <div key={phase.name} className="rounded-xl border border-border p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4.5 w-4.5 text-teal-600" />
                    <h3 className="font-semibold">{phase.name}</h3>
                  </div>
                  <span className="rounded-full bg-secondary px-3 py-1 text-xs font-mono font-semibold">{phase.time}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{phase.description}</p>
                {phase.modules && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {phase.modules.map((mod) => (
                      <span key={mod} className="rounded-full bg-teal-500/8 px-2.5 py-1 text-xs font-medium text-teal-700">
                        {mod}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </PublicPageSection>

      {/* Why Rust */}
      <PublicPageSection title="Why Rust for the API?">
        <p>
          The API server handles authentication, caching, rate limiting, Stripe billing, and result delivery. We chose Rust with Axum because:
        </p>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li><strong>Memory safety without garbage collection</strong> — no GC pauses, predictable latency under load</li>
          <li><strong>512MB memory limit in production</strong> — the entire API server runs in half a gigabyte, including all routes, middleware, and connection pools</li>
          <li><strong>Compile-time SQL checking</strong> — sqlx validates every database query at compile time, so we never ship a broken query</li>
          <li><strong>Single binary deployment</strong> — no runtime dependencies, no node_modules, just a 15MB binary in a minimal Debian container</li>
        </ul>
      </PublicPageSection>

      {/* CTA */}
      <PublicPageSection title="Try It Yourself">
        <p>
          Every scan runs through this exact pipeline. Enter any URL and watch 26 modules return results in under 30 seconds.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
          >
            Start scanning free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-muted-foreground">3 free scans per day. No credit card.</span>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
}
