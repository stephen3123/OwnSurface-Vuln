"use client";

import { useState, useMemo } from "react";
import type { ScanResult } from "@/lib/api-client";
import { evaluateAllRegulations, type ComplianceResult } from "@/lib/compliance/engine";
import { Check, X, Minus, Globe, AlertTriangle, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComplianceChecklistProps {
 scan: ScanResult;
}

function StatusIcon({ status }: { status: string }) {
 if (status === "pass") return <Check className="h-3 w-3 text-emerald-500 font-black" />;
 if (status === "fail") return <X className="h-3 w-3 text-rose-500 font-black" />;
 return <Minus className="h-3 w-3 text-slate-400" />;
}

function getStatusColor(status: string): string {
 if (status === "compliant") return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
 if (status === "partial") return "bg-amber-500/10 text-amber-600 border-amber-500/20";
 if (status === "non_compliant") return "bg-rose-500/10 text-rose-600 border-rose-500/20";
 return "bg-slate-500/5 text-slate-500 border-border/40";
}

function getStatusLabel(status: string): string {
 if (status === "compliant") return "FULLY COMPLIANT";
 if (status === "partial") return "PARTIAL ALIGNMENT";
 if (status === "non_compliant") return "NON-COMPLIANT";
 return "PENDING AUDIT";
}

export function ComplianceChecklist({ scan }: ComplianceChecklistProps) {
 const results = useMemo(() => evaluateAllRegulations(scan), [scan]);

 if (results.length === 0) return null;

 const compliantCount = results.filter((r) => r.status === "compliant").length;
 const partialCount = results.filter((r) => r.status === "partial").length;
 const nonCompliantCount = results.filter((r) => r.status === "non_compliant").length;
 const totalChecks = results.reduce((sum, r) => sum + r.checks.length, 0);
 const passingChecks = results.reduce((sum, r) => sum + r.passCount, 0);
 const overallPct = totalChecks > 0 ? Math.round((passingChecks / totalChecks) * 100) : 0;

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
 <Scale className="h-4.5 w-4.5 text-teal-500/60" />
 Regulatory Compliance Matrix
 </div>

 <p className="text-[0.72rem] text-muted-foreground/40 font-light leading-relaxed mb-8 px-1">
 Active analysis of {results.length} international privacy frameworks against discovered architectural signals.
 </p>

 {/* Summary stats */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 px-1">
 <div className="p-5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 group transition-colors hover:bg-emerald-500/10">
 <div className="text-[1.2rem] font-black text-emerald-600 tracking-tighter mb-1">{compliantCount}</div>
 <div className="text-[0.55rem] font-black uppercase tracking-widest text-emerald-600/60">Fully Compliant</div>
 </div>
 <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 group transition-colors hover:bg-amber-500/10">
 <div className="text-[1.2rem] font-black text-amber-600 tracking-tighter mb-1">{partialCount}</div>
 <div className="text-[0.55rem] font-black uppercase tracking-widest text-amber-600/60">Partial Alignment</div>
 </div>
 <div className="p-5 rounded-2xl bg-rose-500/5 border border-rose-500/10 group transition-colors hover:bg-rose-500/10">
 <div className="text-[1.2rem] font-black text-rose-600 tracking-tighter mb-1">{nonCompliantCount}</div>
 <div className="text-[0.55rem] font-black uppercase tracking-widest text-rose-600/60">Non-compliant</div>
 </div>
 </div>

 {/* Overall progress */}
 <div className="mb-10 px-1">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
 Global Assurance Level
 </span>
 <span className="text-[0.8rem] font-black tracking-tighter text-foreground/70">
 {passingChecks}/{totalChecks} Validated
 </span>
 </div>
 <div className="h-2 rounded-full bg-card/50 border border-border/40 overflow-hidden ">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-1000 ease-out",
 overallPct >= 80 ? "bg-emerald-500/60" : overallPct >= 50 ? "bg-amber-500/60" : "bg-rose-500/60"
 )}
 style={{ width: `${overallPct}%` }}
 />
 </div>
 </div>

 {/* Regulation list */}
 <div className="space-y-3 mb-10 px-1">
 {results.map((result) => (
 <RegulationRow key={result.regulation.id} result={result} />
 ))}
 </div>

 <div className="mt-auto px-1">
 <div className="flex items-start gap-4 p-5 rounded-2xl bg-card/50 border border-border/20 transition-all hover:bg-card">
 <div className="h-8 w-8 rounded-xl bg-slate-500/5 flex items-center justify-center shrink-0 border border-border/40 ">
 <AlertTriangle className="h-4 w-4 text-slate-400 opacity-60" />
 </div>
 <p className="text-[0.68rem] leading-relaxed text-muted-foreground/60 font-medium italic">
 Architectural analysis provided for informational purposes only. This node does not substitute professional legal counsel. Compliance status depends on multi-vector factors beyond external reconnaissance.
 </p>
 </div>
 </div>
 </div>
 );
}

function RegulationRow({ result }: { result: ComplianceResult }) {
 const [expanded, setExpanded] = useState(false);
 const { regulation, status, passCount, checks } = result;

 return (
 <div className={cn(
 "rounded-2xl border transition-all duration-300 overflow-hidden ",
 expanded ? "bg-card/50 border-border/60" : "bg-card/50 border-border/20 hover:bg-card"
 )}>
 <button
 onClick={() => setExpanded(!expanded)}
 className="flex w-full items-center gap-4 p-4 text-left group"
 >
 <div className="h-10 w-10 rounded-xl bg-card flex items-center justify-center shrink-0 border border-border/10 group-hover:scale-110 transition-transform">
 <Globe className="h-5 w-5 text-blue-500/40" />
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <span className="text-[0.85rem] font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">{regulation.name}</span>
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/30">{regulation.region}</span>
 </div>
 <div className="text-[0.68rem] font-bold text-muted-foreground/40">
 {passCount}/{checks.length} checks passing
 </div>
 </div>
 <span className={cn("px-2.5 py-1 rounded-md border text-[0.55rem] font-black uppercase tracking-widest ", getStatusColor(status))}>
 {getStatusLabel(status)}
 </span>
 </button>

 {expanded && (
 <div className="border-t border-border/40 bg-card/50 p-5 space-y-3">
 {checks.map(({ check, result: checkResult }) => (
 <div key={check.id} className="flex items-center gap-4 group/item">
 <div className="h-6 w-6 rounded-lg bg-card/50 flex items-center justify-center shrink-0 border border-border/20 ">
 <StatusIcon status={checkResult} />
 </div>
 <span className="text-[0.75rem] font-medium text-muted-foreground/60 group-hover/item:text-foreground/70 transition-colors tracking-tight">{check.title}</span>
 </div>
 ))}
 <div className="pt-4 mt-2 border-t border-border/10 text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/20 italic">
 Full Protocol Reference: {regulation.full_name}
 </div>
 </div>
 )}
 </div>
 );
}

