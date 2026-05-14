"use client";

import type { CostEstimate } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CostCalculatorProps {
 estimate: CostEstimate;
}

function formatCurrency(num: number): string {
 if (num == null || isNaN(num)) return "$0";
 if (num >= 1000) return `$${(num / 1000).toFixed(0)}K`;
 return `$${num.toLocaleString()}`;
}

export function CostCalculator({ estimate }: CostCalculatorProps) {
 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border border-border transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Infrastructure Cost Model
 </div>

 {/* Total cost hero */}
 <div className="mb-10 px-1">
 <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 transition-all">
 <div className="flex items-center gap-2 text-emerald-900 mb-3">
 <span className="text-[0.625rem] font-black uppercase tracking-widest px-2 py-0.5 rounded-sm bg-emerald-200/50">EST</span>
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-emerald-900/60">Estimated Annual Operating Cost</span>
 </div>
 <div className="flex items-baseline gap-2">
 <span className="text-[1.8rem] font-black tracking-tighter text-emerald-800">
 {formatCurrency(estimate.total_min)} – {formatCurrency(estimate.total_max)}
 </span>
 <span className="text-[0.65rem] font-black uppercase tracking-widest text-emerald-800/40">/year</span>
 </div>
 </div>
 </div>

 {/* Breakdown */}
 <div className="px-1 space-y-3">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-foreground mb-4">
 Cost Topology Breakdown
 </h4>
 {estimate.breakdown.map((item, idx) => (
 <div
 key={`${item.category}-${idx}`}
 className="flex items-center justify-between p-4 border-b border-border last:border-0 transition-all hover:bg-muted/30"
 >
 <div className="min-w-0 flex-1">
 <p className="text-[0.85rem] font-black tracking-tight text-foreground uppercase mb-0.5">{item.category}</p>
 <p className="text-[0.68rem] text-muted-foreground font-black uppercase tracking-tighter truncate">{item.detail}</p>
 </div>
 <span className="text-[0.85rem] font-black tracking-tighter text-foreground whitespace-nowrap ml-4 font-mono">
 {formatCurrency(item.min)} – {formatCurrency(item.max)}
 </span>
 </div>
 ))}
 </div>
 </div>
 );
}
