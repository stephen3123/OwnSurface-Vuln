"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface Finding {
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
 tool_used?: string;
 request_payload?: string;
 response_snippet?: string;
 proof_of_concept?: string;
}

const SEVERITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
 critical: { bg: "bg-red-50", text: "text-red-950", border: "border-red-200" },
 high: { bg: "bg-orange-50", text: "text-orange-950", border: "border-orange-200" },
 medium: { bg: "bg-amber-50", text: "text-amber-950", border: "border-amber-200" },
 low: { bg: "bg-blue-50", text: "text-blue-950", border: "border-blue-200" },
 info: { bg: "bg-slate-50", text: "text-slate-950", border: "border-slate-200" },
};

export function FindingCard({ finding }: { finding: Finding }) {
 const [expanded, setExpanded] = useState(false);
 const [copied, setCopied] = useState(false);

 const style = SEVERITY_STYLES[finding.severity] || SEVERITY_STYLES.info;

 const copyToClipboard = (text: string) => {
 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 };

 return (
 <div
 className={cn(
 "rounded-[1.2rem] border bg-card/50 transition-all duration-300",
 style.border,
 expanded ? " scale-[1.01]" : "hover:border-white/10"
 )}
 >
 <button
 onClick={() => setExpanded(!expanded)}
 className="flex w-full items-center gap-4 px-6 py-5 text-left hover:bg-muted/10 rounded-[1.2rem] transition-all"
 >
 {/* Expand/collapse indicator */}
 <span className="text-[0.6rem] font-medium text-muted-foreground w-4">
 {expanded ? "[-]" : "[+]"}
 </span>

 {/* Severity badge */}
 <span
 className={cn(
 "inline-flex shrink-0 items-center rounded-md border px-2.5 py-1 text-[0.62rem] font-medium uppercase tracking-widest",
 style.bg,
 style.text,
 style.border
 )}
 >
 {finding.severity}
 </span>

 {/* Title */}
 <span className="flex-1 min-w-0 truncate text-[0.95rem] font-medium tracking-tight text-foreground">
 {finding.title}
 </span>

 {/* CVSS & Tool Row */}
 <div className="flex items-center gap-3 shrink-0">
 {finding.cvss_score && (
 <span className="text-[0.65rem] font-medium text-muted-foreground bg-muted/30 px-2.5 py-1 rounded-md border border-border uppercase tracking-widest">
 BASE {finding.cvss_score}
 </span>
 )}

 {finding.tool_used && (
 <span className="hidden items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1 text-[0.65rem] font-medium text-muted-foreground uppercase tracking-widest sm:inline-flex">
 {finding.tool_used}
 </span>
 )}
 </div>
 </button>

 {expanded && (
 <div className="border-t border-border/70 px-5 py-5 space-y-6">
 {/* Description */}
 <div>
 <h4 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">Detailed Intelligence</h4>
 <p className="text-[0.9rem] text-foreground/80 leading-relaxed bg-muted/20 p-5 rounded-[1.2rem] border border-border/40 font-medium">{finding.description}</p>
 </div>

 {/* Evidence */}
 {finding.evidence && (
 <div>
 <h4 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">Technical Evidence</h4>
 <div className="relative group overflow-hidden rounded-[1.2rem] border border-border bg-zinc-950 ">
 <div className="absolute top-0 left-0 w-full h-10 bg-white/5 border-b border-white/5 flex items-center px-4">
 <span className="text-[0.65rem] text-white/40 font-medium uppercase tracking-widest">RAW PAYLOAD TRACE</span>
 </div>
 <pre className="overflow-x-auto p-4 pt-10 text-xs text-sky-200/90 font-mono leading-relaxed custom-scrollbar">
 {finding.evidence}
 </pre>
 </div>
 </div>
 )}

 {/* Proof of Concept */}
 {finding.proof_of_concept && (
 <div>
 <div className="mb-3 flex items-center justify-between">
 <h4 className="text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">Proof of Concept</h4>
 <button
 onClick={() => copyToClipboard(finding.proof_of_concept!)}
 className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white text-[0.6rem] font-semibold uppercase tracking-widest transition-all hover:bg-black"
 >
 {copied ? "COPIED" : "COPY POC"}
 </button>
 </div>
 <div className="relative overflow-hidden rounded-[1.2rem] border border-border bg-zinc-950 ">
 <pre className="overflow-x-auto p-5 text-emerald-400 font-mono text-[0.8rem] leading-relaxed custom-scrollbar">
 {finding.proof_of_concept}
 </pre>
 </div>
 </div>
 )}

 {/* Remediation */}
 <div>
 <h4 className="mb-3 text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">Remediation Guide</h4>
 <div className="text-[0.9rem] text-emerald-950 leading-relaxed bg-emerald-50 p-6 rounded-[1.2rem] border border-emerald-200 font-medium uppercase tracking-wide">
 {finding.remediation}
 </div>
 </div>

 {/* Metadata chips */}
 <div className="flex flex-wrap gap-2 pt-2">
 {finding.cwe_id && (
 <span className="rounded-md border border-border bg-muted/20 px-3 py-1.5 text-[0.62rem] font-medium uppercase tracking-widest text-foreground">
 CWE IDENTIFIER: {finding.cwe_id}
 </span>
 )}
 {finding.affected_asset && (
 <span className="rounded-md border border-border bg-muted/20 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-widest text-foreground">
 ASSET: {finding.affected_asset}
 </span>
 )}
 {finding.category && (
 <span className="rounded-md border border-border bg-muted/20 px-3 py-1.5 text-[0.62rem] font-black uppercase tracking-widest text-foreground">
 CATEGORY: {finding.category}
 </span>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
