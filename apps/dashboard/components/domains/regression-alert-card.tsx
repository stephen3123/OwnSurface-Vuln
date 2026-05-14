"use client";

import { useState, useEffect } from "react";
import { ArrowRight, Check, ShieldAlert, TrendingDown, Clock, Wifi } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RegressionAlert {
 id: string;
 domain: string;
 type: "score_drop" | "new_vulnerability" | "ssl_expiry" | "downtime";
 severity: "critical" | "high" | "medium" | "low";
 title: string;
 description: string;
 previous_value: string;
 current_value: string;
 detected_at: string;
}

interface RegressionAlertCardProps {
 alert: RegressionAlert;
 onAcknowledge?: (id: string) => void;
}

const SEVERITY_BORDER: Record<RegressionAlert["severity"], string> = {
 critical: "border-l-red-500",
 high: "border-l-orange-500",
 medium: "border-l-amber-500",
 low: "border-l-sky-500",
};

const SEVERITY_BADGE: Record<RegressionAlert["severity"], string> = {
 critical: "bg-red-500/10 text-red-500",
 high: "bg-orange-500/10 text-orange-500",
 medium: "bg-amber-500/10 text-amber-500",
 low: "bg-sky-500/10 text-sky-500",
};

const TYPE_ICON: Record<RegressionAlert["type"], React.ComponentType<{ className?: string }>> = {
 score_drop: TrendingDown,
 new_vulnerability: ShieldAlert,
 ssl_expiry: Clock,
 downtime: Wifi,
};

function getAckKey(id: string) {
 return `regression_ack_${id}`;
}

export function RegressionAlertCard({ alert, onAcknowledge }: RegressionAlertCardProps) {
 const [acknowledged, setAcknowledged] = useState(false);
 const Icon = TYPE_ICON[alert.type] || TrendingDown;

 useEffect(() => {
 try {
 setAcknowledged(localStorage.getItem(getAckKey(alert.id)) === "true");
 } catch {}
 }, [alert.id]);

 function handleAcknowledge() {
 setAcknowledged(true);
 try {
 localStorage.setItem(getAckKey(alert.id), "true");
 } catch {}
 onAcknowledge?.(alert.id);
 }

 const timeAgo = formatTimeAgo(alert.detected_at);

 return (
 <div
 className={cn(
 "shell-panel rounded-[1.7rem] p-5 border-l-4 transition-opacity",
 SEVERITY_BORDER[alert.severity],
 acknowledged && "opacity-50",
 )}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-start gap-3 min-w-0">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary">
 <Icon className="h-4 w-4 text-muted-foreground" />
 </div>
 <div className="min-w-0">
 <div className="flex items-center gap-2 flex-wrap">
 <h4 className="text-sm font-semibold truncate">{alert.title}</h4>
 <span
 className={cn(
 "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize",
 SEVERITY_BADGE[alert.severity],
 )}
 >
 {alert.severity}
 </span>
 </div>
 <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{alert.description}</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-2 mt-4 px-12">
 <span className="text-sm font-mono text-muted-foreground">{alert.previous_value}</span>
 <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="text-sm font-mono text-foreground font-medium">{alert.current_value}</span>
 </div>

 <div className="flex items-center justify-between mt-4 pt-3 border-t border-border">
 <span className="text-xs text-muted-foreground">{timeAgo}</span>
 {!acknowledged ? (
 <button
 onClick={handleAcknowledge}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary hover:bg-secondary/80 transition-colors"
 >
 <Check className="w-3.5 h-3.5" />
 Acknowledge
 </button>
 ) : (
 <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
 <Check className="w-3.5 h-3.5" />
 Acknowledged
 </span>
 )}
 </div>
 </div>
 );
}

function formatTimeAgo(dateStr: string): string {
 const date = new Date(dateStr);
 const now = new Date();
 const diffMs = now.getTime() - date.getTime();
 const diffMin = Math.floor(diffMs / 60000);

 if (diffMin < 1) return "Just now";
 if (diffMin < 60) return `${diffMin}m ago`;
 const diffHours = Math.floor(diffMin / 60);
 if (diffHours < 24) return `${diffHours}h ago`;
 const diffDays = Math.floor(diffHours / 24);
 if (diffDays < 7) return `${diffDays}d ago`;
 return date.toLocaleDateString();
}
