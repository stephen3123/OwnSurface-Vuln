"use client";

import { useState } from "react";
import {
 Shield,
 ChevronDown,
 Copy,
 Check,
 Clock,
 AlertTriangle,
 AlertCircle,
 Info,
 CircleAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SecurityFix {
 summary: string;
 nginx: string | null;
 apache: string | null;
 cloudflare: string | null;
 meta_tag: string | null;
 vercel_json: string | null;
 netlify_toml: string | null;
}

interface SecurityFinding {
 id: string;
 severity: "critical" | "high" | "medium" | "low" | "info";
 title: string;
 description: string;
 impact: string;
 fix: SecurityFix;
 effort: "5min" | "15min" | "30min" | "1hr" | "complex";
 priority: number;
}

interface SecurityFixesProps {
 findings: SecurityFinding[];
}

const SEVERITY_CONFIG = {
 critical: {
 label: "CRITICAL",
 bg: "bg-rose-500/5",
 border: "border-rose-500/10",
 text: "text-rose-600",
 badge: "bg-rose-500/10 text-rose-600 border-rose-500/20",
 icon: CircleAlert,
 },
 high: {
 label: "HIGH",
 bg: "bg-orange-500/5",
 border: "border-orange-500/10",
 text: "text-orange-600",
 badge: "bg-orange-500/10 text-orange-600 border-orange-500/20",
 icon: AlertTriangle,
 },
 medium: {
 label: "MEDIUM",
 bg: "bg-amber-500/5",
 border: "border-amber-500/10",
 text: "text-amber-600",
 badge: "bg-amber-500/10 text-amber-600 border-amber-500/20",
 icon: AlertCircle,
 },
 low: {
 label: "LOW",
 bg: "bg-sky-500/5",
 border: "border-sky-500/10",
 text: "text-sky-600",
 badge: "bg-sky-500/10 text-sky-600 border-sky-500/20",
 icon: Info,
 },
 info: {
 label: "INFO",
 bg: "bg-slate-500/5",
 border: "border-border/20",
 text: "text-slate-500",
 badge: "bg-slate-500/5 text-slate-500 border-border/40",
 icon: Info,
 },
};

const EFFORT_LABELS: Record<string, string> = {
 "5min": "5 min fix",
 "15min": "15 min fix",
 "30min": "30 min fix",
 "1hr": "1 hour fix",
 complex: "Complex fix",
};

type TabId = "nginx" | "apache" | "cloudflare" | "vercel_json" | "netlify_toml" | "meta_tag";

const TAB_LABELS: { id: TabId; label: string }[] = [
 { id: "nginx", label: "Nginx" },
 { id: "apache", label: "Apache" },
 { id: "cloudflare", label: "Cloudflare" },
 { id: "vercel_json", label: "Vercel" },
 { id: "netlify_toml", label: "Netlify" },
 { id: "meta_tag", label: "HTML Meta" },
];

function CopyButton({ text }: { text: string }) {
 const [copied, setCopied] = useState(false);

 function handleCopy() {
 try {
 navigator.clipboard.writeText(text);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 } catch {
 const textarea = document.createElement("textarea");
 textarea.value = text;
 textarea.style.position = "fixed";
 textarea.style.opacity = "0";
 document.body.appendChild(textarea);
 textarea.select();
 document.execCommand("copy");
 document.body.removeChild(textarea);
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }
 }

 return (
 <button
 onClick={handleCopy}
 className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-[0.65rem] font-bold uppercase tracking-widest text-white/60 transition-all hover:bg-card/50 hover:text-white"
 >
 {copied ? (
 <>
 <Check className="h-3 w-3 text-emerald-400" />
 Copied
 </>
 ) : (
 <>
 <Copy className="h-3 w-3" />
 Copy
 </>
 )}
 </button>
 );
}

function FixCodeTabs({ fix }: { fix: SecurityFix }) {
 const availableTabs = TAB_LABELS.filter((tab) => fix[tab.id] !== null);
 const [activeTab, setActiveTab] = useState<TabId>(availableTabs[0]?.id || "nginx");

 if (availableTabs.length === 0) {
 return (
 <p className="text-[0.82rem] text-muted-foreground/60 font-light leading-relaxed">{fix.summary}</p>
 );
 }

 const currentCode = fix[activeTab];

 return (
 <div className="space-y-4">
 <p className="text-[0.82rem] text-muted-foreground/60 font-light leading-relaxed">{fix.summary}</p>

 <div className="overflow-hidden rounded-2xl border border-border/20 ">
 {/* Tab bar */}
 <div className="flex flex-wrap gap-0 border-b border-border/20 bg-card/50">
 {availableTabs.map((tab) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 "px-4 py-2.5 text-[0.6rem] font-black uppercase tracking-widest transition-all",
 activeTab === tab.id
 ? "border-b-2 border-teal-500 bg-card text-teal-600"
 : "text-muted-foreground/40 hover:bg-card/50 hover:text-foreground/60"
 )}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* Code block */}
 {currentCode && (
 <div className="relative bg-[#0f1419] p-5">
 <div className="absolute right-4 top-4">
 <CopyButton text={currentCode} />
 </div>
 <pre className="overflow-x-auto pr-24 text-[0.78rem] leading-relaxed text-emerald-300/80 font-mono">
 <code>{currentCode}</code>
 </pre>
 </div>
 )}
 </div>
 </div>
 );
}

function FindingCard({ finding, defaultOpen }: { finding: SecurityFinding; defaultOpen: boolean }) {
 const [open, setOpen] = useState(defaultOpen);
 const config = SEVERITY_CONFIG[finding.severity];
 const SevIcon = config.icon;

 return (
 <div className={cn(
 "overflow-hidden rounded-2xl border transition-all duration-300",
 config.border,
 open ? config.bg : "bg-card/50 hover:bg-card"
 )}>
 <button
 onClick={() => setOpen(!open)}
 aria-expanded={open}
 className="flex w-full items-start gap-4 p-5 text-left group"
 >
 <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-card border border-border/10 group-hover:scale-110 transition-transform">
 <SevIcon className={cn("h-5 w-5", config.text)} />
 </div>

 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2 mb-2">
 <span className={cn("px-2.5 py-0.5 rounded-md border text-[0.55rem] font-black uppercase tracking-widest ", config.badge)}>
 {config.label}
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-md border border-border/20 bg-card px-2.5 py-0.5 text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground/40 ">
 <Clock className="h-3 w-3" />
 {EFFORT_LABELS[finding.effort] || finding.effort}
 </span>
 <span className="text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground/30">
 Priority #{finding.priority}
 </span>
 </div>
 <h4 className="text-[0.9rem] font-bold tracking-tight text-foreground/80 group-hover:text-foreground transition-colors">
 {finding.title}
 </h4>
 {!open && (
 <p className="mt-1 line-clamp-1 text-[0.72rem] text-muted-foreground/50 font-light">
 {finding.description}
 </p>
 )}
 </div>

 <ChevronDown
 className={cn("mt-2 h-4 w-4 shrink-0 text-muted-foreground/30 transition-transform", open && "rotate-180")}
 />
 </button>

 {open && (
 <div className="space-y-6 border-t border-border/20 px-5 pb-6 pt-5">
 <div>
 <h5 className="mb-2 text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
 Impact Analysis
 </h5>
 <p className="text-[0.82rem] leading-relaxed text-foreground/70 font-light">
 {finding.description}
 </p>
 </div>

 <div>
 <h5 className="mb-2 text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
 Security Exposure
 </h5>
 <p className="text-[0.82rem] leading-relaxed text-foreground/70 font-light">
 {finding.impact}
 </p>
 </div>

 <div>
 <h5 className="mb-3 text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
 Remediation Protocol
 </h5>
 <FixCodeTabs fix={finding.fix} />
 </div>
 </div>
 )}
 </div>
 );
}

export function SecurityFixes({ findings }: SecurityFixesProps) {
 if (!findings || findings.length === 0) {
 return (
 <div className="shell-panel flex items-center gap-5 rounded-[2rem] p-8 border-border/40">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-600 ">
 <Shield className="h-6 w-6" />
 </div>
 <div>
 <div className="text-[0.9rem] font-bold tracking-tight text-foreground/80">Zero actionable findings identified</div>
 <div className="text-[0.72rem] text-muted-foreground/50 font-light mt-0.5">
 Security headers and configuration protocols operating within expected parameters.
 </div>
 </div>
 </div>
 );
 }

 const criticalCount = findings.filter((f) => f.severity === "critical").length;
 const highCount = findings.filter((f) => f.severity === "high").length;

 return (
 <div className="space-y-4">
 {/* Summary bar */}
 <div className="shell-panel flex flex-wrap items-center gap-5 rounded-[2rem] p-6 border-border/40">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500/5 border border-amber-500/10 text-amber-600 ">
 <Shield className="h-6 w-6" />
 </div>
 <div className="flex-1">
 <div className="text-[0.9rem] font-bold tracking-tight text-foreground/80">
 {findings.length} security {findings.length === 1 ? "finding" : "findings"} with copy-paste remediation
 </div>
 <div className="text-[0.72rem] text-muted-foreground/50 font-light mt-0.5">
 {criticalCount > 0 && `${criticalCount} critical`}
 {criticalCount > 0 && highCount > 0 && ", "}
 {highCount > 0 && `${highCount} high severity`}
 {(criticalCount > 0 || highCount > 0) && " — "}
 Begin with priority #{findings[0]?.priority} for maximum impact.
 </div>
 </div>
 </div>

 {/* Findings list */}
 {findings.map((finding, i) => (
 <FindingCard
 key={finding.id}
 finding={finding}
 defaultOpen={i === 0}
 />
 ))}
 </div>
 );
}
