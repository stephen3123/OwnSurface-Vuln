"use client";

import { Cookie, Check, X, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface CookieEntry {
 name: string;
 domain?: string;
 httpOnly: boolean;
 secure: boolean;
 sameSite: string;
 hasSecurePrefix: boolean;
 issues: string[];
}

interface CookieAuditProps {
 cookies: CookieEntry[];
 score: number;
 issues: string[];
}

function BoolIcon({ value }: { value: boolean }) {
 return value ? (
 <Check className="w-4 h-4 text-emerald-400" />
 ) : (
 <X className="w-4 h-4 text-red-400" />
 );
}

function getScoreColor(score: number) {
 if (score >= 80) return "text-emerald-400";
 if (score >= 60) return "text-yellow-400";
 if (score >= 40) return "text-orange-400";
 return "text-red-400";
}

function getScoreStroke(score: number) {
 if (score >= 80) return "stroke-emerald-400";
 if (score >= 60) return "stroke-yellow-400";
 if (score >= 40) return "stroke-orange-400";
 return "stroke-red-400";
}

function getScoreTrack(score: number) {
 if (score >= 80) return "stroke-emerald-400/15";
 if (score >= 60) return "stroke-yellow-400/15";
 if (score >= 40) return "stroke-orange-400/15";
 return "stroke-red-400/15";
}

export function CookieAudit({ cookies, score, issues }: CookieAuditProps) {
 if (cookies.length === 0 && issues.length === 0) {
 return (
 <div className="flex items-center gap-4 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 ">
 <div className="h-10 w-10 rounded-full bg-emerald-500/10 flex items-center justify-center shrink-0">
 <Cookie className="w-5 h-5 text-emerald-500" />
 </div>
 <div>
 <p className="text-[0.9rem] font-semibold text-emerald-600/80 tracking-tight">Zero Session Footprint</p>
 <p className="text-[0.75rem] text-muted-foreground/60 font-light mt-0.5">
 No active session cookies were intercepted during the standard crawl procedure.
 </p>
 </div>
 </div>
 );
 }

 const circumference = 2 * Math.PI * 40;
 const dashOffset = circumference - (score / 100) * circumference;

 return (
 <div className="space-y-10">
 {/* Score + Summary */}
 <div className="flex items-center gap-8 p-6 rounded-[2rem] bg-card/50 border border-border/20 group">
 <div className="relative w-24 h-24 shrink-0 scale-110">
 <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
 <circle cx="48" cy="48" r="40" fill="none" strokeWidth="4" className={cn("opacity-10", getScoreStroke(score))} />
 <circle
 cx="48"
 cy="48"
 r="40"
 fill="none"
 strokeWidth="4"
 strokeLinecap="round"
 strokeDasharray={circumference}
 strokeDashoffset={dashOffset}
 className={cn("transition-all duration-1000 ease-out", getScoreStroke(score))}
 style={{ strokeDashoffset: dashOffset }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className={cn("text-2xl font-black tracking-tighter leading-none", getScoreColor(score))}>{score}</span>
 <span className="text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground/30 mt-0.5">Rating</span>
 </div>
 </div>
 <div className="flex-1">
 <div className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-1">Session Security Audit</div>
 <p className="text-[0.95rem] font-semibold text-foreground/80 tracking-tight leading-none mb-2">Cookie Configuration Baseline</p>
 <p className="text-[0.75rem] text-muted-foreground/80 font-light leading-relaxed max-w-[12rem]">
 {cookies.length} active persistent markers analyzed for attribute hardening.
 </p>
 </div>
 </div>

 {/* Cookie matrix */}
 {cookies.length > 0 && (
 <div className="custom-scrollbar overflow-x-auto pr-1">
 <table className="w-full">
 <thead>
 <tr className="text-left text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/30 border-b border-border/20">
 <th className="pb-3 pr-4">Marker Alias</th>
 <th className="pb-3 pr-4 text-center">HttpOnly</th>
 <th className="pb-3 pr-4 text-center">Secure</th>
 <th className="pb-3 pr-4 text-center">State</th>
 <th className="pb-3 text-center">Prefix</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/20">
 {cookies.map((cookie) => (
 <tr key={cookie.name} className="group hover:bg-card/50 transition-colors">
 <td className="py-4 pr-4">
 <div className="flex flex-col gap-1">
 <span className="font-mono text-[0.7rem] font-bold text-foreground/70 group-hover:text-foreground transition-colors">{cookie.name}</span>
 {cookie.domain && (
 <span className="text-[0.6rem] text-muted-foreground/40 font-mono tracking-tight">{cookie.domain}</span>
 )}
 </div>
 {cookie.issues.length > 0 && (
 <div className="mt-2 space-y-1">
 {cookie.issues.map((issue, i) => (
 <div key={i} className="flex items-center gap-1.5 text-[0.65rem] font-medium text-orange-500/80">
 <div className="h-1 w-1 rounded-full bg-orange-500/40" />
 {issue}
 </div>
 ))}
 </div>
 )}
 </td>
 <td className="py-4 pr-4 text-center">
 <div className="flex justify-center">
 <div className={cn("h-6 w-6 rounded-full flex items-center justify-center transition-colors", cookie.httpOnly ? "bg-emerald-500/5" : "bg-red-500/5")}>
 <BoolIcon value={cookie.httpOnly} />
 </div>
 </div>
 </td>
 <td className="py-4 pr-4 text-center">
 <div className="flex justify-center">
 <div className={cn("h-6 w-6 rounded-full flex items-center justify-center transition-colors", cookie.secure ? "bg-emerald-500/5" : "bg-red-500/5")}>
 <BoolIcon value={cookie.secure} />
 </div>
 </div>
 </td>
 <td className="py-4 pr-4 text-center">
 <span
 className={cn(
 "inline-flex px-2 py-0.5 rounded-md text-[0.6rem] font-black uppercase tracking-widest border",
 cookie.sameSite === "Strict" || cookie.sameSite === "Lax"
 ? "bg-emerald-500/5 text-emerald-600/70 border-emerald-500/20"
 : cookie.sameSite === "None"
 ? "bg-orange-500/5 text-orange-600/70 border-orange-500/20 "
 : "bg-slate-500/5 text-slate-500/70 border-border/40"
 )}
 >
 {cookie.sameSite || "Unset"}
 </span>
 </td>
 <td className="py-4 text-center">
 <div className="flex justify-center">
 <div className={cn("h-6 w-6 rounded-full flex items-center justify-center transition-colors ", cookie.hasSecurePrefix ? "bg-emerald-500/5" : "bg-white/5 border border-border/20")}>
 <BoolIcon value={cookie.hasSecurePrefix} />
 </div>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Issues summary */}
 {issues.length > 0 && (
 <div className="space-y-3">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 ml-1">Critical Anomalies</h4>
 <div className="grid gap-2.5">
 {issues.map((issue, i) => (
 <div
 key={i}
 className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 group hover:bg-orange-500/10 transition-all"
 >
 <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
 <AlertTriangle className="w-4 h-4 text-orange-500/60" />
 </div>
 <p className="text-[0.82rem] text-orange-600/80 leading-relaxed font-light">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
