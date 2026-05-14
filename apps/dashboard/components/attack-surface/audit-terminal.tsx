"use client";

import { ActivityTerminal, type ActivityTerminalEntry, type ActivityTerminalStat } from "@/components/shared/activity-terminal";

export interface AuditLog {
 timestamp: string;
 level: "info" | "warning" | "error" | "success";
 phase: string;
 message: string;
}

interface AuditTerminalProps {
 auditId: string;
 status: string;
 logs: AuditLog[];
 layout?: "default" | "sidebar";
}

function getEntryTone(level: AuditLog["level"]): ActivityTerminalEntry["tone"] {
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

function formatPhaseLabel(phase: string): string {
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
 return phase.replaceAll("_", " ");
 }
}

export function AuditTerminal({ auditId, status, logs, layout = "default" }: AuditTerminalProps) {
 const progress = status === "complete" ? 100
 : status === "failed" ? 100
 : status === "running" ? Math.min(95, Math.max(12, 12 + logs.length * 6))
 : 8;

 const latestPhase = logs.length > 0 ? formatPhaseLabel(logs[logs.length - 1].phase) : "Preparing";
 const stats: ActivityTerminalStat[] = [
 {
 label: "Events",
 value: `${logs.length}`,
 meta: "recorded entries",
 },
 {
 label: "Latest Phase",
 value: latestPhase,
 meta: "most recent checkpoint",
 tone: "accent",
 },
 {
 label: "Status",
 value: status === "complete" ? "Complete" : status === "failed" ? "Failed" : status === "running" ? "Running" : "Pending",
 meta: "probe lifecycle",
 tone: status === "complete" ? "success" : status === "failed" ? "danger" : "accent",
 },
 ];

 const entries: ActivityTerminalEntry[] = logs.map((log, index) => ({
 id: `${log.timestamp}-${index}`,
 timestamp: log.timestamp,
 label: formatPhaseLabel(log.phase),
 message: log.message,
 tone: getEntryTone(log.level),
 }));

 return (
 <ActivityTerminal
 eyebrow="Security probe session"
 sessionLabel={`ownsurface://attack-surface/${auditId}`}
 status={status}
 progress={progress}
 progressLabel={
 status === "complete"
 ? "Security probe completed"
 : status === "failed"
 ? "Security probe failed"
 : "Running verified-domain security checks"
 }
 stats={stats}
 entries={entries}
 emptyMessage="Preparing verified-domain security probe..."
 layout={layout}
 />
 );
}
