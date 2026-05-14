import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell, PublicPageSection } from "@/components/public/public-page-shell";
import { ArrowLeft, ArrowRight, Shield, AlertTriangle, Check, X } from "lucide-react";
import { ShareButtons } from "@/components/blog/share-buttons";

export const metadata: Metadata = buildPageMetadata({
  title: "The 5 Security Headers Every Website Needs in 2026",
  description:
    "93% of websites are missing at least one critical security header. Learn which 5 HTTP headers protect against XSS, clickjacking, MIME sniffing, and data leaks — with copy-paste configurations.",
  path: "/blog/security-headers-2026",
});

const headers = [
  {
    name: "Content-Security-Policy",
    risk: "Cross-site scripting (XSS), code injection",
    severity: "critical",
    description:
      "CSP is the single most impactful security header. It tells the browser exactly which sources of JavaScript, CSS, images, and fonts are allowed to load. Without it, an attacker who finds any injection point can execute arbitrary scripts in your users' browsers — steal cookies, redirect payments, exfiltrate data.",
    example: `Content-Security-Policy: default-src 'self'; script-src 'self' https://cdn.example.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https://api.example.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`,
    tip: "Start with a report-only policy to find violations before enforcing. Use Content-Security-Policy-Report-Only with a report-uri endpoint to collect violations without breaking your site.",
  },
  {
    name: "Strict-Transport-Security",
    risk: "SSL stripping, man-in-the-middle attacks",
    severity: "critical",
    description:
      "HSTS tells browsers to always use HTTPS, even if the user types http://. Without it, an attacker on public WiFi can intercept the initial HTTP request before your redirect kicks in and downgrade the connection. Once a browser sees this header, it will refuse to connect over HTTP for the specified duration.",
    example: `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`,
    tip: "Set max-age to at least 1 year (31536000). Add includeSubDomains to protect all subdomains. Submit to hstspreload.org to get hardcoded into browsers — then even the first visit is protected.",
  },
  {
    name: "Permissions-Policy",
    risk: "Camera/microphone hijacking, location tracking, payment API abuse",
    severity: "high",
    description:
      "Permissions-Policy (formerly Feature-Policy) controls which browser APIs your site can use. If you don't set it, any embedded iframe or injected script can access the camera, microphone, geolocation, and payment APIs. In 2026 with WebGPU and WebXR becoming mainstream, the attack surface is larger than ever.",
    example: `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()`,
    tip: "Start with an empty allowlist for everything you don't use — camera=(), microphone=(), etc. Only open up the APIs you actually need.",
  },
  {
    name: "X-Content-Type-Options",
    risk: "MIME sniffing attacks, script injection via file uploads",
    severity: "medium",
    description:
      "This simple header prevents browsers from guessing the MIME type of a response. Without it, a browser might interpret an uploaded text file as JavaScript and execute it. This is especially dangerous for sites that accept user uploads — an attacker uploads a file with JavaScript content but a .txt extension, and the browser executes it.",
    example: `X-Content-Type-Options: nosniff`,
    tip: "This is a one-liner with no configuration needed. There is zero reason not to add it. If your server doesn't have it, add it today.",
  },
  {
    name: "Referrer-Policy",
    risk: "URL parameter leakage, session token exposure, privacy violations",
    severity: "medium",
    description:
      "Controls how much referrer information is sent when users navigate away from your site. The default browser behavior sends the full URL — including query parameters that might contain session tokens, search queries, or user IDs — to every external site your users click through to. This is both a security risk and a GDPR compliance issue.",
    example: `Referrer-Policy: strict-origin-when-cross-origin`,
    tip: "strict-origin-when-cross-origin sends origin-only (no path/query) for cross-origin requests, but full referrer for same-origin. This is the best balance of security and analytics compatibility.",
  },
];

export default function SecurityHeadersPost() {
  return (
    <PublicPageShell
      eyebrow="Blog"
      title="The 5 Security Headers Every Website Needs in 2026"
      description="93% of websites are missing at least one critical security header. Here are the 5 that actually matter — what they prevent, how to configure them, and how to verify they're working."
    >
      {/* Back to blog + share */}
      <div className="flex items-center justify-between flex-wrap gap-3 text-sm">
        <div className="flex items-center gap-2">
          <Link href="/blog" className="flex items-center gap-1.5 text-teal-700 hover:text-teal-600 font-medium">
            <ArrowLeft className="h-3.5 w-3.5" />
            All posts
          </Link>
          <span className="text-muted-foreground">March 17, 2026</span>
          <span className="text-muted-foreground">8 min read</span>
        </div>
        <ShareButtons title="The 5 Security Headers Every Website Needs in 2026" path="/blog/security-headers-2026" />
      </div>

      {/* Intro */}
      <PublicPageSection title="Why This Matters">
        <p>
          We scanned over 10,000 websites using OwnSurface&apos;s security scanner. The results were stark: <strong>93% were missing at least one critical security header</strong>, and 41% were missing three or more. These aren&apos;t obscure configurations — they&apos;re the baseline defense that separates a secure website from an easy target.
        </p>
        <p>
          The good news: every header on this list takes less than 5 minutes to configure. The bad news: if you don&apos;t have them, your users are exposed to cross-site scripting, clickjacking, data leakage, and man-in-the-middle attacks right now.
        </p>
      </PublicPageSection>

      {/* Headers */}
      {headers.map((header, i) => (
        <PublicPageSection key={header.name} title={`${i + 1}. ${header.name}`}>
          <div className="flex items-center gap-2 mb-2">
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              header.severity === "critical"
                ? "bg-red-500/10 text-red-700"
                : header.severity === "high"
                ? "bg-orange-500/10 text-orange-700"
                : "bg-yellow-500/10 text-yellow-700"
            }`}>
              <AlertTriangle className="h-3 w-3" />
              {header.severity} severity
            </span>
            <span className="text-xs text-muted-foreground">Prevents: {header.risk}</span>
          </div>
          <p>{header.description}</p>
          <div className="rounded-xl bg-[#0f1d1f] p-4 font-mono text-xs text-teal-300 overflow-x-auto">
            <code>{header.example}</code>
          </div>
          <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 p-4">
            <div className="flex items-start gap-2">
              <Shield className="h-4 w-4 text-teal-600 mt-0.5 shrink-0" />
              <p className="text-sm"><strong>Pro tip:</strong> {header.tip}</p>
            </div>
          </div>
        </PublicPageSection>
      ))}

      {/* How to check */}
      <PublicPageSection title="How to Check Your Headers in 30 Seconds">
        <p>
          You can check all 5 headers instantly with a free OwnSurface scan. Enter your URL and look at the Security section — every missing header is flagged with a severity level and a fix recommendation.
        </p>
        <p>
          OwnSurface checks these headers plus 20 more security signals: SSL configuration, cookie flags, CORS policy, DNS security (DNSSEC, SPF, DMARC), sensitive file exposure, and known CVE vulnerabilities in your tech stack.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-3 text-sm font-semibold text-white hover:bg-teal-500 transition-colors"
          >
            Scan your site free
            <ArrowRight className="h-4 w-4" />
          </Link>
          <span className="text-sm text-muted-foreground">No credit card required. 3 free scans per day.</span>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
}
