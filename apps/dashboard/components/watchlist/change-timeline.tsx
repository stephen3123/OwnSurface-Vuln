"use client";

import type { WatchlistChange } from "@/lib/api-client";
import { formatDateTime } from "@/lib/utils";
import { Plus, Minus, Shield, FileText } from "lucide-react";

function getChangeIcon(type: string) {
 switch (type) {
 case "tech_added":
 return Plus;
 case "tech_removed":
 return Minus;
 case "security_changed":
 return Shield;
 default:
 return FileText;
 }
}

function getChangeColor(type: string) {
 switch (type) {
 case "tech_added":
 return "text-emerald-400 bg-emerald-400/10";
 case "tech_removed":
 return "text-red-400 bg-red-400/10";
 case "security_changed":
 return "text-yellow-400 bg-yellow-400/10";
 default:
 return "text-blue-400 bg-blue-400/10";
 }
}

interface ChangeTimelineProps {
 changes: WatchlistChange[];
}

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
 if (changes.length === 0) {
 return (
 <p className="text-sm text-muted-foreground py-8 text-center">No changes detected yet.</p>
 );
 }

 return (
 <div className="space-y-3">
 {changes.map((change) => {
 const Icon = getChangeIcon(change.change_type);
 const color = getChangeColor(change.change_type);
 return (
 <div key={change.id} className="flex items-start gap-3 p-3 rounded-lg bg-background border border-border">
 <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
 <Icon className="w-4 h-4" />
 </div>
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium">{change.description}</p>
 <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
 <span className="truncate">{change.url}</span>
 <span>&middot;</span>
 <span>{formatDateTime(change.detected_at)}</span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 );
}
