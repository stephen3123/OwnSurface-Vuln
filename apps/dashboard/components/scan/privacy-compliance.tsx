"use client";

import { cn } from "@/lib/utils";

interface PrivacyData {
 has_cookie_banner: boolean;
 banner_provider?: string | null;
 tracking_before_consent: boolean;
 tracking_scripts: string[];
 has_privacy_policy: boolean;
 has_terms: boolean;
 compliance_score: number;
 issues: string[];
}

interface PrivacyComplianceProps {
 privacy: PrivacyData;
}

function ChecklistItem({
 label,
 passed,
 detail,
 warning,
}: {
 label: string;
 passed: boolean;
 detail?: string;
 warning?: boolean;
}) {
 return (
 <div
 className={cn(
 "group relative flex items-start gap-4 p-4 rounded-2xl border transition-all duration-300 ",
 warning
 ? "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
 : passed
 ? "bg-white/5 border-white/5 hover:bg-card/50"
 : "bg-orange-500/5 border-orange-500/10 hover:bg-orange-500/10"
 )}
 >
 <div
 className={cn(
 "w-10 h-10 rounded-sm border border-current/20 flex items-center justify-center shrink-0 font-black text-[0.6rem] uppercase tracking-tighter",
 warning
 ? "bg-rose-100 text-rose-900"
 : passed
 ? "bg-emerald-100 text-emerald-900"
 : "bg-orange-100 text-orange-900"
 )}
 >
 {passed ? (warning ? "!!" : "OK") : "!!"}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 mb-0.5">
 <p className="text-[0.85rem] font-black tracking-tight text-foreground uppercase">{label}</p>
 </div>
 {detail && <p className="text-[0.72rem] text-muted-foreground font-black uppercase tracking-tight leading-relaxed">{detail}</p>}
 </div>
 
 {/* No icons */}
 </div>
 );
}

export function PrivacyCompliance({ privacy }: PrivacyComplianceProps) {
 const score = privacy.compliance_score;

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border border-border transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Privacy Framework Audit
 </div>

 {/* Score progress bar */}
 <div className="mb-8 px-1">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground">
 Compliance Integrity
 </span>
 <span className={cn(
 "text-[0.8rem] font-black tracking-tighter",
 score >= 90 ? "text-emerald-600" : score >= 70 ? "text-amber-600" : "text-rose-600"
 )}>
 {score}% OPERATIONAL
 </span>
 </div>
 <div className="h-2 w-full bg-muted border border-border rounded-none p-[1px]">
 <div
 className={cn(
 "h-full rounded-none transition-all duration-1000 ",
 score >= 90 ? "bg-emerald-600" : score >= 70 ? "bg-amber-600" : "bg-rose-600"
 )}
 style={{ width: `${score}%` }}
 />
 </div>
 </div>

 {/* Checklist */}
 <div className="grid gap-3 mb-8 px-1">
 <ChecklistItem
 label="Consent Architecture"
 passed={privacy.has_cookie_banner}
 detail={
 privacy.has_cookie_banner
 ? privacy.banner_provider
 ? `Active Node: ${privacy.banner_provider}`
 : "Active banner detected in crawl"
 : "No compliant consent mechanism identified"
 }
 />
 <ChecklistItem
 label="Pre-Consent Surveillance"
 passed={!privacy.tracking_before_consent}
 warning={privacy.tracking_before_consent}
 detail={
 privacy.tracking_before_consent
 ? "Surveillance scripts executing before user authorization"
 : "Zero passive tracking detected before handshake"
 }
 />
 <ChecklistItem
 label="Privacy Disclosure"
 passed={privacy.has_privacy_policy}
 detail={privacy.has_privacy_policy ? "Documented privacy policy discovered" : "Missing required disclosure node"}
 />
 <ChecklistItem
 label="Terms of Service"
 passed={privacy.has_terms}
 detail={privacy.has_terms ? "Legal terms of service discovered" : "Missing required service terms node"}
 />
 </div>

 {/* Tracking scripts */}
 {(privacy.tracking_scripts || []).length > 0 && (
 <div className="mb-8 px-1">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
 Tracking Infrastructure ({(privacy.tracking_scripts || []).length})
 </h4>
 <div className="space-y-2">
 {(privacy.tracking_scripts || []).map((script, i) => (
 <div
 key={i}
 className="flex items-center gap-3 p-3 rounded-sm bg-muted border border-border group hover:bg-card transition-all"
 >
 <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
 <span className="text-[0.7rem] font-black uppercase tracking-widest text-foreground group-hover:text-blue-700 transition-colors truncate">{script}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Issues */}
 {privacy.issues.length > 0 && (
 <div className="px-1">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
 Corrective Protocols
 </h4>
 <div className="space-y-2.5">
 {privacy.issues.map((issue, i) => (
 <div
 key={i}
 className="flex items-center gap-4 p-4 rounded-xl bg-orange-50 border border-orange-200 "
 >
 <div className="h-8 w-8 rounded-sm bg-orange-200 flex items-center justify-center shrink-0 font-black text-[0.6rem] text-orange-900">
 !
 </div>
 <p className="text-[0.82rem] text-orange-900 leading-relaxed font-black uppercase tracking-tight">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
