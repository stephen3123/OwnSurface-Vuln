"use client";

import { useState } from "react";
import {
 ResponsiveContainer,
 LineChart,
 Line,
 XAxis,
 YAxis,
 Tooltip,
 Legend,
} from "recharts";
import type { HealthScoreHistoryEntry } from "@/lib/health-score";
import { Activity } from "lucide-react";

interface HealthScoreChartProps {
 history: HealthScoreHistoryEntry[];
}

const LINES = [
 { key: "overall", label: "Overall", color: "#14b8a6" },
 { key: "security", label: "Security", color: "#f87171" },
 { key: "performance", label: "Performance", color: "#60a5fa" },
 { key: "seo", label: "SEO", color: "#fbbf24" },
 { key: "availability", label: "Availability", color: "#34d399" },
] as const;

export function HealthScoreChart({ history }: HealthScoreChartProps) {
 const [visible, setVisible] = useState<Set<string>>(new Set(LINES.map((l) => l.key)));

 function toggleLine(key: string) {
 setVisible((prev) => {
 const next = new Set(prev);
 if (next.has(key)) {
 if (next.size > 1) next.delete(key);
 } else {
 next.add(key);
 }
 return next;
 });
 }

 if (history.length === 0) {
 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Score History</p>
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <Activity className="w-10 h-10 text-muted-foreground/40 mb-3" />
 <p className="text-sm text-muted-foreground">No history available yet</p>
 <p className="text-xs text-muted-foreground/60 mt-1">Run scans over time to track your health score trend</p>
 </div>
 </div>
 );
 }

 const formatted = history.map((entry) => ({
 ...entry,
 date: new Date(entry.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
 }));

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Score History</p>

 <div className="flex flex-wrap gap-2 mb-4">
 {LINES.map(({ key, label, color }) => (
 <button
 key={key}
 onClick={() => toggleLine(key)}
 className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
 visible.has(key)
 ? "border-transparent text-white"
 : "border-border text-muted-foreground opacity-40"
 }`}
 style={visible.has(key) ? { backgroundColor: color + "33", color } : undefined}
 >
 {label}
 </button>
 ))}
 </div>

 <div className="h-[280px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={formatted}>
 <XAxis
 dataKey="date"
 tick={{ fontSize: 11 }}
 stroke="hsl(215 20% 30%)"
 tickLine={false}
 axisLine={false}
 />
 <YAxis
 domain={[0, 100]}
 tick={{ fontSize: 11 }}
 stroke="hsl(215 20% 30%)"
 tickLine={false}
 axisLine={false}
 width={32}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(222 47% 11%)",
 border: "1px solid hsl(217 33% 17%)",
 borderRadius: "0.5rem",
 fontSize: "0.75rem",
 }}
 itemStyle={{ color: "#fff" }}
 />
 {LINES.map(({ key, color }) =>
 visible.has(key) ? (
 <Line
 key={key}
 type="monotone"
 dataKey={key}
 stroke={color}
 strokeWidth={key === "overall" ? 2.5 : 1.5}
 dot={false}
 activeDot={{ r: 4, strokeWidth: 0 }}
 />
 ) : null,
 )}
 <Legend content={() => null} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}
