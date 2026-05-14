import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell, PublicPageSection } from "@/components/public/public-page-shell";
import { ArrowLeft, ArrowRight, DollarSign, Clock, Layers, Check, X } from "lucide-react";
import { ShareButtons } from "@/components/blog/share-buttons";

export const metadata: Metadata = buildPageMetadata({
  title: "Why We Built OwnSurface to Replace 6 Tools",
  description:
    "The story behind building a single website intelligence platform that replaces BuiltWith ($295/mo), Wappalyzer ($250/mo), SecurityHeaders, SimilarWeb ($149/mo), Clearbit, and social lookups — starting at $0.",
  path: "/blog/replace-6-tools",
});

const tools = [
  {
    name: "BuiltWith",
    does: "Tech stack detection",
    price: "$295/mo",
    limitation: "Only tells you what technologies a site uses. No security, SEO, or traffic data. Expensive for what it provides.",
    ownSurface: "Same tech detection using the Wappalyzer engine (3,000+ signatures), plus 25 additional modules — included in the free plan.",
  },
  {
    name: "Wappalyzer",
    does: "Technology profiling",
    price: "$250/mo (API)",
    limitation: "Excellent at tech detection, but that's all it does. API pricing is steep for startups and freelancers.",
    ownSurface: "Uses the same Wappalyzer detection engine, so you get identical accuracy. But every scan also returns security, SEO, traffic, and business intelligence.",
  },
  {
    name: "SecurityHeaders",
    does: "HTTP header scanning",
    price: "Free (basic)",
    limitation: "Checks HTTP security headers and gives a letter grade. That's it — no tech stack, no SSL details, no CVE matching, no cookie analysis, no DNS security.",
    ownSurface: "Checks the same headers plus cookie flags, CORS policy, DNS security (DNSSEC, SPF, DMARC), sensitive file exposure, admin panel detection, and CVE matching against detected technologies.",
  },
  {
    name: "SimilarWeb",
    does: "Traffic estimation",
    price: "$149/mo",
    limitation: "Good traffic estimates and competitive intelligence, but no technical analysis. Can't tell you what a site is built with or whether it's secure.",
    ownSurface: "Traffic estimation via Tranco ranking, plus full competitive intelligence — tech stack comparison, security posture comparison, and cost estimation.",
  },
  {
    name: "Clearbit",
    does: "Company enrichment",
    price: "Custom pricing",
    limitation: "Enriches company data from a domain — employee count, revenue, industry. Useful for sales, not for technical analysis.",
    ownSurface: "Business signal detection identifies pricing pages, hiring indicators, payment processors, and company metadata directly from the website — no third-party data purchase needed.",
  },
  {
    name: "Social lookups",
    does: "Finding social profiles",
    price: "Various",
    limitation: "Manual process of checking each social platform, or using scattered tools that each cover one network.",
    ownSurface: "Automatically discovers all linked social profiles (Twitter, LinkedIn, GitHub, Facebook, Instagram, YouTube, etc.) from the website's markup and link structure.",
  },
];

export default function ReplaceSixToolsPost() {
  return (
    <PublicPageShell
      eyebrow="Blog"
      title="Why We Built OwnSurface to Replace 6 Tools"
      description="We were spending $700+/month on BuiltWith, Wappalyzer, SimilarWeb, and others — and still had to switch between 6 tabs to get a complete picture of any website. So we built one tool that does all of it."
    >
      {/* Back to blog + share */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Link href="/blog" className="flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>
          <span className="text-muted-foreground">March 17, 2026</span>
          <span className="text-muted-foreground">7 min read</span>
        </div>
        <ShareButtons title="Why We Built OwnSurface to Replace 6 Tools" path="/blog/replace-6-tools" />
      </div>

      <PublicPageSection title="The $700/Month Problem">
        <p>
          If you&apos;re a developer, security consultant, or SEO professional, you know the drill. A client sends you a URL and asks: &quot;What can you tell me about this site?&quot;
        </p>
        <p>
          To answer properly, you open 6 tabs:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {tools.slice(0, 6).map((tool) => (
            <div key={tool.name} className="flex items-center gap-3 rounded-lg border border-border p-3">
              <div className="text-sm">
                <span className="font-semibold">{tool.name}</span>
                <span className="text-muted-foreground"> — {tool.does}</span>
              </div>
            </div>
          ))}
        </div>
        <p>
          Each tool takes 30-60 seconds. None of them share data. By the time you have a complete picture, 5 minutes have passed — and you&apos;ve spent $700+/month on subscriptions for the privilege.
        </p>
        <p>
          We thought: <strong>what if one scan returned all of this in 30 seconds, starting at $0?</strong>
        </p>
      </PublicPageSection>

      {/* Cost comparison */}
      <PublicPageSection title="The Cost Breakdown">
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-4 bg-secondary/50 px-5 py-3 text-sm font-semibold">
            <span>Tool</span>
            <span>What it does</span>
            <span>Their price</span>
            <span className="text-teal-700">OwnSurface</span>
          </div>
          {tools.map((tool) => (
            <div key={tool.name} className="grid grid-cols-4 items-center border-t border-border px-5 py-3 text-sm">
              <span className="font-medium">{tool.name}</span>
              <span className="text-muted-foreground">{tool.does}</span>
              <span className="font-mono text-xs">{tool.price}</span>
              <span className="flex items-center gap-1 text-teal-700">
                <Check className="h-3.5 w-3.5" /> Included
              </span>
            </div>
          ))}
          <div className="grid grid-cols-4 items-center border-t-2 border-foreground/10 bg-secondary/30 px-5 py-4 text-sm font-semibold">
            <span>Total</span>
            <span></span>
            <span className="font-mono text-red-600">$694+/mo</span>
            <span className="text-teal-700">$0 — $49/mo</span>
          </div>
        </div>
      </PublicPageSection>

      {/* What each tool misses */}
      <PublicPageSection title="What Each Tool Misses">
        <div className="space-y-4">
          {tools.map((tool) => (
            <div key={tool.name} className="rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-2">{tool.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start gap-2 text-muted-foreground">
                  <X className="h-3.5 w-3.5 text-red-400 mt-1 shrink-0" />
                  <span><strong>Limitation:</strong> {tool.limitation}</span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-teal-600 mt-1 shrink-0" />
                  <span><strong>OwnSurface:</strong> {tool.ownSurface}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </PublicPageSection>

      {/* The philosophy */}
      <PublicPageSection title="One Scan. Complete Intelligence.">
        <p>
          The core insight behind OwnSurface is simple: <strong>website intelligence is a single question, not six</strong>. When someone asks &quot;what do you know about this website?&quot;, the answer should include technology, security, SEO, traffic, business signals, and social presence — all at once.
        </p>
        <p>
          That&apos;s why every OwnSurface scan runs all 26 modules in parallel. The free plan gives you 5 of these comprehensive scans per day. No artificial limitations on which modules you can access — every user gets the full picture.
        </p>
        <p>
          Pro ($49/month) unlocks unlimited scans, deep scanning (500 pages), attack surface auditing, monitoring (uptime, SSL, speed), teams, bulk scanning, and API access. That&apos;s everything BuiltWith, Wappalyzer, SecurityHeaders, SimilarWeb, and Clearbit offer — combined — for a fraction of the cost.
        </p>
      </PublicPageSection>

      {/* CTA */}
      <PublicPageSection title="See for Yourself">
        <p>
          Enter any URL. In 30 seconds, you&apos;ll have more intelligence about that website than you&apos;d get from 6 separate tools in 5 minutes.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
          >
            Try your first scan
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/alternatives/builtwith" className="text-sm font-medium text-teal-700 hover:text-teal-600">
            See detailed comparisons
          </Link>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
}
