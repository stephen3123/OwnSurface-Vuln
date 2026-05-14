"use client";

import { FileCode, AlertTriangle, Package, Map, TrendingUp } from "lucide-react";
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
 ResponsiveContainer,
 CartesianGrid,
} from "recharts";
import { cn } from "@/lib/utils";

interface ScriptEntry {
 url: string;
 size_bytes: number;
 has_source_map: boolean;
}

interface JSBundleData {
 total_scripts: number;
 total_size_bytes: number;
 scripts: ScriptEntry[];
 exposed_source_maps: string[];
 largest_bundle?: { url: string; size_bytes: number } | null;
 issues: string[];
}

interface JSBundleAnalysisProps {
 bundles: JSBundleData;
}

function formatBytes(bytes: number): string {
 if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
 if (bytes >= 1024) return `${(bytes / 1024).toFixed(1)} KB`;
 return `${bytes} B`;
}

function getScriptName(url: string): string {
 try {
 const pathname = new URL(url).pathname;
 const parts = pathname.split("/");
 const name = parts[parts.length - 1] || pathname;
 if (name.length > 25) return "..." + name.slice(-22);
 return name;
 } catch {
 const parts = url.split("/");
 const name = parts[parts.length - 1] || url;
 if (name.length > 25) return "..." + name.slice(-22);
 return name;
 }
}

export function JSBundleAnalysis({ bundles }: JSBundleAnalysisProps) {
 const avgSize =
 bundles.total_scripts > 0
 ? Math.round(bundles.total_size_bytes / bundles.total_scripts)
 : 0;

 const top10 = [...(bundles.scripts || [])]
 .sort((a, b) => b.size_bytes - a.size_bytes)
 .slice(0, 10)
 .map((s) => ({
 name: getScriptName(s.url),
 size: s.size_bytes,
 sizeLabel: formatBytes(s.size_bytes),
 hasSourceMap: s.has_source_map,
 }));

 return (
 <div className="dark-panel flex h-full flex-col p-8 rounded-[2rem] transition-all hover:scale-[1.01]">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-white/40 px-1">
 <FileCode className="h-4.5 w-4.5 text-teal-400/60" />
 Binary Payload Analysis
 </div>

 {/* Stats */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 px-1">
 {[
 { icon: FileCode, label: "Resources", value: bundles.total_scripts, color: "text-blue-400" },
 { icon: Package, label: "Total Weight", value: formatBytes(bundles.total_size_bytes), color: "text-teal-400" },
 { icon: TrendingUp, label: "Avg Weight", value: formatBytes(avgSize), color: "text-amber-400" }
 ].map((stat, i) => (
 <div key={i} className="p-5 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-card/50 group">
 <div className="flex items-center gap-2 text-white/20 mb-2">
 <stat.icon className={cn("w-3.5 h-3.5 transition-colors", stat.color)} />
 <span className="text-[0.6rem] font-black uppercase tracking-widest">{stat.label}</span>
 </div>
 <p className="text-[1.1rem] font-black tracking-tighter text-white/70 group-hover:text-white transition-colors">{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Chart */}
 {top10.length > 0 && (
 <div className="h-56 mb-10 px-1">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={top10} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
 <defs>
 <linearGradient id="jsGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.8} />
 <stop offset="100%" stopColor="#0ea5e9" stopOpacity={0.2} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis
 dataKey="name"
 axisLine={false}
 tickLine={false}
 tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 8, fontWeight: 700 }}
 dy={10}
 />
 <YAxis hide />
 <Tooltip
 contentStyle={{
 backgroundColor: "rgba(10, 20, 25, 0.95)",
 borderRadius: "1rem",
 border: "1px solid rgba(255,255,255,0.1)",
 boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
 backdropFilter: "blur(10px)",
 }}
 itemStyle={{ color: "rgba(255,255,255,0.8)", fontSize: "11px", fontWeight: 700 }}
 labelStyle={{ color: "rgba(255,255,255,0.3)", fontSize: "9px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
 cursor={{ fill: "rgba(255,255,255,0.05)" }}
 formatter={(value: number) => [formatBytes(value), "Weight"]}
 />
 <Bar
 dataKey="size"
 fill="url(#jsGradient)"
 radius={[6, 6, 0, 0]}
 barSize={20}
 />
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* Exposed Maps */}
 {bundles.exposed_source_maps.length > 0 && (
 <div className="mb-8 px-1">
 <div className="flex items-center gap-2 mb-4">
 <Map className="h-4 w-4 text-rose-400" />
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-rose-400/60">
 Critical Leakage: Source Maps exposed
 </h4>
 </div>
 <div className="space-y-2">
 {bundles.exposed_source_maps.map((map, i) => (
 <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-rose-500/5 border border-rose-500/10 ">
 <p className="text-[0.75rem] font-mono text-rose-400/80 truncate pr-4">{map}</p>
 <AlertTriangle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
 </div>
 ))}
 </div>
 </div>
 )}

 {/* Issues */}
 {bundles.issues.length > 0 && (
 <div className="px-1">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-white/20 mb-4">
 Performance & Security Recommendations
 </h4>
 <div className="space-y-2.5">
 {bundles.issues.map((issue, i) => (
 <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 transition-all hover:bg-card/50 group">
 <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0 border border-teal-500/10 group-hover:scale-110 transition-transform ">
 <AlertTriangle className="w-4 h-4 text-teal-400" />
 </div>
 <p className="text-[0.82rem] text-white/60 leading-relaxed font-light">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
