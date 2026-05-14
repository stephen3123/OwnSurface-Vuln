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
 Dot,
} from "recharts";
import { Loader2 } from "lucide-react";

interface UptimeChartProps {
 monitorId: string;
 domain: string;
}

interface UptimeDataPoint {
 timestamp: string;
 response_time_ms: number;
 status: "up" | "down";
}

interface UptimeStats {
 avg_response_time: number;
 uptime_percentage: number;
 total_checks: number;
 downtime_incidents: number;
}

type TimeRange = "24h" | "7d" | "30d";

function formatTimestamp(ts: string, range: TimeRange) {
 const d = new Date(ts);
 if (range === "24h") {
 return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
 }
 return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function CustomDot(props: any) {
 const { cx, cy, payload } = props;
 if (!payload) return null;
 const color = payload.status === "up" ? "#10b981" : "#ef4444";
 return <circle cx={cx} cy={cy} r={3} fill={color} stroke="none" />;
}

export function UptimeChart({ monitorId, domain }: UptimeChartProps) {
 const [range, setRange] = useState<TimeRange>("24h");
 const [data, setData] = useState<UptimeDataPoint[]>([]);
 const [stats, setStats] = useState<UptimeStats | null>(null);
 const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .request<{ monitor: any; checks: any[]; stats: any }>(
        `/monitors/uptime/${monitorId}`
      )
      .then((res) => {
        if (res.data) {
          // Map checks to data points
          const dataPoints: UptimeDataPoint[] = (res.data.checks || []).map((c: any) => ({
            timestamp: c.checked_at,
            response_time_ms: c.response_time_ms || 0,
            status: (c.status_code && c.status_code >= 200 && c.status_code < 400 ? "up" : "down") as "up" | "down",
          }));
          setData(dataPoints.reverse()); // Data is DESC in DB, chart usually wants ASC
          
          if (res.data.stats) {
            setStats({
              avg_response_time: res.data.stats.avg_response_ms || 0,
              uptime_percentage: res.data.stats.uptime_percentage || 0,
              total_checks: res.data.stats.total_checks || 0,
              downtime_incidents: (res.data.checks || []).filter((c: any) => !(c.status_code && c.status_code >= 200 && c.status_code < 400)).length,
            });
          }
        }
        setLoading(false);
      });
  }, [monitorId]);

 const chartData = data.map((d) => ({
 ...d,
 time: formatTimestamp(d.timestamp, range),
 }));

 return (
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-center justify-between mb-4">
 <div>
 <h3 className="text-sm font-semibold">{domain}</h3>
 <p className="text-xs text-muted-foreground">Response time over time</p>
 </div>
 <div className="flex gap-1">
 {(["24h", "7d", "30d"] as TimeRange[]).map((r) => (
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

 {/* Stats */}
 {stats && (
 <div className="grid grid-cols-4 gap-3 mb-4">
 <div className="bg-background rounded-lg border border-border p-3 text-center">
 <div className="text-lg font-bold">{stats.uptime_percentage.toFixed(2)}%</div>
 <div className="text-xs text-muted-foreground">Uptime</div>
 </div>
 <div className="bg-background rounded-lg border border-border p-3 text-center">
 <div className="text-lg font-bold">{Math.round(stats.avg_response_time)}ms</div>
 <div className="text-xs text-muted-foreground">Avg Response</div>
 </div>
 <div className="bg-background rounded-lg border border-border p-3 text-center">
 <div className="text-lg font-bold">{stats.total_checks}</div>
 <div className="text-xs text-muted-foreground">Total Checks</div>
 </div>
 <div className="bg-background rounded-lg border border-border p-3 text-center">
 <div className="text-lg font-bold text-red-400">{stats.downtime_incidents}</div>
 <div className="text-xs text-muted-foreground">Incidents</div>
 </div>
 </div>
 )}

 {/* Chart */}
 {loading ? (
 <div className="flex items-center justify-center h-[280px]">
 <Loader2 className="w-6 h-6 animate-spin text-teal-400" />
 </div>
 ) : chartData.length === 0 ? (
 <div className="flex items-center justify-center h-[280px] text-sm text-muted-foreground">
 No data for this time range yet.
 </div>
 ) : (
 <div className="h-[280px]">
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
 formatter={(value: number) => [`${value}ms`, "Response Time"]}
 />
 <Line
 type="monotone"
 dataKey="response_time_ms"
 stroke="#2dd4bf"
 strokeWidth={2}
 dot={<CustomDot />}
 activeDot={{ r: 5, fill: "#2dd4bf" }}
 />
 </LineChart>
 </ResponsiveContainer>
 </div>
 )}
 </div>
 );
}
