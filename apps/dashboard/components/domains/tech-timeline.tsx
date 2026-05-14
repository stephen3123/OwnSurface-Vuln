"use client";

import { GitBranch, Plus, Minus, RefreshCw } from "lucide-react";

export interface TechChangeEvent {
 id: string;
 date: string;
 type: "added" | "removed" | "version_change";
 technology: string;
 category: string;
 old_version?: string;
 new_version?: string;
}

interface TechTimelineProps {
 events: TechChangeEvent[];
}

const TYPE_CONFIG = {
 added: { icon: Plus, dotClass: "bg-emerald-500", label: "Added" },
 removed: { icon: Minus, dotClass: "bg-red-500", label: "Removed" },
 version_change: { icon: RefreshCw, dotClass: "bg-blue-500", label: "Updated" },
};

function groupByDate(events: TechChangeEvent[]): [string, TechChangeEvent[]][] {
 const groups: Record<string, TechChangeEvent[]> = {};
 for (const event of events) {
 const key = new Date(event.date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
 if (!groups[key]) groups[key] = [];
 groups[key].push(event);
 }
 return Object.entries(groups);
}

function getChangeDescription(event: TechChangeEvent): string {
 switch (event.type) {
 case "added":
 return `${event.technology} was added${event.new_version ? ` (v${event.new_version})` : ""}`;
 case "removed":
 return `${event.technology} was removed`;
 case "version_change":
 if (event.old_version && event.new_version) return `${event.technology} updated from v${event.old_version} to v${event.new_version}`;
 if (event.new_version) return `${event.technology} updated to v${event.new_version}`;
 return `${event.technology} version changed`;
 }
}

export function TechTimeline({ events }: TechTimelineProps) {
 if (events.length === 0) {
 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Tech Stack History</p>
 <div className="flex flex-col items-center justify-center py-12 text-center">
 <GitBranch className="w-10 h-10 text-muted-foreground/40 mb-3" />
 <p className="text-sm text-muted-foreground">No tech changes detected yet</p>
 <p className="text-xs text-muted-foreground/60 mt-1">
 Run multiple scans to track technology evolution
 </p>
 </div>
 </div>
 );
 }

 const grouped = groupByDate(events);

 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <p className="section-kicker mb-4">Tech Stack History</p>

 <div className="relative">
 {/* Vertical line */}
 <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />

 <div className="space-y-6">
 {grouped.map(([date, dateEvents]) => (
 <div key={date}>
 <p className="text-xs font-medium text-muted-foreground ml-9 mb-2">{date}</p>
 <div className="space-y-3">
 {dateEvents.map((event) => {
 const config = TYPE_CONFIG[event.type];
 const Icon = config.icon;
 return (
 <div key={event.id} className="relative flex items-start gap-3 pl-0">
 <div className={`relative z-10 w-6 h-6 rounded-full ${config.dotClass} flex items-center justify-center shrink-0`}>
 <Icon className="w-3 h-3 text-white" />
 </div>
 <div className="flex-1 min-w-0 pt-0.5">
 <div className="flex items-center gap-2 flex-wrap">
 <span className="text-sm font-medium">{event.technology}</span>
 <span className="platform-chip">{event.category}</span>
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">
 {getChangeDescription(event)}
 </p>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
}
