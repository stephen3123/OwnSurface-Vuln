"use client";

import { formatDate, formatRelative } from "@/lib/utils";
import {
 Shield,
 ShieldCheck,
 ShieldAlert,
 ShieldX,
 Trash2,
 Clock,
 Link as LinkIcon,
 Settings,
} from "lucide-react";
import { useState } from "react";

interface SslMonitor {
 id: string;
 domain: string;
 issuer: string;
 valid_from: string;
 valid_to: string;
 days_remaining: number;
 subject: string;
 serial_number: string;
 chain_length: number;
 chain_valid: boolean;
 last_checked: string;
 alert_days: number;
 created_at: string;
}

interface SslStatusCardProps {
 monitor: SslMonitor;
 onDelete: () => void;
 onUpdateAlertDays: (days: number) => void;
}

function getStatusColor(days: number) {
 if (days > 30) return { icon: ShieldCheck, color: "text-emerald-400", bg: "border-emerald-500/20" };
 if (days > 7) return { icon: ShieldAlert, color: "text-yellow-400", bg: "border-yellow-500/20" };
 return { icon: ShieldX, color: "text-red-400", bg: "border-red-500/20" };
}

function getDaysLabel(days: number) {
 if (days < 0) return "Expired";
 if (days === 0) return "Expires today";
 if (days === 1) return "1 day remaining";
 return `${days} days remaining`;
}

function getDaysBg(days: number) {
 if (days > 30) return "bg-emerald-500/10 text-emerald-400";
 if (days > 7) return "bg-yellow-500/10 text-yellow-400";
 return "bg-red-500/10 text-red-400";
}

export function SslStatusCard({ monitor, onDelete, onUpdateAlertDays }: SslStatusCardProps) {
 const { icon: StatusIcon, color, bg } = getStatusColor(monitor.days_remaining);
 const [showSettings, setShowSettings] = useState(false);

 return (
 <div className={`bg-card/40 backdrop-blur-xl border ${bg} rounded-[1.5rem] p-6 transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:`}>
 {/* Header */}
 <div className="flex items-start justify-between mb-4">
 <div className="flex items-center gap-3">
 <StatusIcon className={`w-6 h-6 ${color}`} />
 <div>
 <p className="text-sm font-medium">{monitor.domain}</p>
 <p className="text-xs text-muted-foreground">{monitor.subject}</p>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <button
 onClick={() => setShowSettings(!showSettings)}
 className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
 title="Alert settings"
 >
 <Settings className="w-4 h-4" />
 </button>
 <button
 onClick={onDelete}
 className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
 title="Delete monitor"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Days remaining badge */}
 <div className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium mb-4 ${getDaysBg(monitor.days_remaining)}`}>
 <Clock className="w-3 h-3" />
 {getDaysLabel(monitor.days_remaining)}
 </div>

 {/* Details */}
 <div className="space-y-2.5 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Issuer</span>
 <span className="font-medium text-right truncate max-w-[200px]">{monitor.issuer}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Valid From</span>
 <span className="font-medium">{formatDate(monitor.valid_from)}</span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Valid To</span>
 <span className={`font-medium ${monitor.days_remaining <= 7 ? "text-red-400" : ""}`}>
 {formatDate(monitor.valid_to)}
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Chain</span>
 <span className="font-medium">
 {monitor.chain_length} cert{monitor.chain_length !== 1 && "s"}
 {" - "}
 <span className={monitor.chain_valid ? "text-emerald-400" : "text-red-400"}>
 {monitor.chain_valid ? "Valid" : "Invalid"}
 </span>
 </span>
 </div>
 <div className="flex items-center justify-between">
 <span className="text-muted-foreground">Last Checked</span>
 <span className="text-xs text-muted-foreground">
 {formatRelative(monitor.last_checked)}
 </span>
 </div>
 </div>

 {/* Alert settings */}
 {showSettings && (
 <div className="mt-4 pt-4 border-t border-border">
 <p className="text-xs font-medium mb-2">Alert before expiry</p>
 <div className="flex gap-2">
 {[7, 14, 30, 60].map((days) => (
 <button
 key={days}
 onClick={() => onUpdateAlertDays(days)}
 className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
 monitor.alert_days === days
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "bg-background border border-border text-muted-foreground hover:text-foreground"
 }`}
 >
 {days}d
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
