"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Check, X, Filter } from "lucide-react";

interface AuditEvent {
 id: string;
 event_type: string;
 event_data: Record<string, unknown>;
 target_host?: string;
 target_ip?: string;
 decision: "allow" | "block" | "warn" | "kill";
 created_at: string;
}

interface ScanTimelineProps {
 events: AuditEvent[];
}

const EVENT_TYPE_LABELS: Record<string, string> = {
 scope_check: "Scope Check",
 request: "Request",
 safety_trigger: "Safety Trigger",
 classification: "Classification",
 drift: "Drift Violation",
 kill: "Kill Switch",
 scope_violation: "Scope Violation",
 firewall: "Firewall",
 canary: "Canary",
 risk_assessment: "Risk Assessment",
};

const DECISION_CONFIG: Record<string, { color: string; bg: string; icon: typeof Check }> = {
 allow: { color: "text-green-400", bg: "bg-green-500/10", icon: Check },
 block: { color: "text-red-400", bg: "bg-red-500/10", icon: X },
 warn: { color: "text-yellow-400", bg: "bg-yellow-500/10", icon: AlertTriangle },
 kill: { color: "text-red-500", bg: "bg-red-500/20", icon: Shield },
};

export function ScanTimeline({ events }: ScanTimelineProps) {
 const [filter, setFilter] = useState<string | null>(null);

 const eventTypes = useMemo(() => {
 const types = new Set(events.map((e) => e.event_type));
 return Array.from(types).sort();
 }, [events]);

 const filteredEvents = useMemo(() => {
 if (!filter) return events;
 return events.filter((e) => e.event_type === filter);
 }, [events, filter]);

 if (events.length === 0) {
 return (
 <div className="rounded-xl bg-white/[0.02] p-8 text-center text-sm text-white/40">
 No audit events recorded for this scan.
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* Filter bar */}
 <div className="flex flex-wrap items-center gap-2">
 <Filter className="h-4 w-4 text-white/30" />
 <button
 onClick={() => setFilter(null)}
 className={cn(
 "rounded-lg px-2.5 py-1 text-xs transition-colors",
 !filter ? "bg-teal-500/10 text-teal-400" : "text-white/40 hover:text-white/60"
 )}
 >
 All ({events.length})
 </button>
 {eventTypes.map((type) => {
 const count = events.filter((e) => e.event_type === type).length;
 return (
 <button
 key={type}
 onClick={() => setFilter(filter === type ? null : type)}
 className={cn(
 "rounded-lg px-2.5 py-1 text-xs transition-colors",
 filter === type
 ? "bg-teal-500/10 text-teal-400"
 : "text-white/40 hover:text-white/60"
 )}
 >
 {EVENT_TYPE_LABELS[type] || type} ({count})
 </button>
 );
 })}
 </div>

 {/* Timeline */}
 <div className="relative space-y-0">
 {/* Vertical line */}
 <div className="absolute left-[18px] top-3 bottom-3 w-px bg-card/50" />

 {filteredEvents.map((event, i) => {
 const config = DECISION_CONFIG[event.decision] || DECISION_CONFIG.allow;
 const Icon = config.icon;
 const time = new Date(event.created_at);

 return (
 <div key={event.id || i} className="relative flex gap-4 py-2">
 {/* Timeline dot */}
 <div
 className={cn(
 "relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
 config.bg
 )}
 >
 <Icon className={cn("h-4 w-4", config.color)} />
 </div>

 {/* Content */}
 <div className="flex-1 min-w-0 pt-1">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-white/80">
 {EVENT_TYPE_LABELS[event.event_type] || event.event_type}
 </span>
 <span
 className={cn(
 "rounded-md px-1.5 py-0.5 text-[10px] font-medium uppercase",
 config.bg,
 config.color
 )}
 >
 {event.decision}
 </span>
 <span className="text-xs text-white/25">
 {time.toLocaleTimeString()}
 </span>
 </div>

 {event.target_host && (
 <div className="mt-0.5 text-xs text-white/40">
 {event.target_host}
 {event.target_ip && ` (${event.target_ip})`}
 </div>
 )}

 {/* Event data summary */}
 {Object.keys(event.event_data).length > 0 && (
 <div className="mt-1 rounded-lg bg-white/[0.02] px-3 py-2 text-xs text-white/30 font-mono">
 {formatEventData(event.event_data)}
 </div>
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}

function formatEventData(data: Record<string, unknown>): string {
 const entries = Object.entries(data).slice(0, 5);
 return entries
 .map(([k, v]) => {
 const val = typeof v === "object" ? JSON.stringify(v) : String(v);
 return `${k}: ${val.length > 80 ? val.slice(0, 80) + "..." : val}`;
 })
 .join(" | ");
}
