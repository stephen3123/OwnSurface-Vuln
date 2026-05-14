"use client";

import { Shield, Mail, Key, Lock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface SPFResult {
 found: boolean;
 record?: string;
 policy?: string;
 issues: string[];
}

interface DMARCResult {
 found: boolean;
 record?: string;
 policy?: string;
 issues: string[];
}

interface DKIMResult {
 found: boolean;
}

interface DNSSECResult {
 enabled: boolean;
}

interface DNSSecurityProps {
 spf: SPFResult;
 dmarc: DMARCResult;
 dkim: DKIMResult;
 dnssec: DNSSECResult;
 score: number;
}

function StatusCard({
 icon: Icon,
 title,
 found,
 detail,
 issues,
}: {
 icon: React.ComponentType<{ className?: string }>;
 title: string;
 found: boolean;
 detail?: string;
 issues?: string[];
}) {
 return (
 <div
 className={cn(
 "group relative p-5 rounded-2xl border transition-all duration-300",
 found
 ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/8"
 : "bg-red-500/5 border-red-500/10 hover:bg-red-500/8 "
 )}
 >
 <div className="flex items-center gap-4 mb-4">
 <div
 className={cn(
 "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ",
 found ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
 )}
 >
 <Icon className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-0.5">{title}</p>
 <p className={cn("text-sm font-semibold tracking-tight", found ? "text-emerald-600/80" : "text-red-500/80")}>
 {found ? "Verified" : "Missing"}
 </p>
 </div>
 </div>
 
 {detail && (
 <div className="mt-3 p-3 rounded-xl bg-card/50 border border-border/20 group-hover:bg-card/50 transition-colors">
 <p className="text-[0.7rem] text-muted-foreground/60 font-mono break-all leading-relaxed">{detail}</p>
 </div>
 )}

 {issues && issues.length > 0 && (
 <div className="mt-4 space-y-2">
 {issues.map((issue, i) => (
 <div key={i} className="flex items-start gap-2 p-2 rounded-xl bg-orange-500/5 border border-orange-500/10">
 <AlertTriangle className="w-3.5 h-3.5 text-orange-500/60 mt-0.5 shrink-0" />
 <p className="text-[0.65rem] text-orange-600/70 font-medium leading-relaxed">{issue}</p>
 </div>
 ))}
 </div>
 )}
 
 {!found && (
 <div className="absolute top-4 right-4 animate-pulse">
 <div className="h-2 w-2 rounded-full bg-red-500/40" />
 </div>
 )}
 </div>
 );
}

function getPolicyLabel(policy?: string): string {
 if (!policy) return "";
 switch (policy.toLowerCase()) {
 case "reject":
 return "Policy: reject (strict)";
 case "quarantine":
 return "Policy: quarantine";
 case "none":
 return "Policy: none (monitoring only)";
 default:
 return `Policy: ${policy}`;
 }
}

export function DNSSecurity({ spf, dmarc, dkim, dnssec, score }: DNSSecurityProps) {
 return (
 <div className="space-y-8">
 {/* Score bar */}
 <div className="flex flex-col gap-3">
 <div className="flex items-center justify-between px-1">
 <span className="text-[0.62rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">Infrastructure Trust Score</span>
 <span className="text-[0.8rem] font-bold text-teal-600/80">{score}/100</span>
 </div>
 <div className="h-2 rounded-full bg-card/50 border border-border/40 overflow-hidden ">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-1000 ease-out ",
 score >= 80
 ? "bg-emerald-500/60"
 : score >= 60
 ? "bg-yellow-500/60"
 : score >= 40
 ? "bg-orange-500/60"
 : "bg-red-500/60"
 )}
 style={{ width: `${score}%` }}
 />
 </div>
 </div>

 {/* 2x2 grid */}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <StatusCard
 icon={Shield}
 title="Sender Policy Framework"
 found={spf.found}
 detail={
 spf.found
 ? [spf.record, getPolicyLabel(spf.policy)].filter(Boolean).join(" — ")
 : undefined
 }
 issues={spf.issues}
 />
 <StatusCard
 icon={Mail}
 title="DMARC Authentication"
 found={dmarc.found}
 detail={
 dmarc.found
 ? [dmarc.record, getPolicyLabel(dmarc.policy)].filter(Boolean).join(" — ")
 : undefined
 }
 issues={dmarc.issues}
 />
 <StatusCard icon={Key} title="DKIM Record" found={dkim.found} />
 <StatusCard icon={Lock} title="DNSSEC Hardening" found={dnssec.enabled} />
 </div>
 </div>
 );
}
