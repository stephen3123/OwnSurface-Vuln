"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { api, type AttackSurfaceAuditResponse, type DeepScanInfo } from "@/lib/api-client";
import { DeepScanTerminal } from "@/components/domains/deep-scan-terminal";
import { AuditTerminal, type AuditLog } from "@/components/attack-surface/audit-terminal";
import { FullAuditTerminal } from "@/components/attack-surface/full-audit-terminal";
import { FindingCard, type AuditFinding } from "@/components/attack-surface/finding-card";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";


type ScanMode = "deep" | "probe" | "full";

function isActive(status: string): boolean {
 return status === "running" || status === "scanning" || status === "pending";
}

function ScanningContent() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const searchParams = useSearchParams();

 const modeParam = (searchParams.get("mode") || "deep") as ScanMode;
 const deepIdParam = searchParams.get("deepId");
 const probeIdParam = searchParams.get("probeId");
 const requestedDomain = searchParams.get("domain") || "";

 const probeId = modeParam === "deep" ? null : (probeIdParam || id);
 // Only use route id as deepId if mode is "deep" (not "full" — in full mode the route id is the probe id)
 const deepId = modeParam === "probe" ? null : (deepIdParam || (modeParam === "deep" ? id : null));

 const [probe, setProbe] = useState<AttackSurfaceAuditResponse | null>(null);
 const [deep, setDeep] = useState<DeepScanInfo | null>(null);
 const [loading, setLoading] = useState(true);
 const [redirecting, setRedirecting] = useState(false);
 // For full audit: resolve deepId dynamically if not passed in URL
 const [resolvedDeepId, _setResolvedDeepId] = useState<string | null>(deepId);
 const resolvedDeepIdRef = useRef<string | null>(deepId);
 const setResolvedDeepId = (id: string | null) => {
 resolvedDeepIdRef.current = id;
 _setResolvedDeepId(id);
 };
 const [startingDeepScan, setStartingDeepScan] = useState(false);
 const [cancelling, setCancelling] = useState(false);

 const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const hasRedirectedRef = useRef(false);
 const hasStartedDeepScanRef = useRef(false);

 const loadData = useCallback(async () => {
 try {
 const promises: Promise<any>[] = [];

 if (probeId) {
 promises.push(api.getAttackSurfaceAudit(probeId));
 } else {
 promises.push(Promise.resolve({ data: null }));
 }

 // Always read the latest resolvedDeepId from the ref
 const currentDeepId = resolvedDeepIdRef.current;

 if (currentDeepId) {
 promises.push(api.request<any>(`/deep-scan/${currentDeepId}`));
 } else {
 promises.push(Promise.resolve({ data: null }));
 }

 const [probeRes, deepRes] = await Promise.all(promises);

 const probeData = probeRes.data || null;
 if (probeData) {
 setProbe(probeData);
 if (modeParam === "full" && !currentDeepId && probeData.paired_deep_scan_id) {
 setResolvedDeepId(probeData.paired_deep_scan_id);
 }
 }

 const deepData = deepRes.data?.deep_scan || deepRes.data || null;
 if (deepData?.id) setDeep(deepData);
 } catch {
 // graceful fallback — keep polling
 } finally {
 setLoading(false);
 }
 }, [modeParam, probeId]);

 useEffect(() => { loadData(); }, [loadData]);

 useEffect(() => {
 if (modeParam !== "full") return;
 if (!probe || probe.status !== "complete") return;
 if (probe.paired_deep_scan_id) return;
 if (resolvedDeepId || startingDeepScan || hasStartedDeepScanRef.current) return;
 const completedProbe = probe;

 let cancelled = false;

 async function startPhaseTwo() {
 const targetDomain = completedProbe.domain || requestedDomain;
 if (!targetDomain) return;

 hasStartedDeepScanRef.current = true;
 setStartingDeepScan(true);

 try {
 const res = await api.startDeepScan(targetDomain);
 const deepData = (res.data as any)?.deep_scan || res.data;

 if (!deepData?.id) {
 throw new Error("Deep scan did not return an id");
 }

 if (cancelled) return;

 setResolvedDeepId(deepData.id);
 setDeep(deepData);

 if (probeId) {
 api.pairFullAudit(probeId, deepData.id).catch(() => {});
 }

 const params = new URLSearchParams(searchParams.toString());
 params.set("mode", "full");
 params.set("probeId", probeId || id);
 params.set("deepId", deepData.id);
 router.replace(`/dashboard/attack-surface/${probeId || id}/scanning?${params.toString()}`);

 // Immediately trigger a data load so we don't wait for next poll
 setTimeout(() => loadData(), 500);
 } catch {
 hasStartedDeepScanRef.current = false;
 if (!cancelled) {
 toast.error("Security probe finished, but deep scan could not be started");
 }
 } finally {
 if (!cancelled) {
 setStartingDeepScan(false);
 }
 }
 }

 startPhaseTwo();

 return () => {
 cancelled = true;
 };
 }, [modeParam, probe, resolvedDeepId, startingDeepScan, probeId, id, requestedDomain, router, searchParams, loadData]);

 async function handleCancel() {
 setCancelling(true);
 try {
 const results = await Promise.allSettled([
 probeId && probe && isActive(probe.status)
 ? api.cancelAttackSurfaceAudit(probeId)
 : Promise.resolve(),
 resolvedDeepId && deep && isActive(deep.status)
 ? api.cancelDeepScan(resolvedDeepId)
 : Promise.resolve(),
 ]);

 const anySuccess = results.some((r) => r.status === "fulfilled");
 if (anySuccess) {
 toast.success("Scan cancelled");
 await loadData();
 } else {
 toast.error("Failed to cancel scan");
 }
 } catch {
 toast.error("Failed to cancel scan");
 } finally {
 setCancelling(false);
 }
 }

 // Poll every 3s while scans are active
 useEffect(() => {
 const probeActive = probeId && (!probe || isActive(probe.status));
 const deepActive = resolvedDeepId && (!deep || isActive(deep.status));

 if (!probeActive && !deepActive) {
 if (pollRef.current) clearInterval(pollRef.current);
 return;
 }

 pollRef.current = setInterval(loadData, 3000);
 return () => {
 if (pollRef.current) clearInterval(pollRef.current);
 };
 }, [probe?.status, deep?.status, probeId, resolvedDeepId, loadData]);

 // Auto-redirect when ALL scans complete (not just one)
 useEffect(() => {
 if (hasRedirectedRef.current || loading) return;

 const waitingForPhaseTwo = modeParam === "full" && (!resolvedDeepId || startingDeepScan);
 const probeComplete = !probeId || (probe && !isActive(probe.status));
 const deepComplete = !resolvedDeepId || (deep && !isActive(deep.status));

 if (!waitingForPhaseTwo && probeComplete && deepComplete) {
 hasRedirectedRef.current = true;
 setRedirecting(true);

 const resultId = probeId || resolvedDeepId || id;
 const params = new URLSearchParams();
 if (modeParam) params.set("mode", modeParam);
 if (resolvedDeepId && probeId) {
 params.set("deepId", resolvedDeepId);
 params.set("probeId", probeId);
 }
 const qs = params.toString();
 const url = `/dashboard/attack-surface/${resultId}${qs ? `?${qs}` : ""}`;

 const timer = setTimeout(() => {
 router.replace(url);
 }, 2000);

 return () => clearTimeout(timer);
 }
 }, [probe, deep, probeId, resolvedDeepId, loading, id, modeParam, router]);

 // Overall status — only "complete" when ALL scans are done
 const probeStatus = probeId ? (probe?.status || "pending") : null;
 const deepStatus = resolvedDeepId ? (deep?.status || "pending") : null;
 const statuses = [probeStatus, deepStatus].filter(Boolean) as string[];

 const overallStatus = modeParam === "full"
 ? probe?.status === "failed"
 ? "failed"
 : !probe || isActive(probe.status)
 ? "running"
 : startingDeepScan || !resolvedDeepId
 ? "running"
 : !deep || isActive(deep.status)
 ? "running"
 : deep.status === "failed"
 ? "failed"
 : "complete"
 : statuses.length === 0
 ? "pending"
 : statuses.some((s) => s === "running" || s === "scanning")
 ? "running"
 : statuses.every((s) => s === "complete")
 ? "complete"
 : statuses.some((s) => s === "failed") && statuses.some((s) => s === "complete")
 ? "complete"
 : statuses.every((s) => s === "failed")
 ? "failed"
 : statuses.some((s) => s === "pending")
 ? "pending"
 : "running";

 const domain = probe?.domain || deep?.domain || requestedDomain || "";

 // Probe logs
 const probeLogs: AuditLog[] = (probe?.logs || []).map((l) => ({
 timestamp: l.timestamp,
 level: l.level as "info" | "warning" | "error" | "success",
 phase: l.phase,
 message: l.message,
 }));

 // Mode config
 const isFullAudit = modeParam === "full" || !!probe?.paired_deep_scan_id || !!deep?.paired_audit_id;
 const actualMode = isFullAudit ? "full" : modeParam;

 const modeConfig = {
 deep: { label: "Deep Scan", bg: "bg-blue-500/10 text-blue-700" },
 probe: { label: "Security Probe", bg: "bg-amber-500/10 text-amber-700" },
 full: { label: "Full Audit", bg: "bg-purple-500/10 text-purple-700" },
 }[actualMode];

 // Dynamic progress calculation
 const PHASE1_TASKS = [
 "HEADERS", "SSL", "DNS", "COOKIES", "CORS", "ROBOTS", "LEAKS", "TECH", "CARBON", "EMAIL", "REMEDIATION",
 "DIR", "ADMIN", "REDIRECT", "ERROR", "SERVER", "API", "S3", "SUBDOMAIN", "VULNERABILITY"
 ];

 // For Phase 1: count unique completed or meaningful phases in logs
 const completedPhases = new Set(
 probeLogs
 .filter(l => l.level !== "info" || l.message.includes("complete") || l.message.includes("finished"))
 .map(l => l.phase)
 .filter(p => PHASE1_TASKS.includes(p))
 );
 
 const probeProgress = !probeId ? 100 
 : (probeStatus === "complete" || probeStatus === "failed") ? 100 
 : Math.min(95, Math.max(10, Math.round((completedPhases.size / PHASE1_TASKS.length) * 100)));

 const deepProgress = !resolvedDeepId ? 0 
 : (deepStatus === "complete" || deepStatus === "failed") ? 100 
 : deep ? Math.min(95, Math.round(((deep.pages_scanned || 0) / Math.max(deep.pages_found || 1, 1)) * 100)) 
 : 0;

 const overallProgress = modeParam === "full"
 ? !probe || isActive(probe.status)
 ? Math.round(probeProgress * 0.5) // Phase 1 maps to 0-50%
 : startingDeepScan || !resolvedDeepId
 ? 50 + Math.min(5, Math.max(1, Math.round((Date.now() % 5000) / 1000))) // Subtle movement during transition (50-55%)
 : Math.min(100, 55 + Math.round(deepProgress * 0.45)) // Phase 2 maps to 55-100%
 : (probeId ? probeProgress : deepProgress);

 // Current phase label for full audit
 const currentPhase = modeParam === "full"
 ? probeStatus && isActive(probeStatus)
 ? "Phase 1: Security Probe"
 : startingDeepScan
 ? "Phase 2: Starting Deep Scan"
 : !resolvedDeepId
 ? "Phase 2: Waiting To Start"
 : deepStatus && isActive(deepStatus)
 ? "Phase 2: Deep Scan"
 : overallStatus === "complete"
 ? "Results Ready"
 : overallStatus === "failed"
 ? "Audit Failed"
 : "Starting..."
 : null;

 const findings: AuditFinding[] = (probe?.findings || []).map((f) => ({
 id: f.id, severity: f.severity as AuditFinding["severity"], category: f.category,
 title: f.title, description: f.description, evidence: f.evidence,
 remediation: f.remediation, cvss_score: f.cvss_score, cwe_id: f.cwe_id,
 affected_asset: f.affected_asset,
 }));

 return (
 <div className="flex flex-col lg:flex-row gap-6 items-start lg:h-[calc(100vh-2rem)]">
 <div className="flex-1 space-y-6 min-w-0 w-full pb-10 lg:overflow-y-auto custom-scrollbar h-full xl:pr-4">
 {/* Back button */}
 <button
 onClick={() => router.push("/dashboard/attack-surface")}
 className="mb-6 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-foreground"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to {actualMode === "full" ? "Full Audit" : actualMode === "deep" ? "Deep Scan" : "Security Probe"}
 </button>

 {/* Header */}
 <div className="shell-panel rounded-[2rem] p-8 sm:p-10 border border-border bg-card overflow-hidden relative">
 <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between relative z-10">
 <div>
 <div className="flex flex-wrap items-center gap-4">
 <h1 className="text-[2rem] font-medium text-foreground tracking-tight uppercase">
 {loading ? "Starting scan..." : domain || "Scanning..."}
 </h1>
 <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest border ${
 overallStatus === "complete" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
 : overallStatus === "failed" ? "bg-red-500/10 text-red-400 border-red-500/20"
 : "bg-white/5 text-zinc-400 border-border/40"
 }`}>
 {overallStatus === "complete" ? "Complete" : overallStatus === "failed" ? "Failed" : "Scanning"}
 </span>
 <span className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1 text-[0.6rem] font-semibold uppercase tracking-widest border ${
 actualMode === "full" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
 actualMode === "deep" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
 "bg-amber-500/10 text-amber-400 border-amber-500/20"
 }`}>
 {modeConfig.label}
 </span>
 </div>

 {/* Phase indicator for full audit */}
 {actualMode === "full" && (
 <div className="mt-5 flex flex-wrap items-center gap-6">
 <PhaseStep
 label="Security Probe"
 status={probeStatus || "pending"}
 number={1}
 />
 <div className="h-px w-8 bg-border" />
 <PhaseStep
 label="Deep Scan"
 status={deepStatus || "pending"}
 number={2}
 />
 </div>
 )}
 </div>

 <div className="flex items-center gap-3">
 {/* Cancel button — only while scanning */}
 {isActive(overallStatus) && (
 <button
 onClick={handleCancel}
 disabled={cancelling}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-6 py-3.5 text-[0.7rem] font-semibold uppercase tracking-widest text-foreground transition-all hover:bg-zinc-50 hover:border-zinc-300 disabled:opacity-50 "
 >
 {cancelling ? "Cancelling..." : "Cancel scan"}
 </button>
 )}
 </div>
 </div>
 </div>

 {/* Loading state */}
 {loading && (
 <div className="flex flex-col items-center justify-center py-16 gap-4">
 <div className="h-1.5 w-32 bg-muted border border-border rounded-full overflow-hidden">
 <div className="h-full bg-teal-500 animate-progress w-1/3" />
 </div>
 <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">Connecting to scan...</span>
 </div>
 )}

 {/* Main Content Area (Live Discoveries) */}
 {!loading && (
 <div className="mt-8">
 <h2 className="text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground mb-4">
 Live Discoveries
 </h2>
 
 <div className="space-y-3">
 {findings.length === 0 && isActive(overallStatus) && (
 <div className="rounded-xl border border-dashed border-border/40 bg-card/50 p-12 text-center ">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-500/10 mb-4 ring-8 ring-teal-500/5">
 <span className="relative flex h-3 w-3">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
 <span className="relative inline-flex h-3 w-3 rounded-full bg-teal-500"></span>
 </span>
 </div>
 <p className="text-[0.7rem] font-semibold uppercase tracking-widest text-muted-foreground">Scanning for vulnerabilities...</p>
 <p className="mt-2 text-sm text-muted-foreground/60 max-w-sm mx-auto">Findings will appear here instantly as soon as the probe discovers an issue.</p>
 </div>
 )}
 
 {findings.length === 0 && !isActive(overallStatus) && overallStatus !== "failed" && (
 <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-12 text-center ">
 <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 mb-4 text-xl font-bold">
 ✓
 </div>
 <p className="text-[0.7rem] font-bold uppercase tracking-widest text-emerald-400">No vulnerabilities found</p>
 <p className="mt-2 text-sm text-emerald-400/60 max-w-sm mx-auto">The scan completed and no immediate technical threats were discovered in this scope.</p>
 </div>
 )}

 {findings.map(f => (
 <FindingCard key={f.id} finding={f} />
 ))}
 </div>

 {/* Completion banner */}
 {overallStatus === "complete" && (
 <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-8 mt-8">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
 <div>
 <p className="text-[0.75rem] font-bold text-emerald-400 uppercase tracking-widest">
 {actualMode === "full" ? "Full audit complete" : "Scan complete"}
 </p>
 <p className="mt-1 text-sm font-medium text-emerald-400/80">
 The scan has finished. You can review the live findings above, or open the detailed report context.
 </p>
 </div>
 <button
 onClick={() => {
 const resultId = probeId || resolvedDeepId || id;
 const params = new URLSearchParams();
 if (modeParam) params.set("mode", modeParam);
 if (resolvedDeepId && probeId) {
 params.set("deepId", resolvedDeepId);
 params.set("probeId", probeId);
 }
 const qs = params.toString();
 router.push(`/dashboard/attack-surface/${resultId}${qs ? "?" + qs : ""}`);
 }}
 className="shrink-0 inline-flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/20 px-8 py-3.5 text-[0.75rem] font-bold uppercase tracking-widest text-emerald-100 transition-all hover:bg-emerald-500/30"
 >
 View Full Report →
 </button>
 </div>
 </div>
 )}

 {/* Failed banner */}
 {overallStatus === "failed" && (
 <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-8 mt-8">
 <div className="flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
 <div>
 <p className="text-[0.75rem] font-bold text-red-500 uppercase tracking-widest">Scan failed</p>
 <p className="mt-1 text-[0.8rem] font-medium text-red-400/80">The scan encountered an error and could not complete.</p>
 </div>
 <button
 onClick={() => router.push("/dashboard/attack-surface")}
 className="shrink-0 inline-flex items-center gap-2 rounded-md border border-red-500/20 bg-red-500/10 px-8 py-4 text-[0.75rem] font-bold uppercase tracking-widest text-red-400 transition-colors hover:bg-red-500/20"
 >
 Back to scans
 </button>
 </div>
 </div>
 )}
 </div>
 )}
 </div>

 {/* Terminal sidebar */}
 {!loading && (
 <div className="w-full lg:w-[400px] xl:w-[440px] 2xl:w-[500px] shrink-0 sticky top-0 h-auto lg:h-full mt-10 lg:mt-0">
 {actualMode === "full" ? (
 <FullAuditTerminal
 domain={domain}
 probeId={probeId}
 deepId={resolvedDeepId}
 probe={probe}
 deep={deep}
 startingDeepScan={startingDeepScan}
 progress={overallProgress}
 phaseLabel={currentPhase || "Starting"}
 overallStatus={overallStatus}
 probeLogs={probeLogs}
 layout="sidebar"
 />
 ) : actualMode === "probe" ? (
 probeId && (
 <AuditTerminal
 auditId={probeId}
 status={probe?.status || "pending"}
 logs={probeLogs}
 layout="sidebar"
 />
 )
 ) : (
 resolvedDeepId && (
 <DeepScanTerminal
 scanId={resolvedDeepId}
 domain={domain}
 scan={deep}
 layout="sidebar"
 />
 )
 )}
 </div>
 )}
 </div>
 );
}

function PhaseStep({ label, status, number }: { label: string; status: string; number: number }) {
 const isDone = status === "complete" || status === "failed";
 const isRunning = isActive(status);

 return (
 <div className="flex items-center gap-3">
 <div className={`flex h-6 w-6 items-center justify-center rounded-sm text-[0.65rem] font-semibold ${
 isDone
 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
 : isRunning
 ? "bg-card text-zinc-900 animate-pulse"
 : "bg-white/5 text-muted-foreground border border-border/40"
 }`}>
 {number}
 </div>
 <span className={`text-[0.65rem] font-semibold uppercase tracking-widest ${
 isDone ? "text-emerald-400" : isRunning ? "text-white" : "text-muted-foreground"
 }`}>
 {label}
 </span>
 </div>
 );
}

function SubStatus({ label, status }: { label: string; status: string }) {
 return (
 <div className="flex items-center gap-2 text-[0.6rem] font-black uppercase tracking-widest">
 <span className="opacity-40">{label}:</span>
 <span className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 ${
 status === "complete" ? "bg-emerald-500/10 text-emerald-400"
 : status === "failed" ? "bg-red-500/10 text-red-400"
 : isActive(status) ? "bg-teal-500/10 text-teal-400"
 : "bg-white/5 text-muted-foreground"
 }`}>
 {status === "complete" ? "Complete" : status === "failed" ? "Failed" : isActive(status) ? "Running" : "Pending"}
 </span>
 </div>
 );
}

export default function ScanningPage() {
 return (
 <Suspense
 fallback={
 <div className="flex flex-col items-center justify-center py-20 gap-4">
 <div className="h-1.5 w-32 bg-muted border border-border rounded-full overflow-hidden">
 <div className="h-full bg-foreground animate-progress w-1/3" />
 </div>
 </div>
 }
 >
 <ScanningContent />
 </Suspense>
 );
}
