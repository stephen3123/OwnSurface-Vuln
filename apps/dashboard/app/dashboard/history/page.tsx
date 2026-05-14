"use client";

import { useState } from "react";
import type { ScanResult } from "@/lib/api-client";
import { useRecentScans } from "@/lib/dashboard-cache";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { WebsiteDiff } from "@/components/scan/website-diff";
import { formatRelative, formatDateTime, truncateUrl, getSecurityGrade, getSecurityColor, formatNumber } from "@/lib/utils";
import { History, Search, ExternalLink, BarChart3, ScanSearch } from "lucide-react";
import Link from "next/link";
import {
 LineChart,
 Line,
 XAxis,
 YAxis,
 CartesianGrid,
 Tooltip,
 ResponsiveContainer,
} from "recharts";

export default function HistoryPage() {
 const [search, setSearch] = useState("");
 const [selectedUrl, setSelectedUrl] = useState<string | null>(null);
 const { data: scans = [], isLoading: loading } = useRecentScans();

 const filtered = search
 ? scans.filter((s) => s.url.toLowerCase().includes(search.toLowerCase()))
 : scans;

 // Group by URL for timeline
 const urlGroups = filtered.reduce<Record<string, ScanResult[]>>((acc, scan) => {
 if (!acc[scan.url]) acc[scan.url] = [];
 acc[scan.url].push(scan);
 return acc;
 }, {});

 const selectedScans = selectedUrl ? (urlGroups[selectedUrl] || []) : [];
 const chartData = selectedScans
 .slice()
 .reverse()
 .map((s) => ({
 date: new Date(s.scanned_at).toLocaleDateString(),
 security: s.security.score,
 seo: s.seo.score,
 techs: s.technologies.length,
 }));

 return (
 <div className="dashboard-page mx-auto max-w-6xl">
 {/* Search */}
 <div className="shell-panel relative rounded-[1.35rem]">
 <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
 <input
 type="text"
 value={search}
 onChange={(e) => setSearch(e.target.value)}
 placeholder="Search by URL..."
 className="w-full rounded-[1.35rem] border-0 bg-transparent py-4 pl-11 pr-4 text-sm outline-none"
 />
 </div>

 <div className="grid gap-6 lg:grid-cols-3">
 {/* URL list */}
 <div className="lg:col-span-1">
 <h3 className="dashboard-section-title mb-3">Scanned URLs</h3>
 {loading ? (
 <div className="space-y-3">
 {Array.from({ length: 5 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : Object.keys(urlGroups).length === 0 ? (
 <div className="text-center py-12 bg-card border border-border rounded-xl">
 <History className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
 <p className="text-sm text-muted-foreground mb-3">No scans found.</p>
 <Link
 href="/dashboard/scan"
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <ScanSearch className="w-4 h-4" />
 Run your first scan
 </Link>
 </div>
 ) : (
 <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
 {Object.entries(urlGroups).map(([url, scansForUrl]) => (
 <button
 key={url}
 onClick={() => setSelectedUrl(selectedUrl === url ? null : url)}
 className={`w-full text-left p-3 rounded-lg border transition-colors ${
 selectedUrl === url
 ? "bg-teal-500/10 border-teal-500/20"
 : "bg-card border-border hover:border-muted-foreground/30"
 }`}
 >
 <p className="text-sm font-medium truncate">{truncateUrl(url, 35)}</p>
 <p className="text-xs text-muted-foreground mt-1">
 {scansForUrl.length} scans &middot; Last {formatRelative(scansForUrl[0].scanned_at)}
 </p>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Timeline and chart */}
 <div className="lg:col-span-2 space-y-6">
 {selectedUrl && selectedScans.length > 0 ? (
 <>
 <div className="dashboard-toolbar">
 <h3 className="dashboard-section-title">{truncateUrl(selectedUrl, 50)}</h3>
 <Link
 href={`/dashboard/scan/${selectedScans[0].hash}`}
 className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
 >
 Latest Scan <ExternalLink className="w-3.5 h-3.5" />
 </Link>
 </div>

 {/* Chart */}
 {chartData.length > 1 && (
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-center gap-2 mb-4">
 <BarChart3 className="w-5 h-5 text-teal-400" />
 <h4 className="font-semibold">Trends</h4>
 </div>
 <ResponsiveContainer width="100%" height={250}>
 <LineChart data={chartData}>
 <CartesianGrid stroke="hsl(217 33% 17%)" strokeDasharray="3 3" />
 <XAxis dataKey="date" tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} />
 <YAxis tick={{ fontSize: 12, fill: "hsl(215 20% 55%)" }} />
 <Tooltip
 contentStyle={{
 background: "hsl(222 47% 8%)",
 border: "1px solid hsl(217 33% 17%)",
 borderRadius: "8px",
 fontSize: "12px",
 }}
 />
 <Line type="monotone" dataKey="security" stroke="#a78bfa" name="Security" strokeWidth={2} dot={{ r: 3 }} />
 <Line type="monotone" dataKey="seo" stroke="#60a5fa" name="SEO" strokeWidth={2} dot={{ r: 3 }} />
 <Line type="monotone" dataKey="techs" stroke="#34d399" name="Technologies" strokeWidth={2} dot={{ r: 3 }} />
 </LineChart>
 </ResponsiveContainer>
 </div>
 )}

 {/* Diff */}
 {selectedScans.length >= 2 && (
 <WebsiteDiff before={selectedScans[1]} after={selectedScans[0]} />
 )}

 {/* Timeline */}
 <div className="bg-card border border-border rounded-xl p-5">
 <h4 className="font-semibold mb-3">Scan Timeline</h4>
 <div className="space-y-3">
 {selectedScans.map((scan) => (
 <Link
 key={scan.hash}
 href={`/dashboard/scan/${scan.hash}`}
 className="flex items-center justify-between p-3 rounded-lg bg-background border border-border hover:border-teal-500/20 transition-colors"
 >
 <div>
 <p className="text-sm font-medium">{formatDateTime(scan.scanned_at)}</p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {scan.technologies.length} technologies &middot; SEO {scan.seo.score}/100
 </p>
 </div>
 <span className={`text-sm font-bold ${getSecurityColor(scan.security.score)}`}>
 {getSecurityGrade(scan.security.score)}
 </span>
 </Link>
 ))}
 </div>
 </div>
 </>
 ) : (
 <div className="text-center py-20 bg-card border border-border rounded-xl">
 <History className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-sm text-muted-foreground">Select a URL from the left to view its scan history and trends.</p>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
