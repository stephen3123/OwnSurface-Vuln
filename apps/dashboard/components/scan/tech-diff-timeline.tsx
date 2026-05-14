"use client";

import { Plus, Minus, ArrowUpDown, Shield, Search, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";

interface Change {
 change_type: string;
 description: string;
 old_value?: string | number | boolean | null;
 new_value?: string | number | boolean | null;
}

interface TimelineEntry {
 scanned_at: string;
 changes: Change[];
}

interface TechDiffTimelineProps {
 entries: TimelineEntry[];
 domain: string;
}

const CHANGE_ICONS: Record<string, { icon: typeof Plus; color: string; bg: string }> = {
 tech_added: { icon: Plus, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/10" },
 tech_removed: { icon: Minus, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/10" },
 security_improved: { icon: Shield, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/10" },
 security_degraded: { icon: Shield, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/10" },
 security_grade_changed: { icon: Shield, color: "text-amber-600", bg: "bg-amber-500/10 border-amber-500/10" },
 ssl_expiring: { icon: Shield, color: "text-orange-600", bg: "bg-orange-500/10 border-orange-500/10" },
 seo_improved: { icon: Search, color: "text-emerald-600", bg: "bg-emerald-500/10 border-emerald-500/10" },
 seo_degraded: { icon: Search, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/10" },
 sensitive_file_exposed: { icon: Shield, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/10" },
 cve_detected: { icon: Shield, color: "text-rose-600", bg: "bg-rose-500/10 border-rose-500/10" },
 carbon_grade_changed: { icon: Leaf, color: "text-teal-600", bg: "bg-teal-500/10 border-teal-500/10" },
 business_signal: { icon: ArrowUpDown, color: "text-blue-600", bg: "bg-blue-500/10 border-blue-500/10" },
};

function formatDate(iso: string): string {
 return new Date(iso).toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 hour: "2-digit",
 minute: "2-digit",
 });
}

export function TechDiffTimeline({ entries, domain }: TechDiffTimelineProps) {
 if (!entries || entries.length === 0) {
 return (
 <div className="shell-panel flex items-center gap-5 rounded-[2rem] p-8 border-border/40">
 <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-500/5 border border-border/20 text-muted-foreground/40 ">
 <ArrowUpDown className="h-6 w-6" />
 </div>
 <div>
 <div className="text-[0.9rem] font-bold tracking-tight text-foreground/80">No mutations detected yet</div>
 <div className="text-[0.72rem] text-muted-foreground/50 font-light mt-0.5">
 Architectural mutations will surface here as {domain} is re-scanned over time.
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {entries.map((entry, entryIdx) => (
 <div key={entryIdx} className="shell-panel rounded-[2rem] p-6 border-border/40 transition-all hover:bg-card/50">
 <div className="mb-5 px-1 text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30">
 {formatDate(entry.scanned_at)}
 </div>
 <div className="space-y-2.5 px-1">
 {entry.changes.map((change, changeIdx) => {
 const config = CHANGE_ICONS[change.change_type] || CHANGE_ICONS.business_signal;
 const Icon = config.icon;
 return (
 <div
 key={changeIdx}
 className={cn(
 "flex items-center gap-4 p-4 rounded-2xl border transition-all hover:bg-card group",
 config.bg
 )}
 >
 <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", config.bg)}>
 <Icon className={cn("h-4 w-4", config.color)} />
 </div>
 <span className="text-[0.82rem] font-bold tracking-tight text-foreground/70 group-hover:text-foreground transition-colors">{change.description}</span>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 );
}
