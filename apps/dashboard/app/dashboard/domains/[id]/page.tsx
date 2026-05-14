"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { api } from "@/lib/api-client";
import { DeepScanTerminal } from "@/components/domains/deep-scan-terminal";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { HealthScoreHero } from "@/components/domains/health-score-hero";
import { SeoPulseChecklist } from "@/components/domains/seo-pulse-checklist";
import { IssueList } from "@/components/issues/issue-list";
import { IssueDetailDrawer } from "@/components/issues/issue-detail-drawer";
import { computeHealthScore } from "@/lib/health-score";
import { analyzeSeo } from "@/lib/seo-analyzer";
import { generateIssues, type Issue } from "@/lib/issue-generator";
import { evaluateAllRegulations, getPriorityFixes } from "@/lib/compliance/engine";
import { CompliancePriorityList } from "@/components/compliance/compliance-priority-list";
import { LegalDisclaimer } from "@/components/compliance/legal-disclaimer";
import type { ScanResult } from "@/lib/api-client";
import { formatDate, formatDateTime, formatRelative, getSecurityColor, getSecurityGrade } from "@/lib/utils";
import {
 AlertTriangle,
 ArrowLeft,
 ArrowRight,
 CheckCircle2,
 Clock,
 Code2,
 Download,
 ExternalLink,
 Globe,
 History,
 Layers3,
 Loader2,
 Radar,
 Scan,
 ScanSearch,
 ShieldCheck,
 FileDown,
 TrendingUp,
} from "lucide-react";

interface DeepScanResult {
 id: string;
 domain: string;
 status: "pending" | "scanning" | "complete" | "error";
 pages_found: number;
 pages_scanned: number;
 current_url: string | null;
 started_at: string;
 completed_at: string | null;
 overall_score: number;
 pages: ScannedPage[];
 vulnerabilities: Vulnerability[];
 technologies?: string[];
}

interface ScannedPage {
 url: string;
 status_code: number;
 security_score: number;
 issues_count: number;
 scanned_at: string;
}

interface Vulnerability {
 id: string;
 severity: "critical" | "high" | "medium" | "low" | "info";
 title: string;
 description: string;
 affected_pages: string[];
 category: string;
}

interface ScanHistoryEntry {
 id: string;
 domain: string;
 status: string;
 overall_score: number;
 pages_scanned: number;
 started_at: string;
 completed_at: string | null;
}

type ActiveTab = "overview" | "tech" | "security" | "seo" | "intel" | "issues" | "monitoring" | "history" | "compliance" | "exports";

interface TabDef {
 id: ActiveTab;
 label: string;
 group: "performance" | "security" | "intelligence";
}

const TAB_GROUPS: { key: string; label: string; color: string }[] = [
 { key: "performance", label: "Performance", color: "text-teal-700" },
 { key: "security", label: "Security", color: "text-red-600" },
 { key: "intelligence", label: "Intelligence", color: "text-blue-700" },
];

const tabs: TabDef[] = [
 { id: "overview", label: "Overview", group: "performance" },
 { id: "seo", label: "SEO", group: "performance" },
 { id: "monitoring", label: "Monitoring", group: "performance" },
 { id: "tech", label: "Tech Stack", group: "performance" },
 { id: "security", label: "Security", group: "security" },
 { id: "issues", label: "Issues", group: "security" },
 { id: "compliance", label: "Compliance", group: "security" },
 { id: "intel", label: "Intel", group: "intelligence" },
 { id: "history", label: "History", group: "intelligence" },
 { id: "exports", label: "Exports", group: "intelligence" },
];

const severityRank: Record<Vulnerability["severity"], number> = {
 critical: 0, high: 1, medium: 2, low: 3, info: 4,
};

function getSeverityClasses(severity: Vulnerability["severity"]) {
 switch (severity) {
 case "critical": return "bg-red-500/10 text-red-600 border-red-500/20";
 case "high": return "bg-orange-500/10 text-orange-600 border-orange-500/20";
 case "medium": return "bg-amber-500/10 text-amber-700 border-amber-500/20";
 case "low": return "bg-sky-500/10 text-sky-700 border-sky-500/20";
 default: return "bg-slate-500/10 text-slate-600 border-slate-500/20";
 }
}

function deriveIntelSignals(pages: ScannedPage[]) {
 const signals = [
 { key: "pricing", label: "Commercial surface", description: "Pricing or packaging pages discovered — monetization signal.", match: /pricing|plans|buy|checkout/i },
 { key: "docs", label: "Developer motion", description: "Documentation or knowledge surface detected — developer ecosystem.", match: /docs|developers|kb|help|guide/i },
 { key: "api", label: "API exposure", description: "Public API or integration surface likely present.", match: /api|developer|graphql|swagger/i },
 { key: "careers", label: "Hiring signal", description: "Careers or recruitment pages suggest active expansion.", match: /careers|jobs|hiring|join/i },
 { key: "status", label: "Reliability posture", description: "Status or trust surface appears publicly accessible.", match: /status|trust|security|uptime/i },
 { key: "blog", label: "Content signal", description: "Blog or content marketing surface — active thought leadership.", match: /blog|news|articles|posts/i },
 { key: "legal", label: "Compliance surface", description: "Privacy policy, terms of service, or legal pages detected.", match: /privacy|terms|legal|gdpr|cookie/i },
 { key: "auth", label: "Authentication surface", description: "Login, register, or SSO endpoints — user-facing product confirmed.", match: /login|register|signin|signup|auth|sso/i },
 ];
 return signals
 .map((signal) => ({ ...signal, pages: pages.filter((page) => signal.match.test(page.url)).slice(0, 3) }))
 .filter((signal) => signal.pages.length > 0);
}

// Fetch the scan result for a specific domain (not from recent scans list)
function useDomainScan(domain: string) {
 const [scanData, setScanData] = useState<ScanResult | null>(null);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function load() {
 try {
 // Try to get cached scan for this specific domain
 const res = await api.scan(`https://${domain}`);
 if (res.data && res.data.status === "complete") {
 setScanData(res.data);
 }
 } catch {
 // graceful fallback
 } finally {
 setLoading(false);
 }
 }
 load();
 }, [domain]);

 return { scanData, loading };
}

function DomainHealthScoreSection({ domain }: { domain: string }) {
 const { scanData, loading } = useDomainScan(domain);

 if (loading) return <CardSkeleton />;
 if (!scanData) return null;

 const healthScore = computeHealthScore(scanData);

 return <HealthScoreHero score={healthScore} />;
}

function DomainSeoTab({ domain }: { domain: string }) {
 const { scanData, loading } = useDomainScan(domain);

 if (loading) return <CardSkeleton />;
 if (!scanData) return <div className="dashboard-empty">Run a scan on this domain to see SEO analysis.</div>;

 const analysis = analyzeSeo(scanData);

 return (
 <div className="space-y-5">
 <SeoPulseChecklist analysis={analysis} />
 </div>
 );
}

function DomainIssuesTab({ domain }: { domain: string }) {
 const { scanData, loading } = useDomainScan(domain);
 const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

 if (loading) return <CardSkeleton />;

 const issues = scanData ? generateIssues(scanData, domain) : [];
 if (issues.length === 0) return <div className="dashboard-empty">No issues found for this domain.</div>;

 const openIssues = issues.filter((i) => i.status === "open");

 return (
 <>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Issues</div>
 <h3 className="mt-3 text-[2rem] font-bold">{openIssues.length} open issues</h3>
 <div className="mt-6">
 <IssueList issues={issues} onSelectIssue={setSelectedIssue} />
 </div>
 </div>
 <IssueDetailDrawer issue={selectedIssue} open={!!selectedIssue} onClose={() => setSelectedIssue(null)} />
 </>
 );
}

function DomainComplianceTab({ domain }: { domain: string }) {
 const { scanData, loading } = useDomainScan(domain);

 if (loading) return <CardSkeleton />;
 if (!scanData) return <div className="dashboard-empty">Run a scan on this domain to see compliance analysis.</div>;

 const results = evaluateAllRegulations(scanData);
 const fixes = getPriorityFixes(results);

 return (
 <div className="space-y-5">
 <LegalDisclaimer />
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Compliance overview</div>
 <h3 className="mt-3 text-[2rem] font-bold">Regulation status</h3>
 <div className="mt-6 grid gap-3 md:grid-cols-2 lg:grid-cols-3">
 {results.map((r) => (
 <div key={r.regulation.id} className="rounded-[1.25rem] border border-border bg-card/78 p-4">
 <div className="flex items-center justify-between">
 <span className="text-sm font-semibold">{r.regulation.name}</span>
 <span className={`platform-chip ${r.status === "compliant" ? "text-emerald-700" : r.status === "partial" ? "text-amber-700" : r.status === "non_compliant" ? "text-red-600" : "text-muted-foreground"}`}>
 {r.status === "compliant" ? "Compliant" : r.status === "partial" ? "Partial" : r.status === "non_compliant" ? "Non-compliant" : "Unknown"}
 </span>
 </div>
 <div className="mt-2 text-xs text-muted-foreground">{r.regulation.region} &middot; {r.passCount}/{r.checks.length} checks passing</div>
 <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
 <div className={`h-full rounded-full ${r.score >= 80 ? "bg-emerald-500" : r.score >= 50 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${r.score}%` }} />
 </div>
 </div>
 ))}
 </div>
 </div>
 {fixes.length > 0 && <CompliancePriorityList fixes={fixes} />}
 </div>
 );
}

function DomainExportsTab({ scan }: { scan: DeepScanResult }) {
 const [sharing, setSharing] = useState(false);
 const [shareUrl, setShareUrl] = useState<string | null>(null);

 function downloadJSON() {
 const blob = new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `${scan.domain}-deep-scan.json`;
 a.click();
 URL.revokeObjectURL(url);
 }

 function downloadPDF() {
 // Generate a printable HTML report and trigger browser print-to-PDF
 // Sanitize text content to prevent XSS in the generated HTML report
 const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

 const vulnRows = (scan.vulnerabilities || []).map((v) =>
 `<tr><td style="padding:8px;border-bottom:1px solid #eee"><span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600;background:${v.severity === 'critical' || v.severity === 'high' ? '#fee2e2' : v.severity === 'medium' ? '#fef3c7' : '#e0f2fe'};color:${v.severity === 'critical' || v.severity === 'high' ? '#991b1b' : v.severity === 'medium' ? '#92400e' : '#075985'}">${esc(v.severity.toUpperCase())}</span></td><td style="padding:8px;border-bottom:1px solid #eee"><strong>${esc(v.title)}</strong><br/><span style="color:#666;font-size:12px">${esc(v.description)}</span></td><td style="padding:8px;border-bottom:1px solid #eee;font-size:12px;color:#666">${esc(v.category)}</td></tr>`
 ).join("");

 const techList = (scan.technologies || []).map((t) => `<span style="display:inline-block;margin:2px 4px;padding:4px 12px;background:#f0fdfa;border:1px solid #99f6e4;border-radius:6px;font-size:12px">${esc(String(t))}</span>`).join("");

 const pageRows = (scan.pages || []).slice(0, 20).map((p) =>
 `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:12px">${esc(p.url)}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${p.status_code}</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;font-weight:600;color:${p.security_score >= 80 ? '#059669' : p.security_score >= 60 ? '#d97706' : '#dc2626'}">${p.security_score}/100</td><td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${p.issues_count}</td></tr>`
 ).join("");

 const html = `<!DOCTYPE html><html><head><title>${esc(scan.domain)} — Security Report</title><style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:900px;margin:0 auto;padding:40px 20px;color:#111}h1{font-size:28px}h2{font-size:20px;margin-top:32px;padding-bottom:8px;border-bottom:2px solid #0d9488}table{width:100%;border-collapse:collapse}th{text-align:left;padding:8px;background:#f8fafc;border-bottom:2px solid #e2e8f0;font-size:12px;text-transform:uppercase;letter-spacing:0.05em;color:#64748b}.grade{font-size:64px;font-weight:800}.meta{color:#666;font-size:14px}@media print{body{padding:20px}}</style></head><body>
 <div style="display:flex;justify-content:space-between;align-items:start">
 <div><h1>${esc(scan.domain)}</h1><p class="meta">Deep Scan Security Report — Generated ${new Date().toLocaleDateString()}</p><p class="meta">${scan.pages_scanned} pages scanned &middot; ${(scan.vulnerabilities || []).length} vulnerabilities &middot; ${(scan.technologies || []).length} technologies</p></div>
 <div style="text-align:center;padding:20px 30px;border:2px solid #0d9488;border-radius:16px"><div class="grade" style="color:${scan.overall_score >= 80 ? '#059669' : scan.overall_score >= 60 ? '#d97706' : '#dc2626'}">${getSecurityGrade(scan.overall_score)}</div><div style="font-size:14px;color:#666">${scan.overall_score}/100</div></div>
 </div>
 <h2>Technologies Detected</h2><div style="margin:12px 0">${techList || '<em>None detected</em>'}</div>
 <h2>Vulnerabilities (${(scan.vulnerabilities || []).length})</h2>
 ${(scan.vulnerabilities || []).length > 0 ? `<table><thead><tr><th>Severity</th><th>Issue</th><th>Category</th></tr></thead><tbody>${vulnRows}</tbody></table>` : '<p style="color:#666">No vulnerabilities found.</p>'}
 <h2>Scanned Pages</h2>
 ${(scan.pages || []).length > 0 ? `<table><thead><tr><th>URL</th><th style="text-align:center">Status</th><th style="text-align:center">Score</th><th style="text-align:center">Issues</th></tr></thead><tbody>${pageRows}</tbody></table>` : '<p style="color:#666">No pages scanned.</p>'}
 <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e2e8f0;text-align:center;color:#94a3b8;font-size:12px">Generated by OwnSurface</div>
 </body></html>`;

 const win = window.open("", "_blank");
 if (win) {
 win.document.write(html);
 win.document.close();
 setTimeout(() => win.print(), 500);
 }
 }

 async function generateShareLink() {
 setSharing(true);
 // Try to create a report via API
 const res = await api.request<any>("/reports", {
 method: "POST",
 body: JSON.stringify({
 url: `https://${scan.domain}`,
 scan_hash: scan.id,
 is_public: true,
 }),
 });
 if (res.data?.slug || res.data?.id) {
 const slug = res.data.slug || res.data.id;
 const url = `${window.location.origin}/report/${slug}`;
 setShareUrl(url);
 await navigator.clipboard.writeText(url).catch(() => {});
 const { toast } = await import("sonner");
 toast.success("Share link copied to clipboard");
 } else {
 // Fallback: copy current page URL
 const url = window.location.href.split("?")[0];
 setShareUrl(url);
 await navigator.clipboard.writeText(url).catch(() => {});
 const { toast } = await import("sonner");
 toast.success("Link copied to clipboard");
 }
 setSharing(false);
 }

 return (
 <section className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Export options</div>
 <h3 className="mt-3 text-[2rem] font-bold">Download and share</h3>
 <div className="mt-6 grid gap-4 md:grid-cols-3">
 <button
 onClick={downloadPDF}
 className="flex flex-col items-start rounded-[1.25rem] border border-border bg-card/78 p-5 text-left hover:border-teal-500/25 transition-colors"
 >
 <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-teal-500/10 text-teal-700">
 <Download className="h-4.5 w-4.5" />
 </div>
 <p className="mt-4 text-sm font-semibold">PDF Report</p>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">Print-ready security report with vulnerabilities, technologies, and page scores.</p>
 </button>
 <button
 onClick={downloadJSON}
 className="flex flex-col items-start rounded-[1.25rem] border border-border bg-card/78 p-5 text-left hover:border-teal-500/25 transition-colors"
 >
 <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-teal-500/10 text-teal-700">
 <Code2 className="h-4.5 w-4.5" />
 </div>
 <p className="mt-4 text-sm font-semibold">JSON Data</p>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">Machine-readable scan results for integration with your security pipeline.</p>
 </button>
 <button
 onClick={generateShareLink}
 disabled={sharing}
 className="flex flex-col items-start rounded-[1.25rem] border border-border bg-card/78 p-5 text-left hover:border-teal-500/25 transition-colors disabled:opacity-50"
 >
 <div className="flex h-11 w-11 items-center justify-center rounded-[1rem] bg-teal-500/10 text-teal-700">
 <ExternalLink className="h-4.5 w-4.5" />
 </div>
 <p className="mt-4 text-sm font-semibold">{shareUrl ? "Link Copied" : "Share Link"}</p>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">
 {shareUrl ? shareUrl : "Generate a public link to share this scan report with your team."}
 </p>
 </button>
 </div>
 </section>
 );
}

function DomainMonitoringTab({ domain, grade, score, pagesFound, totalIssues, techCount }: { domain: string; grade: string; score: number; pagesFound: number; totalIssues: number; techCount: number }) {
 const [uptimeData, setUptimeData] = useState<any>(null);
 const [sslData, setSslData] = useState<any>(null);
 const [speedData, setSpeedData] = useState<any>(null);
 const [loaded, setLoaded] = useState(false);

 useEffect(() => {
 async function fetchMonitors() {
 const [uptimeRes, sslRes, speedRes] = await Promise.all([
 api.request<any>("/monitors/uptime").catch(() => ({ data: null })),
 api.request<any>("/monitors/ssl").catch(() => ({ data: null })),
 api.request<any>("/monitors/speed").catch(() => ({ data: null })),
 ]);

 const uptimeArr = Array.isArray(uptimeRes.data) ? uptimeRes.data : uptimeRes.data?.monitors || uptimeRes.data?.uptime_monitors || [];
 const sslArr = Array.isArray(sslRes.data) ? sslRes.data : sslRes.data?.monitors || sslRes.data?.ssl_monitors || [];
 const speedArr = Array.isArray(speedRes.data) ? speedRes.data : speedRes.data?.monitors || speedRes.data?.speed_monitors || speedRes.data?.measurements || [];

 setUptimeData(uptimeArr.find((m: any) => m.domain === domain || m.url?.includes(domain)) || null);
 setSslData(sslArr.find((m: any) => m.domain === domain) || null);
 setSpeedData(speedArr.find((m: any) => m.domain === domain || m.url?.includes(domain)) || null);
 setLoaded(true);
 }
 fetchMonitors();
 }, [domain]);

 if (!loaded) return <div className="grid gap-5 xl:grid-cols-2"><CardSkeleton /><CardSkeleton /></div>;

 return (
 <section className="grid gap-5 xl:grid-cols-2">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Live status</div>
 <h3 className="mt-3 text-[2rem] font-bold">Monitor status</h3>
 <div className="mt-6 space-y-4">
 {/* Uptime */}
 <div className="rounded-[1.25rem] border border-border bg-card/78 p-5">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-emerald-500/10 text-emerald-700">
 <Radar className="h-4 w-4" />
 </div>
 <span className="text-sm font-semibold">Uptime</span>
 </div>
 {uptimeData ? (
 <span className={`platform-chip ${uptimeData.status === "up" ? "text-emerald-700" : uptimeData.status === "down" ? "text-red-600" : "text-muted-foreground"}`}>
 {uptimeData.status === "up" ? "Online" : uptimeData.status === "down" ? "Down" : "Unknown"}
 </span>
 ) : (
 <span className="platform-chip text-muted-foreground">Not set up</span>
 )}
 </div>
 {uptimeData ? (
 <div className="grid grid-cols-3 gap-3">
 <div><div className="text-xs text-muted-foreground">30d uptime</div><div className="text-lg font-bold">{(uptimeData.uptime_30d ?? 0).toFixed(1)}%</div></div>
 <div><div className="text-xs text-muted-foreground">Response</div><div className="text-lg font-bold">{uptimeData.response_time_ms ?? "—"}ms</div></div>
 <div><div className="text-xs text-muted-foreground">Last check</div><div className="text-sm font-medium">{uptimeData.last_check ? formatRelative(uptimeData.last_check) : "—"}</div></div>
 </div>
 ) : (
 <Link href="/dashboard/monitoring/uptime" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-600">
 Set up uptime monitoring <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 )}
 </div>

 {/* SSL */}
 <div className="rounded-[1.25rem] border border-border bg-card/78 p-5">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-blue-500/10 text-blue-700">
 <ShieldCheck className="h-4 w-4" />
 </div>
 <span className="text-sm font-semibold">SSL Certificate</span>
 </div>
 {sslData ? (
 <span className={`platform-chip ${sslData.days_remaining > 30 ? "text-emerald-700" : sslData.days_remaining > 7 ? "text-amber-700" : "text-red-600"}`}>
 {sslData.days_remaining > 0 ? `${sslData.days_remaining}d remaining` : "Expired"}
 </span>
 ) : (
 <span className="platform-chip text-muted-foreground">Not set up</span>
 )}
 </div>
 {sslData ? (
 <div className="grid grid-cols-3 gap-3">
 <div><div className="text-xs text-muted-foreground">Issuer</div><div className="text-sm font-medium truncate">{sslData.issuer || "—"}</div></div>
 <div><div className="text-xs text-muted-foreground">Chain</div><div className="text-sm font-medium">{sslData.chain_valid ? "Valid" : "Invalid"}</div></div>
 <div><div className="text-xs text-muted-foreground">Expires</div><div className="text-sm font-medium">{formatDate(sslData.valid_to)}</div></div>
 </div>
 ) : (
 <Link href="/dashboard/monitoring/ssl" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-600">
 Set up SSL monitoring <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 )}
 </div>

 {/* Speed */}
 <div className="rounded-[1.25rem] border border-border bg-card/78 p-5">
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-teal-500/10 text-teal-700">
 <TrendingUp className="h-4 w-4" />
 </div>
 <span className="text-sm font-semibold">Speed / Core Web Vitals</span>
 </div>
 {speedData ? (
 <span className="platform-chip text-emerald-700">Active</span>
 ) : (
 <span className="platform-chip text-muted-foreground">Not set up</span>
 )}
 </div>
 {speedData && speedData.current_lcp != null ? (
 <div className="grid grid-cols-3 gap-3">
 <div><div className="text-xs text-muted-foreground">LCP</div><div className="text-lg font-bold">{Math.round(speedData.current_lcp)}ms</div></div>
 <div><div className="text-xs text-muted-foreground">CLS</div><div className="text-lg font-bold">{speedData.current_cls?.toFixed(3) ?? "—"}</div></div>
 <div><div className="text-xs text-muted-foreground">TTFB</div><div className="text-lg font-bold">{speedData.current_ttfb != null ? `${Math.round(speedData.current_ttfb)}ms` : "—"}</div></div>
 </div>
 ) : speedData ? (
 <p className="text-sm text-muted-foreground">No measurements yet. Run a measurement from the speed tracking page.</p>
 ) : (
 <Link href="/dashboard/monitoring/speed" className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 hover:text-teal-600">
 Set up speed tracking <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 )}
 </div>
 </div>
 </div>

 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Domain info</div>
 <h3 className="mt-3 text-[2rem] font-bold">Verified domain</h3>
 <div className="mt-6 space-y-3">
 {[
 { label: "Domain", value: domain },
 { label: "Status", value: "Verified" },
 { label: "Security grade", value: `${grade} (${score}/100)` },
 { label: "Pages discovered", value: `${pagesFound}` },
 { label: "Vulnerabilities", value: `${totalIssues}` },
 { label: "Technologies", value: `${techCount} detected` },
 ].map((item) => (
 <div key={item.label} className="flex items-center justify-between rounded-[1rem] border border-border bg-card/78 px-4 py-3">
 <span className="text-sm text-muted-foreground">{item.label}</span>
 <span className="text-sm font-medium">{item.value}</span>
 </div>
 ))}
 </div>

 <div className="mt-6">
 <Link
 href="/dashboard/monitoring"
 className="inline-flex items-center gap-2 rounded-[1rem] bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90 transition-colors"
 >
 Open monitoring dashboard
 <ArrowRight className="h-4 w-4" />
 </Link>
 </div>
 </div>
 </section>
 );
}

function DomainProfileContent() {
 const params = useParams<{ id: string }>();
 const searchParams = useSearchParams();
 const router = useRouter();
 const domainId = params.id;
 const scanIdParam = searchParams.get("scan");
 const domainParam = searchParams.get("domain");

 const [scan, setScan] = useState<DeepScanResult | null>(null);
 const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<ActiveTab>("overview");
 const [showTerminal, setShowTerminal] = useState(!!scanIdParam);
 const [activeScanId, setActiveScanId] = useState(scanIdParam || "");
 const [activeDomain, setActiveDomain] = useState(domainParam || "");

 // Prevents re-triggering terminal after simulation completes
 const terminalDoneRef = useRef(false);
 // Track whether we already have good simulated results — don't overwrite with empty API data
 const hasSimulatedResultsRef = useRef(false);

 // Only allow terminal when user explicitly initiated a scan via URL params
 const wasExplicitScan = !!scanIdParam;

 const loadScan = useCallback(async (skipTerminalCheck = false) => {
 // If we already have simulated results from terminal, don't overwrite with incomplete API data
 const protectSimulatedData = hasSimulatedResultsRef.current;

 // Try direct deep-scan lookup
 const res = await api.request<any>(`/deep-scan/${domainId}`);
 const data = res.data?.deep_scan || res.data;
 if (data?.id) {
 // Only update scan state if API data is richer than what we have (has pages/vulns)
 // or if we don't have simulated results to protect
 const apiHasContent = (data.pages?.length > 0 || data.vulnerabilities?.length > 0) && data.status === "complete";
 if (!protectSimulatedData || apiHasContent) {
 setScan({
 ...data,
 pages: data.pages || [],
 vulnerabilities: data.vulnerabilities || [],
 technologies: data.technologies || [],
 overall_score: data.overall_score || 0,
 pages_found: data.pages_found || 0,
 pages_scanned: data.pages_scanned || 0,
 });
 }
 setLoading(false);
 return;
 }
 // Fallback: list all deep scans
 const listRes = await api.request<{ deep_scans: any[] }>("/deep-scan");
 const allScans = listRes.data?.deep_scans || (Array.isArray(listRes.data) ? listRes.data : []);
 if (allScans.length) {
 const latest = allScans[0];
 if (!protectSimulatedData) {
 setScan({
 ...latest,
 pages: latest.pages || [],
 vulnerabilities: latest.vulnerabilities || [],
 technologies: latest.technologies || [],
 overall_score: latest.overall_score || 0,
 pages_found: latest.pages_found || 0,
 pages_scanned: latest.pages_scanned || 0,
 });
 }
 // Build scan history from list
 setScanHistory(
 allScans.map((s: any) => ({
 id: s.id || "",
 domain: s.domain || "",
 status: s.status || "unknown",
 overall_score: s.overall_score || 0,
 pages_scanned: s.pages_scanned || 0,
 started_at: s.started_at || s.created_at || "",
 completed_at: s.completed_at || null,
 }))
 );
 }
 setLoading(false);
 }, [domainId, domainParam]);

 useEffect(() => { loadScan(); }, [loadScan]);

 // Poll while terminal is showing, and auto-hide on completion
 useEffect(() => {
 if (!showTerminal || !activeScanId) return;
 const interval = setInterval(async () => {
 await loadScan();
 }, 3000);
 return () => clearInterval(interval);
 }, [showTerminal, activeScanId, loadScan]);

 // Auto-hide terminal when scan completes or fails
 useEffect(() => {
 if (!showTerminal || !scan) return;
 if (scan.status === "complete" || scan.status === "error") {
 const timer = setTimeout(() => {
 terminalDoneRef.current = true;
 setShowTerminal(false);
 router.replace(`/dashboard/domains/${domainId}`, { scroll: false });
 }, 2000);
 return () => clearTimeout(timer);
 }
 }, [showTerminal, scan?.status, scan, domainId, router]);

 const severityCounts = useMemo(() => {
 const counts: Record<Vulnerability["severity"], number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
 for (const issue of scan?.vulnerabilities ?? []) counts[issue.severity] += 1;
 return counts;
 }, [scan]);

 const riskyPages = useMemo(
 () => [...(scan?.pages ?? [])].sort((a, b) => b.issues_count !== a.issues_count ? b.issues_count - a.issues_count : a.security_score - b.security_score).slice(0, 8),
 [scan]
 );

 const sortedVulnerabilities = useMemo(
 () => [...(scan?.vulnerabilities ?? [])].sort((a, b) => severityRank[a.severity] - severityRank[b.severity]),
 [scan]
 );

 const intelSignals = useMemo(() => deriveIntelSignals(scan?.pages ?? []), [scan]);

 const timeline = useMemo(() => {
 const events = [
 scan?.started_at ? { label: "Deep scan started", time: scan.started_at, note: `Crawler opened ${scan.domain}` } : null,
 scan?.completed_at ? { label: "Deep scan completed", time: scan.completed_at, note: `${scan.pages_scanned} pages analyzed` } : null,
 ...(scan?.pages ?? []).slice(0, 6).map((page) => ({ label: "Page captured", time: page.scanned_at, note: page.url })),
 ].filter(Boolean) as Array<{ label: string; time: string; note: string }>;
 return events.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
 }, [scan]);

 if (loading) {
 return <div className="dashboard-page"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
 }

 // Show terminal for active/new scans
 if (showTerminal && activeDomain) {
 return (
 <div className="dashboard-page">
 <Link href="/dashboard/domains" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
 <ArrowLeft className="h-4 w-4" /> Back to domains
 </Link>

 <div className="space-y-3 pb-1">
 <div className="flex flex-wrap items-center gap-3">
 <div className="teal-pill">Deep scan in progress</div>
 <span className="inline-flex items-center gap-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-teal-700">
 <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
 Live scan
 </span>
 </div>
 <h2 className="text-[2.15rem] font-bold tracking-[-0.05em] text-[hsl(var(--ink))] sm:text-[2.65rem]">{activeDomain}</h2>
 <p className="max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">
 OwnSurface is actively probing your domain, checking security headers, fingerprinting technology,
 mapping exposed surface, and compiling a cleaner security profile.
 </p>
 </div>

 <DeepScanTerminal
 scanId={activeScanId}
 domain={activeDomain}
 scan={scan ? {
 id: scan.id,
 domain: scan.domain,
 status: scan.status === "error" ? "failed" : scan.status,
 pages_found: scan.pages_found,
 pages_scanned: scan.pages_scanned,
 max_pages: scan.pages_found || 50,
 results: scan.pages?.map((p) => ({ url: p.url, status: p.status_code >= 200 && p.status_code < 400 ? "success" : "error" })) || [],
 started_at: scan.started_at || null,
 completed_at: scan.completed_at || null,
 created_at: scan.started_at || new Date().toISOString(),
 } : null}
 />
 </div>
 );
 }

 // No scan data yet — prompt to run deep scan
 if (!scan || (!scan.pages?.length && !scan.vulnerabilities?.length && scan.status !== "scanning" && scan.status !== "complete")) {
 return (
 <div className="dashboard-page">
 <Link href="/dashboard/domains" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
 <ArrowLeft className="h-4 w-4" /> Back to domains
 </Link>
 <div className="rounded-xl border border-border bg-card px-6 py-16 text-center">
 <Scan className="mx-auto h-12 w-12 text-muted-foreground" />
 <h3 className="mt-4 text-2xl font-bold">Ready for deep scan</h3>
 <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
 Run a deep scan from the domains page to probe this domain for vulnerabilities,
 map the attack surface, and generate a full security profile.
 </p>
 <Link
 href="/dashboard/domains"
 className="mt-6 inline-flex items-center gap-2 rounded-[1rem] bg-foreground px-5 py-3 text-sm font-semibold text-background hover:bg-foreground/90"
 >
 <ArrowLeft className="h-4 w-4" /> Back to domains
 </Link>
 </div>
 </div>
 );
 }

 // Full profile view (scan complete)
 const grade = getSecurityGrade(scan.overall_score);
 const gradeColor = getSecurityColor(scan.overall_score);
 const totalIssues = scan.vulnerabilities?.length || 0;
 const technologies = scan.technologies || [];

 return (
 <div className="dashboard-page">
 <Link href="/dashboard/domains" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground">
 <ArrowLeft className="h-4 w-4" /> Back to domains
 </Link>

 {/* Hero section */}
 <section className="grid gap-5 xl:grid-cols-[1.16fr_0.84fr]">
 <div className="rounded-xl border border-border bg-card p-7 sm:p-8">
 <div className="flex flex-wrap items-start justify-between gap-4">
 <div className="max-w-3xl">
 <div className="teal-pill">Deep scan complete</div>
 <h2 className="mt-5 text-balance text-[3rem] font-bold leading-[0.95] text-foreground sm:text-[3.35rem]">{scan.domain}</h2>
 <p className="mt-4 max-w-2xl text-[1.02rem] leading-8 text-muted-foreground">
 Full security analysis, technology fingerprinting, vulnerability mapping, and intelligence signals — all in one profile.
 </p>
 </div>
 <div className="rounded-xl border border-border bg-accent/50 px-5 py-4 text-right">
 <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">Security posture</div>
 <div className={`mt-3 text-5xl font-bold ${gradeColor}`}>{grade}</div>
 <div className="mt-1 text-sm text-muted-foreground/80">{scan.overall_score}/100</div>
 </div>
 </div>
 <div className="mt-7 flex flex-wrap gap-3">
 <span className="platform-chip">{scan.pages_scanned} pages scanned</span>
 <span className="platform-chip">{totalIssues} vulnerabilities found</span>
 <span className="platform-chip">{technologies.length} technologies detected</span>
 <span className="platform-chip">
 Completed {formatRelative(scan.completed_at || scan.started_at)}
 </span>
 </div>
 <div className="mt-8 grid gap-4 md:grid-cols-3">
 {[
 { label: "Coverage", value: `${scan.pages_scanned}/${scan.pages_found || scan.pages_scanned}`, note: "Endpoints analyzed" },
 { label: "Top concern", value: severityCounts.critical > 0 ? "Critical" : severityCounts.high > 0 ? "High" : severityCounts.medium > 0 ? "Medium" : "Low", note: "Highest severity tier" },
 { label: "Scan duration", value: scan.started_at && scan.completed_at ? `${Math.round((new Date(scan.completed_at).getTime() - new Date(scan.started_at).getTime()) / 1000)}s` : "—", note: "Time to complete" },
 ].map((item) => (
 <div key={item.label} className="rounded-xl border border-border bg-card p-5">
 <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground/70">{item.label}</div>
 <div className="mt-3 text-2xl font-bold text-foreground">{item.value}</div>
 <div className="mt-1 text-sm text-muted-foreground/80">{item.note}</div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Actions</div>
 <h3 className="mt-3 text-[2rem] font-bold">Next steps</h3>
 <div className="mt-6 space-y-3">
 {[
 { title: "Compare workspace", description: "Benchmark against competitors.", href: "/dashboard/domains/compare", icon: TrendingUp },
 { title: "Publish report", description: "Share findings with team or clients.", href: "/dashboard/reports", icon: FileDown },
 { title: "Track changes", description: "Set up monitoring and alerts.", href: "/dashboard/monitoring", icon: Radar },
 ].map((action) => (
 <Link key={action.title} href={action.href} className="flex items-start gap-3 rounded-[1.25rem] border border-border bg-card/78 p-4 hover:border-teal-500/25">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] bg-teal-500/10 text-teal-700">
 <action.icon className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold">{action.title}</p>
 <p className="mt-1 text-sm text-muted-foreground">{action.description}</p>
 </div>
 <ArrowRight className="mt-1 h-4 w-4 text-muted-foreground" />
 </Link>
 ))}
 </div>

 {/* Quick severity summary */}
 <div className="mt-6 grid grid-cols-5 gap-2">
 {(["critical", "high", "medium", "low", "info"] as const).map((sev) => (
 <div key={sev} className="rounded-[1rem] border border-border bg-card/76 p-3 text-center">
 <div className="text-[1.5rem] font-bold">{severityCounts[sev]}</div>
 <div className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground capitalize">{sev}</div>
 </div>
 ))}
 </div>
 </div>
 </section>

 {/* Tabs — grouped by category */}
 <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
 <div className="mobile-scroll-x -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
 <div className="flex items-center gap-1.5 min-w-max">
 {TAB_GROUPS.map((group, groupIdx) => {
 const groupTabs = tabs.filter((t) => t.group === group.key);
 return (
 <div key={group.key} className="flex items-center gap-1">
 {groupIdx > 0 && (
 <div className="mx-1.5 h-5 w-px bg-border" />
 )}
 {groupTabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 data-active={activeTab === tab.id}
 className="dashboard-tab whitespace-nowrap text-sm"
 >
 {tab.label}
 </button>
 ))}
 </div>
 );
 })}
 </div>
 </div>
 </section>

 {/* === OVERVIEW TAB === */}
 {activeTab === "overview" && (
 <section className="space-y-5">
 <DomainHealthScoreSection domain={scan.domain} />
 <div className="grid gap-5 xl:grid-cols-2">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Overview</div>
 <h3 className="mt-3 text-[2rem] font-bold">Entity summary</h3>
 <div className="mt-6 grid gap-4 md:grid-cols-2">
 {[
 { label: "Security grade", value: grade, note: `${scan.overall_score}/100`, icon: ShieldCheck },
 { label: "Risk items", value: totalIssues, note: "Mapped vulnerabilities", icon: AlertTriangle },
 { label: "Pages analyzed", value: scan.pages_scanned, note: "Crawl coverage", icon: Layers3 },
 { label: "Intel signals", value: intelSignals.length, note: "Surface markers", icon: ScanSearch },
 ].map((item) => (
 <div key={item.label} className="domain-card p-5">
 <div className="flex items-center justify-between">
 <div className="text-sm text-muted-foreground">{item.label}</div>
 <item.icon className="h-4 w-4 text-teal-700" />
 </div>
 <div className="mt-5 text-[2.7rem] font-bold">{item.value}</div>
 <div className="mt-2 text-sm text-muted-foreground">{item.note}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Priority pages</div>
 <h3 className="mt-3 text-[2rem] font-bold">Where to investigate</h3>
 <div className="mt-6 space-y-3">
 {riskyPages.length === 0 ? (
 <div className="dashboard-empty">No pages analyzed yet.</div>
 ) : riskyPages.map((page) => (
 <div key={page.url} className="rounded-[1.25rem] border border-border bg-card/78 p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <p className="min-w-0 flex-1 truncate text-sm font-semibold">{page.url}</p>
 <span className={`platform-chip ${page.issues_count > 0 ? "text-orange-700" : "text-emerald-700"}`}>{page.issues_count} issues</span>
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.16em] text-muted-foreground">
 <span>Status {page.status_code}</span>
 <span>Score {page.security_score}/100</span>
 <span>{formatRelative(page.scanned_at)}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </section>
 )}

 {/* === TECH TAB === */}
 {activeTab === "tech" && (
 <section className="grid gap-5 xl:grid-cols-2">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Technology stack</div>
 <h3 className="mt-3 text-[2rem] font-bold">Detected technologies</h3>
 <div className="mt-6 space-y-3">
 {technologies.length === 0 ? (
 <div className="dashboard-empty">No technologies detected.</div>
 ) : technologies.map((tech) => (
 <div key={tech} className="flex items-center gap-3 rounded-[1.15rem] border border-border bg-card/78 p-4">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] bg-teal-500/10 text-teal-700">
 <Code2 className="h-4 w-4" />
 </div>
 <div>
 <p className="text-sm font-semibold">{tech}</p>
 <p className="text-xs text-muted-foreground">Fingerprinted via response headers and page content</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Page index</div>
 <h3 className="mt-3 text-[2rem] font-bold">All scanned endpoints</h3>
 <div className="mt-6 space-y-2">
 {(scan.pages || []).length === 0 ? (
 <div className="dashboard-empty">No pages scanned.</div>
 ) : (scan.pages || []).map((page) => (
 <div key={page.url} className="flex items-center justify-between rounded-[1rem] border border-border bg-card/78 px-4 py-3">
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-medium">{page.url}</p>
 <p className="text-xs text-muted-foreground">Status {page.status_code}</p>
 </div>
 <div className="ml-3 text-right">
 <div className={`text-lg font-bold ${page.security_score >= 80 ? "text-emerald-600" : page.security_score >= 60 ? "text-amber-600" : "text-red-600"}`}>
 {page.security_score}
 </div>
 <div className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">Score</div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </section>
 )}

 {/* === SECURITY TAB === */}
 {activeTab === "security" && (
 <section className="grid gap-5 xl:grid-cols-[0.85fr_1.15fr]">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Security posture</div>
 <h3 className="mt-3 text-[2rem] font-bold">Severity map</h3>
 <div className="mt-6 grid gap-3">
 {Object.entries(severityCounts).map(([severity, count]) => (
 <div key={severity} className="rounded-[1.2rem] border border-border bg-card/78 p-4">
 <div className="flex items-center justify-between">
 <span className={`platform-chip capitalize ${getSeverityClasses(severity as Vulnerability["severity"])}`}>{severity}</span>
 <span className="text-[2rem] font-bold">{count}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Issue inventory</div>
 <h3 className="mt-3 text-[2rem] font-bold">Mapped vulnerabilities</h3>
 <div className="mt-6 space-y-3">
 {sortedVulnerabilities.length === 0 ? (
 <div className="dashboard-empty">No vulnerabilities returned.</div>
 ) : sortedVulnerabilities.map((issue) => (
 <div key={issue.id} className={`rounded-[1.25rem] border p-4 ${getSeverityClasses(issue.severity)}`}>
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="text-sm font-semibold">{issue.title}</p>
 <p className="mt-1 text-xs uppercase tracking-[0.16em] opacity-80">{issue.category}</p>
 </div>
 <span className="platform-chip capitalize">{issue.severity}</span>
 </div>
 <p className="mt-3 text-sm leading-6 opacity-90">{issue.description}</p>
 {issue.affected_pages.length > 0 && (
 <div className="mt-3 flex flex-wrap gap-1.5">
 {issue.affected_pages.map((p) => (
 <span key={p} className="rounded-full bg-black/5 px-2.5 py-0.5 text-[0.65rem] text-muted-foreground">{p}</span>
 ))}
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </section>
 )}

 {/* === INTEL TAB === */}
 {activeTab === "intel" && (
 <section className="grid gap-5 xl:grid-cols-2">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Intelligence signals</div>
 <h3 className="mt-3 text-[2rem] font-bold">Surface analysis</h3>
 <div className="mt-6 space-y-3">
 {intelSignals.length === 0 ? (
 <div className="dashboard-empty">No intelligence signals detected from scanned pages.</div>
 ) : intelSignals.map((signal) => (
 <div key={signal.key} className="rounded-[1.25rem] border border-border bg-card/78 p-4">
 <div className="flex items-center gap-2">
 <CheckCircle2 className="h-4 w-4 text-teal-600" />
 <p className="text-sm font-semibold">{signal.label}</p>
 </div>
 <p className="mt-2 text-sm leading-6 text-muted-foreground">{signal.description}</p>
 <div className="mt-3 flex flex-wrap gap-1.5">
 {signal.pages.map((page) => (
 <span key={page.url} className="rounded-full bg-teal-500/8 px-2.5 py-0.5 text-[0.65rem] text-teal-700">{page.url}</span>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Domain metadata</div>
 <h3 className="mt-3 text-[2rem] font-bold">Profile data</h3>
 <div className="mt-6 space-y-3">
 {[
 { label: "Domain", value: scan.domain },
 { label: "Pages discovered", value: `${scan.pages_found}` },
 { label: "Pages scanned", value: `${scan.pages_scanned}` },
 { label: "Technologies", value: technologies.join(", ") || "—" },
 { label: "Security score", value: `${scan.overall_score}/100 (${grade})` },
 { label: "Vulnerabilities", value: `${totalIssues}` },
 { label: "Scan started", value: formatDateTime(scan.started_at) },
 { label: "Scan completed", value: formatDateTime(scan.completed_at) },
 ].map((item) => (
 <div key={item.label} className="flex items-center justify-between rounded-[1rem] border border-border bg-card/78 px-4 py-3">
 <span className="text-sm text-muted-foreground">{item.label}</span>
 <span className="text-sm font-medium text-right max-w-[60%] truncate">{item.value}</span>
 </div>
 ))}
 </div>
 </div>
 </section>
 )}

 {/* === HISTORY TAB === */}
 {activeTab === "history" && (
 <section className="grid gap-5 xl:grid-cols-2">
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Scan timeline</div>
 <h3 className="mt-3 text-[2rem] font-bold">Activity log</h3>
 <div className="mt-6 space-y-3">
 {timeline.length === 0 ? (
 <div className="dashboard-empty">No timeline events.</div>
 ) : timeline.map((event, idx) => (
 <div key={idx} className="flex gap-3 rounded-[1.15rem] border border-border bg-card/78 p-4">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-700">
 <Clock className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-semibold">{event.label}</p>
 <p className="mt-1 truncate text-xs text-muted-foreground">{event.note}</p>
 <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(event.time)}</p>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="section-kicker">Scan history</div>
 <h3 className="mt-3 text-[2rem] font-bold">Past scans</h3>
 <div className="mt-6 space-y-3">
 {scanHistory.length === 0 ? (
 <div className="rounded-[1.15rem] border border-border bg-card/78 p-4">
 <div className="flex gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-teal-700">
 <History className="h-4 w-4" />
 </div>
 <div>
 <p className="text-sm font-semibold">{scan.domain}</p>
 <p className="mt-1 text-xs text-muted-foreground">
 Score: {scan.overall_score}/100 — {scan.pages_scanned} pages — {formatDate(scan.completed_at || scan.started_at)}
 </p>
 </div>
 </div>
 </div>
 ) : scanHistory.map((entry) => {
 const entryGrade = getSecurityGrade(entry.overall_score);
 const entryColor = getSecurityColor(entry.overall_score);
 return (
 <div key={entry.id} className="rounded-[1.15rem] border border-border bg-card/78 p-4">
 <div className="flex items-center justify-between gap-3">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <p className="text-sm font-semibold">{entry.domain}</p>
 <span className={`platform-chip text-xs capitalize ${entry.status === "complete" ? "text-emerald-700" : "text-amber-700"}`}>
 {entry.status}
 </span>
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 {entry.pages_scanned} pages scanned — {formatDate(entry.completed_at || entry.started_at)}
 </p>
 </div>
 <div className="text-right">
 <div className={`text-xl font-bold ${entryColor}`}>{entryGrade}</div>
 <div className="text-[0.6rem] uppercase tracking-[0.14em] text-muted-foreground">{entry.overall_score}/100</div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </section>
 )}

 {/* === MONITORING TAB === */}
 {activeTab === "monitoring" && (
 <DomainMonitoringTab domain={scan.domain} grade={grade} score={scan.overall_score} pagesFound={scan.pages_found} totalIssues={totalIssues} techCount={technologies.length} />
 )}

 {/* === SEO TAB === */}
 {activeTab === "seo" && (
 <section className="space-y-5">
 <DomainSeoTab domain={scan.domain} />
 </section>
 )}

 {/* === ISSUES TAB === */}
 {activeTab === "issues" && (
 <section className="space-y-5">
 <DomainIssuesTab domain={scan.domain} />
 </section>
 )}

 {/* === COMPLIANCE TAB === */}
 {activeTab === "compliance" && (
 <section className="space-y-5">
 <DomainComplianceTab domain={scan.domain} />
 </section>
 )}

 {/* === EXPORTS TAB === */}
 {activeTab === "exports" && (
 <DomainExportsTab scan={scan} />
 )}
 </div>
 );
}

export default function DomainProfilePage() {
 return (
 <Suspense fallback={<div className="dashboard-page"><CardSkeleton /><CardSkeleton /></div>}>
 <DomainProfileContent />
 </Suspense>
 );
}
