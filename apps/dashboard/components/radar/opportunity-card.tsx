"use client";

import { useState } from "react";
import type { RadarEvent } from "@/lib/api-client";
import { formatRelative, truncateUrl } from "@/lib/utils";
import { TrendingUp, Shield, Zap, ChevronDown, ChevronUp, Globe } from "lucide-react";
import Link from "next/link";

function getEventIcon(type: string) {
 switch (type) {
 case "tech_trend":
 return TrendingUp;
 case "security_alert":
 return Shield;
 default:
 return Zap;
 }
}

function getEventColor(type: string) {
 switch (type) {
 case "tech_trend":
 return "text-blue-400 bg-blue-400/10";
 case "security_alert":
 return "text-red-400 bg-red-400/10";
 default:
 return "text-teal-700 bg-teal-700/10";
 }
}

interface OpportunityCardProps {
 event: RadarEvent;
}

export function OpportunityCard({ event }: OpportunityCardProps) {
 const [expanded, setExpanded] = useState(false);
 const Icon = getEventIcon(event.type);
 const color = getEventColor(event.type);

 return (
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-start gap-3">
 <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
 <Icon className="w-5 h-5" />
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="font-semibold">{event.title}</h3>
 <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
 <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
 <span>{event.affected_count} sites affected</span>
 {event.technology && (
 <span className="px-2 py-0.5 rounded bg-secondary">{event.technology}</span>
 )}
 <span>{formatRelative(event.event_date)}</span>
 </div>
 </div>
 <button
 onClick={() => setExpanded(!expanded)}
 className="p-1.5 rounded-md hover:bg-accent text-muted-foreground shrink-0"
 >
 {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
 </button>
 </div>

 {expanded && event.urls.length > 0 && (
 <div className="mt-4 pt-4 border-t border-border space-y-2">
 {event.urls.slice(0, 10).map((url) => (
 <div key={url} className="flex items-center gap-2 text-sm">
 <Globe className="w-3.5 h-3.5 text-muted-foreground" />
 <span className="text-muted-foreground">{truncateUrl(url, 60)}</span>
 </div>
 ))}
 {event.urls.length > 10 && (
 <p className="text-xs text-muted-foreground">and {event.urls.length - 10} more...</p>
 )}
 </div>
 )}
 </div>
 );
}
