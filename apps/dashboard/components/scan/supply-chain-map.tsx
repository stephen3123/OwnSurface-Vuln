"use client";

import { Globe, ShieldAlert, AlertTriangle, Server } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExternalDomain {
 domain: string;
 type: string;
 count: number;
 domain_age_days?: number | null;
 risk_level: string;
 is_cdn: boolean;
}

interface SupplyChainData {
 external_domains: ExternalDomain[];
 total_external: number;
 high_risk_count: number;
 score: number;
 issues: string[];
}

interface SupplyChainMapProps {
 supply_chain: SupplyChainData;
}

function getRiskColor(risk: string) {
 switch (risk.toLowerCase()) {
 case "high":
 return "bg-rose-500/10 text-rose-600 border-rose-500/20";
 case "medium":
 return "bg-orange-500/10 text-orange-600 border-orange-500/20";
 case "low":
 return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
 default:
 return "bg-slate-500/5 text-slate-500 border-border/40";
 }
}

function getTypeColor(type: string) {
 switch (type.toLowerCase()) {
 case "script":
 return "bg-blue-500/10 text-blue-600 border-blue-500/20";
 case "style":
 return "bg-purple-500/10 text-purple-600 border-purple-500/20";
 case "image":
 return "bg-cyan-500/10 text-cyan-600 border-cyan-500/20";
 case "iframe":
 return "bg-pink-500/10 text-pink-600 border-pink-500/20";
 case "font":
 return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
 default:
 return "bg-slate-500/5 text-slate-500 border-border/40";
 }
}

export function SupplyChainMap({ supply_chain }: SupplyChainMapProps) {
 const domains = supply_chain?.external_domains || [];
 const cdnCount = domains.filter((d) => d.is_cdn).length;

 const highRisk = domains.filter((d) => d.risk_level?.toLowerCase() === "high");
 const mediumRisk = domains.filter((d) => d.risk_level?.toLowerCase() === "medium");
 const lowRisk = domains.filter((d) => d.risk_level?.toLowerCase() === "low");

 const groups = [
 { label: "High Exposure", domains: highRisk, accent: "text-rose-400" },
 { label: "Medium Exposure", domains: mediumRisk, accent: "text-orange-400" },
 { label: "Low Exposure", domains: lowRisk, accent: "text-emerald-400" },
 ].filter((g) => g.domains.length > 0);

 return (
 <div className="dark-panel flex h-full flex-col p-8 rounded-[2rem] transition-all hover:scale-[1.01]">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/40 px-1">
 <Globe className="h-4.5 w-4.5 text-teal-400/60" />
 Infrastructure Dependency Map
 </div>

 {/* Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 px-1">
 {[
 { icon: Globe, label: "External Assets", value: supply_chain.total_external, color: "text-blue-400" },
 { icon: Server, label: "Network CDNs", value: cdnCount, color: "text-teal-400" },
 { icon: ShieldAlert, label: "Risk Nodes", value: supply_chain.high_risk_count, color: "text-rose-400" }
 ].map((stat, i) => (
 <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-card/50 group">
 <div className="flex items-center gap-2 text-white/20 mb-2">
 <stat.icon className={cn("w-3.5 h-3.5 transition-colors", stat.color)} />
 <span className="text-[0.6rem] font-black uppercase tracking-widest">{stat.label}</span>
 </div>
 <p className={cn("text-[1.1rem] font-black tracking-tighter transition-colors text-white/70 group-hover:text-white")}>{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Score bar */}
 <div className="mb-10 px-1">
 <div className="flex items-center justify-between mb-3">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-white/20">
 Supply Chain Integrity
 </span>
 <span className={cn(
 "text-[0.8rem] font-black tracking-tighter",
 supply_chain.score >= 80 ? "text-emerald-400" : supply_chain.score >= 60 ? "text-amber-400" : "text-rose-400"
 )}>
 {supply_chain.score}% SECURED
 </span>
 </div>
 <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
 <div
 className={cn(
 "h-full rounded-full transition-all duration-1000 ",
 supply_chain.score >= 80 ? "bg-emerald-500 shadow-emerald-500/20" : 
 supply_chain.score >= 60 ? "bg-amber-500 shadow-amber-500/20" : "bg-rose-500 shadow-rose-500/20"
 )}
 style={{ width: `${supply_chain.score}%` }}
 />
 </div>
 </div>

 {/* Exposure Groups */}
 <div className="space-y-8 mb-10 px-1">
 {groups.map((group) => (
 <div key={group.label}>
 <div className="flex items-center justify-between mb-4">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-white/20">
 {group.label}
 </h4>
 <span className={cn("text-[0.68rem] font-black", group.accent)}>
 {group.domains.length} NODES
 </span>
 </div>
 <div className="grid gap-2.5">
 {group.domains.map((domain, i) => (
 <div
 key={i}
 className={cn(
 "group flex items-center justify-between p-4 rounded-2xl border bg-white/5 border-white/5 transition-all hover:bg-card/50",
 domain.risk_level.toLowerCase() === "high" ? "border-rose-500/10" : "border-white/5"
 )}
 >
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2 flex-wrap mb-1.5">
 <span className="text-[0.82rem] font-mono font-bold tracking-tight text-white/80 group-hover:text-white transition-colors">{domain.domain}</span>
 <span className={cn("px-2 py-0.5 rounded-md border text-[0.55rem] font-black uppercase tracking-widest ", getTypeColor(domain.type).replace("text-", "text-white bg-").replace("/10", "/20"))}>
 {domain.type}
 </span>
 {domain.is_cdn && (
 <span className="px-2 py-0.5 rounded-md border bg-teal-500/10 text-teal-400 border-teal-500/20 text-[0.55rem] font-black uppercase tracking-widest ">
 CDN
 </span>
 )}
 <span className={cn("px-2 py-0.5 rounded-md border text-[0.55rem] font-black uppercase tracking-widest ", getRiskColor(domain.risk_level).replace("text-", "text-white bg-").replace("/10", "/20"))}>
 {domain.risk_level}
 </span>
 </div>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
 <div className="h-1 w-1 rounded-full bg-card" />
 <span className="text-[0.65rem] font-bold tracking-tight text-white">{domain.count} references</span>
 </div>
 {domain.domain_age_days !== undefined && domain.domain_age_days !== null && (
 <div className="flex items-center gap-1.5 opacity-20 group-hover:opacity-40 transition-opacity">
 <div className={cn("h-1 w-1 rounded-full", domain.domain_age_days < 30 ? "bg-rose-500" : "bg-card")} />
 <span className={cn("text-[0.65rem] font-bold tracking-tight text-white", domain.domain_age_days < 30 && "text-rose-400")}>Age: {domain.domain_age_days}d</span>
 </div>
 )}
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>

 {/* Issues */}
 {supply_chain.issues.length > 0 && (
 <div className="px-1">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-white/20 mb-4">
 Structural Anomalies identified
 </h4>
 <div className="space-y-2.5">
 {supply_chain.issues.map((issue, i) => (
 <div
 key={i}
 className="flex items-center gap-4 p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 transition-all hover:bg-rose-500/10 group"
 >
 <div className="h-8 w-8 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/10">
 <AlertTriangle className="w-4 h-4 text-rose-400" />
 </div>
 <p className="text-[0.82rem] text-rose-400 leading-relaxed font-light">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
