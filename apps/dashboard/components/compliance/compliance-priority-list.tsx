"use client";

import { Wrench, ArrowUp } from "lucide-react";

interface CompliancePriorityListProps {
 fixes: { fix: string; unlocks: string[] }[];
}

export function CompliancePriorityList({ fixes }: CompliancePriorityListProps) {
 if (fixes.length === 0) return null;

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <div className="mb-4 flex items-center gap-2">
 <Wrench className="h-4 w-4 text-teal-400" />
 <p className="section-kicker">Priority Fixes</p>
 </div>

 <div className="space-y-3">
 {fixes.map((item, i) => (
 <div
 key={item.fix}
 className="flex items-start gap-3 rounded-xl border border-border bg-card/[0.02] p-4"
 >
 <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/5 text-sm font-bold text-white/60">
 {i + 1}
 </div>
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <p className="text-sm font-medium">{item.fix}</p>
 {i === 0 && (
 <span className="inline-flex items-center gap-1 rounded-full bg-teal-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-teal-400">
 <ArrowUp className="h-3 w-3" />
 Most impactful
 </span>
 )}
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 Unlocks compliance for {item.unlocks.length} regulation{item.unlocks.length !== 1 ? "s" : ""}
 </p>
 <div className="mt-2 flex flex-wrap gap-1.5">
 {item.unlocks.map((reg) => (
 <span key={reg} className="platform-chip text-[10px]">
 {reg}
 </span>
 ))}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
}
