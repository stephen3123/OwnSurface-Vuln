import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { Check, X, ArrowRight, Zap } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "OwnSurface vs SimilarWeb — Website Intelligence with Security & Tech Stack",
  description:
    "Compare OwnSurface to SimilarWeb. Get traffic analysis plus tech stack detection, security auditing, CVE scanning, and monitoring.",
  path: "/alternatives/similarweb",
});

const comparisonRows = [
  { feature: "Traffic estimation", own: true, other: true },
  { feature: "Competitive intelligence", own: true, other: true },
  { feature: "Tech stack detection", own: true, other: false },
  { feature: "Security posture audit", own: true, other: false },
  { feature: "CVE vulnerability matching", own: true, other: false },
  { feature: "SEO analysis", own: true, other: false },
  { feature: "SSL certificate monitoring", own: true, other: false },
  { feature: "Uptime monitoring", own: true, other: false },
  { feature: "Core Web Vitals tracking", own: true, other: false },
  { feature: "Attack surface audit", own: true, other: false },
  { feature: "Chrome extension", own: true, other: true },
  { feature: "REST API (free)", own: true, other: false },
  { feature: "Free plan", own: true, other: false },
  { feature: "Bulk scanning", own: true, other: false },
  { feature: "Domain monitoring", own: true, other: false },
];

export default function SimilarWebAlternativePage() {
  return (
    <PublicPageShell
      eyebrow="Alternative comparison"
      title="OwnSurface vs SimilarWeb"
      description="SimilarWeb estimates website traffic and competitive data. OwnSurface gives you that plus tech stack detection, security auditing, CVE scanning, SEO analysis, and monitoring — in one 30-second scan. Free."
    >
      {/* Comparison table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <div className="grid grid-cols-3 bg-secondary/50 px-6 py-4 text-sm font-semibold">
          <span>Feature</span>
          <span className="text-center text-teal-700">OwnSurface</span>
          <span className="text-center">SimilarWeb</span>
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
        <h2 className="text-2xl font-bold mb-3">Why switch from SimilarWeb to OwnSurface?</h2>
        <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed mb-6">
          SimilarWeb Pro starts at $149/month for traffic and competitive data. OwnSurface gives
          you traffic estimation <strong>plus</strong> tech stack detection, security auditing,
          CVE scanning, SEO analysis, and monitoring — starting at $0/month.
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
