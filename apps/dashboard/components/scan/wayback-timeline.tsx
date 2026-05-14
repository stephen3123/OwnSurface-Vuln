"use client";

import { cn } from "@/lib/utils";
import {
 BarChart,
 Bar,
 XAxis,
 YAxis,
 Tooltip,
 ResponsiveContainer,
 CartesianGrid,
} from "recharts";

interface Snapshot {
 year: number | string;
 count: number;
}

interface WaybackData {
 available: boolean;
 first_seen?: string | null;
 last_seen?: string | null;
 total_captures?: number;
 snapshots: Snapshot[];
 oldest_url?: string | null;
}

interface WaybackTimelineProps {
 wayback: WaybackData;
}

export function WaybackTimeline({ wayback }: WaybackTimelineProps) {
 if (!wayback.available) {
 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border border-border transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Historical Integrity Audit
 </div>
 <div className="flex items-center gap-4 p-6 rounded-2xl bg-muted border border-border ">
 <p className="text-[0.85rem] text-muted-foreground font-black uppercase tracking-tight italic">No archival records discovered in the global Wayback directory.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border border-border transition-all hover:bg-card/50">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground underline decoration-2 underline-offset-8">
 Wayback Machine Intelligence
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-[0.62rem] font-black text-foreground uppercase tracking-widest ">
 Historical Pulse Active
 </div>
 </div>

 {/* Stats row */}
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 px-1">
 {[
 { label: "Inception", value: wayback.first_seen || "N/A" },
 { label: "Last Record", value: wayback.last_seen || "N/A" },
 { label: "Snapshots", value: wayback.total_captures?.toLocaleString() || "N/A" },
 ].map((stat, i) => (
 <div key={i} className="p-5 rounded-sm bg-muted border border-border transition-all hover:bg-muted/50 group">
 <div className="flex items-center gap-2 text-muted-foreground mb-2">
 <span className="text-[0.625rem] font-black uppercase tracking-widest">{stat.label}</span>
 </div>
 <p className="text-[1.1rem] font-black tracking-tighter text-foreground uppercase">{stat.value}</p>
 </div>
 ))}
 </div>

 {/* Chart */}
 {wayback.snapshots.length > 0 && (
 <div className="h-56 mb-8 px-1">
 <ResponsiveContainer width="100%" height="100%">
 <BarChart data={wayback.snapshots} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
 <defs>
 <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
 <stop offset="0%" stopColor="#059669" stopOpacity={0.9} />
 <stop offset="100%" stopColor="#059669" stopOpacity={0.3} />
 </linearGradient>
 </defs>
 <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.03)" vertical={false} />
 <XAxis
 dataKey="year"
 axisLine={false}
 tickLine={false}
 tick={{ fill: "#000", fontSize: 10, fontWeight: 900 }}
 dy={10}
 />
 <YAxis hide />
 <Tooltip
 contentStyle={{
 backgroundColor: "#fff",
 borderRadius: "0.5rem",
 border: "2px solid #000",
 boxShadow: "4px 4px 0 rgba(0,0,0,1)",
 }}
 itemStyle={{ color: "#000", fontSize: "11px", fontWeight: 900 }}
 labelStyle={{ color: "#666", fontSize: "9px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px" }}
 cursor={{ fill: "rgba(0,0,0,0.05)" }}
 />
 <Bar
 dataKey="count"
 fill="url(#barGradient)"
 radius={[2, 2, 0, 0]}
 barSize={24}
 />
 </BarChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* Footer action */}
 <div className="px-1 mt-auto">
 <a
 href={wayback.oldest_url || "#"}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center justify-between p-5 rounded-xl bg-card border-2 border-border hover:border-black transition-all group font-black"
 >
 <div className="flex items-center gap-3">
 <div className="h-10 w-10 rounded-sm bg-black text-white flex items-center justify-center font-black text-xs uppercase">
 URL
 </div>
 <div>
 <p className="text-[0.62rem] font-black uppercase tracking-[0.2em] text-muted-foreground leading-none mb-1">Source Artifact</p>
 <p className="text-[0.75rem] font-black text-foreground uppercase tracking-tight">Original Version Discovery</p>
 </div>
 </div>
 <span className="text-xl font-black text-foreground group-hover:translate-x-1 transition-transform">→</span>
 </a>
 </div>
 </div>
 );
}
