import { CheckCircle2, Download, Shield, LayoutGrid, Clock, AlertTriangle } from "lucide-react";
import type { AuditFinding } from "./finding-card";
import { cn } from "@/lib/utils";

interface AuditSummaryProps {
 findings: AuditFinding[];
 domain: string;
 duration: string;
 checksRun: string[];
}

const SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"] as const;

const SEVERITY_THEMES: Record<string, { dot: string; text: string; bg: string; shadow: string }> = {
 critical: { dot: "bg-red-500", text: "text-red-400", bg: "bg-red-500/10", shadow: "shadow-[0_0_15px_rgba(239,68,68,0.1)]" },
 high: { dot: "bg-orange-500", text: "text-orange-400", bg: "bg-orange-500/10", shadow: "shadow-[0_0_15px_rgba(249,115,22,0.1)]" },
 medium: { dot: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10", shadow: "shadow-[0_0_15px_rgba(245,158,11,0.1)]" },
 low: { dot: "bg-blue-500", text: "text-blue-400", bg: "bg-blue-500/10", shadow: "shadow-[0_0_15px_rgba(59,130,246,0.1)]" },
 info: { dot: "bg-slate-400", text: "text-slate-400", bg: "bg-slate-500/10", shadow: "" },
};

function computeRiskRating(findings: AuditFinding[]): { label: string; color: string; bg: string } {
 const counts = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
 for (const f of findings) {
 counts[f.severity] = (counts[f.severity] || 0) + 1;
 }
 if (counts.critical > 0) return { label: "CRITICAL RISK", color: "text-red-400", bg: "bg-red-500/10" };
 if (counts.high > 2) return { label: "HIGH RISK", color: "text-orange-400", bg: "bg-orange-500/10" };
 if (counts.high > 0) return { label: "MODERATE RISK", color: "text-amber-400", bg: "bg-amber-500/10" };
 if (counts.medium > 0) return { label: "LOW RISK", color: "text-blue-400", bg: "bg-blue-500/10" };
 return { label: "STABLE", color: "text-emerald-400", bg: "bg-emerald-500/10" };
}

export function AuditSummary({ findings, domain, duration, checksRun }: AuditSummaryProps) {
 const counts: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0, info: 0 };
 for (const f of findings) {
 counts[f.severity] = (counts[f.severity] || 0) + 1;
 }

 const total = findings.length;
 const risk = computeRiskRating(findings);

 function handleExport() {
 const report = {
 domain, duration, checksRun,
 totalFindings: total, severityCounts: counts,
 riskRating: risk.label, findings,
 exportedAt: new Date().toISOString(),
 };
 const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `attack-surface-audit-${domain}-${Date.now()}.json`;
 a.click();
 URL.revokeObjectURL(url);
 }

 return (
 <div className="space-y-6">
 {/* Risk & Highlights */}
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {/* Total Findings Card */}
 <div className="relative overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/30 p-6 backdrop-blur-xl">
 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
 <div className="flex items-center gap-3 mb-4">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
 <LayoutGrid className="h-4 w-4" />
 </div>
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Total Findings</span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-4xl font-medium tracking-tight text-foreground">{total}</span>
 <span className="text-xs text-muted-foreground/40 font-light">Identified Issues</span>
 </div>
 </div>

 {/* Risk Rating Card */}
 <div className="relative overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/30 p-6 backdrop-blur-xl">
 <div className={cn("absolute top-0 right-0 w-24 h-24 blur-2xl rounded-full", risk.bg)} />
 <div className="flex items-center gap-3 mb-4">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
 <Shield className="h-4 w-4" />
 </div>
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Risk Posture</span>
 </div>
 <div className={cn("text-xl font-bold tracking-widest", risk.color)}>{risk.label}</div>
 <div className="mt-2 text-[0.65rem] text-muted-foreground/50 font-medium">Aggregated technical threat score</div>
 </div>

 {/* Timing Card */}
 <div className="relative overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/30 p-6 backdrop-blur-xl">
 <div className="flex items-center gap-3 mb-4">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
 <Clock className="h-4 w-4" />
 </div>
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Execution Time</span>
 </div>
 <div className="text-xl font-medium tracking-tight text-foreground">{duration}</div>
 <div className="mt-2 text-[0.65rem] text-muted-foreground/50 font-medium whitespace-nowrap">Engine processing duration</div>
 </div>

 {/* Checks Done Card */}
 <div className="relative overflow-hidden rounded-[1.75rem] border border-border/40 bg-card/30 p-6 backdrop-blur-xl">
 <div className="flex items-center gap-3 mb-4">
 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground/5 text-muted-foreground">
 <CheckCircle2 className="h-4 w-4" />
 </div>
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">Scope Coverage</span>
 </div>
 <div className="text-xl font-medium tracking-tight text-foreground">{checksRun.length} Protocols</div>
 <div className="mt-2 text-[0.65rem] text-muted-foreground/50 font-medium">Fully validated security checks</div>
 </div>
 </div>

 {/* Severity Breakdown Section */}
 <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
 <div className="relative overflow-hidden rounded-[2rem] border border-border/40 bg-card/20 p-8 backdrop-blur-2xl">
 <div className="flex items-center justify-between mb-8">
 <h3 className="text-[0.7rem] font-bold uppercase tracking-[0.3em] text-muted-foreground/60">Severity Distribution</h3>
 <div className="flex gap-2">
 {SEVERITY_ORDER.map(s => counts[s] > 0 && (
 <div key={s} className={cn("px-3 py-1 rounded-full text-[0.6rem] font-bold tracking-widest uppercase", SEVERITY_THEMES[s].bg, SEVERITY_THEMES[s].text)}>
 {s} ({counts[s]})
 </div>
 ))}
 </div>
 </div>

 {/* Modernized Distribution Bar */}
 <div className="relative flex h-8 w-full overflow-hidden rounded-2xl bg-white/[0.03] p-1 border border-white/5">
 {SEVERITY_ORDER.map((sev) => {
 const pct = total > 0 ? (counts[sev] / total) * 100 : 0;
 if (pct === 0) return null;
 const theme = SEVERITY_THEMES[sev];
 return (
 <div
 key={sev}
 className={cn(theme.dot, "h-full transition-all duration-700 first:rounded-l-xl last:rounded-r-xl group relative")}
 style={{ width: `${pct}%` }}
 >
 <div className={cn("absolute inset-0 opacity-40 blur-sm", theme.dot)} />
 </div>
 );
 })}
 </div>

 <div className="mt-10 grid gap-6 sm:grid-cols-2">
 <div className="space-y-3">
 <h4 className="text-[0.65rem] font-bold tracking-widest text-muted-foreground/40 uppercase">Technical Scope</h4>
 <div className="flex flex-wrap gap-2">
 {checksRun.slice(0, 6).map(check => (
 <span key={check} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[0.7rem] text-zinc-400 font-medium flex items-center gap-2">
 <CheckCircle2 className="h-3 w-3 text-emerald-500/50" />
 {check}
 </span>
 ))}
 {checksRun.length > 6 && <span className="text-[0.7rem] text-muted-foreground/40 self-center">+{checksRun.length - 6} more</span>}
 </div>
 </div>
 <div className="flex flex-col justify-end items-end">
 <button
 onClick={handleExport}
 className="group relative flex h-12 items-center gap-3 overflow-hidden rounded-full bg-card px-8 text-sm font-bold text-foreground transition-all hover:scale-105 active:scale-95 uppercase tracking-widest"
 >
 <Download className="h-4 w-4" />
 Export Intel
 </button>
 </div>
 </div>
 </div>

 {/* Severity Legend / Detailed Counts */}
 <div className="flex flex-col gap-3">
 {SEVERITY_ORDER.map(s => (
 <div key={s} className="flex items-center justify-between rounded-2xl border border-border/40 bg-card/30 p-4 backdrop-blur-xl">
 <div className="flex items-center gap-3">
 <div className={cn("h-2 w-2 rounded-full", SEVERITY_THEMES[s].dot, SEVERITY_THEMES[s].shadow)} />
 <span className="text-[0.75rem] font-bold uppercase tracking-widest text-zinc-400">{s} Priority</span>
 </div>
 <span className={cn("text-lg font-bold", SEVERITY_THEMES[s].text)}>{counts[s]}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
