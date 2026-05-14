"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import { generateIssues, type Issue } from "@/lib/issue-generator";
import { IssueList } from "@/components/issues/issue-list";
import { IssueDetailDrawer } from "@/components/issues/issue-detail-drawer";
import { IssueStatsCard } from "@/components/issues/issue-stats-card";
import { cn } from "@/lib/utils";

type SeverityFilter = "all" | "critical" | "high" | "medium" | "low";
type CategoryFilter = "all" | "security" | "performance" | "seo" | "privacy";
type StatusFilter = "open" | "resolved" | "ignored";

export default function IssuesPage() {
 const [issues, setIssues] = useState<Issue[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
 const [drawerOpen, setDrawerOpen] = useState(false);

 const [severityFilter, setSeverityFilter] = useState<SeverityFilter>("all");

 useEffect(() => {
 loadIssues();
 }, []);

 async function loadIssues() {
 setLoading(true);
 try {
 const [scansRes, domainsRes, auditsRes] = await Promise.all([
 api.getRecentScans(),
 api.getDomains(),
 api.getAttackSurfaceAudits(),
 ]);
 const scans = scansRes.data || [];
 const verifiedDomains = new Set(
 (domainsRes.data || [])
 .filter((d) => d.verified)
 .map((d) => d.domain.toLowerCase()),
 );

 const allIssues: Issue[] = [];

 // Issues from Quick Scans (on verified domains)
 for (const scan of scans) {
 if (scan.status !== "complete") continue;
 let domain: string;
 try {
 domain = new URL(scan.url.startsWith("http") ? scan.url : `https://${scan.url}`).hostname;
 } catch {
 domain = scan.url;
 }
 if (verifiedDomains.size > 0 && !verifiedDomains.has(domain.toLowerCase())) continue;
 allIssues.push(...generateIssues(scan, domain));
 }

 // Issues from Security Probe findings
 const audits = auditsRes.data || [];
 for (const audit of audits) {
 if (audit.status !== "complete") continue;
 for (const f of (audit.findings || [])) {
 if (f.severity === "info") continue; // Skip info-level
 const sevMap: Record<string, Issue["severity"]> = { critical: "critical", high: "high", medium: "medium", low: "low" };
 const catMap: Record<string, Issue["category"]> = {
 header: "security", ssl: "security", cors: "security", cookie: "security",
 "sensitive-file": "security", "admin-panel": "security", "cloud-misconfiguration": "security",
 "open-redirect": "security", "information-disclosure": "security", "api-exposure": "security",
 email: "security", dns: "security", vulnerability: "security", subdomain: "security",
 fingerprint: "security", directory: "security", misconfiguration: "security",
 };
 allIssues.push({
 id: `probe-${f.id}`,
 title: f.title,
 description: `${f.description}${f.remediation ? "\n\nRemediation: " + f.remediation : ""}`,
 severity: sevMap[f.severity] || "medium",
 category: catMap[f.category] || "security",
 domain: audit.domain,
 status: "open",
 detected_at: audit.started_at,
 source: `Security Probe${f.cvss_score ? " (CVSS " + f.cvss_score + ")" : ""}${f.cwe_id ? " " + f.cwe_id : ""}`,
 auto_fixable: false,
 });
 }
 }

 const seen = new Set<string>();
 const deduped = allIssues.filter((issue) => {
 const key = `${issue.title}-${issue.domain}`;
 if (seen.has(key)) return false;
 seen.add(key);
 return true;
 });
 setIssues(deduped);
 } catch {
 setIssues([]);
 } finally {
 setLoading(false);
 }
 }

 function handleSelectIssue(issue: Issue) {
 setSelectedIssue(issue);
 setDrawerOpen(true);
 }

 function handleStatusChange(id: string, status: Issue["status"]) {
 setIssues((prev) =>
 prev.map((i) => (i.id === id && i.domain === selectedIssue?.domain ? { ...i, status } : i)),
 );
 if (selectedIssue?.id === id) {
 setSelectedIssue((prev) => (prev ? { ...prev, status } : prev));
 }
 }

 const filtered = useMemo(() => {
 return issues.filter((issue) => {
 if (severityFilter !== "all" && issue.severity !== severityFilter) return false;
 return true;
 });
 }, [issues, severityFilter]);

 const counts = useMemo(() => ({
 critical: issues.filter((i) => i.severity === "critical" && i.status === "open").length,
 high: issues.filter((i) => i.severity === "high" && i.status === "open").length,
 medium: issues.filter((i) => i.severity === "medium" && i.status === "open").length,
 low: issues.filter((i) => i.severity === "low" && i.status === "open").length,
 }), [issues]);

 const totalOpen = counts.critical + counts.high + counts.medium + counts.low;

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 {/* Hero */}
 <section className="mb-10 w-full">
 <div className="flex flex-col gap-6 sm:flex-row sm:items-end justify-between">
 <div className="max-w-xl">
 <div className="flex items-center gap-3 mb-2">
 <p className="max-w-2xl text-[0.95rem] leading-relaxed text-muted-foreground">
 Real-time intelligence and prioritized remediation for security vulnerabilities across your digital footprint.
 </p>
 {totalOpen > 0 && (
 <span className="flex h-5 items-center rounded-md px-2 text-[0.6rem] font-medium uppercase tracking-[0.15em] text-red-400 shrink-0">
 {totalOpen} active
 </span>
 )}
 </div>
 </div>
 
 <button
 onClick={() => loadIssues()}
 className="group relative inline-flex shrink-0 items-center justify-center rounded-xl border border-border/40 bg-card/50 px-8 py-3.5 text-[0.95rem] text-foreground transition-all hover:bg-accent hover:border-border"
 >
 Sync Intelligence
 </button>
 </div>
 </section>

 {/* Stats row — Updated to White pattern */}
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-8">
 <IssueStatsCard label="Critical" count={counts.critical} color="text-rose-600" />
 <IssueStatsCard label="High" count={counts.high} color="text-orange-600" />
 <IssueStatsCard label="Medium" count={counts.medium} color="text-amber-600" />
 <IssueStatsCard label="Low" count={counts.low} color="text-teal-600" />
 </div>

 {/* Modern Filter Bar */}
 <div className="flex flex-col gap-4 mb-8 sm:flex-row sm:items-center justify-between">
 <div className="flex flex-wrap items-center gap-2">
 {/* Severity */}
 <div className="flex items-center gap-1 rounded-full border border-border bg-background p-1.5">
 {(["all", "critical", "high", "medium", "low"] as const).map((s) => (
 <button
 key={s}
 onClick={() => setSeverityFilter(s)}
 className={cn(
 "rounded-full px-4 py-1.5 text-[0.7rem] font-medium uppercase tracking-wider transition-all",
 severityFilter === s 
 ? "bg-foreground text-background" 
 : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
 )}
 >
 {s}
 </button>
 ))}
 </div>
 </div>
 </div>

 {/* Issue list */}
 {loading ? (
 <div className="flex flex-col items-center justify-center py-24 gap-6">
 <div className="h-3 w-32 bg-muted border-2 border-border rounded-full overflow-hidden">
 <div className="h-full bg-card animate-progress w-1/2" />
 </div>
 <p className="text-[0.7rem] font-medium tracking-[0.3em] uppercase text-foreground">Analyzing Surface Footprint...</p>
 </div>
 ) : issues.length === 0 ? (
 <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-background px-6 py-24 text-center">
 <h3 className="mb-2 text-[1.25rem] font-normal tracking-tight text-foreground">System Secure</h3>
 <p className="mx-auto max-w-md text-[0.8rem] text-muted-foreground uppercase tracking-widest">
 No active issues detected.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 <IssueList issues={filtered} onSelectIssue={handleSelectIssue} />
 </div>
 )}

 {/* Detail drawer */}
 <IssueDetailDrawer
 issue={selectedIssue}
 open={drawerOpen}
 onClose={() => setDrawerOpen(false)}
 onStatusChange={handleStatusChange}
 />
 </div>
 );
}
