"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Check, X, Star, Zap } from "lucide-react";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth";
import { Footer } from "@/components/layout/footer";
import { PublicNav } from "@/components/layout/public-nav";

type BillingCycle = "monthly" | "annual";

const PRO_PRICE_MONTHLY = "$49";
const PRO_PRICE_ANNUAL = "$468";
const PRO_PRICE_ANNUAL_MONTHLY = "$39";
const ANNUAL_SAVINGS = "$120";

// Offer constants
const OFFER_COUPON_ID = "KUL2mXI8"; // Stripe coupon ID (60% off annual, first year)
const OFFER_DISCOUNTED_MONTHLY = "$16";
const OFFER_DISCOUNTED_ANNUAL = "$187";

export default function PricingPage() {
  return (
    <Suspense>
      <PricingContent />
    </Suspense>
  );
}

function PricingContent() {
  const { isAuthenticated } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  // Detect offer=annual60 from banner CTA
  const hasOffer = searchParams.get("offer") === "annual60";

  useEffect(() => {
    if (hasOffer) {
      setCycle("annual");
    }
  }, [hasOffer]);

  async function handleGetStarted() {
    window.location.href = isAuthenticated ? "/dashboard" : "/register";
  }

  async function handleUpgradePro() {
    if (!isAuthenticated) {
      const redirect = hasOffer ? "/pricing?offer=annual60" : "/pricing";
      window.location.href = `/login?redirect=${encodeURIComponent(redirect)}`;
      return;
    }
    setLoading(true);
    const plan = cycle === "annual" ? "pro_annual" : "pro";
    // Auto-apply coupon only for annual when coming from offer banner
    const coupon = hasOffer && cycle === "annual" ? OFFER_COUPON_ID : undefined;
    const res = await api.createCheckoutSession(plan, coupon);
    if (res.data?.url) {
      window.location.href = res.data.url;
    }
    setLoading(false);
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid text-foreground relative">
      <PublicNav />

      <div className="mx-auto max-w-5xl px-4 py-14 sm:px-6 sm:py-20">
        {/* Header */}
        <div className="mb-12 text-center sm:mb-16">
          <div className="section-kicker justify-center">
            <Star className="h-3.5 w-3.5" />
            Two plans. No gimmicks.
          </div>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl md:text-5xl">
            Free to explore. Pro to operate.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-white/60 sm:text-lg sm:leading-8">
            Every scan uses all 26 modules — same intelligence on both plans.
            Free gives you a taste of everything. Pro removes every limit.
          </p>
        </div>

        {/* Billing toggle */}
        <div className="mb-10 flex items-center justify-center gap-3">
          <button
            onClick={() => setCycle("monthly")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cycle === "monthly"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setCycle("annual")}
            className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              cycle === "annual"
                ? "bg-white text-black"
                : "text-white/60 hover:text-white"
            }`}
          >
            Annual
            <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-400">
              Save {ANNUAL_SAVINGS}
            </span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="mb-18 grid gap-6 md:grid-cols-2 sm:mb-24 max-w-3xl mx-auto">
          {/* Free Plan */}
          <div className="flex flex-col rounded-xl bg-black/40 backdrop-blur-md border border-white/10 p-6 sm:p-7">
            <h3 className="text-xl font-bold">Free</h3>
            <div className="mb-1 mt-2">
              <span className="text-4xl font-bold">$0</span>
              <span className="text-white/60"> forever</span>
            </div>
            <p className="mb-6 text-sm text-white/60">
              Full scan intelligence, volume-limited
            </p>
            <ul className="mb-8 flex-1 space-y-3">
              {[
                "3 scans per day",
                "All 26 scanner modules",
                "Full security audit + CVE matching",
                "AI-powered executive summary",
                "SEO, business signals, traffic",
                "Chrome extension (full)",
                "1 verified domain",
                "1 bulk scan / month (10 URLs)",
                "1 watchlist (5 URLs)",
                "1 collection",
                "3 saved reports",
                "3-day scan history",
                "API access (1 key, 10 calls/day)",
                "Profile + badges",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-400" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleGetStarted}
              className="w-full rounded-2xl bg-secondary py-3 text-sm font-semibold transition-colors hover:bg-secondary/80"
            >
              Get Started
            </button>
          </div>

          {/* Pro Plan */}
          <div className="flex flex-col rounded-xl bg-[#111] border border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.1)] relative z-10 p-6 sm:p-7">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-300">
              Everything. Unlimited.
            </div>
            <h3 className="text-xl font-bold text-white">Pro</h3>
            <div className="mb-1 mt-2">
              {hasOffer && cycle === "annual" ? (
                <>
                  <span className="text-lg font-semibold text-white/40 line-through mr-2">$39</span>
                  <span className="text-4xl font-bold text-teal-300">{OFFER_DISCOUNTED_MONTHLY}</span>
                </>
              ) : (
                <span className="text-4xl font-bold text-white">
                  {cycle === "annual" ? PRO_PRICE_ANNUAL_MONTHLY : PRO_PRICE_MONTHLY}
                </span>
              )}
              <span className="text-white/55">/month</span>
            </div>
            {cycle === "annual" && (
              <div className="mb-2 flex items-center gap-2">
                {hasOffer ? (
                  <>
                    <span className="text-xs text-white/40 line-through">{PRO_PRICE_ANNUAL}/year</span>
                    <span className="text-xs text-teal-300 font-semibold">{OFFER_DISCOUNTED_ANNUAL}/year</span>
                    <span className="rounded-full bg-teal-400/20 px-2 py-0.5 text-[0.65rem] font-bold text-teal-300">
                      60% OFF
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-xs text-white/50">
                      Billed {PRO_PRICE_ANNUAL}/year
                    </span>
                    <span className="rounded-full bg-teal-500/15 px-2 py-0.5 text-[0.65rem] font-semibold text-teal-300">
                      Save {ANNUAL_SAVINGS}
                    </span>
                  </>
                )}
              </div>
            )}
            <p className="mb-6 text-sm text-white/68">
              Full power for professionals
            </p>
            <ul className="mb-8 flex-1 space-y-3">
              {[
                "Everything in Free, plus:",
                "Unlimited scans",
                "Unlimited verified domains",
                "Unlimited deep scans (500 pages)",
                "Unlimited attack surface audits (3 tiers + Nuclei)",
                "Unlimited uptime + SSL monitoring",
                "Speed / Core Web Vitals tracking",
                "Bulk scanning (1,000 URLs/job)",
                "Unlimited watchlists + collections",
                "Unlimited reports + PDF export",
                "Scheduled reports (daily/weekly)",
                "Lead generation — search by technology",
                "Contact database + email reveal",
                "AI search visibility tracking",
                "Real traffic estimation (CrUX)",
                "Webhooks + enrichment API",
                "MCP server (Claude, Cursor, Windsurf)",
                "1-year scan history",
                "10 API keys, 10K calls/day",
                "Priority email support (24h)",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-white/72">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-teal-300" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={handleUpgradePro}
              disabled={loading}
              className="w-full rounded-2xl bg-white py-3 text-sm font-semibold text-black transition-colors hover:bg-white/90 disabled:opacity-50"
            >
              {loading ? "Redirecting..." : "Start Pro"}
            </button>
          </div>
        </div>

        {/* Plan philosophy */}
        <div className="mb-20 grid gap-4 md:grid-cols-2 max-w-3xl mx-auto">
          {[
            ["Free", "See everything a scan can reveal — all 26 modules, every time. When you need volume, history, monitoring, or deep scanning, upgrade to Pro."],
            ["Pro", "Remove every limit. Unlimited scans, domains, monitoring, deep scans, audits, bulk jobs, and a year of history. $49/mo for everything."],
          ].map(([title, body]) => (
            <div key={title} className="rounded-xl border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-5">
              <div className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/60">{title}</div>
              <p className="mt-3 text-sm leading-7 text-white/60">{body}</p>
            </div>
          ))}
        </div>

        {/* Feature comparison */}
        <div>
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold">Feature comparison</h2>
            <p className="mt-3 text-white/60">Same scan quality on both plans. Pro unlocks operational power.</p>
          </div>
          <div className="bg-black/40 backdrop-blur-md border border-white/10 overflow-x-auto rounded-xl p-4 sm:p-6">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="py-3 pr-4 text-left font-medium text-white/60">Feature</th>
                  <th className="text-center py-3 px-4 font-medium">Free</th>
                  <th className="text-center py-3 px-4 font-medium text-teal-400">Pro</th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((row) => (
                  <tr key={row.name} className="border-b border-border/50 last:border-b-0">
                    <td className="py-3 pr-4 text-white/60">{row.name}</td>
                    <td className="py-3 px-4 text-center">{row.free}</td>
                    <td className="py-3 px-4 text-center font-medium">{row.pro}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Need more? */}
        <div className="bg-[#111] border border-white/10 shadow-[0_0_30px_rgba(20,184,166,0.1)] relative z-10 mt-20 rounded-xl px-8 py-10 sm:px-10 lg:flex lg:items-center lg:justify-between">
          <div>
            <h3 className="text-3xl font-bold text-white">Need custom limits or enterprise features?</h3>
            <p className="mt-3 max-w-2xl text-base leading-7 text-white/68">
              We can tailor a plan for your specific needs. Get in touch.
            </p>
          </div>
          <Link
            href="mailto:contact@aeonovx.com?subject=OwnSurface%20Custom%20Plan%20Inquiry"
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-white/10 border border-white/10 px-6 py-3.5 text-sm font-semibold text-white hover:bg-white/20 transition-colors lg:mt-0"
          >
            Contact us
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

const comparisonFeatures = [
  { name: "Lead generation (search)", free: "3 results", pro: "Unlimited" },
  { name: "Contact database", free: "Emails masked", pro: "Full reveal + export" },
  { name: "AI search visibility", free: "-", pro: "10 checks/month" },
  { name: "Traffic estimation (CrUX)", free: "Tier only", pro: "Full data + history" },
  { name: "Daily scans", free: "3", pro: "Unlimited" },
  { name: "Scanner modules", free: "All 26", pro: "All 26" },
  { name: "Tech detection", free: "Full + versions", pro: "Full + versions" },
  { name: "Security audit + CVE matching", free: "Full", pro: "Full" },
  { name: "AI executive summary", free: "Yes", pro: "Yes" },
  { name: "Chrome extension", free: "Full", pro: "Full" },
  { name: "Verified domains", free: "1", pro: "Unlimited" },
  { name: "Deep scan crawler (500 pages)", free: "-", pro: "Unlimited" },
  { name: "Attack surface audit (3 tiers)", free: "-", pro: "Unlimited" },
  { name: "Uptime monitoring", free: "-", pro: "Unlimited" },
  { name: "SSL monitoring", free: "-", pro: "Unlimited" },
  { name: "Speed / Core Web Vitals", free: "-", pro: "Unlimited" },
  { name: "Bulk scanning (CSV)", free: "1 / month (10 URLs)", pro: "1,000 URLs/job" },
  { name: "Watchlists", free: "1 (5 URLs)", pro: "Unlimited" },
  { name: "Collections", free: "1", pro: "Unlimited" },
  { name: "Saved reports", free: "3", pro: "Unlimited" },
  { name: "PDF export", free: "-", pro: "Yes" },
  { name: "Scheduled reports", free: "-", pro: "Daily / Weekly" },
  { name: "Webhooks", free: "-", pro: "Yes" },
  { name: "Enrichment API (Clearbit alt.)", free: "-", pro: "Yes" },
  { name: "MCP server (AI agents)", free: "-", pro: "7 tools" },
  { name: "Scan history", free: "3 days", pro: "1 year" },
  { name: "API access", free: "1 key, 10/day", pro: "10 keys, 10K/day" },
  { name: "Security badge (embed)", free: "1 domain", pro: "Unlimited" },
  { name: "Profile + badges", free: "Full", pro: "Full" },
  { name: "Support", free: "Community", pro: "Priority email (24h)" },
];
