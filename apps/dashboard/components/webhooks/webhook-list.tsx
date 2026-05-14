"use client";

import { useState } from "react";
import { formatRelative } from "@/lib/utils";
import { Webhook, Globe, Trash2, Clock, Zap } from "lucide-react";

export interface WebhookItem {
 id: string;
 domain: string;
 endpoint_url: string;
 secret: string;
 events: string[];
 is_active: boolean;
 created_at: string;
 last_triggered_at?: string;
}

interface WebhookListProps {
 webhooks: WebhookItem[];
 onDelete?: (id: string) => void;
 onToggle?: (id: string, active: boolean) => void;
}

export function WebhookList({ webhooks, onDelete, onToggle }: WebhookListProps) {
 const [confirmId, setConfirmId] = useState<string | null>(null);

 if (webhooks.length === 0) {
 return (
 <div className="dashboard-empty">
 <Webhook className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">No webhooks configured yet.</h3>
 <p className="text-sm text-muted-foreground">
 Create a webhook to trigger scans from your CI/CD pipeline.
 </p>
 </div>
 );
 }

 return (
 <div className="space-y-3">
 {webhooks.map((wh) => (
 <div
 key={wh.id}
 className="bg-card border border-border rounded-xl p-5"
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3 min-w-0">
 <div className="w-10 h-10 rounded-lg bg-teal-500/10 flex items-center justify-center shrink-0">
 <Globe className="w-5 h-5 text-teal-600" />
 </div>
 <div className="min-w-0">
 <h3 className="font-semibold">{wh.domain}</h3>
 <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">
 {wh.endpoint_url}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 <button
 onClick={() => onToggle?.(wh.id, !wh.is_active)}
 className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
 wh.is_active
 ? "bg-emerald-500/10 text-emerald-700"
 : "bg-zinc-500/10 text-muted-foreground"
 }`}
 >
 {wh.is_active ? "Active" : "Inactive"}
 </button>
 {confirmId === wh.id ? (
 <div className="flex items-center gap-1">
 <button
 onClick={() => {
 onDelete?.(wh.id);
 setConfirmId(null);
 }}
 className="px-2 py-1 rounded-md text-xs font-medium bg-red-500/10 text-red-600 hover:bg-red-500/20 transition-colors"
 >
 Confirm
 </button>
 <button
 onClick={() => setConfirmId(null)}
 className="px-2 py-1 rounded-md text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
 >
 Cancel
 </button>
 </div>
 ) : (
 <button
 onClick={() => setConfirmId(wh.id)}
 className="p-1.5 hover:bg-accent rounded-md text-muted-foreground hover:text-red-500 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 )}
 </div>
 </div>
 <div className="flex items-center gap-3 mt-3 flex-wrap">
 {wh.events.map((event) => (
 <span
 key={event}
 className="platform-chip"
 >
 <Zap className="w-3 h-3" />
 {event}
 </span>
 ))}
 {wh.last_triggered_at && (
 <span className="flex items-center gap-1 text-xs text-muted-foreground ml-auto">
 <Clock className="w-3 h-3" />
 Last triggered {formatRelative(wh.last_triggered_at)}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 );
}
