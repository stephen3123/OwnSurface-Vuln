"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeft } from "lucide-react";
import { api, type AttackSurfaceAuditResponse, type DeepScanInfo } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { AuditTerminal } from "@/components/attack-surface/audit-terminal";
import { AuditSummary } from "@/components/attack-surface/audit-summary";
import { FindingCard, type AuditFinding } from "@/components/attack-surface/finding-card";
import { TechStackGrid } from "@/components/scan/tech-stack-grid";
import { SecurityScore } from "@/components/scan/security-score";
import { SeoAnalysis } from "@/components/scan/seo-analysis";
import { CompanyInfoCard } from "@/components/scan/company-info";
import { SocialLinks } from "@/components/scan/social-links";
import { TrafficChart } from "@/components/scan/traffic-chart";
import { BusinessSignals } from "@/components/scan/business-signals";
import { CompetitorList } from "@/components/scan/competitor-list";
import { CostCalculator } from "@/components/scan/cost-calculator";
import { VulnerabilityPanel } from "@/components/scan/vulnerability-panel";
import { PrivacyCompliance } from "@/components/scan/privacy-compliance";
import { WaybackTimeline } from "@/components/scan/wayback-timeline";
import { JSBundleAnalysis as JsBundleAnalysis } from "@/components/scan/js-bundle-analysis";
import { APIEndpoints as ApiEndpoints } from "@/components/scan/api-endpoints";
import { SupplyChainMap } from "@/components/scan/supply-chain-map";
import { CarbonScoreCard } from "@/components/scan/carbon-score";
import { SecurityFixes } from "@/components/scan/security-fixes";
import { EmailPatternsCard } from "@/components/scan/email-patterns";
import { ComplianceChecklist } from "@/components/scan/compliance-checklist";
// ─── Types ───

type ScanMode = "probe" | "deep" | "full";
type TabId = "overview" | "intelligence" | "security" | "findings" | "recon" | "pages" | "sustainability" | "logs";

interface DeepScanPage {
 url: string;
 status: string;
 scan_result?: {
 tech_stack?: Array<{ name: string; category: string; version?: string; confidence: number; icon?: string }>;
 security?: { score: number; grade: string; headers: Array<{ name: string; present: boolean; value?: string }>; issues: string[] };
 company?: { name: string; description?: string; industry?: string; logo_url?: string; founded?: string; employee_range?: string; location?: string } | null;
 social_links?: Array<{ platform: string; url: string; followers?: number }>;
 seo?: { score: number; title?: string; description?: string; has_sitemap: boolean; has_robots_txt: boolean; has_structured_data: boolean; has_canonical: boolean; h1_count: number; meta_issues: string[] };
 business_signals?: Array<{ type: string; label: string; detail: string; confidence: number }> | Record<string, unknown>;
 traffic?: { tranco_rank: number | null; traffic_tier: string; estimated_monthly_visits?: string } | null;
 competitors?: Array<{ url: string; name: string; similarity_score: number; shared_tech: string[] }>;
 cost_estimate?: { total_min: number; total_max: number; breakdown: Array<{ category: string; min: number; max: number; detail: string }> } | null;
 ai_summary?: string;
 vulnerability?: {
 sensitive_files?: { exposed_files: Array<{ path: string; status: number; size: number; risk_level: string }>; total_checked: number; issues: string[] };
 cve_matches?: { cves: Array<{ id: string; severity: string; score: number; description: string; technology: string; affected_versions: string; published: string }>; total_found: number };
 cookie_audit?: { cookies: Array<{ name: string; domain: string; httpOnly: boolean; secure: boolean; sameSite: string; issues: string[] }>; score: number; issues: string[] };
 cors_check?: { misconfigured: boolean; allows_any_origin: boolean; issues: string[] };
 dns_security?: { spf?: any; dmarc?: any; dkim?: any; dnssec?: any; score: number; issues: string[] };
 admin_panels?: { admin_panels: Array<{ path: string; status: number; accessible: boolean }>; s3_buckets?: Array<{ url: string; pattern: string }>; issues: string[] };
 };
 privacy?: { has_cookie_banner: boolean; banner_provider?: string | null; tracking_before_consent: boolean; tracking_scripts: string[]; has_privacy_policy: boolean; has_terms: boolean; compliance_score: number; issues: string[] };
 wayback?: { available: boolean; first_seen?: string | null; last_seen?: string | null; total_captures?: number; snapshots: Array<{ year: string | number; count: number }>; oldest_url?: string | null };
 js_bundles?: { total_scripts: number; total_size_bytes: number; scripts: Array<{ url: string; size_bytes: number; has_source_map: boolean }>; exposed_source_maps: string[]; largest_bundle?: { url: string; size_bytes: number } | null; issues: string[] };
 api_endpoints?: { endpoints: Array<{ path: string; type: string; status?: number; accessible: boolean }>; patterns_found: string[]; has_swagger: boolean; has_graphql: boolean; has_openapi: boolean; issues: string[] };
 supply_chain?: { external_domains: Array<{ domain: string; type: string; count: number; domain_age_days?: number | null; risk_level: string; is_cdn: boolean }>; total_external: number; high_risk_count: number; score: number; issues: string[] };
 carbon?: { co2_grams_per_visit: number; energy_kwh_per_visit?: number; sustainability_grade: string; is_green_hosted: boolean; hosting_provider: string | null; page_weight_bytes: number; cleaner_than_percent: number; annual_co2_kg: number; estimated_monthly_visits?: number; recommendations: string[]; };
 security_findings?: Array<{ id: string; severity: string; title: string; description: string; impact: string; fix: { summary?: string; nginx?: string | null; apache?: string | null; cloudflare?: string | null; meta_tag?: string | null; vercel_json?: string | null; netlify_toml?: string | null } & Record<string, string | null>; effort: string; priority: number; }>;
 email_patterns?: { found_emails: string[]; pattern: string | null; confidence: number; team_page_url?: string | null; contact_page_url?: string | null };
 technologies?: Array<{ name: string; category: string; version?: string; confidence?: number }>;
 performance?: { score?: number; lcp?: number };
 };
 error?: string;
}

// ─── Helpers ───

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
 pending: { color: "text-slate-400 border-slate-500/20 bg-slate-500/10", label: "Pending" },
 running: { color: "text-teal-400 border-teal-500/20 bg-teal-500/10", label: "Running" },
 scanning: { color: "text-teal-400 border-teal-500/20 bg-teal-500/10", label: "Scanning" },
 complete: { color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/10", label: "Complete" },
 failed: { color: "text-red-400 border-red-500/20 bg-red-500/10", label: "Failed" },
};

function formatDuration(start: string, end?: string | null): string {
 const s = new Date(start).getTime();
 const e = end ? new Date(end).getTime() : Date.now();
 if (isNaN(s)) return "—";
 const sec = Math.round((e - s) / 1000);
 if (sec < 60) return `${sec}s`;
 return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function getChecksRun(scope: Record<string, any>): string[] {
 const labels: Record<string, string> = {
 port_scan: "Port Scan", subdomain_enum: "Subdomain Enumeration",
 directory_bruteforce: "Directory Bruteforce", header_analysis: "Header Analysis",
 ssl_analysis: "SSL/TLS Analysis", dns_zone_transfer: "DNS Zone Transfer",
 email_security: "Email Security", waf_detection: "WAF Detection",
 vulnerability_testing: "Vulnerability Testing (Nuclei)",
 };
 return Object.entries(scope?.checks || {}).filter(([, v]) => v).map(([k]) => labels[k] || k);
}

function getGradeColor(grade: string): string {
 if (grade === "A+" || grade === "A") return "text-emerald-500";
 if (grade === "B") return "text-teal-500";
 if (grade === "C") return "text-amber-500";
 return "text-red-500";
}

function isActive(status: string): boolean {
 return status === "running" || status === "scanning" || status === "pending";
}

function sev(severity: string): number {
 const idx = ["critical", "high", "medium", "low", "info"].indexOf(severity.toLowerCase());
 return idx === -1 ? 999 : idx;
}

function getOverallStatus(probe: AttackSurfaceAuditResponse | null, deep: DeepScanInfo | null): string {
 const statuses = [probe?.status, deep?.status].filter(Boolean) as string[];
 if (statuses.length === 0) return "pending";
 if (statuses.some((s) => s === "running" || s === "scanning")) return "running";
 if (statuses.every((s) => s === "complete")) return "complete";
 if (statuses.some((s) => s === "failed") && statuses.some((s) => s === "complete")) return "complete";
 if (statuses.every((s) => s === "failed")) return "failed";
 return "pending";
}

function getPageTechs(page: DeepScanPage) {
 return page.scan_result?.tech_stack || page.scan_result?.technologies || [];
}

function normalizeBusinessSignals(raw: unknown): Array<{ type: string; label: string; detail: string; confidence: number }> {
 if (!raw) return [];
 if (Array.isArray(raw)) return raw;
 if (typeof raw !== "object") return [];
 const obj = raw as Record<string, any>;
 const signals: Array<{ type: string; label: string; detail: string; confidence: number }> = [];
 if (obj.has_pricing) signals.push({ type: "monetized", label: "Has Pricing Page", detail: "Website has a pricing page", confidence: 90 });
 if (obj.has_careers) signals.push({ type: "hiring", label: "Has Careers Page", detail: "Company is hiring", confidence: 90 });
 return signals;
}

function aggregateDeepScanData(pages: DeepScanPage[]) {
 const success = pages.filter((p) => p.status === "success");
 const homepage = success[0]?.scan_result || null;

 const techMap = new Map<string, any>();
 for (const p of success) {
 for (const t of getPageTechs(p)) {
 if (!techMap.has(t.name)) techMap.set(t.name, { ...t, confidence: t.confidence || 100 });
 }
 }
 const technologies = Array.from(techMap.values());

 const avgSecScore = success.length > 0
 ? Math.round(success.reduce((s, p) => s + (p.scan_result?.security?.score || 0), 0) / success.length)
 : 0;

 const securityIssues: string[] = [];
 for (const p of success) {
 for (const iss of (p.scan_result?.security?.issues || [])) {
 if (!securityIssues.includes(iss)) securityIssues.push(iss);
 }
 }

 return {
 technologies,
 security: homepage?.security ? { ...homepage.security, score: avgSecScore, issues: securityIssues } : { score: avgSecScore, grade: "—", headers: [], issues: securityIssues },
 company: homepage?.company || null,
 socialLinks: homepage?.social_links || [],
 seo: homepage?.seo || null,
 businessSignals: normalizeBusinessSignals(homepage?.business_signals),
 traffic: homepage?.traffic || null,
 competitors: homepage?.competitors || [],
 costEstimate: homepage?.cost_estimate || null,
 vulnerability: homepage?.vulnerability || {},
 privacy: homepage?.privacy || null,
 wayback: homepage?.wayback || null,
 jsBundles: homepage?.js_bundles || null,
 apiEndpoints: homepage?.api_endpoints || null,
 supplyChain: homepage?.supply_chain || null,
 carbon: homepage?.carbon || null,
 securityFindings: homepage?.security_findings || [],
 emailPatterns: homepage?.email_patterns || null,
 aiSummary: homepage?.ai_summary || null,
 avgSecScore,
 securityIssues,
 successPageCount: success.length,
 };
}

// ─── Main Page ───

function UnifiedResultContent() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const searchParams = useSearchParams();

 const modeRaw = searchParams.get("mode") || "";
 const modeParam: ScanMode | null = (modeRaw === "deep" || modeRaw === "probe" || modeRaw === "full") ? (modeRaw as ScanMode) : null;
 const deepIdParam = searchParams.get("deepId");
 const probeIdParam = searchParams.get("probeId");

 const isDeepOnly = modeParam === "deep";
 const isProbeOnly = modeParam === "probe";
 const resolvedProbeId = isDeepOnly ? null : (probeIdParam || id);
 const resolvedDeepId = isProbeOnly ? null : (deepIdParam || id);

 const [probe, setProbe] = useState<AttackSurfaceAuditResponse | null>(null);
 const [deep, setDeep] = useState<DeepScanInfo | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);
 const [activeTab, setActiveTab] = useState<TabId>("overview");
 const [expandedPage, setExpandedPage] = useState<string | null>(null);

 const loadData = useCallback(async () => {
 try {
 const promises: Promise<any>[] = [];
 if (resolvedProbeId) promises.push(api.getAttackSurfaceAudit(resolvedProbeId));
 else promises.push(Promise.resolve({ data: null }));
 
 if (resolvedDeepId) promises.push(api.request<any>(`/deep-scan/${resolvedDeepId}`));
 else promises.push(Promise.resolve({ data: null }));

 const [probeRes, deepRes] = await Promise.all(promises);
 setProbe(probeRes.data);
 const deepRaw = deepRes.data?.deep_scan || deepRes.data || null;
 setDeep(deepRaw?.id ? deepRaw : null);
 
 if (!probeRes.data && !deepRaw?.id) setError("Scan not found");
 } catch {
 setError("Failed to load scan data");
 } finally {
 setLoading(false);
 }
 }, [resolvedProbeId, resolvedDeepId]);

 useEffect(() => { loadData(); }, [loadData]);

 if (loading) {
 return (
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <div className="h-1.5 w-32 bg-muted border border-border rounded-full overflow-hidden">
 <div className="h-full bg-foreground animate-progress w-1/3" />
 </div>
 <p className="text-[0.6rem] font-semibold uppercase tracking-widest text-muted-foreground/40">Initializing Result View...</p>
 </div>
 );
 }

 if (error || (!probe && !deep)) {
 return (
 <div className="space-y-6">
 <BackButton router={router} />
 <div className="rounded-[1.7rem] border border-border bg-card p-12 text-center ">
 <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">{error || "Scan not found"}</p>
 </div>
 </div>
 );
 }

 const hasProbe = !!probe;
 const hasDeep = !!deep;
 const mode: ScanMode = hasProbe && hasDeep ? "full" : hasProbe ? "probe" : "deep";
 const domain = probe?.domain || deep?.domain || "";
 const overallStatus = getOverallStatus(probe, deep);
 const badge = STATUS_BADGE[overallStatus] || STATUS_BADGE.pending;

 const findings: AuditFinding[] = (probe?.findings || []).map((f) => ({
 id: f.id, severity: f.severity as AuditFinding["severity"], category: f.category,
 title: f.title, description: f.description, evidence: f.evidence,
 remediation: f.remediation, cvss_score: f.cvss_score, cwe_id: f.cwe_id,
 affected_asset: f.affected_asset,
 }));

 const deepPages: DeepScanPage[] = (deep?.results || []) as DeepScanPage[];
 const agg = aggregateDeepScanData(deepPages);

 const tabs: Array<{ id: TabId; label: string; show: boolean; count?: number }> = [
 { id: "overview", label: "Overview", show: true },
 { id: "intelligence", label: "Intelligence", show: hasDeep && agg.successPageCount > 0 },
 { id: "security", label: "Security", show: hasDeep && agg.successPageCount > 0, count: agg.securityIssues.length + agg.securityFindings.length },
 { id: "findings", label: "Findings", show: hasProbe, count: findings.length },
 { id: "recon", label: "Tech & Recon", show: hasDeep && agg.successPageCount > 0, count: agg.technologies.length },
 { id: "pages", label: "Pages", show: hasDeep && deep!.status === "complete", count: agg.successPageCount },
 { id: "sustainability", label: "Sustainability", show: !!agg.carbon },
 { id: "logs", label: "Logs", show: hasProbe },
 ];

 const startedAt = probe?.started_at || deep?.started_at || "";
 const completedAt = probe?.completed_at || deep?.completed_at || null;

 return (
 <div className="mx-auto max-w-7xl">
 <div className="mb-6">
 <BackButton router={router} />
 </div>

 <div className="shell-panel relative mb-10 overflow-hidden rounded-[2.5rem] p-10 border border-border bg-card ">
 <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center justify-between">
 <div className="flex-1">
 <div className="flex flex-wrap items-center gap-4 mb-4">
 <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl uppercase">{domain}</h1>
 <div className={cn("inline-flex items-center rounded-full px-4 py-1 text-[0.65rem] font-bold uppercase tracking-widest border", badge.color, badge.color.includes("border") ? "" : "border-border")}>
 {badge.label}
 </div>
 <ModeChip mode={mode} />
 </div>
 
 <div className="flex flex-wrap gap-6 text-[0.7rem] font-semibold text-muted-foreground uppercase tracking-widest">
 {startedAt && <span>Initialized {new Date(startedAt).toLocaleDateString()}</span>}
 {startedAt && <span>Duration: {formatDuration(startedAt, completedAt)}</span>}
 </div>

 {mode === "full" && (
 <div className="mt-6 flex flex-wrap gap-4">
 <SubStatus label="Security Probe" status={probe!.status} />
 <SubStatus label="Deep Scan" status={deep!.status} />
 </div>
 )}
 </div>
 </div>
 </div>

 <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
 {hasDeep && <HeroStat label="Pages Map" value={String(deep!.pages_scanned)} theme="blue" />}
 {hasDeep && <HeroStat label="Sec Score" value={`${agg.avgSecScore}/100`} theme="emerald" />}
 {hasProbe && <HeroStat label="Threats" value={String(findings.length)} theme="red" />}
 <HeroStat label="Status" value={badge.label} theme="indigo" />
 </div>

 <div className="space-y-8">
 <div className="sticky top-4 z-50 flex gap-1 overflow-x-auto rounded-2xl border border-border bg-card p-1.5 ">
 {tabs.filter((t) => t.show).map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "whitespace-nowrap rounded-xl px-5 py-3 text-[0.65rem] font-semibold uppercase tracking-widest transition-all",
 activeTab === tab.id ? "bg-zinc-900 text-white" : "text-muted-foreground/80 hover:text-zinc-900 hover:bg-muted"
 )}
 >
 {tab.label}
 {tab.count !== undefined && tab.count > 0 && <span className="ml-2 opacity-70 font-mono">{tab.count}</span>}
 </button>
 ))}
 </div>

 <div className="min-h-[400px]">
 {activeTab === "overview" && (
 <div className="space-y-6">
 {(probe?.ai_summary || agg.aiSummary) && (
 <div className="rounded-[2.5rem] border border-border bg-card p-8 ">
 <h2 className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-teal-600 mb-6 underline decoration-2 underline-offset-8">AI Analysis</h2>
 <div className="text-[0.95rem] leading-relaxed text-foreground font-medium whitespace-pre-wrap">
 {probe?.ai_summary || agg.aiSummary}
 </div>
 </div>
 )}
 {hasProbe && <AuditSummary findings={findings} domain={domain} duration={formatDuration(probe!.started_at, probe!.completed_at)} checksRun={getChecksRun(probe!.scope)} />}
 </div>
 )}

 {activeTab === "intelligence" && hasDeep && (
 <div className="space-y-6">
 <div className="grid gap-6 xl:grid-cols-2">
 {agg.company && <CompanyInfoCard company={agg.company as any} />}
 {agg.traffic && <TrafficChart traffic={agg.traffic as any} />}
 </div>
 {agg.socialLinks.length > 0 && <SocialLinks links={agg.socialLinks as any} />}
 {agg.businessSignals.length > 0 && <BusinessSignals signals={agg.businessSignals as any} />}
 </div>
 )}

 {activeTab === "security" && hasDeep && (
 <div className="space-y-6">
 {agg.security.score > 0 && <SecurityScore security={agg.security as any} />}
 {Object.keys(agg.vulnerability).length > 0 && <VulnerabilityPanel vulnerability={agg.vulnerability as any} />}
 {agg.securityFindings.length > 0 && <SecurityFixes findings={agg.securityFindings as any} />}
 </div>
 )}

 {activeTab === "findings" && hasProbe && (
 <div className="space-y-3">
 {findings.length === 0 ? <EmptySection message="No findings. Your site looks clean." /> : findings.sort((a,b) => sev(a.severity)-sev(b.severity)).map(f => <FindingCard key={f.id} finding={f} />)}
 </div>
 )}

 {activeTab === "recon" && hasDeep && (
 <div className="space-y-6">
 {agg.technologies.length > 0 && <TechStackGrid technologies={agg.technologies as any} />}
 {agg.privacy && <PrivacyCompliance privacy={agg.privacy as any} />}
 {agg.wayback && <WaybackTimeline wayback={agg.wayback as any} />}
 </div>
 )}

 {activeTab === "pages" && hasDeep && (
 <div className="space-y-2">
 {deepPages.map((page, i) => <PageRow key={i} page={page} />)}
 </div>
 )}

 {activeTab === "sustainability" && agg.carbon && <CarbonScoreCard carbon={agg.carbon as any} />}

 {activeTab === "logs" && hasProbe && (
 <AuditTerminal auditId={probe!.id} status={probe!.status} logs={probe!.logs?.map(l => ({ ...l, level: l.level as any })) || []} />
 )}
 </div>
 </div>

 {overallStatus === "failed" && !hasProbe && !hasDeep && (
 <div className="rounded-[1.7rem] border border-border bg-card p-8 text-center mt-8">
 <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">The scan encountered a critical error.</p>
 </div>
 )}
 </div>
 );
}

// ─── Sub-components ───

function BackButton({ router }: { router: ReturnType<typeof useRouter> }) {
 return (
 <button onClick={() => router.push("/dashboard/attack-surface")} className="mb-6 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground">
 <ArrowLeft className="h-4 w-4" />
 Back to Scans
 </button>
 );
}

function ModeChip({ mode }: { mode: ScanMode }) {
 const cfg = {
 probe: { label: "Probe", bg: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
 deep: { label: "Deep", bg: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
 full: { label: "Full", bg: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
 }[mode];
 return <span className={cn("rounded-md px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest border", cfg.bg)}>{cfg.label}</span>;
}

function SubStatus({ label, status }: { label: string; status: string }) {
 const isAct = isActive(status);
 const isDone = status === "complete" || status === "failed";
 return (
 <div className="flex items-center gap-3">
 <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">{label}</span>
 <span className={cn("px-3 py-1 text-[0.62rem] font-bold uppercase tracking-widest border rounded-md",
 isAct ? "bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse" :
 isDone ? (status === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20") :
 "bg-white/5 text-zinc-400 border-border/40"
 )}>
 {isAct && <span className="inline-block h-1.5 w-1.5 rounded-full bg-teal-500 mr-2 animate-ping" />}
 {status}
 </span>
 </div>
 );
}

function HeroStat({ label, value, theme }: { label: string; value: string; theme: string }) {
 const themes: Record<string, string> = {
 blue: "bg-blue-500/10 text-blue-400 border-blue-500/20",
 emerald: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
 red: "bg-red-500/10 text-red-400 border-red-500/20",
 indigo: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
 };
 return (
 <div className={cn("rounded-lg border p-6", themes[theme] || themes.blue)}>
 <p className="text-[0.65rem] font-semibold uppercase tracking-widest mb-1 opacity-70">{label}</p>
 <p className="text-2xl font-bold tracking-tight">{value}</p>
 </div>
 );
}

function StatCard({ label, value, detail }: { label: string; value: string; detail?: string }) {
 return (
 <div className="rounded-3xl border border-border bg-card p-6">
 <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40 mb-3">{label}</p>
 <div className="text-2xl font-black text-foreground tracking-tight">{value}</div>
 {detail && <p className="mt-1 text-[0.65rem] text-muted-foreground font-medium">{detail}</p>}
 </div>
 );
}

function MiniStat({ label, value }: { label: string; value: string }) {
 return (
 <div className="rounded-2xl border border-border bg-muted/20 px-4 py-3">
 <div className="text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground/60">{label}</div>
 <div className="mt-1 text-[0.85rem] font-black text-foreground font-mono">{value}</div>
 </div>
 );
}

function PageRow({ page }: { page: DeepScanPage }) {
 return (
 <div className="flex items-center gap-4 rounded-lg border border-border/40 bg-card/50 p-4">
 <div className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md bg-white/5 text-[0.6rem] font-black text-muted-foreground/40">URL</div>
 <div className="min-w-0 flex-1"><p className="truncate text-sm font-black text-foreground">{page.url}</p></div>
 <span className={cn("rounded-md px-3 py-1 text-[0.6rem] font-black uppercase tracking-widest border", page.status === "success" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-red-500/10 text-red-400 border-red-500/20")}>{page.status}</span>
 </div>
 );
}

function EmptySection({ message }: { message: string }) {
 return (
 <div className="rounded-[2rem] py-16 text-center border-dashed border-border bg-muted/5">
 <p className="text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground/40">{message}</p>
 </div>
 );
}

function handleExport(domain: string, mode: ScanMode, probe: any, deep: any, findings: any, pages: any) {
 const report = { domain, mode, exportedAt: new Date().toISOString(), probe, deepScan: deep, findings, pages };
 const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `security-report-${domain}.json`;
 a.click();
}

export default function UnifiedResultPage() {
 return (
 <Suspense fallback={<div className="py-20 text-center text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40">Loading Intelligence...</div>}>
 <UnifiedResultContent />
 </Suspense>
 );
}
