"use client";

import { Check, X, AlertTriangle, Eye, FileText, Shield, Code, Cookie, Tag } from "lucide-react";
import type { PrivacyResult } from "@/lib/api-client";

interface PrivacyCompliancePanelProps {
 privacy: PrivacyResult | undefined;
 domain: string;
}

const TRACKER_CATEGORIES: Record<string, { label: string; keywords: string[] }> = {
 analytics: { label: "Analytics", keywords: ["google analytics", "ga4", "gtag", "gtm", "google tag", "matomo", "plausible", "fathom", "amplitude", "mixpanel", "segment", "heap", "hotjar", "clarity", "fullstory", "posthog"] },
 advertising: { label: "Advertising", keywords: ["facebook pixel", "meta pixel", "google ads", "doubleclick", "adsense", "criteo", "taboola", "outbrain", "tiktok pixel", "snapchat pixel", "pinterest tag", "linkedin insight", "twitter pixel"] },
 social: { label: "Social", keywords: ["facebook sdk", "facebook connect", "twitter widget", "linkedin", "addthis", "sharethis", "disqus"] },
};

function categorizeTracker(name: string): string {
 const lower = name.toLowerCase();
 for (const [category, { keywords }] of Object.entries(TRACKER_CATEGORIES)) {
 if (keywords.some((kw) => lower.includes(kw))) return category;
 }
 return "other";
}

function getCategoryLabel(cat: string): string {
 return TRACKER_CATEGORIES[cat]?.label ?? "Other";
}

function getCategoryColor(cat: string): string {
 switch (cat) {
 case "analytics": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
 case "advertising": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
 case "social": return "bg-sky-500/10 text-sky-400 border-sky-500/20";
 default: return "bg-slate-500/10 text-slate-400 border-slate-500/20";
 }
}

function getScoreColor(score: number): string {
 if (score >= 80) return "#10b981";
 if (score >= 60) return "#f59e0b";
 if (score >= 40) return "#f97316";
 return "#ef4444";
}

function getScoreTextClass(score: number): string {
 if (score >= 80) return "text-emerald-400";
 if (score >= 60) return "text-amber-400";
 if (score >= 40) return "text-orange-400";
 return "text-red-400";
}

function ChecklistItem({ label, passed, detail, warning }: {
 label: string;
 passed: boolean;
 detail: string;
 warning?: boolean;
}) {
 return (
 <div className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
 warning ? "bg-red-500/5 border-red-500/20" : passed ? "bg-emerald-500/5 border-emerald-500/20" : "bg-orange-500/5 border-orange-500/20"
 }`}>
 <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
 warning ? "bg-red-500/20" : passed ? "bg-emerald-500/20" : "bg-orange-500/20"
 }`}>
 {(warning || !passed) ? (
 <X className={`h-3 w-3 ${warning ? "text-red-400" : "text-orange-400"}`} />
 ) : (
 <Check className="h-3 w-3 text-emerald-400" />
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium">{label}</p>
 <p className="text-xs text-muted-foreground">{detail}</p>
 </div>
 </div>
 );
}

export function PrivacyCompliancePanel({ privacy, domain }: PrivacyCompliancePanelProps) {
 if (!privacy) {
 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Privacy Compliance</p>
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <Shield className="mb-3 h-10 w-10 text-white/10" />
 <p className="text-sm text-muted-foreground">Run a scan to analyze privacy compliance.</p>
 <p className="mt-1 text-xs text-muted-foreground/60">We&apos;ll check for cookie banners, tracking scripts, and policy pages.</p>
 </div>
 </div>
 );
 }

 const score = privacy.compliance_score;
 const radius = 52;
 const circumference = 2 * Math.PI * radius;
 const progress = (score / 100) * circumference;
 const strokeColor = getScoreColor(score);

 const trackers = privacy.tracking_scripts || [];
 const grouped = new Map<string, string[]>();
 for (const t of trackers) {
 const cat = categorizeTracker(t);
 if (!grouped.has(cat)) grouped.set(cat, []);
 grouped.get(cat)!.push(t);
 }

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-5">Privacy Compliance</p>

 <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-start mb-6">
 <div className="relative shrink-0">
 <svg width="130" height="130" viewBox="0 0 130 130">
 <circle cx="65" cy="65" r={radius} fill="none" stroke="currentColor" className="text-white/5" strokeWidth="10" />
 <circle
 cx="65" cy="65" r={radius}
 fill="none" stroke={strokeColor} strokeWidth="10" strokeLinecap="round"
 strokeDasharray={`${progress} ${circumference - progress}`}
 strokeDashoffset={circumference / 4}
 style={{ transition: "stroke-dasharray 0.6s ease" }}
 />
 </svg>
 <div className="absolute inset-0 flex flex-col items-center justify-center">
 <span className={`text-2xl font-bold ${getScoreTextClass(score)}`}>{score}</span>
 <span className="text-[10px] text-muted-foreground">/ 100</span>
 </div>
 </div>

 <div className="flex-1 w-full space-y-2">
 <ChecklistItem
 label="Cookie Consent Banner"
 passed={privacy.has_cookie_banner}
 detail={privacy.has_cookie_banner
 ? privacy.banner_provider ? `Provider: ${privacy.banner_provider}` : "Banner detected"
 : "No cookie consent banner found"
 }
 />
 <ChecklistItem
 label="Privacy Policy"
 passed={privacy.has_privacy_policy}
 detail={privacy.has_privacy_policy ? "Privacy policy page found" : "No privacy policy detected"}
 />
 <ChecklistItem
 label="Terms of Service"
 passed={privacy.has_terms}
 detail={privacy.has_terms ? "Terms of service page found" : "No terms of service detected"}
 />
 <ChecklistItem
 label="Consent Before Tracking"
 passed={!privacy.tracking_before_consent}
 warning={privacy.tracking_before_consent}
 detail={privacy.tracking_before_consent
 ? "Tracking scripts load before user consent — potential violation"
 : "No tracking detected before consent"
 }
 />
 </div>
 </div>

 {privacy.tracking_before_consent && (
 <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3">
 <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
 <div>
 <p className="text-sm font-medium text-red-400">Pre-Consent Tracking Detected</p>
 <p className="mt-0.5 text-xs text-red-300/60">
 Scripts are loading and tracking users before consent is obtained. This may violate GDPR, LGPD, and other privacy regulations.
 </p>
 </div>
 </div>
 )}

 {privacy.banner_provider && (
 <div className="mb-5">
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Banner Provider</p>
 <span className="platform-chip">{privacy.banner_provider}</span>
 </div>
 )}

 {trackers.length > 0 && (
 <div className="mb-5">
 <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Tracking Scripts ({trackers.length})
 </p>
 <div className="space-y-3">
 {Array.from(grouped.entries()).map(([category, scripts]) => (
 <div key={category}>
 <div className="mb-1.5 flex items-center gap-2">
 <Tag className="h-3 w-3 text-muted-foreground" />
 <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
 {getCategoryLabel(category)}
 </span>
 </div>
 <div className="space-y-1">
 {scripts.map((script, i) => (
 <div key={i} className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${getCategoryColor(category)}`}>
 <Code className="h-3 w-3 shrink-0 opacity-60" />
 <span className="truncate text-xs font-mono">{script}</span>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {(privacy.issues?.length ?? 0) > 0 && (
 <div>
 <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recommendations</p>
 <div className="space-y-1.5">
 {(privacy.issues ?? []).map((issue, i) => (
 <div key={i} className="flex items-start gap-2 rounded-lg bg-orange-500/10 border border-orange-500/20 p-2.5">
 <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-orange-400" />
 <p className="text-xs text-orange-400">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
