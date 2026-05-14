"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { FindingCard } from "@/components/offensive/finding-card";
import { AppMetadata } from "@/components/mobile/app-metadata";
import { AppStoreVerdict } from "@/components/mobile/appstore-verdict";
import { Loader2 } from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import Link from "next/link";

interface MobileScanResult {
 id: string;
 status: string;
 scan_mode: "appstore_check" | "security_audit" | "offensive_pentest";
 app_name: string;
 package_name: string;
 version_name: string;
 platform: "android" | "ios";
 framework?: string;
 target_sdk?: number;
 permissions?: string[];
 findings: any[];
 logs: any[];
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 severity_info: number;
 appstore_verdict?: {
 verdict: "pass" | "fail" | "warning";
 blockers: any[];
 warnings: any[];
 passed: string[];
 };
 api_endpoints?: string[];
 tools_used: string[];
 started_at: string;
 completed_at: string;
 created_at: string;
}

export default function MobileScanDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const [scan, setScan] = useState<MobileScanResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [sortBy, setSortBy] = useState<"severity" | "category" | "tool">("severity");

 const fetchScan = useCallback(async () => {
 if (authLoading || !id) return;
 if (!isAuthenticated) {
 setLoading(false);
 return;
 }
 
 try {
 const res = await api.request<{ scan: MobileScanResult }>(`/mobile-scan/${id}`);
 if (res.data) {
 setScan(res.data.scan);
 }
 } catch (error) {
 console.error("Failed to fetch scan:", error);
 } finally {
 setLoading(false);
 }
 }, [isAuthenticated, authLoading, id]);

 useEffect(() => {
  fetchScan();
 }, [fetchScan]);

 useEffect(() => {
  if (scan && (scan.status === "running" || scan.status === "pending")) {
   router.replace(`/dashboard/mobile-scan/${id}/scanning`);
  }
 }, [id, router, scan]);

 // Poll while running
 useEffect(() => {
 if (!scan || scan.status !== "running") return;
 const interval = setInterval(fetchScan, 5000);
 return () => clearInterval(interval);
 }, [scan?.status, fetchScan]);

 const exportFindings = (format: "json" | "sarif") => {
 if (!scan) return;
 const data =
 format === "json"
 ? JSON.stringify(scan.findings, null, 2)
 : JSON.stringify(
 {
 version: "2.1.0",
 $schema: "https://json.schemastore.org/sarif-2.1.0.json",
 runs: [
 {
 tool: {
 driver: { name: "OwnSurface Mobile Xray", version: "1.0.0" },
 },
 results: scan.findings.map((f: any) => ({
 ruleId: f.id,
 level:
 f.severity === "critical" || f.severity === "high"
 ? "error"
 : "warning",
 message: { text: f.description },
 })),
 },
 ],
 },
 null,
 2
 );

 const blob = new Blob([data], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `mobile-scan-${scan.package_name || scan.id.slice(0, 8)}.${format}`;
 a.click();
 URL.revokeObjectURL(url);
 };

 if (loading) {
 return (
 <div className="flex justify-center py-20">
 <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
 </div>
 );
 }

 if (!scan) {
 return <div className="py-20 text-center text-white/50">Run not found</div>;
 }

 const severityOrder: Record<string, number> = {
 critical: 0,
 high: 1,
 medium: 2,
 low: 3,
 info: 4,
 };
 const sortedFindings = [...(scan.findings || [])].sort((a, b) => {
 if (sortBy === "severity")
 return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
 if (sortBy === "category")
 return (a.category || "").localeCompare(b.category || "");
 return (a.tool_used || "").localeCompare(b.tool_used || "");
 });

 return (
 <div className="mx-auto max-w-7xl animate-in fade-in duration-700">
 <div className="mb-6">
 <div className="mb-8">
 <Link
 href="/dashboard/mobile-scan"
 className="inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
 >
 [ BACK TO APP SECURITY ]
 </Link>
 </div>
 </div>

 {/* ─── Premium Integrated Header ─── */}
 {/* Dashboard-style Header Card */}
 <div className="dark-panel rounded-[2rem] p-8 sm:p-10 mb-10 border border-white/5 relative overflow-hidden group">
 <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center justify-between">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-4 mb-4">
 <h1 className="text-[2.5rem] sm:text-[3.2rem] font-medium leading-[0.94] tracking-tight text-white truncate">
 {scan.app_name || scan.package_name || "App Security"}
 </h1>
 <div className="inline-flex items-center gap-2 rounded-full px-4 py-1 text-[0.65rem] font-medium uppercase tracking-widest bg-card/50 text-white border border-white/10">
 {scan.status === "running" ? "SCANNING..." : "COMPLETE"}
 </div>
 </div>
 
 <div className="flex flex-wrap gap-6 text-[0.7rem] font-medium text-white/40 uppercase tracking-widest">
 {scan.started_at && (
 <div className="flex items-center gap-2">
 <span>DETECTED {new Date(scan.started_at).toLocaleDateString()}</span>
 </div>
 )}
 {scan.completed_at && (
 <div className="flex items-center gap-2">
 <span className="text-emerald-400">STATUS: VERIFIED</span>
 </div>
 )}
 </div>
 </div>
 
 <div className="flex flex-shrink-0 gap-3">
 {scan.status === "complete" && (
 <>
 <button
 onClick={() => exportFindings("json")}
 className="px-6 py-3 rounded-[1.1rem] bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-[0.7rem] font-medium uppercase tracking-widest transition-all backdrop-blur-sm"
 >
 EXPORT JSON
 </button>
 <button
 onClick={() => exportFindings("sarif")}
 className="px-6 py-3 rounded-[1.1rem] bg-white/[0.07] hover:bg-white/[0.12] border border-white/10 text-white text-[0.7rem] font-medium uppercase tracking-widest transition-all backdrop-blur-sm"
 >
 EXPORT SARIF
 </button>
 </>
 )}
 </div>
 </div>
 </div>

 <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-10">
 <HeroStat label="Critical" value={String(scan.severity_critical)} theme="red" />
 <HeroStat label="High" value={String(scan.severity_high)} theme="orange" />
 <HeroStat label="Medium" value={String(scan.severity_medium)} theme="amber" />
 <HeroStat label="Low" value={String(scan.severity_low)} theme="blue" />
 <HeroStat label="Info" value={String(scan.severity_info)} theme="teal" />
 </div>

 {/* Content Section */}
 <div className="space-y-8">
 {/* App Metadata & Verdict Side by Side */}
 <div className="grid gap-6 xl:grid-cols-2">
 <AppMetadata
 metadata={{
 app_name: scan.app_name,
 package_name: scan.package_name,
 version_name: scan.version_name,
 platform: scan.platform,
 framework: scan.framework,
 target_sdk: scan.target_sdk,
 permissions: scan.permissions,
 }}
 />
 {scan.appstore_verdict && (
 <AppStoreVerdict verdict={scan.appstore_verdict} />
 )}
 </div>

 {/* Running indicator */}
 {scan.status === "running" && (
 <div className="shell-panel flex items-center gap-4 rounded-[1.5rem] p-8 border border-border bg-card ">
 <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-full bg-teal-50 border border-teal-200" />
 <div>
 <div className="text-[0.7rem] font-medium uppercase tracking-widest text-teal-900 mb-1">INTELLIGENCE ENGAGEMENT IN PROGRESS</div>
 <div className="text-[0.85rem] font-medium text-teal-900/60">
 {scan.logs?.length > 0
 ? scan.logs[scan.logs.length - 1].message
 : "Initializing scan components..."}
 </div>
 </div>
 </div>
 )}

 {/* Findings Controls */}
 {sortedFindings.length > 0 && (
 <div className="flex items-center gap-4 px-1">
 <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground">SORT INTEL BY:</span>
 <div className="flex gap-2">
 {(["severity", "category", "tool"] as const).map((opt) => (
 <button
 key={opt}
 onClick={() => setSortBy(opt)}
 className={`rounded-lg px-4 py-1.5 text-[0.65rem] font-medium uppercase tracking-widest transition-all border ${
 sortBy === opt
 ? "bg-zinc-900 text-white border-zinc-900"
 : "bg-card text-muted-foreground border-border hover:border-zinc-400 hover:text-foreground"
 }`}
 >
 {opt}
 </button>
 ))}
 </div>
 </div>
 )}

 {/* Findings List */}
 <div className="space-y-3">
 {sortedFindings.map((finding) => (
 <FindingCard key={finding.id} finding={finding} />
 ))}

 {sortedFindings.length === 0 && scan.status === "complete" && (
 <div className="rounded-[2.5rem] border border-dashed border-border bg-muted/5 px-6 py-24 text-center">
 <h3 className="text-[1.25rem] font-medium tracking-tight text-foreground mb-2">System Integrity Confirmed</h3>
 <p className="text-[0.8rem] font-medium text-muted-foreground uppercase tracking-widest">
 No vulnerabilities discovered across mobile endpoints
 </p>
 </div>
 )}
 </div>

 {/* Discovered API Endpoints & Tools */}
 {(scan.api_endpoints?.length || scan.tools_used?.length) ? (
 <div className="grid gap-6 md:grid-cols-2">
 {scan.api_endpoints && scan.api_endpoints.length > 0 && (
 <div className="shell-panel rounded-[2rem] p-8 border border-border bg-card ">
 <h3 className="mb-6 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 DISCOVERED API ENDPOINTS ({scan.api_endpoints.length})
 </h3>
 <div className="max-h-[300px] space-y-2 overflow-y-auto pr-2 custom-scrollbar">
 {scan.api_endpoints.map((endpoint, i) => (
 <div
 key={i}
 className="rounded-[1rem] bg-muted/30 border border-border px-4 py-3 font-mono text-xs text-foreground/80 break-all"
 >
 {endpoint}
 </div>
 ))}
 </div>
 </div>
 )}
 
 {scan.tools_used && scan.tools_used.length > 0 && (
 <div className="shell-panel rounded-[2rem] p-8 h-fit border border-border bg-card ">
 <h3 className="mb-6 text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 TOOLS DEPLOYED ({scan.tools_used.length})
 </h3>
 <div className="flex flex-wrap gap-2">
 {scan.tools_used.map((tool, i) => (
 <div
 key={i}
 className="rounded-full bg-muted/30 border border-border px-4 py-1.5 font-mono text-[0.65rem] font-medium text-foreground/70"
 >
 {tool}
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 ) : null}
 </div>
 </div>
 );
}

// ─── Sub-components ───

function HeroStat({ label, value, theme }: { label: string; value: string; theme: "blue" | "emerald" | "amber" | "red" | "indigo" | "teal" | "purple" | "orange" }) {
 const themes = {
 blue: "text-blue-400 bg-blue-500/10 border-blue-500/20",
 emerald: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
 amber: "text-amber-400 bg-amber-500/10 border-amber-500/20",
 red: "text-red-400 bg-red-500/10 border-red-500/20",
 indigo: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
 teal: "text-teal-400 bg-teal-500/10 border-teal-500/20",
 purple: "text-purple-400 bg-purple-500/10 border-purple-500/20",
 orange: "text-orange-400 bg-orange-500/10 border-orange-500/20",
 };
 return (
 <div className={cn("relative overflow-hidden rounded-[1.5rem] border p-6 flex flex-col justify-center gap-1 transition-all hover:", themes[theme])}>
 <div className="text-[0.62rem] font-medium uppercase tracking-[0.2em] opacity-70 mb-1">
 {label}
 </div>
 <div className="text-3xl font-medium tracking-tight">
 {value}
 </div>
 </div>
 );
}
