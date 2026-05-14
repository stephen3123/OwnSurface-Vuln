"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useVerifiedDomains } from "@/hooks/use-verified-domains";
import { DomainPicker, NoDomainsCTA } from "@/components/monitoring/domain-picker";
import { UptimeChart } from "@/components/monitoring/uptime-chart";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative } from "@/lib/utils";
import { toast } from "sonner";
import {
 Activity,
 Plus,
 CheckCircle2,
 XCircle,
 Loader2,
 Trash2,
 X,
 ArrowLeft,
 Clock,
} from "lucide-react";
import Link from "next/link";

interface UptimeMonitor {
  id: string;
  domain: string;
  url: string;
  last_status: "up" | "down" | null;
  last_checked_at: string | null;
  response_time_ms?: number | null;
  uptime_30d?: number;
  check_interval_seconds: number;
  created_at: string;
}

export default function UptimeMonitoringPage() {
 const [monitors, setMonitors] = useState<UptimeMonitor[]>([]);
 const [loading, setLoading] = useState(true);
 const [showAdd, setShowAdd] = useState(false);
 const [creating, setCreating] = useState(false);
 const [selectedMonitor, setSelectedMonitor] = useState<UptimeMonitor | null>(null);
 const [form, setForm] = useState({ domain: "", interval: "60" });
 const { domains: verifiedDomains, loading: domainsLoading } = useVerifiedDomains();

 const loadMonitors = useCallback(async () => {
 try {
 const res = await api.request<any>("/monitors/uptime");
 const data = res.data;
 const arr = Array.isArray(data) ? data : Array.isArray(data?.monitors) ? data.monitors : Array.isArray(data?.uptime_monitors) ? data.uptime_monitors : [];
 setMonitors(arr);
 } catch {
 setMonitors([]);
 }
 setLoading(false);
 }, []);

 useEffect(() => {
 loadMonitors();
 }, [loadMonitors]);

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!form.domain) return;
 setCreating(true);
 const url = form.domain.startsWith("http") ? form.domain : `https://${form.domain}`;
 const res = await api.request<UptimeMonitor>("/monitors/uptime", {
 method: "POST",
 body: JSON.stringify({
 url,
 domain: form.domain,
 check_interval_seconds: parseInt(form.interval),
 }),
 });
 setCreating(false);
 if (res.data) {
 toast.success("Uptime monitor created");
 setShowAdd(false);
 setForm({ domain: "", interval: "60" });
 loadMonitors();
 } else {
 toast.error(res.error || "Failed to create monitor");
 }
 }

 async function handleDelete(monitorId: string) {
 if (!confirm("Delete this uptime monitor?")) return;
 const res = await api.request<void>(`/monitors/uptime/${monitorId}`, { method: "DELETE" });
 if (!res.error) {
 toast.success("Monitor deleted");
 setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
 if (selectedMonitor?.id === monitorId) setSelectedMonitor(null);
 } else {
 toast.error(res.error || "Failed to delete monitor");
 }
 }

 // Domains not yet monitored
 const monitoredDomains = new Set(monitors.map((m) => m.domain || new URL(m.url).hostname));
 const availableDomains = verifiedDomains.filter((d) => !monitoredDomains.has(d.domain));

 const pageLoading = loading || domainsLoading;

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 <Link
 href="/dashboard/monitoring"
 className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
 >
 <ArrowLeft className="h-3.5 w-3.5" />
 Monitoring
 </Link>

 <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end justify-between">
 <div className="max-w-xl">
 <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Uptime Monitoring</h1>
 <p className="mt-3 text-[1.05rem] text-muted-foreground font-light leading-relaxed">
 Monitor your verified domains and receive instant alerts when they go offline.
 </p>
 </div>
 {verifiedDomains.length > 0 && (
 <button
 onClick={() => setShowAdd(true)}
 className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-black/5 dark:bg-zinc-100 dark:text-zinc-900"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Add Monitor
 </button>
 )}
 </div>

 {/* Add monitor dialog */}
 {showAdd && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">New Uptime Monitor</h2>
 <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 {availableDomains.length === 0 ? (
 <div className="text-center py-4">
 <p className="text-sm text-muted-foreground mb-3">
 {verifiedDomains.length === 0
 ? "No verified domains found. Verify a domain first."
 : "All your verified domains already have uptime monitoring."}
 </p>
 {verifiedDomains.length === 0 && (
 <Link
 href="/dashboard/domains"
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white"
 >
 Verify a domain
 </Link>
 )}
 <button
 onClick={() => setShowAdd(false)}
 className="mt-3 block w-full py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Close
 </button>
 </div>
 ) : (
 <form onSubmit={handleCreate} className="space-y-4">
 <DomainPicker
 domains={availableDomains}
 selected={form.domain}
 onSelect={(domain) => setForm({ ...form, domain })}
 label="Domain to Monitor"
 placeholder="Select a verified domain"
 />
 <div>
 <label className="block text-sm font-medium mb-1.5">Check Interval</label>
 <div className="flex gap-2">
 {[
 { value: "60", label: "1 min" },
 { value: "300", label: "5 min" },
 { value: "600", label: "10 min" },
 { value: "3600", label: "1 hour" },
 ].map((opt) => (
 <button
 key={opt.value}
 type="button"
 onClick={() => setForm({ ...form, interval: opt.value })}
 className={`px-4 py-2 rounded-lg text-sm ${
 form.interval === opt.value
 ? "bg-teal-500/10 text-teal-700 border border-teal-500/20"
 : "bg-background border border-border text-muted-foreground"
 }`}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowAdd(false)}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={creating || !form.domain}
 className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
 Create
 </button>
 </div>
 </form>
 )}
 </div>
 </div>
 )}

 {pageLoading ? (
 <div className="space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : verifiedDomains.length === 0 ? (
 <NoDomainsCTA message="Verify a domain to start monitoring uptime and response times." />
 ) : monitors.length === 0 ? (
 <div className="dashboard-empty">
 <Activity className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">No uptime monitors</h3>
 <p className="text-sm text-muted-foreground mb-4">
 Add a monitor to track website uptime on your verified domains.
 </p>
 <button
 onClick={() => setShowAdd(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium"
 >
 <Plus className="w-4 h-4" />
 Add Monitor
 </button>
 </div>
 ) : (
 <div className="flex flex-col gap-6">
 <div className="flex flex-col gap-3">
 {monitors.map((monitor) => (
 <div
 key={monitor.id}
 className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[1.5rem] border border-border/40 bg-card/40 p-6 backdrop-blur-xl transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer ${
 selectedMonitor?.id === monitor.id ? "border-teal-500/40 bg-teal-500/5 " : ""
 }`}
 onClick={() => setSelectedMonitor(selectedMonitor?.id === monitor.id ? null : monitor)}
 >
 <div className="flex items-center gap-4 min-w-0 flex-1">
 <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/50 border border-border/50 transition-colors ${
 monitor.last_status === "up" ? "text-emerald-500" : monitor.last_status === "down" ? "text-red-500" : "text-muted-foreground"
 }`}>
 {monitor.last_status === "up" ? (
 <CheckCircle2 className="h-5 w-5" />
 ) : monitor.last_status === "down" ? (
 <XCircle className="h-5 w-5" />
 ) : (
 <Clock className="h-5 w-5" />
 )}
 </div>
 <div className="min-w-0">
 <p className="text-[1.05rem] font-medium tracking-tight text-foreground truncate group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
 {monitor.domain || monitor.url}
 </p>
 <p className="mt-0.5 text-[0.85rem] text-muted-foreground">
 {monitor.last_checked_at
 ? `Checked ${formatRelative(monitor.last_checked_at)}`
 : "Not checked yet"}
 {monitor.response_time_ms != null && ` • ${monitor.response_time_ms}ms`}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-6 sm:ml-4">
 <div className="flex flex-col text-right">
              <span className="text-[1.25rem] font-semibold tracking-tight text-foreground">
                {monitor.uptime_30d != null ? `${monitor.uptime_30d.toFixed(1)}%` : "---"}
              </span>
 <span className="mt-0.5 text-[0.7rem] uppercase tracking-widest text-muted-foreground">30d Uptime</span>
 </div>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(monitor.id);
 }}
 className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 sm:opacity-0 sm:group-hover:opacity-100 disabled:opacity-50"
 title="Delete monitor"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>
 ))}
 </div>

 {/* Chart for selected monitor */}
 {selectedMonitor && (
 <UptimeChart monitorId={selectedMonitor.id} domain={selectedMonitor.domain || selectedMonitor.url} />
 )}
 </div>
 )}
 </div>
 );
}
