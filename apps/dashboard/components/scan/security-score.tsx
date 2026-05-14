"use client";

import type { SecurityResult } from "@/lib/api-client";
import { getSecurityGrade, getSecurityColor, getSecurityBgColor } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface SecurityScoreProps {
 security: SecurityResult;
}

function getSeverityColor(severity: string) {
 switch (severity) {
 case "critical":
 return "bg-red-500/10 text-red-400 border-red-500/20";
 case "high":
 return "bg-orange-500/10 text-orange-400 border-orange-500/20";
 case "medium":
 return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
 case "low":
 return "bg-blue-500/10 text-blue-400 border-blue-500/20";
 default:
 return "bg-slate-500/10 text-slate-400 border-slate-500/20";
 }
}

export function SecurityScore({ security }: SecurityScoreProps) {
 const grade = getSecurityGrade(security.score);
 const colorClass = getSecurityColor(security.score);
 
 const statusLabel = security.score >= 80 ? "Optimized" : security.score >= 50 ? "Partially Hardened" : "Vulnerable";

 const passedHeaders = security.headers.filter((h) => h.present).length;
 const totalHeaders = security.headers.length;

 const circumference = 2 * Math.PI * 52;
 const dashOffset = circumference * (1 - security.score / 100);

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.2em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Security Standards Compliance
 </div>

 <div className="grid gap-12 lg:grid-cols-2 px-1">
 {/* Left Col: Dial & Summary */}
 <div className="flex flex-col">
 <div className="flex items-center gap-8 mb-10 p-6 rounded-[2rem] bg-card/50 border border-border/40 group">
 <div className="relative w-32 h-32 shrink-0 scale-110">
 <svg className="w-32 h-32 -rotate-90" viewBox="0 0 120 120">
 <circle cx="60" cy="60" r="52" fill="none" stroke="hsl(var(--muted) / 0.1)" strokeWidth="6" />
 <circle
 cx="60"
 cy="60"
 r="52"
 fill="none"
 stroke="currentColor"
 strokeWidth="6"
 strokeLinecap="round"
 strokeDasharray={circumference}
 className={cn("transition-all duration-1000 ease-out", colorClass)}
 style={{ strokeDashoffset: dashOffset }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className={cn("text-4xl font-black tracking-tighter leading-none", colorClass.split(" ")[0])}>{grade}</span>
 <span className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground/40 mt-1">{security.score}</span>
 </div>
 </div>
 
 <div className="flex-1">
 <div className="flex items-center gap-2 mb-2">
 <span className={cn("text-xl font-black tracking-tight uppercase", colorClass.split(" ")[0])}>
 {statusLabel}
 </span>
 </div>
 <p className="text-[0.82rem] text-muted-foreground/80 font-light leading-relaxed">
 Verification of industry-standard security headers and configuration presets.
 </p>
 <div className="mt-4 flex items-center gap-2">
 <div className="flex h-1.5 w-24 bg-muted/20 rounded-full overflow-hidden">
 <div className={cn("h-full", colorClass.replace("text-", "bg-"))} style={{ width: `${(passedHeaders / totalHeaders) * 100}%` }} />
 </div>
 <span className="text-[0.65rem] font-bold text-muted-foreground/60">{passedHeaders}/{totalHeaders} Passed</span>
 </div>
 </div>
 </div>

 {/* Critical Observations */}
 <div className="space-y-4">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 ml-1">Current Observations</h4>
 {security.issues.length > 0 ? (
 <div className="space-y-2.5">
 {security.issues.map((issue, i) => (
 <div key={i} className={cn("flex items-start gap-4 p-4 rounded-2xl border transition-all hover:bg-card/50", getSeverityColor(issue.severity))}>
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 mb-1">
 <span className="text-sm font-black tracking-tight uppercase">{issue.title}</span>
 <span className="text-[0.55rem] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border border-current">{issue.severity}</span>
 </div>
 <p className="text-[0.78rem] font-bold opacity-80 leading-relaxed font-mono">{issue.description}</p>
 </div>
 </div>
 ))}
 </div>
 ) : (
 <div className="flex items-center gap-3 p-6 rounded-2xl bg-emerald-500/10 border border-emerald-200 text-emerald-800">
 <span className="text-xs font-black uppercase tracking-widest">Safe: No critical configuration issues detected.</span>
 </div>
 )}
 </div>
 </div>

 {/* Right Col: Headers Base */}
 <div className="flex flex-col">
 <div className="rounded-[2rem] bg-card/50 border border-border/40 p-6 overflow-hidden h-full">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-foreground mb-6 underline decoration-2 underline-offset-8">
 Raw Header Analysis
 </h4>
 <div className="space-y-3 custom-scrollbar overflow-y-auto pr-2" style={{ maxHeight: "calc(100% - 2rem)" }}>
 {security.headers.map((header) => (
 <div key={header.name} className="group flex items-center justify-between gap-4 py-3 border-b border-border/20 last:border-0 hover:bg-card/50 px-2 rounded-lg transition-colors">
 <div className="flex min-w-0 items-center gap-3">
 <span className={cn("text-[0.6rem] font-black uppercase px-2 py-0.5 rounded border", header.present ? "bg-emerald-50 text-emerald-800 border-emerald-100" : "bg-red-50 text-red-800 border-red-100")}>
 {header.present ? "Pass" : "Fail"}
 </span>
 <span className="text-xs font-mono font-black text-foreground truncate">{header.name}</span>
 </div>
 {header.value && (
 <div className="ml-auto flex flex-col items-end min-w-0">
 <span className="text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/40 mb-0.5">Assigned Value</span>
 <span className="text-[0.7rem] text-muted-foreground truncate max-w-[12rem] font-mono group-hover:text-muted-foreground/80" title={header.value}>
 {header.value}
 </span>
 </div>
 )}
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
