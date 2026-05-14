"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ScanResult } from "@/lib/api-client";
import { api } from "@/lib/api-client";
import { TechStackGrid } from "./tech-stack-grid";
import { SecurityScore } from "./security-score";
import { SeoAnalysis } from "./seo-analysis";
import { CompanyInfoCard } from "./company-info";
import { SocialLinks } from "./social-links";
import { TrafficChart } from "./traffic-chart";
import { BusinessSignals } from "./business-signals";
import { CompetitorList } from "./competitor-list";
import { CostCalculator } from "./cost-calculator";
import { VulnerabilityPanel } from "./vulnerability-panel";
import { PrivacyCompliance } from "./privacy-compliance";
import { WaybackTimeline } from "./wayback-timeline";
import { JSBundleAnalysis as JsBundleAnalysis } from "./js-bundle-analysis";
import { APIEndpoints as ApiEndpoints } from "./api-endpoints";
import { SupplyChainMap } from "./supply-chain-map";
import { ComplianceChecklist } from "./compliance-checklist";
import { CarbonScoreCard } from "./carbon-score";
import { SecurityFixes } from "./security-fixes";
import { EmailPatternsCard } from "./email-patterns";
import {
 Copy,
 Check,
 FileText,
 Save,
 Eye,
 FileJson,
 FileSpreadsheet,
 Download,
 Share2,
 ExternalLink,
 Shield,
 Blocks,
 TrendingUp,
 Radar,
 Clock3,
 Globe,
 ChevronDown,
 Target,
 ShieldAlert,
 BadgeInfo,
 CheckSquare,
} from "lucide-react";

type TabId = "executive" | "surface" | "context" | "compliance";

const TABS: { id: TabId; label: string; icon: any }[] = [
 { id: "executive", label: "Executive Focus", icon: Target },
 { id: "surface", label: "Attack Surface", icon: ShieldAlert },
 { id: "context", label: "Context & Market", icon: BadgeInfo },
 { id: "compliance", label: "Compliance & Fixes", icon: CheckSquare },
];
import { exportScanPdf } from "@/lib/export-pdf";
import { exportScanCsv } from "@/lib/export-csv";
import { useUserPlan } from "@/lib/dashboard-cache";
import { toast } from "sonner";

interface ScanResultCardProps {
 scan: ScanResult;
}

function getHostname(url: string) {
 try {
 return new URL(url).hostname.replace(/^www\./, "");
 } catch {
 return url;
 }
}

function getSecurityTone(score: number) {
 if (score >= 80) {
 return "border-emerald-500/25 bg-emerald-500/6 text-emerald-700";
 }

 if (score >= 50) {
 return "border-amber-500/25 bg-amber-500/6 text-amber-700";
 }

 return "border-rose-500/25 bg-rose-500/6 text-rose-700";
}

function getTrafficLabel(tier?: string | null) {
 if (!tier) {
 return "No traffic signal";
 }

 return `${tier} traffic`;
}

function formatScanDate(value: string) {
 return new Date(value).toLocaleString();
}

function formatShortHash(value: string) {
 if (!value) return "—";
 return `${value.slice(0, 8)}...${value.slice(-6)}`;
}

function exportScanJson(scan: ScanResult) {
 const blob = new Blob([JSON.stringify(scan, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const anchor = document.createElement("a");
 const hostname = getHostname(scan.url);

 anchor.href = url;
 anchor.download = `${hostname}-scan-result.json`;
 anchor.click();
 URL.revokeObjectURL(url);
}

interface ActionButtonProps {
 onClick: () => unknown;
 children: React.ReactNode;
 variant?: "default" | "primary";
 disabled?: boolean;
}

function ActionButton({ onClick, children, variant = "default", disabled = false }: ActionButtonProps) {
 const baseClassName =
 "inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-colors";
 const variantClassName =
 variant === "primary"
 ? "bg-[hsl(var(--ink))] text-white hover:bg-teal-600"
 : "border border-border bg-card text-foreground hover:bg-accent";

 return (
 <button onClick={onClick} disabled={disabled} className={`${baseClassName} ${variantClassName} disabled:opacity-50`}>
 {children}
 </button>
 );
}

/* ---- Export dropdown ---- */

function ExportDropdown({ scan }: { scan: ScanResult }) {
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);
 const { data: plan } = useUserPlan();
 const isPro = plan?.plan === "pro" || (plan?.plan as string) === "business" || (plan?.plan as string) === "enterprise";

 useEffect(() => {
 function handleClickOutside(e: MouseEvent) {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false);
 }
 }
 if (open) document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, [open]);

 const items = [
 {
 label: "Copy JSON",
 icon: Copy,
 action: () => {
 navigator.clipboard.writeText(JSON.stringify(scan, null, 2));
 toast.success("JSON copied to clipboard");
 },
 },
 {
 label: "Export JSON",
 icon: FileJson,
 action: () => exportScanJson(scan),
 },
 {
 label: "Export CSV",
 icon: FileSpreadsheet,
 action: () => {
 exportScanCsv(scan);
 toast.success("CSV downloaded");
 },
 },
 {
 label: isPro ? "Export PDF" : "Export PDF (Pro)",
 icon: FileText,
 action: async () => {
 await exportScanPdf(scan, { plan: isPro ? "pro" : "free" });
 toast.success("PDF downloaded");
 },
 },
 ];

 return (
 <div ref={ref} className="relative">
 <button
 onClick={() => setOpen((v) => !v)}
 className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
 >
 <Download className="h-4 w-4" />
 Export
 <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
 </button>

 {open && (
 <div className="absolute right-0 top-full z-50 mt-1.5 w-52 overflow-hidden rounded-xl border border-border bg-card">
 {items.map((item) => {
 const Icon = item.icon;
 return (
 <button
 key={item.label}
 onClick={() => {
 setOpen(false);
 item.action();
 }}
 className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-foreground transition-colors hover:bg-accent"
 >
 <Icon className="h-4 w-4 text-muted-foreground" />
 {item.label}
 </button>
 );
 })}
 </div>
 )}
 </div>
 );
}

interface MetricCardProps {
 icon: React.ReactNode;
 label: string;
 value: string;
 detail: string;
 tone?: string;
 valueClassName?: string;
}

function MetricCard({ icon, label, value, detail, tone = "domain-card", valueClassName = "text-foreground" }: MetricCardProps) {
 return (
 <div className={`${tone} p-5`}>
 <div className="mb-3 flex items-center justify-between gap-3">
 <span className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">{label}</span>
 <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-background text-current">{icon}</div>
 </div>
 <div className={`text-3xl font-semibold tracking-tight ${valueClassName}`}>{value}</div>
 <div className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</div>
 </div>
 );
}

function SnapshotCard({ label, value, detail }: { label: string; value: string; detail: string }) {
 return (
 <div className="rounded-[1.35rem] border border-border bg-card/72 p-4">
 <div className="text-[0.68rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
 {label}
 </div>
 <div className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{value}</div>
 <div className="mt-2 text-sm leading-6 text-muted-foreground">{detail}</div>
 </div>
 );
}

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
 return (
 <div className="mb-5 flex flex-col gap-1">
 <span className="text-[0.68rem] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
 {eyebrow}
 </span>
 <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
 <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{description}</p>
 </div>
 );
}

function deriveKeyFindings(scan: ScanResult) {
 const findings: { severity: "critical" | "warning" | "info"; text: string }[] = [];

 // Security findings
 const missingHeaders = scan.security.headers.filter((h) => !h.present);
 const criticalMissing = missingHeaders.filter((h) =>
 ["strict-transport-security", "content-security-policy", "x-frame-options"].includes(h.name.toLowerCase())
 );
 if (criticalMissing.length > 0) {
 findings.push({
 severity: "critical",
 text: `Missing critical security headers: ${criticalMissing.map((h) => h.name).join(", ")}`,
 });
 }

 // Vulnerability findings
 if (scan.vulnerability) {
 const cveCount = scan.vulnerability.cve_matches?.cves?.length || 0;
 if (cveCount > 0) {
 findings.push({
 severity: "critical",
 text: `${cveCount} known CVE${cveCount > 1 ? "s" : ""} detected in technology stack`,
 });
 }
 const exposedFiles = scan.vulnerability.sensitive_files?.exposed_files;
 if (exposedFiles?.length) {
 findings.push({
 severity: "warning",
 text: `${exposedFiles.length} exposed file${exposedFiles.length > 1 ? "s" : ""} found (e.g. .env, .git)`,
 });
 }
 }

 // SEO findings
 if (scan.seo.score < 60) {
 findings.push({
 severity: "warning",
 text: `SEO score is ${scan.seo.score}/100 with ${scan.seo.meta_issues.length} metadata issues`,
 });
 }

 // Technology count
 if (scan.technologies.length > 30) {
 findings.push({
 severity: "info",
 text: `Large technology footprint: ${scan.technologies.length} technologies detected across ${new Set(scan.technologies.map((t) => t.category || "Other")).size} categories`,
 });
 }

 // Privacy
 if (scan.privacy && !scan.privacy.has_privacy_policy) {
 findings.push({
 severity: "warning",
 text: "No privacy policy detected — potential compliance risk",
 });
 }

 // Low security score
 if (scan.security.score < 50) {
 findings.push({
 severity: "critical",
 text: `Security posture is weak (${scan.security.score}/100) — immediate remediation recommended`,
 });
 }

 return findings.slice(0, 4);
}

export function ScanResultCard({ scan }: ScanResultCardProps) {
 const router = useRouter();
 const [saving, setSaving] = useState(false);
 const [findingsExpanded, setFindingsExpanded] = useState(true);
 const [activeTab, setActiveTab] = useState<TabId>("executive");
 const hostname = getHostname(scan.url);
 const detectedTechnologies = scan.technologies.length;
 const securityScore = scan.security.score;
 const visibleHeaders = scan.security.headers.filter((header) => header.present).length;
 const trafficTier = scan.traffic?.traffic_tier ?? null;
 const competitorCount = scan.competitors.length;
 const businessSignalsCount = scan.business_signals.length;
 const securityTone = getSecurityTone(securityScore);
 const topSummary = scan.ai_summary || "No executive summary available for this scan yet.";
 const keyFindings = deriveKeyFindings(scan);

 async function handleSaveReport() {
 setSaving(true);
 const res = await api.createReport({ scan_hash: scan.hash, is_public: false });
 if (res.data) {
 toast.success("Report saved");
 router.push(`/dashboard/reports`);
 } else {
 toast.error(res.error || "Failed to save report");
 }
 setSaving(false);
 }

 async function handleShareReport() {
 const res = await api.createReport({ scan_hash: scan.hash, is_public: true });
 if (res.data) {
 const url = `${window.location.origin}/report/${res.data.slug}`;
 await navigator.clipboard.writeText(url);
 toast.success("Share link copied to clipboard");
 } else {
 toast.error(res.error || "Failed to create share link");
 }
 }

 return (
 <div className="space-y-8">
 <section className="shell-panel rounded-[2rem] p-6 sm:p-8">
 <div className="flex flex-col gap-6">
 <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
 <div className="min-w-0 flex-1">
 <div className="mb-4 flex flex-wrap items-center gap-2">
 
 </div>

 <div className="flex flex-wrap items-start gap-3">
 <div className="min-w-0 flex-1">
 <h1 className="wrap-anywhere text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
 {hostname}
 </h1>
 <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-2 xl:grid-cols-3">
 <span className="wrap-anywhere inline-flex items-center gap-2 rounded-[1rem] border border-border bg-card/72 px-3 py-2">
 <Globe className="h-4 w-4 text-teal-700" />
 {scan.url}
 </span>
 <span className="inline-flex items-center gap-2 rounded-[1rem] border border-border bg-card/72 px-3 py-2">
 <Clock3 className="h-4 w-4 text-teal-700" />
 Scanned {formatScanDate(scan.scanned_at)}
 </span>
 <span className="inline-flex items-center gap-2 rounded-[1rem] border border-border bg-card/72 px-3 py-2">
 <Radar className="h-4 w-4 text-teal-700" />
 Hash {formatShortHash(scan.hash)}
 </span>
 </div>
 </div>
 <a
 href={scan.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
 >
 <ExternalLink className="h-4 w-4" />
 </a>
 </div>
 </div>

 <div className="flex flex-wrap gap-2 xl:max-w-[30rem] xl:justify-end">
 <ActionButton onClick={handleSaveReport} disabled={saving}>
 <Save className="h-4 w-4" />
 Save report
 </ActionButton>
 <ActionButton onClick={async () => {
 try {
 const domain = new URL(scan.url).hostname;
 const res = await api.createWatchlist({ name: domain, description: `Watchlist for ${domain}`, urls: [scan.url], frequency: "weekly" });
 if (res.error) {
 toast.error(res.error || "Failed to add to watchlist");
 } else {
 toast.success(`${domain} added to watchlist`);
 }
 } catch {
 toast.error("Failed to add to watchlist");
 }
 }}>
 <Eye className="h-4 w-4" />
 Watchlist
 </ActionButton>
 <ExportDropdown scan={scan} />
 <ActionButton onClick={handleShareReport} variant="primary">
 <Share2 className="h-4 w-4" />
 Share
 </ActionButton>
 </div>
 </div>

 <div className="grid gap-5 xl:grid-cols-[minmax(0,1.16fr)_minmax(18rem,0.84fr)]">
 <div className="rounded-[1.6rem] border border-border bg-card/78 p-6">
 <div className="mb-3 flex items-center gap-2 text-foreground">
 <FileText className="h-5 w-5 text-teal-700" />
 <h2 className="text-lg font-semibold tracking-tight">Executive summary</h2>
 </div>
 <p className="wrap-anywhere text-sm leading-8 text-muted-foreground">{topSummary}</p>
 </div>

 <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
 <SnapshotCard
 label="Company"
 value={scan.company?.name || "Unknown entity"}
 detail={scan.company?.industry || "No industry signal"}
 />
 <SnapshotCard
 label="Social"
 value={String(scan.social_links.length)}
 detail="Linked profiles found"
 />
 <SnapshotCard
 label="SEO"
 value={`${scan.seo.score}/100`}
 detail={`${scan.seo.meta_issues.length} open metadata issues`}
 />
 </div>
 </div>

 {/* Key Findings callout */}
 {keyFindings.length > 0 && (
 <div className="rounded-[1.35rem] border border-amber-500/15 bg-amber-500/[0.04]">
 <button
 onClick={() => setFindingsExpanded(!findingsExpanded)}
 className="flex w-full items-center justify-between px-5 py-4 text-left"
 >
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-[0.85rem] bg-amber-500/12">
 <Shield className="h-4 w-4 text-amber-600" />
 </div>
 <div>
 <p className="text-sm font-semibold text-foreground">
 {keyFindings.length} key finding{keyFindings.length > 1 ? "s" : ""}
 </p>
 <p className="text-xs text-muted-foreground">Issues that need your attention</p>
 </div>
 </div>
 <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${findingsExpanded ? "rotate-180" : ""}`} />
 </button>
 {findingsExpanded && (
 <div className="space-y-1.5 px-5 pb-4">
 {keyFindings.map((finding, idx) => (
 <div
 key={idx}
 className={`flex items-start gap-3 rounded-[0.9rem] px-3.5 py-3 ${
 finding.severity === "critical"
 ? "bg-red-500/8 border border-red-500/10"
 : finding.severity === "warning"
 ? "bg-amber-500/8 border border-amber-500/10"
 : "bg-slate-500/8 border border-slate-500/10"
 }`}
 >
 <span
 className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
 finding.severity === "critical"
 ? "bg-red-500"
 : finding.severity === "warning"
 ? "bg-amber-500"
 : "bg-slate-400"
 }`}
 />
 <p className="text-sm leading-6 text-foreground">{finding.text}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <MetricCard
 icon={<Blocks className="h-4 w-4" />}
 label="Technology"
 value={String(detectedTechnologies)}
 detail={`${new Set(scan.technologies.map((item) => item.category || "Other")).size} categories detected`}
 tone="domain-card"
 />
 <MetricCard
 icon={<Shield className="h-4 w-4" />}
 label="Security"
 value={`${securityScore}/100`}
 detail={`${visibleHeaders}/${scan.security.headers.length} headers present`}
 tone={`rounded-[1.45rem] border p-5 ${securityTone}`}
 />
 <MetricCard
 icon={<TrendingUp className="h-4 w-4" />}
 label="Reach"
 value={trafficTier ?? "Unknown"}
 detail={scan.traffic?.estimated_monthly_visits || getTrafficLabel(trafficTier)}
 tone="domain-card"
 />
 <MetricCard
 icon={<Radar className="h-4 w-4" />}
 label="Signals"
 value={String(businessSignalsCount)}
 detail={`${competitorCount} similar sites found`}
 tone="domain-card"
 />
 </div>
 </div>
 </section>

 {/* Tabs Navigation */}
 <div className="flex w-full items-center gap-2 overflow-x-auto border-b border-border/60 pb-px custom-scrollbar">
 {TABS.map((tab) => {
 const isActive = activeTab === tab.id;
 const Icon = tab.icon;
 return (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={`group flex items-center gap-2 border-b-2 px-5 py-4 text-sm font-semibold transition-all ${
 isActive
 ? "border-teal-600 text-teal-700"
 : "border-transparent text-muted-foreground hover:border-border hover:text-foreground"
 }`}
 >
 <Icon
 className={`h-4 w-4 ${
 isActive ? "text-teal-600" : "text-muted-foreground opacity-70 group-hover:opacity-100"
 }`}
 />
 {tab.label}
 </button>
 );
 })}
 </div>

 <div className="pt-4">
 {activeTab === "executive" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {scan.cost_estimate ? (
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Operations"
 title="Valuation & Interpretation"
 description="Estimated domain value and high-level operating profile."
 />
 <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
 <CostCalculator estimate={scan.cost_estimate} />
 <div className="shell-panel rounded-[1.6rem] p-6">
 <div className="mb-3 text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
 Interpretation
 </div>
 <h3 className="text-2xl font-semibold tracking-tight text-foreground">
 Operating profile at a glance
 </h3>
 <div className="mt-4 space-y-3 text-sm leading-6 text-muted-foreground">
 <p>
 {detectedTechnologies > 0
 ? `The site runs on a lean stack with ${detectedTechnologies} detected technologies.`
 : "The scanner did not identify a stable technology footprint."}
 </p>
 <p>
 {competitorCount > 0
 ? `${competitorCount} comparable sites were detected, which makes this result useful for compare workflows and benchmarking.`
 : "No strong competitor cluster was returned from this scan."}
 </p>
 <p>
 {securityScore >= 80
 ? "Security posture is above baseline and looks fit for monitoring rather than urgent remediation."
 : securityScore >= 50
 ? "Security posture is mixed and worth reviewing before sharing externally."
 : "Security posture is weak enough to treat this scan as an action item, not just a reference snapshot."}
 </p>
 </div>
 </div>
 </div>
 </section>
 ) : null}

 {scan.technologies.length > 0 && (
  <section className="space-y-5">
    <SectionHeading
      eyebrow="Infrastructure"
      title="Technology Footprint"
      description="Detected software stack, frameworks, and third-party services."
    />
    <TechStackGrid technologies={scan.technologies} />
  </section>
)}

 {(scan.company || scan.traffic) && (
  <section className="space-y-5">
    <SectionHeading
      eyebrow="Market snapshot"
      title="Immediate Business Context"
      description="High-level view of identity and traffic."
    />
    <div className={"grid gap-6 " + (scan.company && scan.traffic ? "xl:grid-cols-[minmax(0,1.08fr)_minmax(0,0.92fr)]" : "xl:grid-cols-1")}>
      {scan.company && <div><CompanyInfoCard company={scan.company} /></div>}
      {scan.traffic && <div><TrafficChart traffic={scan.traffic} /></div>}
    </div>
  </section>
)}
 </div>
 )}

 {activeTab === "surface" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Core analysis"
 title="Defensive posture"
 description="High-level security grading and baseline header analysis."
 />
 <div className="mx-auto max-w-4xl">
 <SecurityScore security={scan.security} />
 </div>
 </section>

 {(scan.js_bundles || scan.api_endpoints || scan.supply_chain || scan.vulnerability) && (
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Deep intelligence"
 title="Architecture and Vulnerabilities"
 description="Expanded recon intelligence outlining the underlying infrastructure."
 />
 
 {scan.vulnerability ? <VulnerabilityPanel vulnerability={scan.vulnerability} /> : null}
 
 <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
 {scan.js_bundles ? <JsBundleAnalysis bundles={scan.js_bundles} /> : null}
 {scan.api_endpoints ? <ApiEndpoints apis={scan.api_endpoints} /> : null}
 </div>

 {scan.supply_chain ? <SupplyChainMap supply_chain={scan.supply_chain} /> : null}
 </section>
 )}
 </div>
 )}

 {activeTab === "context" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Profile"
 title="Search, Social, and Market"
 description="How the site presents itself, where it can improve, and who it most resembles."
 />
 <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
 <SeoAnalysis seo={scan.seo} />
 <CompetitorList competitors={scan.competitors} />
 </div>
 </section>

 {(scan.social_links.length > 0 || scan.business_signals.length > 0 || scan.email_patterns || scan.wayback) && (
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Signaling"
 title="External footprints"
 description="Communication patterns, historical captures, and organizational indicators."
 />
 <BusinessSignals signals={scan.business_signals} />
 
 <div className="grid gap-6 xl:grid-cols-2">
 <div className="space-y-6">
 {scan.social_links.length > 0 ? <SocialLinks links={scan.social_links} /> : null}
 {scan.email_patterns && <EmailPatternsCard emailPatterns={scan.email_patterns} />}
 </div>
 <div>
 {scan.wayback ? <WaybackTimeline wayback={scan.wayback} /> : null}
 </div>
 </div>
 </section>
 )}
 </div>
 )}

 {activeTab === "compliance" && (
 <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
 {(scan.privacy || scan.carbon) && (
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Governance"
 title="Privacy and Compliance Posture"
 description="Regulatory adherence, privacy signaling, and carbon footprint analysis."
 />
 <div className="grid gap-6 xl:grid-cols-2 lg:items-start">
 <div className="space-y-6">
 {scan.privacy ? <PrivacyCompliance privacy={scan.privacy} /> : null}
 {scan.carbon ? <CarbonScoreCard carbon={scan.carbon} /> : null}
 </div>
 <ComplianceChecklist scan={scan} />
 </div>
 </section>
 )}

 {scan.security_findings && scan.security_findings.length > 0 && (
 <section className="space-y-5">
 <SectionHeading
 eyebrow="Remediation"
 title="Security fixes with copy-paste code"
 description="Actionable fixes prioritized by impact. Copy the config for your server and deploy."
 />
 <SecurityFixes findings={scan.security_findings} />
 </section>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
