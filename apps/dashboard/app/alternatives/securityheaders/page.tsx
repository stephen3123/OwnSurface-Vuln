import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { Check, X, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "OwnSurface vs SecurityHeaders — Complete Website Security Audit Tool",
  description:
    "Compare OwnSurface to SecurityHeaders.com. Get HTTP header analysis plus tech stack, CVE scanning, SSL monitoring, attack surface audit, and more.",
  path: "/alternatives/securityheaders",
});

const comparisonRows = [
  { feature: "HTTP security header check", own: true, other: true },
  { feature: "Security grade rating", own: true, other: true },
  { feature: "Tech stack detection", own: true, other: false },
  { feature: "CVE vulnerability matching", own: true, other: false },
  { feature: "SEO analysis", own: true, other: false },
  { feature: "Traffic estimation", own: true, other: false },
  { feature: "SSL certificate monitoring", own: true, other: false },
  { feature: "Uptime monitoring", own: true, other: false },
  { feature: "Core Web Vitals tracking", own: true, other: false },
  { feature: "Attack surface audit", own: true, other: false },
  { feature: "Chrome extension", own: true, other: false },
  { feature: "REST API", own: true, other: false },
  { feature: "Free plan", own: true, other: true },
  { feature: "Bulk scanning", own: true, other: false },
  { feature: "Domain monitoring", own: true, other: false },
];

export default function SecurityHeadersAlternativePage() {
  return (
    <PublicPageShell
      eyebrow="Alternative comparison"
      title="OwnSurface vs SecurityHeaders"
      description="SecurityHeaders checks your HTTP security headers. OwnSurface checks those plus your tech stack, CVE vulnerabilities, SEO health, traffic signals, SSL certificates, and attack surface — in one 30-second scan. Free."
    >
      {/* Comparison table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-3 bg-secondary/50 px-6 py-4 text-sm font-semibold">
          <span>Feature</span>
          <span className="text-center text-teal-700">OwnSurface</span>
          <span className="text-center">SecurityHeaders</span>
        </div>
        {comparisonRows.map((row) => (
          <div key={row.feature} className="grid grid-cols-3 items-center border-t border-border px-6 py-3.5 text-sm">
            <span>{row.feature}</span>
            <span className="flex justify-center">
              {row.own ? <Check className="h-4 w-4 text-teal-600" /> : <X className="h-4 w-4 text-muted-foreground/40" />}
            </span>
            <span className="flex justify-center">
              {row.other ? <Check className="h-4 w-4 text-foreground/60" /> : <X className="h-4 w-4 text-muted-foreground/40" />}
            </span>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-8 text-center">
        <Zap className="mx-auto h-8 w-8 text-teal-600 mb-4" />
        <h2 className="text-2xl font-bold mb-3">Why switch from SecurityHeaders to OwnSurface?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
          SecurityHeaders gives you one piece of the puzzle — HTTP header grades. OwnSurface
          gives you the full picture: tech stack detection, <strong>security auditing</strong>,
          CVE scanning, SEO analysis, traffic signals, and monitoring — starting at $0/month.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-500 transition-colors">
            Start scanning free <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/pricing" className="text-sm font-medium text-teal-700 hover:text-teal-600">View pricing</Link>
        </div>
      </div>
    </PublicPageShell>
  );
}
