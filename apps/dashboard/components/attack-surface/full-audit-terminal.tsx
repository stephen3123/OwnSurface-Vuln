"use client";


import { type AttackSurfaceAuditResponse, type DeepScanInfo } from "@/lib/api-client";
import { ActivityTerminal, type ActivityTerminalEntry, type ActivityTerminalStat } from "@/components/shared/activity-terminal";
import { getDeepScanEntries, type DeepScanPageSummary } from "@/components/domains/deep-scan-activity";
import { type AuditLog } from "@/components/attack-surface/audit-terminal";

interface FullAuditTerminalProps {
 domain: string;
 probeId: string | null;
 deepId: string | null;
 probe: AttackSurfaceAuditResponse | null;
 deep: DeepScanInfo | null;
 startingDeepScan: boolean;
 progress: number;
 phaseLabel: string;
 overallStatus: string;
 probeLogs: AuditLog[];
 layout?: "default" | "sidebar";
}

function formatProbeStatus(status: string | null): string {
 if (status === "complete") return "Complete";
 if (status === "failed") return "Failed";
 if (status === "running") return "Running";
 return "Pending";
}

function formatDeepStatus(status: string | null, startingDeepScan: boolean): string {
 if (startingDeepScan) return "Starting";
 if (status === "complete") return "Complete";
 if (status === "failed") return "Failed";
 if (status === "running" || status === "scanning") return "Running";
 return "Queued";
}

function formatAuditPhase(phase: string): string {
 switch (phase) {
 case "PORT_SCAN":
 return "Ports";
 case "SUBDOMAIN":
 return "Subdomains";
 case "DIRECTORY":
 return "Paths";
 case "HEADERS":
 return "Headers";
 case "SSL":
 return "SSL";
 case "DNS":
 return "DNS";
 case "EMAIL":
 return "Email";
 case "WAF":
 return "WAF";
 case "INIT":
 return "Init";
 case "COMPLETE":
 return "Result";
 default:
 return phase.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());
 }
}

function getProbeEntryTone(level: AuditLog["level"]): ActivityTerminalEntry["tone"] {
 switch (level) {
 case "success":
 return "success";
 case "warning":
 return "warning";
 case "error":
 return "danger";
 default:
 return "default";
 }
}

export function FullAuditTerminal({
 domain,
 probeId,
 deepId,
 probe,
 deep,
 startingDeepScan,
 progress,
 phaseLabel,
 overallStatus,
 probeLogs,
 layout = "default",
}: FullAuditTerminalProps) {
 const findingsCount = probe?.findings?.length || 0;
 const deepResults = Array.isArray(deep?.results) ? (deep.results as DeepScanPageSummary[]) : [];
 const deepSuccessfulPages = deepResults.filter((page) => page.status === "success").length;

 const stats: ActivityTerminalStat[] = [
 {
 label: "Phase",
 value: phaseLabel,
 meta: "current execution step",
 tone: "accent",
 },
 {
 label: "Probe",
 value: formatProbeStatus(probe?.status || null),
 meta: probeId ? "phase 1 status" : "not started",
 tone: probe?.status === "complete" ? "success" : probe?.status === "failed" ? "danger" : "accent",
 },
 {
 label: "Deep Scan",
 value: formatDeepStatus(deep?.status || null, startingDeepScan),
 meta: deepId ? "phase 2 status" : "launches after probe",
 tone: deep?.status === "complete" ? "success" : deep?.status === "failed" ? "danger" : "accent",
 },
 {
 label: "Findings",
 value: `${findingsCount}`,
 meta: "security probe results",
 tone: findingsCount > 0 ? "danger" : "default",
 },
 ];

 const entries: ActivityTerminalEntry[] = [
 {
 id: "phase-1",
 label: "Phase 1",
 message: "Security probe",
 detail: "Verified-domain checks, recon, and active audit steps are recorded here first.",
 tone: "accent",
 },
 ...probeLogs.map((log, index) => ({
 id: `probe-${log.timestamp}-${index}`,
 timestamp: log.timestamp,
 label: formatAuditPhase(log.phase),
 message: log.message,
 tone: getProbeEntryTone(log.level),
 })),
 ];

 if (probe?.status === "complete" && !deep && !startingDeepScan) {
 entries.push({
 id: "phase-transition",
 label: "Transition",
 message: "Security probe complete. Deep scan is next in sequence.",
 detail: "The full audit remains on the same activity stream while phase two is prepared.",
 tone: "success",
 });
 }

 if (startingDeepScan) {
 entries.push({
 id: "phase-2-starting",
 label: "Phase 2",
 message: "Starting deep scan session.",
 detail: "The crawler is being launched after the security probe completed.",
 tone: "accent",
 });
 }

 if (deep) {
 entries.push({
 id: "phase-2",
 label: "Phase 2",
 message: "Deep scan",
 detail: "Crawler coverage and page analysis continue in the same audit stream.",
 tone: "accent",
 });
 entries.push(...getDeepScanEntries(deep, domain).map((entry, index) => ({
 ...entry,
 id: `${entry.id}-${index}`,
 })));
 }

 if (overallStatus === "complete") {
 entries.push({
 id: "results-ready",
 label: "Result",
 message: "Full audit complete. The final report is ready.",
 detail: deep ? `${deepSuccessfulPages} successful page results are attached to the combined audit.` : "The combined audit output is available.",
 tone: "success",
 });
 }

 if (overallStatus === "failed") {
 entries.push({
 id: "audit-failed",
 label: "Result",
 message: "Full audit ended with an error.",
 detail: "Review the latest phase output before retrying the run.",
 tone: "danger",
 });
 }

 return (
 <ActivityTerminal
 eyebrow="Full audit session"
 sessionLabel={`ownsurface://full-audit/${probeId || deepId || domain || "session"}`}
 status={overallStatus}
 progress={progress}
 progressLabel={phaseLabel}
 stats={stats}
 entries={entries}
 emptyMessage="Preparing phased full audit..."
 layout={layout}
 footer={
 overallStatus === "complete" ? (
 <div className="border-t border-emerald-500/12 bg-emerald-500/4 px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-sm font-black text-white uppercase tracking-widest">✓ FULL AUDIT COMPLETE</p>
 <p className="mt-0.5 text-xs text-white/50">
 Security probe and deep scan both completed on {domain || "the selected domain"}.
 </p>
 </div>
 </div>
 </div>
 ) : overallStatus === "failed" ? (
 <div className="border-t border-red-500/12 bg-red-500/4 px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-sm font-black text-white uppercase tracking-widest">✗ FULL AUDIT FAILED</p>
 <p className="mt-0.5 text-xs text-white/50">
 The audit stopped before both phases completed. Review the latest event stream and retry.
 </p>
 </div>
 </div>
 </div>
 ) : null
 }
 />
 );
}
