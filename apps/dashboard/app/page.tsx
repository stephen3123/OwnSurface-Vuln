"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Check,
  ChevronDown,
  Chrome,
  Code2,
  Eye,
  FileStack,
  Globe,
  Layers,
  Lock,
  Menu,
  Monitor,
  Search,
  Shield,
  Signal,
  Terminal,
  Users,
  Workflow,
  X,
  Zap,
  Bot,
  MessageSquare,
  Mail,
  Target,
  TrendingUp,
  type LucideIcon,
  Smartphone,
  AlertTriangle,
} from "lucide-react";
import { Footer } from "@/components/layout/footer";
import { LiveIntelligenceBox } from "@/components/public/live-intelligence-box";
import { OfferBanner } from "@/components/public/offer-banner";

/* ──────────────────────────── data ──────────────────────────── */

type HeroStat = { value: string; label: string; note: string };
type TrustLine = { title: string; body: string };
type Capability = { title: string; summary: string; note: string; icon: LucideIcon };
type ProofSignal = { domain: string; change: string; impact: string };
type WorkflowStep = { step: string; title: string; body: string; href: string; cta: string };
type Surface = { title: string; body: string; detail: string; href: string; icon: LucideIcon };
type Persona = { title: string; body: string; features: string[]; icon: LucideIcon };
type ReplacedTool = { name: string; category: string };
type FAQ = { question: string; answer: string };

const heroStats: HeroStat[] = [
  {
    value: "26",
    label: "analysis modules",
    note: "Security, stack, traffic, SEO, privacy, CVE matching, and recon checks run in parallel.",
  },
  {
    value: "3",
    label: "free scans daily",
    note: "Full 26-module intelligence on every scan. Same depth as Pro — upgrade when you need volume.",
  },
  {
    value: "1",
    label: "evidence record",
    note: "Scans, reports, monitoring, watchlists, and exports stay attached to the same object.",
  },
];

const trustLines: TrustLine[] = [
  {
    title: "One operating layer",
    body: "Replace fragmented website tools with one evidence chain the whole team can use.",
  },
  {
    title: "Public trust included",
    body: "Security, privacy, legal, contact, and developer resources are available publicly from day one.",
  },
  {
    title: "Built for real workflows",
    body: "Move from scan to monitoring, reports, verification, and team delivery without changing products.",
  },
];

const capabilities: Capability[] = [
  {
    title: "Technology and infrastructure intelligence",
    summary:
      "Read frameworks, analytics, CDNs, payments, JavaScript bundles, supply chain dependencies, and public architecture decisions in one pass.",
    note: "Covers tech detection, JS bundle analysis, clone detection, cost estimation, and supply chain review.",
    icon: Workflow,
  },
  {
    title: "Security and exposed-surface review",
    summary:
      "Inspect headers, SSL, DNS, cookies, CORS, admin panels, sensitive files, CVE matching, and privacy posture from a structured audit.",
    note: "Three-tier attack surface audit: passive recon, active probing, and Nuclei template testing.",
    icon: Shield,
  },
  {
    title: "SEO, traffic, and commercial motion",
    summary:
      "Analyze meta tags, sitemap compliance, heading structure, traffic estimation, pricing changes, conversion surfaces, and competitor signals.",
    note: "SEO pulse, accessibility audit, Wayback Machine integration, and business signal detection built in.",
    icon: Signal,
  },
  {
    title: "Lead generation and sales intelligence",
    summary:
      "Search companies by technology stack, reveal contact emails, track your AI search visibility, and enrich any domain with structured company data.",
    note: "Replaces Hunter.io and Clearbit. Export leads as CSV, reveal emails, and pipe enrichment data into your CRM.",
    icon: Target,
  },
  {
    title: "Mobile App Security & Pre-Submission",
    summary:
      "Upload your iOS (IPA) or Android (APK) binaries to check for private API usage, permission mismatches, and exposed keys before store reviewers reject your app.",
    note: "Automated binary analysis, SDK compliance checks, and pentesting in one pass.",
    icon: Smartphone,
  },
];

const proofSignals: ProofSignal[] = [
  {
    domain: "cursor.com",
    change: "Packaging changed across the pricing surface.",
    impact:
      "Commercial movement, navigation shifts, and competitor cues stay connected to the same scan object.",
  },
  {
    domain: "vercel.com",
    change: "Infrastructure and docs footprint expanded.",
    impact:
      "Technology, docs posture, and distribution signals resolve into one operating record instead of separate tabs.",
  },
  {
    domain: "notion.so",
    change: "Trust and enterprise buying motion increased.",
    impact:
      "Company, market, SEO, and conversion signals can be reviewed together without context switching.",
  },
];

const workflowSteps: WorkflowStep[] = [
  {
    step: "01",
    title: "Start from a URL, the browser, or your application layer.",
    body: "Run a homepage, pricing page, docs portal, or owned domain. OwnSurface works as a dashboard, a browser extension, and a programmable surface.",
    href: "/register",
    cta: "Create workspace",
  },
  {
    step: "02",
    title: "Resolve the public surface into one shared record.",
    body: "All 26 modules run in parallel. Technology, security, SEO, traffic clues, company context, and market movement unify into one object.",
    href: "/pricing",
    cta: "See what's included",
  },
  {
    step: "03",
    title: "Promote the result into monitoring and verified-domain review.",
    body: "Verify ownership, run deep scans (500 pages), activate uptime and SSL monitoring, and run three-tier security probes on your own sites.",
    href: "/security",
    cta: "Read security posture",
  },
  {
    step: "04",
    title: "Publish, export, and distribute evidence across the team.",
    body: "Move scan results into reports, collections, watchlists, bulk jobs, and team workflows when the work becomes operational.",
    href: "/pricing",
    cta: "Compare plans",
  },
];

const surfaces: Surface[] = [
  {
    title: "Dashboard workspace",
    body: "Operate scans, watchlists, verified domains, reports, collections, bulk jobs, and team workflows from one command surface.",
    detail: "Best for day-to-day intelligence operations.",
    href: "/register",
    icon: Activity,
  },
  {
    title: "Chrome extension",
    body: "Scan the page you are already on and keep website intelligence in context while browsing.",
    detail: "Best for fast operator workflows.",
    href: "/chrome-extension",
    icon: Chrome,
  },
  {
    title: "Verified domains",
    body: "Separate your own properties from general recon and unlock deep scanning, security probes, and continuous monitoring.",
    detail: "Best for owned-site hardening and continuous review.",
    href: "/security",
    icon: Eye,
  },
  {
    title: "Reports and collections",
    body: "Generate shareable reports, organize scans into collections, and export PDF evidence for stakeholders.",
    detail: "Best for team delivery and compliance.",
    href: "/register",
    icon: FileStack,
  },
];

const personas: Persona[] = [
  {
    title: "Security teams",
    body: "Run attack surface audits, CVE matching, header and SSL reviews, and continuous monitoring from one surface.",
    features: ["3-tier security probe", "CVE matching", "SSL monitoring", "Vulnerability reports"],
    icon: Shield,
  },
  {
    title: "Sales and BD teams",
    body: "Find companies by their tech stack, reveal contact emails, and enrich prospect data — all from one platform.",
    features: ["Lead search by technology", "Email reveal + export", "Company enrichment", "AI visibility tracking"],
    icon: Target,
  },
  {
    title: "Growth and marketing",
    body: "Track competitor tech stacks, pricing changes, traffic signals, SEO health, and AI search visibility across your market.",
    features: ["Competitor watchlists", "SEO pulse", "Traffic estimation", "AI search visibility"],
    icon: BarChart3,
  },
  {
    title: "Agencies",
    body: "Bulk scan client portfolios, generate branded reports, and manage multiple verified domains from one workspace.",
    features: ["Bulk scanning (1,000 URLs)", "PDF export", "Collections", "Scheduled reports"],
    icon: Users,
  },
  {
    title: "Developers",
    body: "Pipe structured intelligence into internal systems, CI/CD pipelines, and security workflows via the API.",
    features: ["REST API (10K calls/day)", "Webhooks", "Enrichment API", "MCP server"],
    icon: Code2,
  },
];

const replacedTools: ReplacedTool[] = [
  { name: "BuiltWith & Wappalyzer", category: "Web architecture & frameworks" },
  { name: "SecurityHeaders & Shodan", category: "Surface exposure & posture" },
  { name: "MobSF & Appdome", category: "Mobile app penetration (APK/IPA)" },
  { name: "Meltwater & Brandwatch", category: "GEO intelligence & AI visibility" },
  { name: "Clearbit & Hunter.io", category: "Company enrichment & lead gen" },
  { name: "SimilarWeb & Ahrefs", category: "Traffic signals & SEO health" },
];

const faqs: FAQ[] = [
  {
    question: "How long does a scan take?",
    answer:
      "A standard scan completes in 15-30 seconds. All 26 modules run in parallel using a headless browser. Deep scans (up to 500 pages) and security probes take longer depending on site size.",
  },
  {
    question: "What does the Free plan include?",
    answer:
      "3 scans per day with all 26 scanner modules — the same intelligence depth as Pro. You also get 1 verified domain, 1 watchlist, 1 collection, 3 saved reports, Chrome extension, API access (10 calls/day), and 3-day scan history. No credit card required. Deep scanning, attack surface audits, and monitoring are Pro features.",
  },
  {
    question: "Is it safe to scan my own site?",
    answer:
      "Standard scans are passive — they read publicly available information only. For verified domains, the Security Probe offers active testing (header probing, directory scanning, Nuclei templates) with explicit consent. You control the scope and rate.",
  },
  {
    question: "Can I scan competitor websites?",
    answer:
      "Yes. Standard scans only read public information (the same data any browser visitor sees). You can track competitors with watchlists that detect changes over time — stack updates, pricing shifts, traffic signals, and security posture changes.",
  },
  {
    question: "What monitoring is available?",
    answer:
      "Pro includes uptime monitoring (1-60 min intervals), SSL certificate tracking with expiry alerts, and speed monitoring with Core Web Vitals (LCP, CLS, INP, TTFB). All monitors require a verified domain.",
  },
  {
    question: "How does domain verification work?",
    answer:
      "Add a DNS TXT record or an HTML meta tag to prove ownership. Once verified, you unlock deep scanning (500 pages), three-tier security probes, uptime/SSL/speed monitoring, and compliance checks.",
  },
  {
    question: "What is the attack surface audit?",
    answer:
      "A three-tier security assessment for verified domains. Tier 1: passive recon (headers, SSL, DNS, cookies, CORS, source leaks). Tier 2: active probing (directories, admin panels, open redirects, cloud storage). Tier 3: Nuclei vulnerability templates.",
  },
  {
    question: "Can I export and share results?",
    answer:
      "Yes. Generate shareable reports (public or private), export to PDF (Pro), organize scans into collections, and distribute via the API. Bulk scanning supports up to 500 URLs per job.",
  },
  {
    question: "How does lead generation work?",
    answer:
      "Search our database by technology stack (e.g. find all companies using Shopify + Stripe), filter by industry and location, and export results as CSV. Every result includes the company profile, tech stack, and detected email patterns. Pro users can reveal full email addresses.",
  },
  {
    question: "What is AI search visibility?",
    answer:
      "AI search visibility checks whether your domain appears in responses from ChatGPT, Claude, Gemini, and other AI models. As AI-powered search grows, this metric tells you whether your brand is being referenced by AI assistants — and how that changes over time. Available on Pro with 10 checks per month.",
  },
  {
    question: "How does the enrichment API compare to Clearbit?",
    answer:
      "Send any domain to our enrichment API and get back company name, industry, tech stack, security grade, traffic tier, social profiles, and email patterns in one call. Clearbit (now HubSpot Breeze) requires a HubSpot subscription and charges per credit. OwnSurface enrichment is included in Pro with 10K API calls/day.",
  },
];

/* ──────────────────────────── helpers ──────────────────────────── */

function normalizeUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const candidate =
    trimmed.startsWith("http://") || trimmed.startsWith("https://") ? trimmed : `https://${trimmed}`;
  try {
    return new URL(candidate).toString();
  } catch {
    return null;
  }
}

/* ──────────────────────────── sub-components ──────────────────────────── */

function ProductFrame({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  return (
    <div className={`overflow-hidden rounded-xl border border-white/10 bg-card shadow-[0_24px_80px_rgba(0,0,0,0.08)] ${className || ""}`}>
      <div className="flex items-center gap-1.5 border-b border-white/10 bg-black/40 backdrop-blur-md border border-white/10 px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
        <span className="ml-3 text-[0.6rem] text-white/60">ownsurface</span>
      </div>
      <div className="relative">
        <Image
          src={src}
          alt={alt}
          width={1400}
          height={900}
          className="h-auto w-full"
          quality={90}
          priority={src.includes("dashboard")}
        />
      </div>
    </div>
  );
}

function FAQItem({ faq }: { faq: FAQ }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-white/10">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 py-5 text-left"
      >
        <span className="text-[1.05rem] font-semibold tracking-[-0.02em] text-white">
          {faq.question}
        </span>
        <ChevronDown
          className={`h-4.5 w-4.5 shrink-0 text-white/60 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`grid transition-all duration-200 ${open ? "grid-rows-[1fr] pb-5" : "grid-rows-[0fr]"}`}
      >
        <div className="overflow-hidden">
          <p className="max-w-3xl text-sm leading-7 text-white/60">{faq.answer}</p>
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────── page ──────────────────────────── */

export default function LandingPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(url);
    if (!normalized) {
      setError("Enter a valid URL to start a scan.");
      return;
    }
    setError("");
    router.push(`/dashboard/scan?url=${encodeURIComponent(normalized)}`);
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-background bg-dot-grid text-foreground">
      <div className="glow-orb top-0 left-0 h-[60rem] w-[60rem] -translate-x-1/3 -translate-y-1/3 bg-teal-500/15" />
      <div className="glow-orb top-40 right-0 h-[50rem] w-[50rem] translate-x-1/3 bg-emerald-500/10" />

      {/* ─── offer banner + nav ─── */}
      <header className="fixed inset-x-0 top-0 z-50">
        <OfferBanner />
        <nav className="border-b border-white/10 bg-black/60 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
          <Link href="/" className="transition-opacity hover:opacity-90">
            <span className="block text-[1.55rem] font-black tracking-[-0.06em] leading-none [background-image:linear-gradient(90deg,#ffffff_0%,#ffffff_82%,rgba(94,234,212,0.92)_100%)] bg-clip-text text-transparent">
              OwnSurface
            </span>
          </Link>

          <div className="hidden items-center gap-8 text-sm font-medium text-white/60 md:flex">
            <Link href="#platform" className="hover:text-white">
              Platform
            </Link>
            <Link href="#use-cases" className="hover:text-white">
              Use cases
            </Link>
            <Link href="#workflow" className="hover:text-white">
              Workflow
            </Link>
            <Link href="/pricing" className="hover:text-white">
              Pricing
            </Link>
            <Link href="#api" className="hover:text-white">
              API
            </Link>
            <Link href="#mcp" className="hover:text-white">
              MCP
            </Link>
            <Link href="#faq" className="hover:text-white">
              FAQ
            </Link>
            <Link href="/blog" className="hover:text-white">
              Blog
            </Link>
            <Link href="/login" className="hover:text-white">
              Log in
            </Link>
            <Link
              href="/register"
              className="rounded-full bg-white px-5 py-2.5 text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.02] transition-transform"
            >
              Start free
            </Link>
          </div>

          <button
            onClick={() => setMobileMenuOpen((o) => !o)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 text-white md:hidden"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="border-t border-white/10 bg-black/95 px-4 pb-6 pt-4 md:hidden backdrop-blur-xl">
            <div className="flex flex-col gap-4 text-sm font-medium">
              <Link href="#platform" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">Platform</Link>
              <Link href="#use-cases" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">Use cases</Link>
              <Link href="#workflow" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">Workflow</Link>
              <Link href="/pricing" className="text-white/60 hover:text-white">Pricing</Link>
              <Link href="#api" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">API</Link>
              <Link href="#mcp" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">MCP</Link>
              <Link href="#faq" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">FAQ</Link>
              <Link href="/blog" onClick={() => setMobileMenuOpen(false)} className="text-white/60 hover:text-white">Blog</Link>
              <Link href="/login" className="text-white/60 hover:text-white">Log in</Link>
              <Link href="/register" className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-black hover:bg-white/90">
                Start free <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
        </nav>
      </header>

      <main className="page-fade pt-[7.6rem]">
        {/* ─── live intelligence ticker ─── */}
        <section className="pt-4 pb-1 sm:pt-5 sm:pb-2">
          <LiveIntelligenceBox />
        </section>

        {/* ─── hero ─── */}
        <section className="relative mx-auto max-w-[1320px] px-4 pb-16 pt-6 sm:px-6 lg:px-10 lg:pb-24 lg:pt-10">
          <div className="flex flex-col items-center text-center">
            <h1 className="max-w-5xl font-heading text-[3.8rem] font-semibold leading-[0.92] tracking-[-0.06em] text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.1)] sm:text-[5.5rem] lg:text-[6.2rem]">
              The operating system for web, mobile, and GEO intelligence.
            </h1>
            
            <p className="mt-8 max-w-3xl text-base leading-8 text-white/70 sm:text-[1.26rem] sm:leading-9">
              Unify web architecture scanning, iOS & Android penetration testing (App Store & Play Store), AI visibility, and commercial signals into one seamless command center. Replaces 15+ fragmented tools with one platform.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 w-full max-w-3xl relative z-20">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center rounded-full bg-black/60 border border-white/10 p-2 pl-6 backdrop-blur-xl shadow-[0_0_40px_rgba(0,0,0,0.5)] focus-within:border-teal-500/50 focus-within:ring-4 focus-within:ring-teal-500/10 transition-all">
                <Search className="h-5 w-5 text-white/40 hidden sm:block" />
                <label className="sr-only" htmlFor="landing-url">Website URL</label>
                <input
                  id="landing-url"
                  type="text"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); if (error) setError(""); }}
                  placeholder="Enter a domain, pricing page, or docs URL..."
                  className="min-w-0 flex-1 bg-transparent px-0 py-3 text-base text-white outline-none placeholder:text-white/40 sm:text-[1.1rem] sm:pl-3"
                />
                <div className="flex flex-col gap-2 sm:flex-row shrink-0 bg-white rounded-full p-1">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-8 py-3 text-[0.85rem] font-bold uppercase tracking-[0.15em] text-white shadow-lg hover:bg-black/80 sm:w-auto transition-colors"
                  >
                    Start scan
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
              {error ? <p className="mt-3 text-sm text-red-500">{error}</p> : null}
            </form>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-white/60">
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20">
                  <Check className="h-3 w-3 text-teal-400" />
                </div>
                <span>Free 26-module scan</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20">
                  <Check className="h-3 w-3 text-teal-400" />
                </div>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-teal-500/20">
                  <Check className="h-3 w-3 text-teal-400" />
                </div>
                <span>Replaces BuiltWith, MobSF, Meltwater, & ZoomInfo</span>
              </div>
            </div>
          </div>

          <div className="mt-20 relative mx-auto w-full max-w-[1240px]">
            <div className="absolute -inset-x-10 -top-20 -bottom-10 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.15),transparent_70%)] rounded-[100%] pointer-events-none" />
            <div className="relative rounded-2xl border border-white/10 bg-black/40 shadow-2xl backdrop-blur-sm overflow-hidden p-2 group overflow-hidden [mask-image:linear-gradient(to_bottom,white_80%,transparent_100%)]">
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
              <ProductFrame
                src="/screenshots/dashboard-overview.png"
                alt="OwnSurface dashboard interface showing live scans, active monitors, and unread alerts"
                className="rounded-xl border border-white/10 transition-transform duration-700 hover:scale-[1.01]"
              />
            </div>
          </div>
          
          <div className="mt-16 sm:mt-24 grid gap-8 sm:grid-cols-3 mx-auto w-full max-w-[1100px] text-center border-t border-white/10 pt-16">
            {heroStats.map((stat) => (
              <div key={stat.label} className="grid gap-2">
                <div className="text-[3rem] font-semibold tracking-[-0.08em] text-white">
                  {stat.value}
                </div>
                <p className="text-[0.75rem] font-bold uppercase tracking-[0.2em] text-teal-300">
                  {stat.label}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/50">{stat.note}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ─── trust strip ─── */}
        <section className="border-y border-white/10">
          <div className="mx-auto max-w-[1320px] px-4 py-8 sm:px-6 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-3">
              {trustLines.map((line, i) => (
                <div key={line.title} className={i === 0 ? "" : "lg:border-l lg:border-white/10 lg:pl-8"}>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">
                    {line.title}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-white/60">{line.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── product preview: dashboard ─── */}
        <section className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
              Inside the workspace
            </p>
            <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.8rem]">
              Everything operates from one surface.
            </h2>
            <p className="mt-5 text-base leading-7 text-white/60">
              Quick Scan, Web Security, App Security, verified domains, monitoring, issues, watchlists, and team workflows all resolve inside one operating workspace.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md border border-white/10 p-5">
              <Search className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold text-white">Quick scan from anywhere</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Enter any URL — homepage, pricing page, docs portal — and get a full 26-module intelligence profile.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md border border-white/10 p-5">
              <Monitor className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold text-white">Real-time workspace pulse</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                See scan usage, watchlist changes, attention queue, and team activity at a glance.
              </p>
            </div>
            <div className="rounded-xl border border-white/10 bg-black/40 backdrop-blur-md border border-white/10 p-5">
              <Layers className="h-5 w-5" />
              <p className="mt-3 text-sm font-semibold text-white">Organized navigation</p>
              <p className="mt-2 text-sm leading-6 text-white/60">
                Home, Quick Scan, My Sites, Intelligence, and Workspace tools stay grouped by the way teams actually operate day to day.
              </p>
            </div>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-[0.36fr_0.64fr]">
            <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
              <div className="p-8 pb-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-300">
                  Stable navigation
                </p>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/60">
                  The sidebar keeps Quick Scan, Web Security, App Security, GEO Intelligence, Radar, and workspace tools visible without forcing users through separate products.
                </p>
              </div>
              <div className="relative mt-auto h-[22rem] overflow-hidden px-8">
                <div className="pointer-events-none absolute inset-x-8 top-0 translate-y-6 transition-transform duration-500 ease-in-out group-hover:translate-y-2">
                  <div className="[mask-image:linear-gradient(to_bottom,white_30%,transparent_100%)] h-[22rem]">
                    <ProductFrame
                      src="/screenshots/sidebar-navigation.png"
                      alt="OwnSurface sidebar navigation showing the dashboard information architecture"
                      className="mx-auto max-w-[20rem] opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
              <div className="p-8 pb-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-300">
                  Attention and remediation
                </p>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/60">
                  Issues are no longer buried in a separate report flow. The workspace surfaces remediation queues, severity counts, and open security items in one place.
                </p>
              </div>
              <div className="relative mt-auto h-[22rem] overflow-hidden px-8">
                <div className="pointer-events-none absolute inset-x-8 top-0 translate-y-6 transition-transform duration-500 ease-in-out group-hover:translate-y-2">
                  <div className="[mask-image:linear-gradient(to_bottom,white_40%,transparent_100%)] h-[22rem]">
                    <ProductFrame
                      src="/screenshots/issues-workspace.png"
                      alt="OwnSurface issues workspace showing severity filters and prioritized remediation items"
                      className="opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── replaces 6 tools ─── */}
        <section className="border-y border-white/10 bg-background relative z-10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Tool consolidation
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.6rem]">
                  Replace 15+ tools with one platform.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                  Stop switching between tabs and subscriptions. OwnSurface unifies the capabilities of over 15 distinct products — from mobile penetration testing to brand visibility — into one continuous intelligence record.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
                >
                  Try a free scan <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {replacedTools.map((tool) => (
                  <div
                    key={tool.name}
                    className="group rounded-xl border border-white/10 bg-black/40 backdrop-blur-md border border-white/10 p-5 transition-colors hover:border-teal-200 hover:bg-teal-50/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-teal-300">
                        Replaced
                      </span>
                    </div>
                    <p className="mt-4 text-[1.1rem] font-semibold tracking-[-0.03em] text-white">
                      {tool.name}
                    </p>
                    <p className="mt-1 text-sm text-white/60">{tool.category}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── platform intelligence + web security screenshot ─── */}
        <section id="platform" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr]">
            <div className="space-y-0 lg:order-1">
              {capabilities.map((cap) => (
                <div key={cap.title} className="grid gap-5 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr_16rem] sm:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <cap.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.5rem] font-semibold tracking-[-0.05em] text-white">
                      {cap.title}
                    </h3>
                    <p className="mt-3 max-w-2xl text-base leading-7 text-white/84">{cap.summary}</p>
                  </div>
                  <p className="text-sm leading-6 text-white/60">{cap.note}</p>
                </div>
              ))}
            </div>

            <div className="lg:order-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Platform intelligence
              </p>
              <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.8rem]">
                Analysis designed for decisions, not screenshots.
              </h2>
            </div>
          </div>

          <div className="mt-16">
            <div className="mb-8 max-w-xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Web Security
              </p>
              <p className="mt-3 text-base leading-7 text-white/60">
                Launch verified-domain security work from one unified surface. Security scans, pentest workflows, and API security all start from the same web-security command layer.
              </p>
            </div>
            <ProductFrame
              src="/screenshots/web-security.png"
              alt="OwnSurface Web Security workspace showing security scan, pentest, and API security launch modes"
            />
          </div>

          <div className="mt-24 grid gap-8 lg:grid-cols-2">
            <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-[#110505] shadow-2xl transition-all duration-300 hover:border-red-500/30 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
              <div className="p-8 pb-3 relative z-10">
                <div className="flex items-center gap-3">
                  <div className="flex justify-center items-center h-8 px-4 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                    <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3" /> Stop Store Rejections
                    </span>
                  </div>
                </div>
                <h3 className="mt-6 font-heading text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
                  App Store & Play Store Compliance
                </h3>
                <p className="mt-4 text-[0.95rem] leading-7 text-white/60">
                  Apple and Google routinely flag undocumented SDKs, missing tracking descriptions, and exposed private keys. Upload your APK or IPA, and our pre-submission checklist will flag exact line-item violations before the reviewers reject them.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 bg-black/60 p-8 h-full min-h-[14rem] relative z-10">
                 <div className="flex flex-col gap-3">
                   <div className="flex items-start gap-4 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                      <X className="h-5 w-5 shrink-0 text-red-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-red-300">NSUserTrackingUsageDescription missing</p>
                        <p className="mt-1 text-xs text-red-400/80">Embedded Meta SDK utilizes native tracking APIs but no iOS prompt string is declared in info.plist.</p>
                      </div>
                   </div>
                   <div className="flex items-start gap-4 rounded-xl border border-teal-500/20 bg-teal-500/10 p-4 text-sm text-teal-100">
                      <Check className="h-5 w-5 shrink-0 text-teal-400 mt-0.5" />
                      <div>
                        <p className="font-semibold text-teal-300">Play Store Data Safety Match</p>
                        <p className="mt-1 text-xs text-teal-400/80">Android manifest permissions strictly match Google Play Data Safety form. No undocumented background location access.</p>
                      </div>
                   </div>
                 </div>
              </div>
            </div>

            <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
              <div className="p-8 pb-3">
                 <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-300">
                  Mobile Penetration Testing
                 </p>
                <h3 className="mt-4 font-heading text-[1.8rem] font-semibold tracking-[-0.04em] text-white">
                  Decompile and discover.
                </h3>
                <p className="mt-4 text-[0.95rem] leading-7 text-white/60">
                  Go beyond surface-level metadata. OwnSurface deep-scans your compiled binaries to extract hidden endpoints, identify vulnerable dependencies, and map your mobile attack surface in minutes.
                </p>
              </div>
              <div className="mt-6 border-t border-white/5 bg-gradient-to-b from-transparent to-teal-500/5 p-8 h-full">
                <div className="rounded-xl border border-white/10 bg-black shadow-2xl overflow-hidden font-mono text-[0.7rem] text-white/50">
                  <div className="border-b border-white/10 bg-white/5 px-4 py-3 flex items-center gap-3">
                     <Terminal className="h-3 w-3 text-white/40" />
                     <span className="text-white/70 tracking-widest uppercase text-[0.6rem] font-bold">APK / IPA Vulnerability Scanner</span>
                  </div>
                  <div className="p-5 space-y-3">
                    <p className="text-teal-400">{">"} Analyzing classes.dex...</p>
                    <p className="text-white/70">Found 4 embedded network configurations</p>
                    <p className="text-amber-400">[WARN] Extracted undocumented staging endpoint: https://api-stg.internal.io</p>
                    <p className="text-white/70">Decrypted 3 certificate pins (Network Security Config)</p>
                    <p className="text-teal-400 font-semibold">{">"} Penetration scan complete. 2 issues queued.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── shared evidence model ─── */}
        <section className="bg-[#050505] border-y border-white/10 relative z-10 text-white">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.78fr_1.22fr] lg:items-start">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/54">
                  Shared evidence model
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-[2.1rem] font-semibold tracking-[-0.06em] text-white sm:text-[4rem]">
                  One read on a website should explain product, market, and risk posture together.
                </h2>
                <p className="mt-6 max-w-md text-base leading-7 text-white/66">
                  The value is not another audit artifact. The value is a single evidence chain a team can monitor, compare, verify, publish, and distribute.
                </p>
              </div>

              <div className="space-y-0 border-t border-white/10">
                {proofSignals.map((signal, i) => (
                  <div key={signal.domain} className="grid gap-5 border-b border-white/10 py-8 sm:grid-cols-[6rem_1fr_1fr]">
                    <div>
                      <div className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-200">
                        0{i + 1}
                      </div>
                      <div className="mt-2 text-sm font-semibold text-white">{signal.domain}</div>
                    </div>
                    <p className="text-[1.2rem] font-semibold tracking-[-0.04em] text-white">{signal.change}</p>
                    <p className="text-sm leading-6 text-white/62">{signal.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ─── who is this for ─── */}
        <section id="use-cases" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <div className="mb-12 max-w-2xl">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
              Built for operators
            </p>
            <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.8rem]">
              Who uses OwnSurface?
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
              Security teams, sales operators, agencies managing client portfolios, growth teams, and developers building intelligence into their own systems.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
            {personas.map((persona, i) => (
              <div
                key={persona.title}
                className={`rounded-xl border border-white/10 bg-black/40 backdrop-blur-md border border-white/10 p-6 transition-colors hover:border-teal-200 ${
                  i < 3 ? "lg:col-span-2" : "lg:col-span-3"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                  <persona.icon className="h-4.5 w-4.5" />
                </div>
                <h3 className="mt-4 text-[1.15rem] font-semibold tracking-[-0.04em] text-white">
                  {persona.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-white/60">{persona.body}</p>
                <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
                  {persona.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 text-sm text-white/60">
                      <Check className="h-3.5 w-3.5 shrink-0 text-teal-400" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── verified domains + screenshot ─── */}
        <section className="border-y border-white/10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-16 lg:grid-cols-[1fr_0.6fr] lg:items-start">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Owned-domain advantage
                </p>
                <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.2rem]">
                  Treat your own public surface like a living attack and trust boundary.
                </h2>
                <p className="mt-5 text-base leading-7 text-white/60">
                  When you verify a domain you own, OwnSurface shifts into deeper scan, vulnerability mapping, exposed-surface review, and continuous monitoring behavior.
                </p>
                <div className="mt-8">
            <ProductFrame
              src="/screenshots/domain-registry.png"
              alt="OwnSurface domain workspace showing verified sites, coverage, and monitoring controls"
            />
          </div>
              </div>

              <div className="space-y-6 lg:pt-16">
                <div className="flex items-start gap-3">
                  <Shield className="mt-1 h-4.5 w-4.5 shrink-0 text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Three-tier security probe</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Passive recon, active probing (directories, admin panels, open redirects), and Nuclei CVE templates — all with configurable rate limiting.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Activity className="mt-1 h-4.5 w-4.5 shrink-0 text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Continuous monitoring</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Uptime (1-60 min intervals), SSL certificate expiry alerts, and speed tracking with Core Web Vitals (LCP, CLS, INP, TTFB).
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Globe className="mt-1 h-4.5 w-4.5 shrink-0 text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Deep crawling (500 pages)</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      Crawl your entire site — sitemap discovery, link extraction, and per-page scanning for security, tech, and compliance findings.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lock className="mt-1 h-4.5 w-4.5 shrink-0 text-teal-400" />
                  <div>
                    <p className="text-sm font-semibold text-white">Compliance and privacy audit</p>
                    <p className="mt-2 text-sm leading-6 text-white/60">
                      GDPR compliance checks, cookie audits, accessibility review, and privacy posture analysis for your owned properties.
                    </p>
                  </div>
                </div>
                <div className="pt-3">
                  <Link href="/security" className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400">
                    Review security posture <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── radar / live intelligence + screenshot ─── */}
        <section className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.45fr_0.55fr] lg:items-start">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Live intelligence
              </p>
              <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.2rem]">
                Stay ahead with real-time radar.
              </h2>
              <p className="mt-5 text-base leading-7 text-white/60">
                Live tech trends, security alerts, and developer community signals — updated every 5 minutes. Track what matters to your stack and market.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Trending technology and security news",
                  "Watchlist change detection over time",
                  "Competitor stack and pricing shift alerts",
                  "Bulk scanning for portfolio analysis",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Zap className="mt-1 h-4 w-4 shrink-0 text-teal-400" />
                    <p className="text-sm leading-6 text-white/60">{item}</p>
                  </div>
                ))}
              </div>

              <Link
                href="/register"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
              >
                Explore the radar <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <ProductFrame
              src="/screenshots/radar-trending.png"
              alt="OwnSurface Radar showing the live trending intelligence feed"
            />
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
              We built 26 distinct intelligence modules that run in parallel. Every scan returns structured data across security, technology, compliance, and business signals.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Community radar
              </p>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Track what developers are discussing in real time, from ecosystem frustration to emerging platform shifts and workflow changes.
              </p>
              <div className="mt-5">
                <ProductFrame
                  src="/screenshots/radar-community.png"
                  alt="OwnSurface Radar community feed showing developer discussions and engagement metrics"
                />
              </div>
            </div>

            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Security radar
              </p>
              <p className="mt-3 text-sm leading-6 text-white/60">
                Move from broad trend detection into concrete security intelligence with CVE severity context, summaries, and fast triage views.
              </p>
              <div className="mt-5">
                <ProductFrame
                  src="/screenshots/radar-security.png"
                  alt="OwnSurface Radar security feed showing CVE items with severity and score context"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ─── specialized workspaces ─── */}
        <section className="border-y border-white/10 bg-black/[0.22]">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="mb-12 max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Specialized workspaces
              </p>
              <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.2rem]">
                The same design system, tuned for different operator jobs.
              </h2>
              <p className="mt-5 text-base leading-7 text-white/60">
                Beyond scanning, OwnSurface gives each operating lane its own focused workspace for app security, GEO intelligence, and lead generation without breaking the overall dashboard flow.
              </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
                <div className="p-8 pb-6">
                  <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">App Security</h3>
                  <p className="mt-3 text-[0.95rem] leading-7 text-white/60">
                    Launch APK and IPA workflows for store checks, app security reviews, and pentest execution from one page.
                  </p>
                </div>
                <div className="relative mt-auto pt-4">
                  <div className="pointer-events-none translate-y-6 transition-transform duration-500 ease-in-out group-hover:translate-y-2 px-6">
                    <div className="[mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)]">
                      <ProductFrame
                        src="/screenshots/app-security.png"
                        alt="OwnSurface App Security workspace showing file upload and unified app security modes"
                        className="opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
                <div className="p-8 pb-6">
                  <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">GEO Intelligence</h3>
                  <p className="mt-3 text-[0.95rem] leading-7 text-white/60">
                    Review AI visibility, brand mentions, and thread discovery in one GEO workspace instead of scattered point tools.
                  </p>
                </div>
                <div className="relative mt-auto pt-4">
                  <div className="pointer-events-none translate-y-6 transition-transform duration-500 ease-in-out group-hover:translate-y-2 px-6">
                    <div className="[mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)]">
                      <ProductFrame
                        src="/screenshots/geo-intelligence.png"
                        alt="OwnSurface GEO Intelligence workspace showing AI visibility, mentions, and thread discovery"
                        className="opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="group flex flex-col overflow-hidden rounded-3xl border border-white/10 bg-black/40 shadow-2xl transition-all duration-300 hover:bg-black/60 hover:border-teal-400/30">
                <div className="p-8 pb-6">
                  <h3 className="text-[1.35rem] font-semibold tracking-[-0.03em] text-white">Lead discovery</h3>
                  <p className="mt-3 text-[0.95rem] leading-7 text-white/60">
                    Search by technology, traffic, and company profile to move from website intelligence into pipeline-ready commercial research.
                  </p>
                </div>
                <div className="relative mt-auto pt-4">
                  <div className="pointer-events-none translate-y-6 transition-transform duration-500 ease-in-out group-hover:translate-y-2 px-6">
                    <div className="[mask-image:linear-gradient(to_bottom,white_50%,transparent_100%)]">
                      <ProductFrame
                        src="/screenshots/leads-workspace.png"
                        alt="OwnSurface lead generation workspace showing company filters and result scoring"
                        className="opacity-80 transition-opacity duration-500 group-hover:opacity-100"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── pro: attack surface, monitoring, deep scan ─── */}
        <section className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
            Pro capabilities
          </p>
          <h2 className="mt-4 max-w-3xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.2rem]">
            Go deeper than any single tool can.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
            Capabilities that turn OwnSurface from a scanner into a continuous security, monitoring, and sales intelligence layer for your infrastructure.
          </p>

          <div className="mt-14 space-y-20">
            {/* Attack Surface Audit */}
            <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-red-400/80">
                  <Shield className="h-3.5 w-3.5" />
                  Attack surface audit
                </div>
                <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                  Find every vulnerability before an attacker does.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Three escalating tiers of security testing — from passive header analysis to active directory scanning to Nuclei CVE templates. Each finding includes a CVSS score, CWE ID, captured evidence, and specific remediation steps. Not a generic report — a professional penetration test output.
                </p>
              </div>
              <div className="space-y-px rounded-2xl bg-white/[0.02] overflow-hidden">
                {[
                  { tier: "Tier 1", name: "Passive recon", time: "30 sec", items: "Headers, SSL, DNS, cookies, CORS, source leaks" },
                  { tier: "Tier 2", name: "Active probing", time: "2-5 min", items: "Admin panels, directories, APIs, subdomains, cloud storage" },
                  { tier: "Tier 3", name: "Vulnerability testing", time: "5-10 min", items: "Nuclei CVE templates, default credentials, misconfigurations" },
                ].map((t) => (
                  <div key={t.tier} className="flex items-start gap-4 bg-black/40 backdrop-blur-md border border-white/10 px-5 py-4">
                    <div className="shrink-0 pt-0.5">
                      <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-teal-400">{t.tier}</span>
                      <p className="text-xs text-white/60 mt-0.5">{t.time}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-xs text-white/60 mt-1">{t.items}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Monitoring */}
            <div className="grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start">
              <div className="lg:order-2">
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-400/80">
                  <Activity className="h-3.5 w-3.5" />
                  Continuous monitoring
                </div>
                <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                  Know the moment something breaks or expires.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  Set it once, get alerts forever. Uptime checks every 1-60 minutes, SSL certificate expiry warnings 14-30 days before they happen, and Core Web Vitals tracking that catches performance regressions before your users complain.
                </p>
              </div>
              <div className="lg:order-1 grid grid-cols-3 gap-px rounded-2xl bg-white/[0.04] overflow-hidden">
                {[
                  { label: "Uptime", value: "1-60 min", sub: "HTTP checks with status code validation, consecutive failure detection, Brevo email alerts" },
                  { label: "SSL", value: "Expiry alerts", sub: "Certificate chain validation, protocol version checks, cipher strength analysis" },
                  { label: "Speed", value: "Core Web Vitals", sub: "LCP, CLS, INP, TTFB — tracked over time with performance scoring" },
                ].map((m) => (
                  <div key={m.label} className="bg-black/40 backdrop-blur-md border border-white/10 p-4">
                    <p className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-teal-400">{m.label}</p>
                    <p className="mt-2 text-sm font-semibold text-white">{m.value}</p>
                    <p className="mt-2 text-xs leading-5 text-white/60">{m.sub}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Deep Scan */}
            <div className="grid gap-10 lg:grid-cols-[1fr_0.85fr] lg:items-start">
              <div>
                <div className="inline-flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-indigo-400/80">
                  <Layers className="h-3.5 w-3.5" />
                  Deep scan crawler
                </div>
                <h3 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] text-white sm:text-[2rem]">
                  Scan 500 pages in one click.
                </h3>
                <p className="mt-4 text-sm leading-7 text-white/60">
                  One page tells you what a site looks like. Five hundred pages tell you what it actually is. The deep scan crawler follows every internal link, discovers sitemaps, and runs security, SEO, and tech detection on every page it finds — surfacing issues that single-page scanners miss entirely.
                </p>
                <div className="mt-6 flex items-center gap-8 text-sm text-white/60">
                  <span><span className="font-semibold text-white">500</span> pages per scan</span>
                  <span><span className="font-semibold text-white">26</span> modules per page</span>
                  <span><span className="font-semibold text-white">1</span> unified report</span>
                </div>
              </div>
              <div className="space-y-3">
                {[
                  "Automatic sitemap discovery and internal link following",
                  "Per-page security header and cookie analysis",
                  "Broken link detection and redirect chain mapping",
                  "Technology changes across different pages (A/B tests, legacy sections)",
                  "SEO issues: missing meta tags, duplicate titles, orphan pages",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-teal-400" />
                    <p className="text-sm leading-6 text-white/60">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-14 flex items-center gap-6">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold uppercase tracking-[0.14em] text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.02] transition-transform"
            >
              Start free, upgrade when ready
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-white/60 hover:text-white">
              $49/month for everything
            </Link>
          </div>
        </section>

        {/* ─── sales intelligence: lead gen, contacts, AI visibility, enrichment ─── */}
        <section className="border-y border-white/10 bg-[linear-gradient(180deg,rgba(20,184,166,0.05),transparent)] relative z-10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr] lg:items-start">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Sales intelligence
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.6rem]">
                  Turn scan data into pipeline.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                  Every scan already captures technology, company info, and email patterns. Pro turns that intelligence into a searchable lead database with contact reveal and CSV export.
                </p>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
                >
                  Start generating leads <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <div className="space-y-0">
                {/* Lead Generation */}
                <div className="grid gap-5 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr] sm:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <Search className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-white">
                      Lead generation — search by technology
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                      Find companies using specific technologies — React, Shopify, Stripe, WordPress, or any of 1,500+ detected technologies.
                      Filter by industry and location. Export results as CSV for your CRM.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Search by tech stack", "Filter by industry", "Filter by location", "CSV export"].map((tag) => (
                        <span key={tag} className="rounded-full bg-teal-500/8 px-3 py-1 text-[0.72rem] font-medium text-teal-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Contact Database */}
                <div className="grid gap-5 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr] sm:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <Mail className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-white">
                      Contact database + email reveal
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                      Every scanned domain builds a company profile with detected email patterns, social links, and business signals.
                      Pro users can reveal full email addresses and export contact data. Free users see masked results.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Email pattern detection", "Full email reveal (Pro)", "Company profiles", "Social links"].map((tag) => (
                        <span key={tag} className="rounded-full bg-teal-500/8 px-3 py-1 text-[0.72rem] font-medium text-teal-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* AI Search Visibility */}
                <div className="grid gap-5 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr] sm:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <Bot className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-white">
                      AI search visibility tracking
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                      Check whether your domain appears in responses from ChatGPT, Claude, Gemini, and other AI models.
                      Track your AI visibility over time and understand how AI search engines reference your brand — a metric that didn&apos;t exist two years ago.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["ChatGPT visibility", "Claude visibility", "Gemini visibility", "Trend tracking"].map((tag) => (
                        <span key={tag} className="rounded-full bg-teal-500/8 px-3 py-1 text-[0.72rem] font-medium text-teal-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Enrichment API */}
                <div className="grid gap-5 border-t border-white/10 py-8 sm:grid-cols-[3.5rem_1fr] sm:items-start">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <TrendingUp className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.3rem] font-semibold tracking-[-0.04em] text-white">
                      Enrichment API — the Clearbit alternative
                    </h3>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-white/60">
                      Send a domain, get back company name, industry, tech stack, security grade, traffic tier, social profiles, and email patterns.
                      One API call replaces what used to take Clearbit + BuiltWith + SimilarWeb. Integrates into any CRM, marketing automation, or internal tool.
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {["Single API call", "Company data", "Tech + security", "CRM integration"].map((tag) => (
                        <span key={tag} className="rounded-full bg-teal-500/8 px-3 py-1 text-[0.72rem] font-medium text-teal-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── workflow ─── */}
        <section id="workflow" className="border-y border-white/10 bg-background relative z-10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr]">
              <div className="space-y-0 border-t border-white/10 lg:order-1">
                {workflowSteps.map((step) => (
                  <div key={step.step} className="grid gap-5 border-b border-white/10 py-8 sm:grid-cols-[6rem_1fr]">
                    <div className="text-[0.85rem] font-semibold uppercase tracking-[0.24em] text-teal-300">
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-[1.55rem] font-semibold tracking-[-0.05em] text-white">
                        {step.title}
                      </h3>
                      <p className="mt-3 max-w-2xl text-base leading-7 text-white/60">{step.body}</p>
                      <Link href={step.href} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400">
                        {step.cta} <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="lg:order-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Operating workflow
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.8rem]">
                  One URL to monitoring, reports, and shared intelligence.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                  Scan, understand, verify, monitor, and distribute — the real product flow from first URL to operational intelligence.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── access surfaces ─── */}
        <section id="surfaces" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
          <div className="grid gap-14 lg:grid-cols-[0.7fr_1.3fr]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Access surfaces
              </p>
              <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.6rem]">
                Start where the work begins.
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                A serious platform follows operators across browser context, team workflows, monitoring, and internal systems.
              </p>
            </div>

            <div className="space-y-0 border-t border-white/10">
              {surfaces.map((surface) => (
                <Link key={surface.title} href={surface.href} className="group grid gap-5 border-b border-white/10 py-7 sm:grid-cols-[3rem_1fr_12rem]">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white ring-1 ring-white/20">
                    <surface.icon className="h-4.5 w-4.5" />
                  </div>
                  <div>
                    <h3 className="text-[1.45rem] font-semibold tracking-[-0.05em] text-white">
                      {surface.title}
                    </h3>
                    <p className="mt-2 max-w-2xl text-base leading-7 text-white/60">{surface.body}</p>
                  </div>
                  <div className="flex items-start justify-between gap-4 sm:flex-col sm:items-end">
                    <p className="text-sm leading-6 text-white/60 sm:text-right">{surface.detail}</p>
                    <span className="inline-flex items-center gap-2 text-sm font-semibold text-white transition-colors group-hover:text-teal-400">
                      Explore <ArrowRight className="h-4 w-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ─── developer API ─── */}
        <section id="api" className="border-y border-white/10 bg-[#111] relative z-10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="grid gap-14 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
              <div className="space-y-0 lg:order-1">
                {/* Live code example */}
                <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0f0d]">
                  <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10" />
                    <span className="h-2.5 w-2.5 rounded-full bg-black/40 backdrop-blur-md border border-white/10" />
                    <span className="ml-3 text-[0.6rem] text-white/30 font-mono">scan-and-use.sh</span>
                  </div>
                  <pre className="p-5 text-[0.78rem] font-mono leading-relaxed overflow-x-auto">
                    <code>
                      <span className="text-white/40"># Scan any website</span>{"\n"}
                      <span className="text-green-400">curl</span><span className="text-white/80"> -X POST </span><span className="text-teal-300">https://ownsurface.com/api/v1/scan</span>{" \\\n"}
                      <span className="text-white/80">{"  "}-H </span><span className="text-amber-300">{'"X-Api-Key: xrai_your_key_here"'}</span>{" \\\n"}
                      <span className="text-white/80">{"  "}-H </span><span className="text-amber-300">{'"Content-Type: application/json"'}</span>{" \\\n"}
                      <span className="text-white/80">{"  "}-d </span><span className="text-amber-300">{"'{\"url\": \"stripe.com\"}"}</span>{"'\n\n"}
                      <span className="text-white/40"># Get structured result</span>{"\n"}
                      <span className="text-green-400">curl</span><span className="text-white/80"> </span><span className="text-teal-300">https://ownsurface.com/api/v1/scan/SCAN_HASH</span>{" \\\n"}
                      <span className="text-white/80">{"  "}-H </span><span className="text-amber-300">{'"X-Api-Key: xrai_your_key_here"'}</span>
                    </code>
                  </pre>
                </div>

                {/* Endpoints */}
                <div className="mt-8 space-y-0 border-t border-white/10">
                  {[
                    { method: "POST", path: "/api/v1/scan", desc: "Run a full 26-module scan on any URL" },
                    { method: "GET", path: "/api/v1/scan/{hash}", desc: "Retrieve a completed scan result" },
                    { method: "GET", path: "/api/v1/scan/recent", desc: "List your recent scans" },
                    { method: "POST", path: "/api/v1/bulk", desc: "Submit up to 500 URLs in one batch" },
                    { method: "GET", path: "/api/v1/bulk/{id}", desc: "Check bulk job progress" },
                    { method: "POST", path: "/api/v1/enrich", desc: "Enrich domain with company data" },
                    { method: "GET", path: "/api/v1/leads/search", desc: "Search leads by tech, industry, location" },
                    { method: "GET", path: "/api/v1/history/{hash}", desc: "Full scan history for a domain" },
                  ].map((ep) => (
                    <div key={ep.path + ep.method} className="flex items-baseline gap-4 border-b border-white/10 py-3.5">
                      <span className={`text-[0.68rem] font-bold uppercase tracking-wider w-10 shrink-0 ${ep.method === "POST" ? "text-teal-400" : "text-blue-400/70"}`}>
                        {ep.method}
                      </span>
                      <code className="text-sm font-mono text-white">{ep.path}</code>
                      <span className="ml-auto text-sm text-white/60 hidden sm:block">{ep.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Use cases as flowing text */}
                <div className="mt-8 grid gap-6 sm:grid-cols-3">
                  {[
                    { title: "CI/CD pipelines", body: "Scan staging URLs on every deploy. Fail builds on critical security findings." },
                    { title: "Client reporting", body: "Pull scan data into branded PDF reports or internal dashboards automatically." },
                    { title: "Competitive intel", body: "Cron-scan competitor sites and pipe tech stack changes into Slack or email." },
                  ].map((uc) => (
                    <div key={uc.title} className="border-t border-white/10 pt-4">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">{uc.title}</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">{uc.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:order-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                  Developer API
                </p>
                <h2 className="mt-4 max-w-xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.6rem]">
                  Pipe intelligence into anything you build.
                </h2>
                <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                  Every scan, every module, every result — accessible through a clean REST API. Authenticate with a single header and start pulling structured data in minutes.
                </p>
                <div className="mt-8 space-y-5 border-t border-white/10 pt-8">
                  {[
                    { label: "Authentication", value: "X-Api-Key header — generate keys from the dashboard, rotate anytime" },
                    { label: "Rate limits", value: "Free: 10 calls/day, 1 key. Pro: 10,000 calls/day, 10 keys" },
                    { label: "Response format", value: "JSON with consistent error shapes — no XML, no pagination surprises" },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">{item.label}</p>
                      <p className="mt-2 text-sm leading-6 text-white/60">{item.value}</p>
                    </div>
                  ))}
                </div>
                <Link
                  href="/register"
                  className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
                >
                  Get your API key <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ─── MCP: AI agent integration ─── */}
        <section id="mcp" className="relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(14,165,144,0.08),_transparent_50%)]" />
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
            <div className="relative">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-teal-400">
                AI agent integration
              </p>
              <h2 className="mt-4 max-w-3xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.6rem] sm:leading-[0.94]">
                Website intelligence that lives inside your AI tools.
              </h2>
              <p className="mt-6 max-w-2xl text-base leading-7 text-white/60 sm:text-[1.15rem] sm:leading-8">
                OwnSurface ships as an MCP server. That means Claude, Cursor, Windsurf, and every MCP-compatible agent
                can scan websites, check security, look up companies, and compare tech stacks — without leaving the conversation.
              </p>

              {/* Conversational flow — not boxes, just natural reading */}
              <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:items-start">

                {/* Left: the narrative */}
                <div className="space-y-10">
                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">How it works</p>
                    <p className="mt-3 text-sm leading-7 text-white/60">
                      You install the MCP server once. After that, your AI assistant has seven tools available natively.
                      Ask it <em className="text-white">&ldquo;What technologies does stripe.com use?&rdquo;</em> and it calls
                      the <code className="rounded bg-teal-500/8 px-1.5 py-0.5 text-[0.82rem] font-mono text-teal-300">get_tech_stack</code> tool,
                      hits the OwnSurface API with your key, and returns the full stack in context.
                    </p>
                    <p className="mt-4 text-sm leading-7 text-white/60">
                      Ask <em className="text-white">&ldquo;Is this site secure?&rdquo;</em> and it runs
                      <code className="rounded bg-teal-500/8 px-1.5 py-0.5 text-[0.82rem] font-mono text-teal-300">check_security</code> —
                      you get the grade, missing headers, and copy-paste fix instructions for your server right inside the chat.
                    </p>
                  </div>

                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">Seven tools, one API key</p>
                    <div className="mt-4 space-y-3">
                      {[
                        { name: "scan_website", what: "Full 26-module intelligence scan" },
                        { name: "get_tech_stack", what: "Frameworks, CDNs, payments, hosting, costs" },
                        { name: "check_security", what: "Grade, headers, SSL, vulnerabilities, fix code" },
                        { name: "get_company_info", what: "Name, industry, social links, email patterns" },
                        { name: "compare_websites", what: "Side-by-side tech, security, SEO, traffic" },
                        { name: "get_scan_history", what: "Track changes over time for any URL" },
                        { name: "check_carbon", what: "CO\u2082 per visit, sustainability grade, green hosting" },
                      ].map((tool) => (
                        <div key={tool.name} className="flex items-baseline gap-3">
                          <code className="shrink-0 text-[0.78rem] font-mono font-medium text-teal-400">{tool.name}</code>
                          <span className="text-sm text-white/60">{tool.what}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-teal-300">Who uses this</p>
                    <p className="mt-3 text-sm leading-7 text-white/60">
                      Developers building with AI agents. Security teams running audits through Claude.
                      Sales teams enriching prospect data mid-conversation. Anyone who wants website intelligence
                      without tab-switching.
                    </p>
                  </div>

                  <Link
                    href="/developers#mcp"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
                  >
                    Read the full MCP documentation <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                {/* Right: Interactive AI Chat UI */}
                <div className="relative rounded-2xl border border-white/10 bg-[#0a0f0d] shadow-2xl overflow-hidden mt-6 lg:mt-0">
                  {/* Window Bar */}
                  <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full bg-black/40 border border-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-black/40 border border-white/10" />
                      <span className="h-2.5 w-2.5 rounded-full bg-black/40 border border-white/10" />
                    </div>
                    <span className="text-[0.65rem] font-medium text-white/40 tracking-wider uppercase flex items-center gap-2">
                      <Bot className="h-3 w-3" /> Agent IDE Interface
                    </span>
                  </div>

                  {/* Chat Area */}
                  <div className="p-6 space-y-6">
                    {/* User Message */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-white font-semibold text-xs border border-white/20">
                        OP
                      </div>
                      <div className="mt-1">
                        <span className="text-[0.9rem] leading-relaxed text-white">Can you run a security scan on our staging environment and write the config fixes?</span>
                      </div>
                    </div>

                    {/* AI Message */}
                    <div className="flex items-start gap-4">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-500/20 text-teal-400 border border-teal-500/30">
                        <Bot className="h-4 w-4" />
                      </div>
                      <div className="mt-1 w-full">
                        <div className="mb-3 flex items-center gap-2 rounded-md bg-white/5 px-2 py-1 w-fit border border-white/10">
                          <Activity className="h-3 w-3 text-teal-400 animate-pulse" />
                          <span className="text-[0.7rem] font-mono text-white/60">Using tool <strong>ownsurface_scan</strong>...</span>
                        </div>
                        <div className="text-[0.9rem] leading-relaxed text-white/80">
                          Scan complete. Your staging environment scored a <strong className="text-amber-400">B grade</strong>. I found one critical issue preventing an A+ rating: you are missing the <code className="text-pink-400 bg-pink-400/10 px-1 py-0.5 rounded text-[0.8rem]">Strict-Transport-Security</code> header on the edge proxy.
                        </div>
                        <div className="mt-4 text-[0.9rem] leading-relaxed text-white/80">
                          Here is the exact AI remediation copy-paste fix for your Nginx configuration. Shall I apply this via the CLI automatically?
                        </div>

                        {/* Code Block */}
                        <div className="mt-4 overflow-hidden rounded-xl border border-white/10 bg-[#050505]">
                          <div className="flex items-center justify-between border-b border-white/10 bg-white/5 px-4 py-2">
                            <span className="text-[0.7rem] font-mono text-white/40">nginx.conf</span>
                            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-teal-400 hover:text-teal-300 cursor-pointer transition-colors">Apply Fix</span>
                          </div>
                          <pre
                            className="p-4 text-[0.75rem] font-mono leading-relaxed text-white/70 overflow-x-auto"
                            dangerouslySetInnerHTML={{
                              __html: `<span style="color:rgba(255,255,255,0.3)"># OwnSurface AI Remediation</span>\n<span style="color:#c084fc">server</span> {\n<span style="color:rgba(255,255,255,0.3)">  ...</span>\n<span style="color:#5eead4">  add_header</span> Strict-Transport-Security <span style="color:#fcd34d">"max-age=31536000"</span> always;\n}`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── faq ─── */}
        <section id="faq" className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-28">
          <div className="grid gap-14 lg:grid-cols-[0.45fr_0.55fr]">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/60">
                Common questions
              </p>
              <h2 className="mt-4 font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[3.2rem]">
                Frequently asked questions
              </h2>
              <p className="mt-5 max-w-md text-base leading-7 text-white/60">
                Everything you need to know about OwnSurface, scanning, and how it works.
              </p>
              <Link
                href="/contact"
                className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-white hover:text-teal-400"
              >
                Still have questions? Contact us <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="border-t border-white/10">
              {faqs.map((faq) => (
                <FAQItem key={faq.question} faq={faq} />
              ))}
            </div>
          </div>
        </section>

        {/* ─── cta ─── */}
        <section className="border-t border-white/10">
          <div className="mx-auto max-w-[1320px] px-4 py-16 sm:px-6 sm:py-20 lg:px-10 lg:py-24">
            <div className="grid gap-12 lg:grid-cols-[1fr_0.7fr] lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-teal-300">
                  <Zap className="h-3.5 w-3.5" />
                  Free forever
                </div>
                <h2 className="mt-5 max-w-3xl font-heading text-[2rem] font-semibold tracking-[-0.06em] text-white sm:text-[4rem]">
                  Start with three free scans every day.
                </h2>
                <p className="mt-5 max-w-xl text-base leading-7 text-white/60">
                  No credit card. No trial countdown. Every scan runs all 26 modules with the same intelligence as Pro. Upgrade when you need volume, monitoring, deep scanning, and operational features.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-semibold text-black shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:bg-white/90 hover:scale-[1.02] transition-transform"
                  >
                    Create free workspace <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Link
                    href="/pricing"
                    className="inline-flex items-center gap-2 rounded-full border border-white/20 px-6 py-3.5 text-sm font-semibold text-white hover:border-white/40 hover:bg-white/5 transition-all"
                  >
                    Compare Free vs Pro
                  </Link>
                </div>
              </div>

              <div className="space-y-4 border-t border-white/10 pt-6">
                {[
                  "3 scans daily — all 26 modules included",
                  "Full security audit with CVE matching",
                  "1 verified domain",
                  "Chrome extension + API access",
                  "Upgrade to Pro ($49/mo) for unlimited everything",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <FileStack className="mt-1 h-4 w-4 shrink-0 text-teal-400" />
                    <p className="text-sm leading-6 text-white/60">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
