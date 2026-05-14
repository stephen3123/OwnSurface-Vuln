"use client";

import type { SeoAnalysis, SeoCheckItem } from "@/lib/seo-analyzer";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, AlertTriangle, HelpCircle } from "lucide-react";

interface SeoPulseChecklistProps {
 analysis: SeoAnalysis;
}

const STATUS_ICON: Record<SeoCheckItem["status"], React.ComponentType<{ className?: string }>> = {
 pass: CheckCircle2,
 fail: XCircle,
 warning: AlertTriangle,
 unknown: HelpCircle,
};

const STATUS_COLOR: Record<SeoCheckItem["status"], string> = {
 pass: "text-emerald-500",
 fail: "text-red-500",
 warning: "text-amber-500",
 unknown: "text-slate-400",
};

const CATEGORY_LABELS: Record<SeoCheckItem["category"], string> = {
 content: "Content",
 technical: "Technical",
 social: "Social",
 performance: "Performance",
};

export function SeoPulseChecklist({ analysis }: SeoPulseChecklistProps) {
 const grouped = analysis.checks.reduce<Record<string, SeoCheckItem[]>>((acc, check) => {
 if (!acc[check.category]) acc[check.category] = [];
 acc[check.category].push(check);
 return acc;
 }, {});

 const scoreColor =
 analysis.score >= 80 ? "text-emerald-500" :
 analysis.score >= 60 ? "text-amber-500" :
 "text-red-500";

 const barColor =
 analysis.score >= 80 ? "bg-emerald-500" :
 analysis.score >= 60 ? "bg-amber-500" :
 "bg-red-500";

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 {/* Score header */}
 <div className="mb-5 flex items-center justify-between">
 <div>
 <p className="section-kicker">SEO Score</p>
 <p className={cn("text-3xl font-bold", scoreColor)}>{analysis.score}</p>
 </div>
 <p className="text-sm text-muted-foreground">
 {analysis.passCount} of {analysis.checks.length} checks passing
 </p>
 </div>

 {/* Progress bar */}
 <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
 <div
 className={cn("h-full rounded-full transition-all duration-500", barColor)}
 style={{ width: `${analysis.score}%` }}
 />
 </div>

 {/* Summary chips */}
 <div className="mb-6 flex gap-3">
 <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-500">
 <CheckCircle2 className="h-3.5 w-3.5" />
 {analysis.passCount} passed
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1 text-xs font-medium text-red-500">
 <XCircle className="h-3.5 w-3.5" />
 {analysis.failCount} failed
 </span>
 {analysis.warningCount > 0 && (
 <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-medium text-amber-500">
 <AlertTriangle className="h-3.5 w-3.5" />
 {analysis.warningCount} warnings
 </span>
 )}
 </div>

 {/* Grouped checks */}
 <div className="space-y-6">
 {(["content", "technical", "social", "performance"] as const).map((category) => {
 const items = grouped[category];
 if (!items || items.length === 0) return null;

 return (
 <div key={category}>
 <p className="section-kicker mb-3">{CATEGORY_LABELS[category]}</p>
 <div className="space-y-2">
 {items.map((item) => {
 const Icon = STATUS_ICON[item.status];
 return (
 <div
 key={item.id}
 className="rounded-xl border border-border p-3.5"
 >
 <div className="flex items-start gap-3">
 <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", STATUS_COLOR[item.status])} />
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium">{item.title}</p>
 <p className="mt-0.5 text-xs text-muted-foreground">{item.description}</p>
 {item.status === "fail" && item.recommendation && (
 <p className="mt-2 rounded-lg bg-red-500/5 px-3 py-2 text-xs text-red-400">
 {item.recommendation}
 </p>
 )}
 {item.status === "warning" && item.recommendation && (
 <p className="mt-2 rounded-lg bg-amber-500/5 px-3 py-2 text-xs text-amber-400">
 {item.recommendation}
 </p>
 )}
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
