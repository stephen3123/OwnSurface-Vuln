"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
 ReferenceLine,
 Legend,
} from "recharts";
import { Loader2 } from "lucide-react";

interface SpeedChartProps {
 monitorId: string;
 domain: string;
}

interface SpeedDataPoint {
 timestamp: string;
 lcp: number;
 cls: number;
 ttfb: number;
}

type TimeRange = "7d" | "30d" | "90d";
type MetricView = "lcp" | "cls" | "ttfb" | "all";

const THRESHOLDS = {
 lcp: { good: 2500, poor: 4000, unit: "ms", label: "LCP" },
 cls: { good: 0.1, poor: 0.25, unit: "", label: "CLS" },
 ttfb: { good: 800, poor: 1800, unit: "ms", label: "TTFB" },
};

const LINE_COLORS = {
 lcp: "#3b82f6",
 cls: "#f59e0b",
 ttfb: "#10b981",
};

function formatTimestamp(ts: string) {
 const d = new Date(ts);
 return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export function SpeedChart({ monitorId, domain }: SpeedChartProps) {
 const [range, setRange] = useState<TimeRange>("30d");
 const [metricView, setMetricView] = useState<MetricView>("lcp");
 const [data, setData] = useState<SpeedDataPoint[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 setLoading(true);
 api
 .request<any>(`/monitors/speed/${monitorId}/history?range=${range}`)
 .then((res) => {
 if (res.data?.history) setData(res.data.history);
 setLoading(false);
 });
 }, [monitorId, range]);

 const chartData = data.map((d) => ({
 ...d,
 time: formatTimestamp(d.timestamp),
 }));

 // Latest values for legend
 const latest = data.length > 0 ? data[data.length - 1] : null;

 function getRating(metric: keyof typeof THRESHOLDS, value: number) {
 const t = THRESHOLDS[metric];
 if (value <= t.good) return "Good";
 if (value <= t.poor) return "Needs Improvement";
 return "Poor";
 }

 function getRatingColor(rating: string) {
 if (rating === "Good") return "text-emerald-400";
 if (rating === "Needs Improvement") return "text-yellow-400";
 return "text-red-400";
 }

 const activeMetrics = metricView === "all" ? ["lcp", "ttfb"] as const : [metricView] as const;
 // CLS has a different scale, so we show it alone or in "all" mode we skip it on the main chart
 const showCls = metricView === "cls" || metricView === "all";
 const showMainChart = metricView !== "cls";

 return (
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-sm font-semibold">{domain}</h3>
 <p className="text-xs text-muted-foreground">Core Web Vitals over time</p>
 </div>
 <div className="flex gap-1">
 {(["7d", "30d", "90d"] as TimeRange[]).map((r) => (
 <button
 key={r}
 onClick={() => setRange(r)}
 className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
 range === r
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 }`}
 >
 {r}
 </button>
 ))}
 </div>
 </div>

 {/* Metric selector */}
 <div className="flex gap-1 mb-4">
 {(["lcp", "cls", "ttfb", "all"] as MetricView[]).map((m) => (
 <button
 key={m}
 onClick={() => setMetricView(m)}
 className={`px-3 py-1 rounded-lg text-xs font-medium uppercase transition-colors ${
 metricView === m
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "bg-secondary text-muted-foreground hover:text-foreground"
 }`}
 >
 {m === "all" ? "All" : THRESHOLDS[m].label}
 </button>
 ))}
 </div>

 {/* Current values */}
 {latest && (
 <div className="grid grid-cols-3 gap-3 mb-4">
 {(["lcp", "cls", "ttfb"] as const).map((metric) => {
 const value = latest[metric];
 const rating = getRating(metric, value);
 const ratingColor = getRatingColor(rating);
 const t = THRESHOLDS[metric];
 return (
 <div
 key={metric}
 className="bg-background rounded-lg border border-border p-3 text-center"
 >
 <div className="text-xs text-muted-foreground uppercase mb-1">{t.label}</div>
 <div className={`text-lg font-bold ${ratingColor}`}>
 {value != null ? (metric === "cls" ? value.toFixed(3) : `${Math.round(value)}${t.unit}`) : "—"}
 </div>
 <div className={`text-xs ${ratingColor}`}>{rating}</div>
 </div>
 );
 })}
 </div>
 )}

 {/* Chart */}
 {loading ? (
 <div className="flex items-center justify-center h-[300px]">
 <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
 </div>
 ) : chartData.length === 0 ? (
 <div className="flex items-center justify-center h-[300px] text-sm text-muted-foreground">
 No data for this time range yet.
 </div>
 ) : (
 <div className="space-y-4">
 {/* Main chart (LCP/TTFB) */}
 {showMainChart && (
 <div className="h-[300px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
 <XAxis
 dataKey="time"
 tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
 tickLine={false}
 axisLine={false}
 />
 <YAxis
 tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
 tickLine={false}
 axisLine={false}
 unit="ms"
 width={60}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(222 47% 11%)",
 border: "1px solid hsl(217 33% 17%)",
 borderRadius: "0.5rem",
 fontSize: "0.75rem",
 }}
 itemStyle={{ color: "#fff" }}
 labelStyle={{ color: "hsl(215 20% 65%)" }}
 formatter={(value: number, name: string) => {
 const label = name === "lcp" ? "LCP" : name === "ttfb" ? "TTFB" : name.toUpperCase();
 return [`${Math.round(value)}ms`, label];
 }}
 />
 <Legend
 formatter={(value: string) => {
 const labels: Record<string, string> = { lcp: "LCP", ttfb: "TTFB" };
 return <span className="text-xs">{labels[value] || value.toUpperCase()}</span>;
 }}
 />

 {/* Threshold lines */}
 {activeMetrics.map((metric) => {
 if (metric === "cls") return null;
 const t = THRESHOLDS[metric];
 return [
 <ReferenceLine
 key={`${metric}-good`}
 y={t.good}
 stroke={LINE_COLORS[metric]}
 strokeDasharray="4 4"
 strokeOpacity={0.3}
 label={{ value: `${t.label} Good`, fontSize: 9, fill: "hsl(215 20% 65%)" }}
 />,
 <ReferenceLine
 key={`${metric}-poor`}
 y={t.poor}
 stroke={LINE_COLORS[metric]}
 strokeDasharray="4 4"
 strokeOpacity={0.3}
 label={{ value: `${t.label} Poor`, fontSize: 9, fill: "hsl(215 20% 65%)" }}
 />,
 ];
 })}

 {activeMetrics.map((metric) => {
 if (metric === "cls") return null;
 return (
 <Line
 key={metric}
 type="monotone"
 dataKey={metric}
 stroke={LINE_COLORS[metric]}
 strokeWidth={2}
 dot={false}
 activeDot={{ r: 4 }}
 />
 );
 })}
 </LineChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* CLS chart (separate axis since it's 0-1) */}
 {showCls && (
 <div>
 {metricView === "all" && (
 <h4 className="text-xs font-medium text-muted-foreground mb-2">CLS (separate scale)</h4>
 )}
 <div className="h-[200px]">
 <ResponsiveContainer width="100%" height="100%">
 <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
 <CartesianGrid strokeDasharray="3 3" stroke="hsl(217 33% 17%)" />
 <XAxis
 dataKey="time"
 tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
 tickLine={false}
 axisLine={false}
 />
 <YAxis
 tick={{ fontSize: 11, fill: "hsl(215 20% 65%)" }}
 tickLine={false}
 axisLine={false}
 width={50}
 domain={[0, "auto"]}
 />
 <Tooltip
 contentStyle={{
 backgroundColor: "hsl(222 47% 11%)",
 border: "1px solid hsl(217 33% 17%)",
 borderRadius: "0.5rem",
 fontSize: "0.75rem",
 }}
 itemStyle={{ color: "#fff" }}
 labelStyle={{ color: "hsl(215 20% 65%)" }}
 formatter={(value: number) => [value.toFixed(3), "CLS"]}
 />
 <ReferenceLine
 y={THRESHOLDS.cls.good}
 stroke={LINE_COLORS.cls}
 strokeDasharray="4 4"
 strokeOpacity={0.3}
 label={{ value: "Good", fontSize: 9, fill: "hsl(215 20% 65%)" }}
 />
 <ReferenceLine
 y={THRESHOLDS.cls.poor}
 stroke={LINE_COLORS.cls}
 strokeDasharray="4 4"
 strokeOpacity={0.3}
 label={{ value: "Poor", fontSize: 9, fill: "hsl(215 20% 65%)" }}
 />
 <Line
 type="monotone"
 dataKey="cls"
 stroke={LINE_COLORS.cls}
 strokeWidth={2}
 dot={false}
 activeDot={{ r: 4 }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 </div>
 )}
 </div>
 )}
 </div>
 );
}
