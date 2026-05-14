"use client";

import type { TrafficInfo } from "@/lib/api-client";
import { formatNumber } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface TrafficChartProps {
 traffic: TrafficInfo;
}

function getTierColor(tier: string) {
 switch (tier.toLowerCase()) {
 case "very high":
 return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
 case "high":
 return "bg-blue-500/10 text-blue-400 border-blue-500/20";
 case "medium":
 return "bg-amber-500/10 text-amber-400 border-amber-500/20";
 case "low":
 return "bg-orange-500/10 text-orange-400 border-orange-500/20";
 default:
 return "bg-slate-500/10 text-slate-400 border-slate-500/20";
 }
}

export function TrafficChart({ traffic }: TrafficChartProps) {
 return (
 <div className="shell-panel rounded-[2rem] p-8 h-full border border-border">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Market Visibility
 </div>

 <div className="grid grid-cols-2 gap-4">
 {traffic.tranco_rank && (
 <div className="relative group overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:bg-muted/30">
 <div className="relative z-10">
 <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
 Tranco Rank
 </p>
 <div className="stat-number text-2xl font-black tracking-tighter text-foreground">
 #{formatNumber(traffic.tranco_rank)}
 </div>
 </div>
 </div>
 )}
 
 <div className="relative group overflow-hidden rounded-2xl bg-card border border-border p-5 transition-all hover:bg-muted/30">
 <div className="relative z-10">
 <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
 Traffic Tier
 </p>
 <div className={cn(
 "inline-flex items-center rounded-full px-3 py-1 text-[0.65rem] font-black uppercase border",
 getTierColor(traffic.traffic_tier)
 )}>
 {traffic.traffic_tier}
 </div>
 </div>
 </div>

 {traffic.estimated_monthly_visits && (
 <div className="col-span-2 relative group overflow-hidden rounded-2xl bg-card border border-border p-6 transition-all hover:bg-muted/30 font-black">
 <div className="relative z-10">
 <p className="text-[0.6rem] font-black uppercase tracking-widest text-zinc-400 mb-3">Estimated Monthly Volume</p>
 <div className="flex items-baseline gap-2">
 <div className="stat-number text-3xl font-black tracking-tighter text-foreground">
 {traffic.estimated_monthly_visits}
 </div>
 <span className="text-xs text-muted-foreground font-black uppercase tracking-widest">Active Visits</span>
 </div>
 </div>
 </div>
 )}
 </div>
 </div>
 );
}
