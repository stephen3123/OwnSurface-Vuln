import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  Shield,
  Globe,
  Code2,
  Lock,
  Search,
  BarChart3,
  Eye,
  ExternalLink,
  AlertTriangle,
  Check,
  Briefcase,
} from "lucide-react";
import { PublicNav } from "@/components/layout/public-nav";
import { Footer } from "@/components/layout/footer";
import { siteConfig } from "@/lib/site";

/* ─── data fetching ─── */

const API_BASE =
  (process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") +
  "/api/v1";

interface ScanData {
  domain: string;
  url: string;
  url_hash: string;
  result: Record<string, unknown>;
  scanned_at: string;
}

async function getScanData(domain: string): Promise<ScanData | null> {
  try {
    const res = await fetch(`${API_BASE}/scan/site/${encodeURIComponent(domain)}`, {
      next: { revalidate: 3600 }, // revalidate hourly
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/* ─── safe extraction helpers ─── */

function get(obj: unknown, ...path: string[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur && typeof cur === "object" && k in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return cur;
}

function str(obj: unknown, ...path: string[]): string {
  const v = get(obj, ...path);
  if (typeof v === "string") return v;
  if (typeof v === "number") return String(v);
  return "";
}

function num(obj: unknown, ...path: string[]): number | null {
  const v = get(obj, ...path);
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isNaN(n) ? null : n;
  }
  return null;
}

function arr(obj: unknown, ...path: string[]): unknown[] {
  const v = get(obj, ...path);
  return Array.isArray(v) ? v : [];
}

function bool(obj: unknown, ...path: string[]): boolean {
  return get(obj, ...path) === true;
}

/* ─── metadata ─── */

export async function generateMetadata({
  params,
}: {
  params: Promise<{ domain: string }>;
}): Promise<Metadata> {
  const { domain } = await params;
  const d = decodeURIComponent(domain);
  const data = await getScanData(d);

  const techCount = data ? arr(data.result, "tech_stack").length : 0;
  const secGrade = data ? str(data.result, "security", "grade") : "";
  const description = data
    ? `${d} uses ${techCount} technologies. Security grade: ${secGrade || "?"}. Full 26-module website intelligence by OwnSurface.`
    : `Scan ${d} to reveal its tech stack, security posture, SEO health, and business intelligence. Free at OwnSurface.`;

  return {
    title: data
      ? `${d} — Tech Stack, Security & SEO`
      : `${d} — Website Intelligence`,
    description,
    openGraph: {
      title: `${d} — Website Intelligence Report`,
      description,
      type: "article",
      siteName: "OwnSurface",
      url: `${siteConfig.url}/site/${d}`,
    },
    twitter: { card: "summary_large_image", title: `${d} — OwnSurface`, description },
    alternates: { canonical: `${siteConfig.url}/site/${d}` },
    robots: data
      ? { index: true, follow: true }
      : { index: false, follow: false },
  };
}

/* ─── page ─── */

export default async function PublicScanPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const { domain } = await params;
  const d = decodeURIComponent(domain).toLowerCase().trim();
  const data = await getScanData(d);

  /* ─── no data state ─── */
  if (!data) {
    return (
      <Shell domain={d}>
        <div className="mx-auto max-w-2xl py-20 text-center">
          <Globe className="mx-auto h-12 w-12 text-muted-foreground/40 mb-5" />
          <h1 className="font-heading text-[2.2rem] font-semibold tracking-[-0.05em] text-[hsl(var(--ink))] sm:text-[3rem]">
            {d}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            No scan data available for this domain yet.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Run a free scan to generate a full 26-module intelligence report.
          </p>
          <Link
            href={`/dashboard/scan?url=${encodeURIComponent(`https://${d}`)}`}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-6 py-3.5 text-sm font-semibold text-white hover:bg-teal-700"
          >
            Scan {d} now <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </Shell>
    );
  }

  /* ─── extract scan data ─── */
  const r = data.result;

  const technologies = arr(r, "tech_stack") as {
    name: string;
    category?: string;
    version?: string;
    website?: string;
  }[];
  const secGrade = str(r, "security", "grade");
  const secScore = num(r, "security", "score");
  const secHeaders = arr(r, "security", "headers") as {
    name: string;
    present: boolean;
    value?: string;
  }[];
  const seoScore = num(r, "seo", "score");
  const seoTitle = str(r, "seo", "meta_title");
  const seoDesc = str(r, "seo", "meta_description");
  const hasSitemap = bool(r, "seo", "has_sitemap");
  const hasRobots = bool(r, "seo", "has_robots");
  const companyName = str(r, "company", "name");
  const companyDesc = str(r, "company", "description");
  const industry = str(r, "company", "industry");
  const logo = str(r, "company", "logo");
  const employees = str(r, "company", "employees_range");
  const location = str(r, "company", "location");
  const socialLinks = arr(r, "social_links") as { platform: string; url: string }[];
  const trafficTier = str(r, "traffic", "traffic_tier");
  const trancoRank = num(r, "traffic", "tranco_rank");
  const monthlyVisits = num(r, "traffic", "estimated_monthly_visits");
  const bizSignals = r.business_signals as Record<string, unknown> | undefined;
  const aiSummary = str(r, "ai_summary");
  const competitors = arr(r, "competitors") as {
    name: string;
    url?: string;
    similarity_score?: number;
  }[];

  const scannedAt = new Date(data.scanned_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Group techs by category
  const techCategories: Record<string, { name: string; version?: string }[]> = {};
  for (const t of technologies) {
    const cat = t.category || "Other";
    if (!techCategories[cat]) techCategories[cat] = [];
    techCategories[cat].push({ name: t.name, version: t.version });
  }
  const catEntries = Object.entries(techCategories).sort((a, b) => b[1].length - a[1].length);

  const gradeColor: Record<string, string> = {
    "A+": "text-emerald-600",
    A: "text-emerald-600",
    B: "text-lime-600",
    C: "text-amber-600",
    D: "text-orange-600",
    F: "text-red-600",
  };

  const presentHeaders = secHeaders.filter((h) => h.present).length;
  const totalHeaders = secHeaders.length;

  return (
    <Shell domain={d}>
      {/* ─── header ─── */}
      <header className="border-b border-black/8 pb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
              Website intelligence report
            </p>
            <h1 className="mt-3 font-heading text-[2.2rem] font-semibold tracking-[-0.06em] text-[hsl(var(--ink))] sm:text-[3.4rem]">
              {d}
            </h1>
            <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
              {companyName && companyName !== d && <span>{companyName}</span>}
              {industry && <span>{industry}</span>}
              {location && <span>{location}</span>}
              <span>Scanned {scannedAt}</span>
            </div>
          </div>
          <Link
            href={`/dashboard/scan?url=${encodeURIComponent(data.url)}`}
            className="hidden shrink-0 items-center gap-2 rounded-full bg-[hsl(var(--ink))] px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 sm:inline-flex"
          >
            Full scan <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* ─── AI summary ─── */}
      {aiSummary && (
        <section className="border-b border-black/8 py-6">
          <p className="text-[0.95rem] leading-7 text-foreground/80">{aiSummary}</p>
        </section>
      )}

      {/* ─── key metrics ─── */}
      <section className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-[1.25rem] border border-black/8 bg-black/[0.03] sm:grid-cols-4">
        <MetricCard
          label="Security"
          value={secGrade || "?"}
          sub={secScore !== null ? `${secScore}/100 · ${presentHeaders}/${totalHeaders} headers` : ""}
          color={gradeColor[secGrade] || "text-muted-foreground"}
        />
        <MetricCard
          label="Technologies"
          value={String(technologies.length)}
          sub={`${catEntries.length} categories`}
          color="text-[hsl(var(--ink))]"
        />
        <MetricCard
          label="SEO"
          value={seoScore !== null ? String(seoScore) : "?"}
          sub={seoScore !== null ? `out of 100` : ""}
          color="text-[hsl(var(--ink))]"
        />
        <MetricCard
          label="Traffic"
          value={trafficTier || "?"}
          sub={trancoRank ? `Tranco #${trancoRank.toLocaleString()}` : monthlyVisits ? `~${formatVisits(monthlyVisits)}/mo` : ""}
          color="text-[hsl(var(--ink))]"
        />
      </section>

      {/* ─── tech stack ─── */}
      {catEntries.length > 0 && (
        <section className="mt-12">
          <SectionHead icon={Code2} title="Technology Stack" count={technologies.length} />
          <div className="mt-6 space-y-5">
            {catEntries.map(([cat, techs]) => (
              <div key={cat}>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-teal-800 mb-2">
                  {cat}
                </p>
                <div className="flex flex-wrap gap-2">
                  {techs.map((t) => (
                    <span
                      key={t.name}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-card px-3 py-1.5 text-sm text-foreground"
                    >
                      {t.name}
                      {t.version && (
                        <span className="text-xs text-muted-foreground">{t.version}</span>
                      )}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── security headers ─── */}
      {secHeaders.length > 0 && (
        <section className="mt-12 border-t border-black/8 pt-10">
          <SectionHead icon={Shield} title="Security Headers" count={`${presentHeaders}/${totalHeaders}`} />
          <div className="mt-5 grid gap-2 sm:grid-cols-2">
            {secHeaders.map((h) => (
              <div
                key={h.name}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${
                  h.present
                    ? "bg-emerald-50/60 text-emerald-800"
                    : "bg-red-50/60 text-red-700"
                }`}
              >
                {h.present ? (
                  <Check className="h-3.5 w-3.5 shrink-0" />
                ) : (
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                )}
                <span className="font-mono text-xs">{h.name}</span>
                {h.present && h.value && (
                  <span className="ml-auto truncate max-w-[12rem] text-xs opacity-60">{h.value}</span>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── SEO overview ─── */}
      {(seoTitle || seoDesc) && (
        <section className="mt-12 border-t border-black/8 pt-10">
          <SectionHead icon={Search} title="SEO Overview" count={seoScore !== null ? `${seoScore}/100` : undefined} />
          <div className="mt-5 space-y-4">
            {seoTitle && (
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Title tag</p>
                <p className="text-sm text-foreground">{seoTitle}</p>
              </div>
            )}
            {seoDesc && (
              <div>
                <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground mb-1">Meta description</p>
                <p className="text-sm text-foreground leading-relaxed">{seoDesc}</p>
              </div>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {hasSitemap && <Tag>Sitemap found</Tag>}
              {hasRobots && <Tag>robots.txt found</Tag>}
              {bool(r, "seo", "has_structured_data") && <Tag>Structured data</Tag>}
              {str(r, "seo", "canonical_url") && <Tag>Canonical URL set</Tag>}
            </div>
          </div>
        </section>
      )}

      {/* ─── company + business signals ─── */}
      {(companyName || (bizSignals && Object.keys(bizSignals).length > 0)) && (
        <section className="mt-12 border-t border-black/8 pt-10">
          <SectionHead icon={Briefcase} title="Company & Business Signals" />
          <div className="mt-5 grid gap-6 sm:grid-cols-2">
            {companyName && (
              <div className="space-y-3">
                {companyDesc && <p className="text-sm text-muted-foreground leading-relaxed">{companyDesc}</p>}
                <div className="flex flex-wrap gap-3">
                  {employees && <Tag>{employees} employees</Tag>}
                  {location && <Tag>{location}</Tag>}
                  {industry && <Tag>{industry}</Tag>}
                </div>
              </div>
            )}
            {bizSignals && (
              <div className="flex flex-wrap gap-2">
                {bool(bizSignals, "has_pricing") && <Tag>Pricing page</Tag>}
                {bool(bizSignals, "has_careers") && <Tag>Careers page</Tag>}
                {bool(bizSignals, "is_hiring") && <Tag>Actively hiring</Tag>}
                {bool(bizSignals, "is_monetized") && <Tag>Monetized</Tag>}
                {arr(bizSignals, "ad_pixels").map((p) => (
                  <Tag key={String(p)}>{String(p)}</Tag>
                ))}
                {arr(bizSignals, "chat_widgets").map((w) => (
                  <Tag key={String(w)}>{String(w)}</Tag>
                ))}
                {arr(bizSignals, "payment_processors").map((p) => (
                  <Tag key={String(p)}>{String(p)}</Tag>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── social + traffic ─── */}
      {(socialLinks.length > 0 || trafficTier) && (
        <section className="mt-12 border-t border-black/8 pt-10">
          <div className="grid gap-8 sm:grid-cols-2">
            {socialLinks.length > 0 && (
              <div>
                <SectionHead icon={Globe} title="Social Presence" />
                <div className="mt-4 flex flex-wrap gap-2">
                  {socialLinks.map((s) => (
                    <span
                      key={s.platform}
                      className="inline-flex items-center gap-1.5 rounded-full border border-black/8 bg-card px-3 py-1.5 text-sm capitalize text-foreground"
                    >
                      {s.platform}
                      <ExternalLink className="h-3 w-3 text-muted-foreground" />
                    </span>
                  ))}
                </div>
              </div>
            )}
            {trafficTier && (
              <div>
                <SectionHead icon={BarChart3} title="Traffic Signals" />
                <div className="mt-4 space-y-2">
                  <div className="flex items-baseline gap-3">
                    <span className="text-2xl font-bold text-[hsl(var(--ink))]">{trafficTier}</span>
                    <span className="text-sm text-muted-foreground">estimated tier</span>
                  </div>
                  {trancoRank && (
                    <p className="text-sm text-muted-foreground">
                      Tranco rank: #{trancoRank.toLocaleString()}
                    </p>
                  )}
                  {monthlyVisits && (
                    <p className="text-sm text-muted-foreground">
                      ~{formatVisits(monthlyVisits)} estimated monthly visits
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* ─── competitors ─── */}
      {competitors.length > 0 && (
        <section className="mt-12 border-t border-black/8 pt-10">
          <SectionHead icon={Eye} title="Similar Sites" count={competitors.length} />
          <div className="mt-5 flex flex-wrap gap-2">
            {competitors.slice(0, 12).map((c) => {
              const host = c.url ? extractHostname(c.url) : c.name;
              return (
                <Link
                  key={c.name}
                  href={`/site/${host}`}
                  className="inline-flex items-center gap-2 rounded-full border border-black/8 bg-card px-3 py-1.5 text-sm text-foreground hover:border-teal-300 hover:bg-teal-50/30 transition-colors"
                >
                  {host}
                  <ArrowRight className="h-3 w-3 text-muted-foreground" />
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* ─── Pro upsell: locked modules ─── */}
      <section className="mt-14 rounded-[1.5rem] bg-[hsl(var(--ink))] p-8 sm:p-10 text-white">
        <div className="grid gap-8 lg:grid-cols-[1fr_0.65fr] lg:items-center">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-white/40">
              Unlock the full report
            </p>
            <h2 className="mt-3 text-[1.6rem] font-semibold tracking-[-0.04em] sm:text-[2rem]">
              26 modules of intelligence for {d}
            </h2>
            <p className="mt-4 text-sm leading-7 text-white/55">
              This public page shows a summary. Sign up to access vulnerability scanning, privacy audits, supply chain analysis, JS bundle inspection, API discovery, performance metrics, deep scanning (500 pages), and attack surface audits.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/dashboard/scan?url=${encodeURIComponent(data.url)}`}
                className="inline-flex items-center gap-2 rounded-full bg-card px-5 py-3 text-sm font-semibold text-[hsl(var(--ink))] hover:bg-teal-50"
              >
                Run full scan <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white hover:bg-card/50"
              >
                View Pro plan
              </Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2.5 text-xs">
            {[
              "CVE vulnerability matching",
              "Cookie & CORS audit",
              "DNS security (SPF/DMARC)",
              "Privacy / GDPR compliance",
              "Admin panel detection",
              "JS bundle analysis",
              "Supply chain review",
              "API endpoint discovery",
              "Wayback Machine history",
              "Performance & Web Vitals",
              "Accessibility audit",
              "Cost estimation",
            ].map((f) => (
              <div key={f} className="flex items-start gap-2 text-white/50">
                <Lock className="mt-0.5 h-3 w-3 shrink-0 text-teal-400/60" />
                {f}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── JSON-LD ─── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TechArticle",
            headline: `${d} — Website Intelligence Report`,
            description: `Technology stack, security posture, and SEO analysis for ${d}. ${technologies.length} technologies detected. Security grade: ${secGrade || "?"}`,
            datePublished: data.scanned_at,
            dateModified: data.scanned_at,
            author: { "@type": "Organization", name: "OwnSurface", url: siteConfig.url },
            publisher: { "@type": "Organization", name: "OwnSurface", url: siteConfig.url },
            mainEntityOfPage: { "@type": "WebPage", "@id": `${siteConfig.url}/site/${d}` },
            about: { "@type": "WebSite", name: companyName || d, url: data.url },
            keywords: technologies
              .slice(0, 15)
              .map((t) => t.name)
              .join(", "),
          }),
        }}
      />
    </Shell>
  );
}

/* ─── sub-components ─── */

function Shell({ domain, children }: { domain: string; children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[hsl(180_26%_99%)] text-foreground">
      <PublicNav />
      <main className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6 sm:py-14 lg:px-10">
        {children}
      </main>
      <Footer />
    </div>
  );
}

function SectionHead({
  icon: Icon,
  title,
  count,
}: {
  icon: React.ElementType;
  title: string;
  count?: string | number;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-5 w-5 text-teal-700" />
      <h2 className="text-lg font-semibold text-[hsl(var(--ink))]">{title}</h2>
      {count !== undefined && (
        <span className="ml-1 rounded-full bg-teal-50 px-2 py-0.5 text-xs font-semibold text-teal-700">
          {count}
        </span>
      )}
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub: string;
  color: string;
}) {
  return (
    <div className="bg-card/50 p-5">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className={`mt-2 text-2xl font-bold tracking-tight ${color}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-black/6 bg-card px-2.5 py-1 text-xs font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/* ─── helpers ─── */

function formatVisits(n: number): string {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function extractHostname(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
  } catch {
    return url;
  }
}
