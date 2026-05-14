"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { FindingCard } from "@/components/offensive/finding-card";
import { TargetConfirmation } from "@/components/offensive/target-confirmation";
import { ScanTimeline } from "@/components/offensive/scan-timeline";
import { Loader2, Shield, Download, ArrowLeft, OctagonX, Clock, Activity } from "lucide-react";
import Link from "next/link";

interface OffensiveScan {
 id: string;
 domain: string;
 status: string;
 findings: any[];
 logs: any[];
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 severity_info: number;
 tools_used: string[];
 safety_score?: number;
 safety_grade?: string;
 started_at: string;
 completed_at: string;
 created_at: string;
}

type Tab = "findings" | "logs" | "replay";

export default function OffensiveScanDetailPage() {
 const { id } = useParams<{ id: string }>();
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const [scan, setScan] = useState<OffensiveScan | null>(null);
 const [loading, setLoading] = useState(true);
 const [sortBy, setSortBy] = useState<"severity" | "category" | "tool">("severity");
 const [activeTab, setActiveTab] = useState<Tab>("findings");
 const [replayEvents, setReplayEvents] = useState<any[]>([]);
 const [replayLoading, setReplayLoading] = useState(false);
 const [killing, setKilling] = useState(false);
 const [classifications, setClassifications] = useState<any[]>([]);

 const fetchScan = useCallback(async () => {
 if (authLoading || !id) return;
 if (!isAuthenticated) {
 setLoading(false);
 return;
 }

 try {
 const res = await api.request<{ scan: OffensiveScan }>(`/offensive-scan/${id}`);
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

 // Poll while running/classifying
 useEffect(() => {
 if (!scan || !["running", "classifying", "awaiting_confirmation"].includes(scan.status)) return;
 const interval = setInterval(fetchScan, 5000);
 return () => clearInterval(interval);
 }, [scan?.status, fetchScan]);

 const fetchReplay = async () => {
 if (authLoading || !isAuthenticated || !id || replayEvents.length > 0) return;
 setReplayLoading(true);
 try {
 const res = await api.request<{ events: any[] }>(`/offensive-scan/${id}/replay`);
 if (res.data) {
 setReplayEvents(res.data.events || []);
 }
 } catch {
 // Replay may not be available for older scans
 } finally {
 setReplayLoading(false);
 }
 };

 const killScan = async () => {
 if (!isAuthenticated || !id || killing) return;
 if (!confirm("Are you sure you want to emergency stop this scan? All running processes will be terminated immediately.")) return;

 setKilling(true);
 try {
 await api.request(`/offensive-scan/${id}/kill`, { method: "POST" });
 fetchScan();
 } catch {
 // Error handled by polling
 } finally {
 setKilling(false);
 }
 };

 const exportFindings = (format: "json" | "sarif") => {
 if (!scan) return;
 const data = format === "json"
 ? JSON.stringify(scan.findings, null, 2)
 : JSON.stringify({
 version: "2.1.0",
 $schema: "https://json.schemastore.org/sarif-2.1.0.json",
 runs: [{
 tool: { driver: { name: "OwnSurface Xray", version: "1.0.0" } },
 results: scan.findings.map((f: any) => ({
 ruleId: f.id,
 level: f.severity === "critical" || f.severity === "high" ? "error" : "warning",
 message: { text: f.description },
 })),
 }],
 }, null, 2);

 const blob = new Blob([data], { type: "application/json" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `offensive-scan-${scan.domain}-${scan.id.slice(0, 8)}.${format}`;
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
 return <div className="py-20 text-center text-muted-foreground">Scan not found</div>;
 }

 const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3, info: 4 };
 const sortedFindings = [...(scan.findings || [])].sort((a, b) => {
 if (sortBy === "severity") return (severityOrder[a.severity] || 4) - (severityOrder[b.severity] || 4);
 if (sortBy === "category") return (a.category || "").localeCompare(b.category || "");
 return (a.tool_used || "").localeCompare(b.tool_used || "");
 });

 const isActive = ["running", "classifying", "awaiting_confirmation"].includes(scan.status);

 // Safety badge colors
 const gradeColors: Record<string, string> = {
 A: "text-green-400 bg-green-500/10 border-green-500/30",
 B: "text-blue-400 bg-blue-500/10 border-blue-500/30",
 C: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
 D: "text-orange-400 bg-orange-500/10 border-orange-500/30",
 F: "text-red-400 bg-red-500/10 border-red-500/30",
 };

 return (
 <div className="space-y-6">
 {/* Header */}
 <div className="flex items-center gap-4">
 <Link
 href="/dashboard/offensive-scan"
 className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" />
 Back
 </Link>
 </div>

 <div className="flex items-start justify-between">
 <div className="flex items-center gap-4">
 <div>
 <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight text-foreground">
 <Shield className="h-6 w-6 text-teal-600" />
 {scan.domain}
 </h1>
 <p className="mt-1 text-sm text-muted-foreground">
 {scan.status === "running" ? "Scan in progress..." :
 scan.status === "classifying" ? "Classifying targets..." :
 scan.status === "awaiting_confirmation" ? "Awaiting target confirmation..." :
 scan.status === "killed" ? "Scan was emergency stopped" :
 scan.status === "blocked_risk" ? "Blocked due to high risk" :
 `Completed ${scan.completed_at ? new Date(scan.completed_at).toLocaleString() : ""}`}
 </p>
 </div>

 {/* Safety badge */}
 {scan.safety_grade && (
 <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 ${gradeColors[scan.safety_grade] || gradeColors.C}`}>
 <div className="text-xl font-bold">{scan.safety_grade}</div>
 <div className="text-xs opacity-70">{scan.safety_score}/100</div>
 </div>
 )}
 </div>

 <div className="flex gap-2">
 {/* Kill button */}
 {isActive && (
 <button
 onClick={killScan}
 disabled={killing}
 className="flex items-center gap-1.5 rounded-xl bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400 hover:bg-red-500/20 disabled:opacity-50"
 >
 <OctagonX className="h-3.5 w-3.5" />
 {killing ? "Stopping..." : "Emergency Stop"}
 </button>
 )}

 {scan.status === "complete" && (
 <>
 <button
 onClick={() => exportFindings("json")}
 className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
 >
 <Download className="h-3 w-3" />
 JSON
 </button>
 <button
 onClick={() => exportFindings("sarif")}
 className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-accent/50 hover:text-foreground"
 >
 <Download className="h-3 w-3" />
 SARIF
 </button>
 </>
 )}
 </div>
 </div>

 {/* Summary bar */}
 <div className="rounded-xl border border-border bg-card grid grid-cols-5 gap-4 p-4">
 {[
 { label: "Critical", count: scan.severity_critical, color: "text-red-600" },
 { label: "High", count: scan.severity_high, color: "text-orange-600" },
 { label: "Medium", count: scan.severity_medium, color: "text-amber-600" },
 { label: "Low", count: scan.severity_low, color: "text-blue-600" },
 { label: "Info", count: scan.severity_info, color: "text-slate-600" },
 ].map(({ label, count, color }) => (
 <div key={label} className="text-center">
 <div className={`text-2xl font-bold ${color}`}>{count}</div>
 <div className="text-xs text-muted-foreground">{label}</div>
 </div>
 ))}
 </div>

 {/* Status-specific displays */}
 {scan.status === "classifying" && (
 <div className="rounded-xl border border-border bg-card flex items-center gap-3 p-4">
 <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
 <div>
 <div className="text-sm font-medium text-foreground">Classifying subdomains</div>
 <div className="text-xs text-muted-foreground">
 Analyzing CNAME records, ASN, and TLS certificates to identify third-party infrastructure...
 </div>
 </div>
 </div>
 )}

 {scan.status === "awaiting_confirmation" && classifications.length > 0 && (
 <div className="rounded-xl border border-border bg-card p-6">
 <TargetConfirmation
 scanId={scan.id}
 domain={scan.domain}
 targets={classifications}
 onConfirmed={fetchScan}
 />
 </div>
 )}

 {scan.status === "awaiting_confirmation" && classifications.length === 0 && (
 <div className="rounded-xl border border-border bg-card flex items-center gap-3 p-4">
 <Clock className="h-5 w-5 text-amber-600" />
 <div>
 <div className="text-sm font-medium text-foreground">Awaiting confirmation</div>
 <div className="text-xs text-muted-foreground">
 High-risk factors detected. Review and confirm to proceed with the scan.
 </div>
 </div>
 </div>
 )}

 {scan.status === "blocked_risk" && (
 <div className="rounded-xl bg-red-50 border border-red-200 p-4">
 <div className="flex items-center gap-2 text-red-600">
 <OctagonX className="h-5 w-5" />
 <span className="text-sm font-medium">Scan Blocked</span>
 </div>
 <p className="mt-1 text-sm text-red-900/70">
 This scan was blocked due to critical risk factors. Review the risk assessment in the logs below.
 </p>
 </div>
 )}

 {scan.status === "killed" && (
 <div className="rounded-xl bg-red-50 border border-red-200 p-4">
 <div className="flex items-center gap-2 text-red-600">
 <OctagonX className="h-5 w-5" />
 <span className="text-sm font-medium">Scan Killed</span>
 </div>
 <p className="mt-1 text-sm text-red-900/70">
 This scan was emergency stopped. All running processes were terminated.
 </p>
 </div>
 )}

 {/* Running indicator */}
 {scan.status === "running" && (
 <div className="rounded-xl border border-border bg-card flex items-center gap-3 p-4">
 <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
 <div>
 <div className="text-sm font-medium text-foreground">Scan in progress</div>
 <div className="text-xs text-muted-foreground">
 {scan.logs?.length > 0 ? scan.logs[scan.logs.length - 1].message : "Initializing..."}
 </div>
 </div>
 </div>
 )}

 {/* Tab controls */}
 <div className="flex items-center gap-1 border-b border-border pb-px">
 {(["findings", "logs", "replay"] as Tab[]).map((tab) => (
 <button
 key={tab}
 onClick={() => {
 setActiveTab(tab);
 if (tab === "replay") fetchReplay();
 }}
 className={`rounded-t-lg px-4 py-2 text-sm transition-colors ${
 activeTab === tab
 ? "bg-teal-50 text-teal-900 border-b-2 border-teal-600"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 {tab === "findings" && `Findings (${scan.findings?.length || 0})`}
 {tab === "logs" && "Logs"}
 {tab === "replay" && (
 <span className="flex items-center gap-1.5">
 <Activity className="h-3.5 w-3.5" />
 Replay
 </span>
 )}
 </button>
 ))}
 </div>

 {/* Tab content */}
 {activeTab === "findings" && (
 <>
 {/* Sort controls */}
 {sortedFindings.length > 0 && (
 <div className="flex items-center gap-2">
 <span className="text-xs text-muted-foreground">Sort by:</span>
 {(["severity", "category", "tool"] as const).map((opt) => (
 <button
 key={opt}
 onClick={() => setSortBy(opt)}
 className={`rounded-lg px-2.5 py-1 text-xs transition-colors ${
 sortBy === opt ? "bg-teal-50 text-teal-900 border border-teal-200" : "text-muted-foreground hover:text-foreground border border-transparent"
 }`}
 >
 {opt.charAt(0).toUpperCase() + opt.slice(1)}
 </button>
 ))}
 </div>
 )}

 <div className="space-y-2">
 {sortedFindings.map((finding) => (
 <FindingCard key={finding.id} finding={finding} />
 ))}

 {sortedFindings.length === 0 && scan.status === "complete" && (
 <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-8 text-center">
 <Shield className="mx-auto h-10 w-10 text-emerald-600" />
 <h3 className="mt-3 text-lg font-semibold text-emerald-800">No vulnerabilities found</h3>
 <p className="mt-1 text-sm text-emerald-600/80">
 All tested attack vectors returned clean results.
 </p>
 </div>
 )}
 </div>
 </>
 )}

 {activeTab === "logs" && (
 <div className="space-y-1">
 {(scan.logs || []).map((log: any, i: number) => (
 <div key={i} className="flex gap-3 rounded-md px-3 py-1.5 text-xs font-mono">
 <span className="shrink-0 text-muted-foreground/50">{new Date(log.timestamp).toLocaleTimeString()}</span>
 <span className={`shrink-0 w-16 ${
 log.level === "error" ? "text-red-600" :
 log.level === "warning" ? "text-amber-600" :
 log.level === "success" ? "text-emerald-600" :
 "text-muted-foreground"
 }`}>
 [{log.phase}]
 </span>
 <span className="text-foreground/80">{log.message}</span>
 </div>
 ))}
 </div>
 )}

 {activeTab === "replay" && (
 replayLoading ? (
 <div className="flex justify-center py-10">
 <Loader2 className="h-6 w-6 animate-spin text-teal-300" />
 </div>
 ) : (
 <ScanTimeline events={replayEvents} />
 )
 )}

 {/* Tools used */}
 {scan.tools_used?.length > 0 && (
 <div className="text-xs text-muted-foreground/50">
 Tools used: {scan.tools_used.join(", ")}
 </div>
 )}
 </div>
 );
}
