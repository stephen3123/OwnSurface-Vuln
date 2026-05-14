"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { FindingCard } from "@/components/offensive/finding-card";
import { Loader2, Puzzle, Download, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface ExtensionScanResult {
 id: string;
 status: string;
 extension_name: string;
 extension_id?: string | null;
 manifest_version?: number | null;
 permissions_declared?: string[];
 host_permissions?: string[];
 findings: any[];
 logs: any[];
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 severity_info: number;
 tools_used: string[];
 started_at?: string | null;
 completed_at?: string | null;
 created_at: string;
}

export default function ExtensionScanDetailPage() {
 const { id } = useParams<{ id: string }>();
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const [scan, setScan] = useState<ExtensionScanResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [sortBy, setSortBy] = useState<"severity" | "category">("severity");

 const fetchScan = useCallback(async () => {
 if (authLoading || !id) return;
 if (!isAuthenticated) {
 setLoading(false);
 return;
 }

 try {
 const res = await api.request<{ scan: ExtensionScanResult }>(`/extension-scan/${id}`);
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

 // Poll while queued/running
 useEffect(() => {
 if (!scan) return;
 if (scan.status !== "pending" && scan.status !== "running") return;
 const interval = setInterval(fetchScan, 3000);
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
 driver: { name: "OwnSurface Extension Xray", version: "1.0.0" },
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
 a.download = `extension-scan-${scan.extension_name || scan.id.slice(0, 8)}.${format}`;
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
 return <div className="py-20 text-center text-white/50">Scan not found</div>;
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
 return (a.category || "").localeCompare(b.category || "");
 });

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center gap-4">
 <Link
 href="/dashboard/extension-scan"
 className="flex items-center gap-1 text-sm text-white/50 hover:text-white/70"
 >
 <ArrowLeft className="h-4 w-4" />
 Back
 </Link>
 </div>

 <div className="flex items-start justify-between">
 <div>
 <h1 className="flex items-center gap-3 text-2xl font-bold text-white">
 <Puzzle className="h-6 w-6 text-teal-400" />
 {scan.extension_name || "Extension Scan"}
 </h1>
 <p className="mt-1 text-sm text-white/50">
 {scan.status === "pending"
 ? "Queued — waiting for worker…"
 : scan.status === "running"
 ? "Scan in progress…"
 : scan.status === "complete"
 ? `Completed ${scan.completed_at ? new Date(scan.completed_at).toLocaleString() : ""}`
 : scan.status === "failed"
 ? "Scan failed"
 : scan.status === "cancelled"
 ? "Scan cancelled"
 : `Status: ${scan.status}`}
 </p>
 </div>

 {scan.status === "complete" && (
 <div className="flex gap-2">
 <button
 onClick={() => exportFindings("json")}
 className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5"
 >
 <Download className="h-3 w-3" />
 JSON
 </button>
 <button
 onClick={() => exportFindings("sarif")}
 className="flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-white/60 hover:bg-white/5"
 >
 <Download className="h-3 w-3" />
 SARIF
 </button>
 </div>
 )}
 </div>

 {/* Extension Metadata */}
 {(scan.manifest_version != null ||
  (scan.permissions_declared && scan.permissions_declared.length > 0) ||
  (scan.host_permissions && scan.host_permissions.length > 0)) && (
 <div className="dark-panel rounded-2xl p-5">
 <h3 className="mb-3 text-sm font-semibold text-white/80">Extension Info</h3>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {scan.manifest_version != null && (
 <div>
 <div className="text-xs text-white/40">Manifest</div>
 <div className="text-sm text-white/80">V{scan.manifest_version}</div>
 </div>
 )}
 </div>
 {scan.permissions_declared && scan.permissions_declared.length > 0 && (
 <div className="mt-3">
 <div className="mb-1 text-xs text-white/40">
 Permissions ({scan.permissions_declared.length})
 </div>
 <div className="flex flex-wrap gap-1.5">
 {scan.permissions_declared.map((perm, i) => (
 <span
 key={i}
 className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60"
 >
 {perm}
 </span>
 ))}
 </div>
 </div>
 )}
 {scan.host_permissions && scan.host_permissions.length > 0 && (
 <div className="mt-3">
 <div className="mb-1 text-xs text-white/40">
 Host permissions ({scan.host_permissions.length})
 </div>
 <div className="flex flex-wrap gap-1.5">
 {scan.host_permissions.map((perm, i) => (
 <span
 key={i}
 className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-xs text-white/60"
 >
 {perm}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 )}

 {/* Severity summary bar */}
 <div className="dark-panel grid grid-cols-5 gap-4 rounded-2xl p-4">
 {[
 { label: "Critical", count: scan.severity_critical, color: "text-red-400" },
 { label: "High", count: scan.severity_high, color: "text-orange-400" },
 { label: "Medium", count: scan.severity_medium, color: "text-yellow-400" },
 { label: "Low", count: scan.severity_low, color: "text-blue-400" },
 { label: "Info", count: scan.severity_info, color: "text-muted-foreground" },
 ].map(({ label, count, color }) => (
 <div key={label} className="text-center">
 <div className={`text-2xl font-bold ${color}`}>{count}</div>
 <div className="text-xs text-white/40">{label}</div>
 </div>
 ))}
 </div>

 {/* Pending/running indicator */}
 {scan.status === "pending" && (
 <div className="dark-panel flex items-center gap-3 rounded-2xl p-4">
 <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
 <div>
 <div className="text-sm font-medium text-white/80">Queued</div>
 <div className="text-xs text-white/40">
 Waiting for the scan worker to pick up the job. If this stays queued for more than ~10–20s, the worker/NATS may not be running.
 </div>
 </div>
 </div>
 )}
 {scan.status === "running" && (
 <div className="dark-panel flex items-center gap-3 rounded-2xl p-4">
 <Loader2 className="h-5 w-5 animate-spin text-teal-400" />
 <div>
 <div className="text-sm font-medium text-white/80">Scan in progress</div>
 <div className="text-xs text-white/40">
 {scan.logs?.length > 0
 ? scan.logs[scan.logs.length - 1].message
 : "Initializing..."}
 </div>
 </div>
 </div>
 )}

 {scan.status === "failed" && (
 <div className="dark-panel rounded-2xl border border-red-500/20 bg-red-500/5 p-5">
 <div className="text-sm font-semibold text-red-300">Scan failed</div>
 <div className="mt-1 text-xs text-white/50">
 {scan.logs?.length > 0 ? scan.logs[scan.logs.length - 1].message : "No logs available."}
 </div>
 </div>
 )}

 {/* Sort controls */}
 {sortedFindings.length > 0 && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-white/40">Sort by:</span>
 {(["severity", "category"] as const).map((opt) => (
 <button
 key={opt}
 onClick={() => setSortBy(opt)}
 className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
 sortBy === opt
 ? "bg-teal-500/10 text-teal-400"
 : "text-white/40 hover:text-white/60"
 }`}
 >
 {opt.charAt(0).toUpperCase() + opt.slice(1)}
 </button>
 ))}
 </div>
 )}

 {/* Findings */}
 <div className="space-y-2">
 {sortedFindings.map((finding) => (
 <FindingCard key={finding.id} finding={finding} />
 ))}

 {sortedFindings.length === 0 && scan.status === "complete" && (
 <div className="rounded-2xl border border-green-500/20 bg-green-500/5 p-8 text-center">
 <Puzzle className="mx-auto h-10 w-10 text-green-400" />
 <h3 className="mt-3 text-lg font-semibold text-green-300">
 No vulnerabilities found
 </h3>
 <p className="mt-1 text-sm text-white/50">
 All security checks passed without issues.
 </p>
 </div>
 )}
 </div>

 {/* Tools used */}
 {scan.tools_used?.length > 0 && (
 <div className="text-xs text-white/30">
 Tools used: {scan.tools_used.join(", ")}
 </div>
 )}
 </div>
 );
}
