"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, ExternalLink, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AuditFinding {
 id: string;
 severity: "critical" | "high" | "medium" | "low" | "info";
 category: string;
 title: string;
 description: string;
 evidence: string;
 remediation: string;
 cvss_score?: number;
 cwe_id?: string;
 affected_asset: string;
}

const SEVERITY_CONFIG: Record<string, { dot: string; badge: string; label: string; border: string }> = {
 critical: { dot: "bg-red-500", badge: "bg-red-500/10 text-red-700 border-red-500/15", label: "Critical", border: "border-l-red-500" },
 high: { dot: "bg-orange-500", badge: "bg-orange-500/10 text-orange-700 border-orange-500/15", label: "High", border: "border-l-orange-500" },
 medium: { dot: "bg-amber-500", badge: "bg-amber-500/10 text-amber-700 border-amber-500/15", label: "Medium", border: "border-l-amber-500" },
 low: { dot: "bg-blue-500", badge: "bg-blue-500/10 text-blue-700 border-blue-500/15", label: "Low", border: "border-l-blue-500" },
 info: { dot: "bg-slate-400", badge: "bg-slate-500/10 text-slate-600 border-slate-500/15", label: "Info", border: "border-l-slate-400" },
};

const CATEGORY_LABELS: Record<string, string> = {
 open_port: "Open Port",
 subdomain: "Subdomain",
 ssl: "SSL/TLS",
 header: "Headers",
 dns: "DNS",
 directory: "Directory",
 email: "Email Security",
 waf: "WAF",
};

export function FindingCard({ finding }: { finding: AuditFinding }) {
 const [expanded, setExpanded] = useState(false);
 const config = SEVERITY_CONFIG[finding.severity] || SEVERITY_CONFIG.info;

 return (
 <div className={cn(
 "group relative overflow-hidden rounded-[1.5rem] border border-border/40 bg-card/30 backdrop-blur-xl transition-all duration-300 hover:bg-card/40 hover:border-border/60 hover:",
 expanded ? "ring-1 ring-border/50 " : "hover:-translate-y-0.5"
 )}>
 {/* Visual severity indicator */}
 <div className={cn("absolute top-0 left-0 bottom-0 w-1", config.dot)} />

 {/* Header row — always visible */}
 <button
 onClick={() => setExpanded(!expanded)}
 className="flex w-full items-start gap-5 px-6 py-5 text-left"
 >
 <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary/80 border border-border/50 text-muted-foreground group-hover:text-foreground transition-colors group-hover:scale-105">
 <Shield className="h-4 w-4" />
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-3 mb-2">
 <span className={cn("inline-flex items-center rounded-full border px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-widest backdrop-blur-md transition-all", config.badge)}>
 {config.label}
 </span>
 <span className="rounded-full border border-border/40 bg-white/5 px-3 py-0.5 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 backdrop-blur-md">
 {CATEGORY_LABELS[finding.category] || finding.category}
 </span>
 {finding.cvss_score !== undefined && (
 <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/10 px-3 py-0.5">
 <span className="text-[0.6rem] font-bold text-muted-foreground/40 uppercase tracking-widest">CVSS</span>
 <span className={cn("text-[0.65rem] font-bold", 
 finding.cvss_score >= 9 ? "text-red-400" : 
 finding.cvss_score >= 7 ? "text-orange-400" : 
 finding.cvss_score >= 4 ? "text-amber-400" : "text-blue-400"
 )}>
 {finding.cvss_score.toFixed(1)}
 </span>
 </div>
 )}
 </div>

 <p className="text-[1.1rem] font-medium text-foreground tracking-tight leading-snug group-hover:text-glow-xs transition-all">{finding.title}</p>
 <p className={cn("mt-1 text-sm leading-6 text-muted-foreground/70 font-light transition-all", !expanded && "line-clamp-2")}>
 {finding.description}
 </p>
 </div>

 <div className={cn("mt-2.5 shrink-0 transition-transform duration-300", expanded ? "rotate-180" : "rotate-0")}>
 <ChevronDown className="h-5 w-5 text-muted-foreground/40" />
 </div>
 </button>

 {/* Expanded details */}
 {expanded && (
 <div className="border-t border-border/20 px-6 pb-6 pt-5 bg-black/10 animate-in fade-in slide-in-from-top-2 duration-300">
 <div className="space-y-6">
 {/* Meta info toolbar */}
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div className="flex items-center gap-2">
 <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground/40">Target Component:</span>
 <span className="rounded-lg bg-secondary/80 px-2.5 py-1 font-mono text-[0.7rem] text-foreground/80 border border-border/40">
 {finding.affected_asset}
 </span>
 </div>
 {finding.cwe_id && (
 <div className="flex items-center gap-2">
 <span className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground/40">CWE Catalog:</span>
 <a
 href={`https://cwe.mitre.org/data/definitions/${finding.cwe_id.replace("CWE-", "")}.html`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors font-medium border-b border-teal-400/30 pb-0.5"
 >
 {finding.cwe_id}
 <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 )}
 </div>

 {/* Evidence Block */}
 {finding.evidence && (
 <div className="relative overflow-hidden rounded-[1.25rem] border border-border/40 bg-[#0A0A0B] p-5 ">
 <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl rounded-full" />
 <div className="flex items-center justify-between mb-3">
 <span className="text-[0.65rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/40">Extraction Evidence</span>
 <div className="flex gap-1.5">
 <div className="h-2 w-2 rounded-full bg-red-500/20" />
 <div className="h-2 w-2 rounded-full bg-orange-500/20" />
 <div className="h-2 w-2 rounded-full bg-emerald-500/20" />
 </div>
 </div>
 <div className="font-mono text-[0.75rem] leading-relaxed text-emerald-400/80 overflow-x-auto whitespace-pre-wrap selection:bg-emerald-500/30">
 {finding.evidence}
 </div>
 </div>
 )}

 {/* Remediation Block */}
 {finding.remediation && (
 <div className="relative overflow-hidden rounded-[1.25rem] border border-emerald-500/20 bg-emerald-500/[0.03] p-6">
 <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
 <h4 className="relative z-10 text-[0.7rem] font-bold uppercase tracking-[0.25em] text-emerald-400 mb-3">Remediation Roadmap</h4>
 <p className="relative z-10 text-[0.9rem] leading-relaxed text-emerald-400/60 font-medium">
 {finding.remediation}
 </p>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
