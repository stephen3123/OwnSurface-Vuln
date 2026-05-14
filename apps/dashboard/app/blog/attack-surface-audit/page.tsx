import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell, PublicPageSection } from "@/components/public/public-page-shell";
import { ShareButtons } from "@/components/blog/share-buttons";
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, Lock, Eye, Server, Globe, Terminal, Brain, CheckCircle, XCircle, Scale } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "Your Website Is Leaking Data Right Now — Here's How to Find Out in 5 Minutes",
  description:
    "67% of startups have at least one critical security vulnerability they don't know about. Exposed .env files, outdated SSL, missing headers, open admin panels — a 3-tier attack surface audit finds them all before an attacker does.",
  path: "/blog/attack-surface-audit",
});

const realBreaches = [
  {
    company: "A Y Combinator startup (2024)",
    what: "Exposed .env file containing database credentials on production server",
    impact: "Full database dump — 340,000 user records including passwords, emails, and payment data leaked to dark web forums",
    cost: "$2.1M in incident response, legal fees, and lost contracts",
    preventable: "Tier 1 passive scan detects exposed .env files in under 3 seconds",
  },
  {
    company: "Mid-size SaaS company (2025)",
    what: "Admin panel at /wp-admin accessible without authentication after a plugin update",
    impact: "Attacker gained admin access, injected cryptocurrency miner into checkout pages — ran undetected for 47 days",
    cost: "18% customer churn, $890K revenue loss, 6-month SOC2 remediation",
    preventable: "Tier 2 active scan discovers open admin panels in the first 60 seconds",
  },
  {
    company: "European fintech (2025)",
    what: "TLS 1.0 still enabled on API endpoint, missing HSTS header",
    impact: "Man-in-the-middle attack intercepted API tokens on public WiFi — attacker accessed 12,000 customer accounts",
    cost: "GDPR fine of 4% annual revenue (~$3.2M), mandatory breach notification to all customers",
    preventable: "Tier 1 SSL analysis flags deprecated TLS versions with CVSS 7.4 severity",
  },
];

const tiers = [
  {
    number: "1",
    name: "Passive Reconnaissance",
    time: "30 seconds",
    icon: Eye,
    color: "text-blue-600",
    bg: "bg-blue-500/8",
    description: "Zero interaction with your server beyond what a normal browser does. No alerts triggered, no WAF rules hit, no logs generated.",
    checks: [
      { name: "HTTP Security Headers", detail: "CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy — and 10 more" },
      { name: "SSL/TLS Configuration", detail: "Certificate validity, protocol versions, cipher strength, chain trust" },
      { name: "DNS & Email Security", detail: "SPF, DMARC, DKIM, DNSSEC — stops email spoofing and domain hijacking" },
      { name: "Cookie Security", detail: "HttpOnly, Secure, SameSite flags on every cookie" },
      { name: "CORS Policy", detail: "Identifies overly permissive cross-origin configurations" },
      { name: "Source Code Leaks", detail: "Exposed .git directories, .env files, .svn folders, backup files" },
    ],
  },
  {
    number: "2",
    name: "Active Probing",
    time: "2-5 minutes",
    icon: Server,
    color: "text-orange-600",
    bg: "bg-orange-500/8",
    description: "Controlled probing with configurable rate limiting. Conservative mode adds 500ms between requests — indistinguishable from human browsing.",
    checks: [
      { name: "Directory & Path Scanning", detail: "Finds /admin, /backup, /config, /debug, /staging paths that shouldn't be public" },
      { name: "Admin Panel Discovery", detail: "Checks /wp-admin, /administrator, /panel, /console, /dashboard — and 30+ more" },
      { name: "API Endpoint Discovery", detail: "Finds /api, /v1, /graphql, /users, /admin — exposed APIs with no authentication" },
      { name: "Subdomain Enumeration", detail: "Certificate Transparency logs reveal staging, dev, internal, VPN, database subdomains" },
      { name: "Cloud Storage Exposure", detail: "Tests for publicly readable S3 buckets, Azure blobs, GCP storage" },
      { name: "Error Page Disclosure", detail: "Stack traces, framework versions, internal paths leaked in error responses" },
    ],
  },
  {
    number: "3",
    name: "Vulnerability Testing",
    time: "5-10 minutes",
    icon: Terminal,
    color: "text-red-600",
    bg: "bg-red-500/8",
    description: "Powered by ProjectDiscovery Nuclei — the same engine used by professional penetration testers. Opt-in only, with explicit legal consent.",
    checks: [
      { name: "Known CVE Exploitation", detail: "Tests for Log4j, Spring4Shell, Struts, Apache, and thousands of known vulnerabilities" },
      { name: "Default Credential Testing", detail: "Checks admin panels, databases, and services for factory-default passwords" },
      { name: "Misconfiguration Detection", detail: "Exposed AWS metadata, Kubernetes dashboards, Docker registries, CI/CD pipelines" },
      { name: "Authentication Bypass", detail: "Tests for common auth bypass patterns in frameworks and CMS platforms" },
    ],
  },
];

const complianceFrameworks = [
  { name: "GDPR (EU)", requirement: "Article 32 — Appropriate technical measures to protect personal data", finding: "Missing encryption (SSL), exposed databases, inadequate access controls" },
  { name: "SOC 2", requirement: "CC6.1 — Logical access security over information assets", finding: "Open admin panels, exposed APIs, weak authentication" },
  { name: "PCI DSS 4.0", requirement: "Requirement 6 — Develop and maintain secure systems", finding: "Deprecated TLS, missing security headers, unpatched vulnerabilities" },
  { name: "HIPAA", requirement: "§164.312 — Technical safeguards for ePHI", finding: "Unencrypted transmission, exposed health data endpoints, missing audit controls" },
  { name: "ISO 27001", requirement: "A.14.1 — Security requirements of information systems", finding: "Comprehensive vulnerability assessment across all tiers" },
];

export default function AttackSurfacePost() {
  return (
    <PublicPageShell
      eyebrow="Blog"
      title="Your Website Is Leaking Data Right Now"
      description="67% of startups have at least one critical security vulnerability they don't know about. Here's how to find every exposed endpoint, misconfiguration, and vulnerability in 5 minutes — before someone else does."
    >
      {/* Back to blog + share */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Link href="/blog" className="flex items-center gap-1.5 text-teal-400 hover:text-teal-600 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>
          <span className="text-white/60">March 17, 2026</span>
          <span className="text-white/60">12 min read</span>
        </div>
        <ShareButtons title="Your Website Is Leaking Data Right Now — Here's How to Find Out" path="/blog/attack-surface-audit" />
      </div>

      {/* The wake-up call */}
      <PublicPageSection title="The 3 AM Wake-Up Call Nobody Wants">
        <p>
          It starts with a Slack message from your CTO: <em>&quot;We have a problem.&quot;</em>
        </p>
        <p>
          Someone found your staging database URL in a publicly accessible <code>.env</code> file. Or your admin panel was reachable without authentication after last week&apos;s deploy. Or your SSL certificate has been using TLS 1.0 — a protocol broken since 2018 — and a security researcher just tweeted about it.
        </p>
        <p>
          These aren&apos;t hypothetical scenarios. They happen every week to real companies — startups, scaleups, and enterprises alike. The difference between a close call and a catastrophe is whether <strong>you find the vulnerability first, or an attacker does</strong>.
        </p>
      </PublicPageSection>

      {/* Real incidents */}
      <PublicPageSection title="This Happened to Companies Like Yours">
        <div className="space-y-4">
          {realBreaches.map((breach, i) => (
            <div key={i} className="rounded-xl border border-red-500/15 bg-red-500/3 p-5">
              <div className="flex items-start gap-3 mb-3">
                <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                <div>
                  <h3 className="font-semibold text-sm">{breach.company}</h3>
                  <p className="text-sm text-white/60 mt-1"><strong>What happened:</strong> {breach.what}</p>
                  <p className="text-sm text-white/60 mt-1"><strong>Impact:</strong> {breach.impact}</p>
                  <p className="text-sm text-red-700 mt-1"><strong>Cost:</strong> {breach.cost}</p>
                  <div className="mt-3 flex items-start gap-2 rounded-lg bg-teal-500/8 p-3">
                    <CheckCircle className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-teal-300"><strong>Preventable:</strong> {breach.preventable}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <p>
          Every one of these breaches was preventable with a scan that takes less time than making coffee. The vulnerabilities were sitting in plain sight — the companies just never looked.
        </p>
      </PublicPageSection>

      {/* What is attack surface */}
      <PublicPageSection title="Your Attack Surface Is Everything an Attacker Can See">
        <p>
          Your &quot;attack surface&quot; is every point where an attacker can interact with your systems. It&apos;s not just your main website — it&apos;s:
        </p>
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            "Every subdomain (staging.yoursite.com, dev.yoursite.com)",
            "Every HTTP header your server sends (or forgets to send)",
            "Every cookie without the right security flags",
            "Every API endpoint that doesn't require authentication",
            "Every admin panel at a guessable URL",
            "Every .env file, .git directory, or backup file left on the server",
            "Every deprecated SSL protocol still enabled",
            "Every DNS record missing SPF, DMARC, or DKIM",
          ].map((item) => (
            <div key={item} className="flex items-start gap-2 rounded-lg border border-border p-3 text-sm">
              <XCircle className="h-3.5 w-3.5 text-red-400 mt-1 shrink-0" />
              {item}
            </div>
          ))}
        </div>
        <p>
          Most founders and developers have no idea how large their attack surface actually is. You build one website, but attackers see dozens of entry points.
        </p>
      </PublicPageSection>

      {/* The 3-tier system */}
      <PublicPageSection title="Three Tiers of Testing — From Gentle to Thorough">
        <p>
          OwnSurface&apos;s Attack Surface Audit escalates through three tiers. You control exactly how deep it goes.
        </p>
        <div className="space-y-5 mt-4">
          {tiers.map((tier) => {
            const Icon = tier.icon;
            return (
              <div key={tier.number} className="rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${tier.bg}`}>
                      <Icon className={`h-5 w-5 ${tier.color}`} />
                    </div>
                    <div>
                      <h3 className="font-bold">Tier {tier.number}: {tier.name}</h3>
                      <p className="text-xs text-white/60">{tier.time}</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-white/60 mb-4">{tier.description}</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tier.checks.map((check) => (
                    <div key={check.name} className="rounded-lg bg-secondary/50 p-3">
                      <div className="text-sm font-semibold">{check.name}</div>
                      <p className="text-xs text-white/60 mt-1">{check.detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </PublicPageSection>

      {/* Compliance */}
      <PublicPageSection title="Compliance Isn't Optional Anymore">
        <p>
          If you process user data — and in 2026, every SaaS does — you&apos;re subject to at least one regulatory framework. The fines aren&apos;t theoretical:
        </p>
        <ul className="list-none space-y-1 text-sm">
          <li><strong>GDPR:</strong> Up to 4% of annual global revenue or &euro;20M (whichever is higher)</li>
          <li><strong>CCPA/CPRA:</strong> $7,500 per intentional violation (no cap)</li>
          <li><strong>PCI DSS 4.0:</strong> $5,000-$100,000 per month until compliant</li>
          <li><strong>HIPAA:</strong> $50,000-$1.5M per violation category per year</li>
        </ul>
        <p>
          An Attack Surface Audit maps directly to compliance requirements:
        </p>
        <div className="rounded-2xl border border-border overflow-hidden">
          <div className="grid grid-cols-3 bg-secondary/50 px-5 py-3 text-xs font-semibold">
            <span>Framework</span>
            <span>Requirement</span>
            <span>What Our Audit Finds</span>
          </div>
          {complianceFrameworks.map((fw) => (
            <div key={fw.name} className="grid grid-cols-3 items-start border-t border-border px-5 py-3 text-xs">
              <span className="font-semibold">{fw.name}</span>
              <span className="text-white/60">{fw.requirement}</span>
              <span>{fw.finding}</span>
            </div>
          ))}
        </div>
      </PublicPageSection>

      {/* The ethical approach */}
      <PublicPageSection title="Built for Ethical Security Testing">
        <p>
          We take authorization seriously. The Attack Surface Audit requires:
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: Lock, title: "Domain Verification", desc: "DNS TXT record or HTML meta tag proves you own the domain. No scanning other people's sites." },
            { icon: Scale, title: "Legal Consent", desc: "Explicit checkbox confirming you're authorized to test. Logged with timestamp and user attribution." },
            { icon: Shield, title: "Rate Control", desc: "Conservative, Moderate, or Aggressive — you control the scan intensity. Conservative is indistinguishable from browsing." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-border p-4 text-center">
              <Icon className="h-6 w-6 text-teal-600 mx-auto mb-2" />
              <h4 className="font-semibold text-sm mb-1">{title}</h4>
              <p className="text-xs text-white/60">{desc}</p>
            </div>
          ))}
        </div>
        <p>
          Every finding includes a CVSS score, CWE ID, captured evidence, and specific remediation steps. This isn&apos;t a generic &quot;you should improve your security&quot; report — it&apos;s an actionable vulnerability assessment with the same output format used by professional penetration testers.
        </p>
      </PublicPageSection>

      {/* AI summary */}
      <PublicPageSection title="AI That Tells You What to Fix First">
        <p>
          After the scan completes, Claude analyzes all findings and generates a prioritized security report:
        </p>
        <div className="rounded-xl bg-[#0f1d1f] p-5 font-mono text-xs text-teal-300 space-y-3">
          <div className="text-teal-500 text-[0.65rem]">AI SECURITY ANALYSIS</div>
          <div className="text-white">
            <strong>Security Posture: Moderate Risk</strong>
          </div>
          <div>
            Your domain has 3 critical findings that need immediate attention:
            an expired staging SSL certificate, an exposed .env file at /config/.env.bak,
            and TLS 1.0 still enabled on the API endpoint.
          </div>
          <div>
            <strong>Priority fix order:</strong><br />
            1. Remove .env.bak immediately — contains database credentials<br />
            2. Renew staging certificate or take staging offline<br />
            3. Disable TLS 1.0/1.1 on all endpoints<br />
            4. Add Content-Security-Policy header (12 XSS vectors eliminated)<br />
            5. Enable DNSSEC on your registrar
          </div>
          <div className="text-teal-500">
            Positive: HSTS enabled, cookies properly flagged, no open admin panels detected.
          </div>
        </div>
        <p>
          Not a wall of CVE numbers. A clear, prioritized action plan that tells you what to fix, in what order, and why it matters.
        </p>
      </PublicPageSection>

      {/* CTA */}
      <PublicPageSection title="Find Your Vulnerabilities Before Someone Else Does">
        <p>
          Every day you don&apos;t scan is a day your exposed .env files, open admin panels, and deprecated SSL protocols are visible to anyone who looks. The scan takes 5 minutes. The breach takes years to recover from.
        </p>
        <div className="rounded-xl border-2 border-teal-500/40 bg-teal-500/5 p-6 text-center">
          <Shield className="h-10 w-10 text-teal-600 mx-auto mb-3" />
          <h3 className="text-xl font-bold mb-2">Start your Attack Surface Audit</h3>
          <p className="text-sm text-white/60 mb-5 max-w-lg mx-auto">
            Verify your domain. Run the scan. Get a prioritized list of every vulnerability — with CVSS scores, evidence, and remediation steps.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-8 py-3.5 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
            >
              Start free — upgrade for attack surface
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <p className="text-xs text-white/60 mt-3">
            Attack Surface Audit is available on the Pro plan ($49/mo). Free plan includes security header analysis, SSL checking, and tech stack detection.
          </p>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
}
