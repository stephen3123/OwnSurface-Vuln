"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/lib/api-client";
import { useVerifiedDomains } from "@/hooks/use-verified-domains";
import { DomainPicker, NoDomainsCTA } from "@/components/monitoring/domain-picker";
import { SpeedChart } from "@/components/monitoring/speed-chart";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative } from "@/lib/utils";
import { toast } from "sonner";
import {
 Gauge,
 Plus,
 Loader2,
 X,
 ArrowLeft,
 Trash2,
 RefreshCw,
 TrendingUp,
 TrendingDown,
} from "lucide-react";
import Link from "next/link";

interface SpeedMonitor {
 id: string;
 domain: string;
 url: string;
 current_lcp: number | null;
 current_cls: number | null;
 current_ttfb: number | null;
 previous_lcp: number | null;
 previous_cls: number | null;
 previous_ttfb: number | null;
 last_measured: string | null;
 created_at: string;
}

function getVitalRating(metric: string, value: number): "good" | "needs-improvement" | "poor" {
 if (metric === "lcp") {
 if (value < 2500) return "good";
 if (value < 4000) return "needs-improvement";
 return "poor";
 }
 if (metric === "cls") {
 if (value < 0.1) return "good";
 if (value < 0.25) return "needs-improvement";
 return "poor";
 }
 // ttfb
 if (value < 800) return "good";
 if (value < 1800) return "needs-improvement";
 return "poor";
}

function getRatingColor(rating: string) {
 switch (rating) {
 case "good":
 return "text-emerald-400";
 case "needs-improvement":
 return "text-yellow-400";
 case "poor":
 return "text-red-400";
 default:
 return "text-muted-foreground";
 }
}

function getRatingBg(rating: string) {
 switch (rating) {
 case "good":
 return "bg-emerald-500/10 border-emerald-500/20";
 case "needs-improvement":
 return "bg-yellow-500/10 border-yellow-500/20";
 case "poor":
 return "bg-red-500/10 border-red-500/20";
 default:
 return "bg-secondary";
 }
}

function getRatingLabel(rating: string) {
 switch (rating) {
 case "good":
 return "Good";
 case "needs-improvement":
 return "Needs Improvement";
 case "poor":
 return "Poor";
 default:
 return "Unknown";
 }
}

export default function SpeedTrackingPage() {
 const [monitors, setMonitors] = useState<SpeedMonitor[]>([]);
 const [loading, setLoading] = useState(true);
 const [showAdd, setShowAdd] = useState(false);
 const [creating, setCreating] = useState(false);
 const [measuringId, setMeasuringId] = useState<string | null>(null);
 const [selectedMonitor, setSelectedMonitor] = useState<SpeedMonitor | null>(null);
 const [form, setForm] = useState({ domain: "" });
 const { domains: verifiedDomains, loading: domainsLoading } = useVerifiedDomains();
 const measurementPollers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

 const clearMeasurementPoller = useCallback((domain: string) => {
 const timeoutId = measurementPollers.current.get(domain);
 if (timeoutId) {
 clearTimeout(timeoutId);
 measurementPollers.current.delete(domain);
 }
 }, []);

 const loadMonitors = useCallback(async () => {
 try {
 // Load verified domains, then fetch speed measurements for each
 const domainsRes = await api.getDomains();
 const verified = (domainsRes.data || []).filter((d) => d.verified);
 const speedMonitors: SpeedMonitor[] = [];

 for (const domain of verified) {
 try {
 const res = await api.request<any>(`/monitors/speed/${domain.domain}`);
 const measurements = res.data?.measurements || [];
 if (measurements.length === 0) continue;

 const latest = measurements[0];
 const previous = measurements.length > 1 ? measurements[1] : null;

 speedMonitors.push({
 id: latest.id,
 domain: domain.domain,
 url: latest.url || `https://${domain.domain}`,
 current_lcp: latest.lcp_ms,
 current_cls: latest.cls,
 current_ttfb: latest.ttfb_ms,
 previous_lcp: previous?.lcp_ms ?? null,
 previous_cls: previous?.cls ?? null,
 previous_ttfb: previous?.ttfb_ms ?? null,
 last_measured: latest.measured_at,
 created_at: latest.measured_at,
 });
 } catch {
 // No speed data for this domain
 }
 }

 setMonitors(speedMonitors);
 setSelectedMonitor((current) => {
 if (!current) return null;
 return speedMonitors.find((monitor) => monitor.domain === current.domain || monitor.url === current.url) ?? null;
 });
 } catch {
 setMonitors([]);
 }
 setLoading(false);
 }, []);

 const pollForMeasurement = useCallback(async (monitor: SpeedMonitor, previousMeasuredAt: string | null, attempt = 0) => {
 const maxAttempts = 15;
 const pollIntervalMs = 3000;

 try {
 const res = await api.getSpeedHistory(monitor.domain);
 const latest = res.data?.[0];
 const hasFreshMeasurement =
 latest &&
 latest.measured_at &&
 latest.id !== monitor.id &&
 latest.measured_at !== previousMeasuredAt;

 if (hasFreshMeasurement) {
 clearMeasurementPoller(monitor.domain);
 await loadMonitors();
 toast.success(`New speed result available for ${monitor.domain}`);
 return;
 }
 } catch {
 // Keep polling until the timeout window is exhausted.
 }

 if (attempt >= maxAttempts) {
 clearMeasurementPoller(monitor.domain);
 return;
 }

 const timeoutId = setTimeout(() => {
 pollForMeasurement(monitor, previousMeasuredAt, attempt + 1);
 }, pollIntervalMs);
 measurementPollers.current.set(monitor.domain, timeoutId);
 }, [clearMeasurementPoller, loadMonitors]);

 useEffect(() => {
 loadMonitors();
 }, [loadMonitors]);

 useEffect(() => {
 return () => {
 for (const timeoutId of measurementPollers.current.values()) {
 clearTimeout(timeoutId);
 }
 measurementPollers.current.clear();
 };
 }, []);

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!form.domain) return;
 setCreating(true);
 const url = form.domain.startsWith("http") ? form.domain : `https://${form.domain}`;
 const res = await api.request<SpeedMonitor>("/monitors/speed", {
 method: "POST",
 body: JSON.stringify({ url, domain: form.domain }),
 });
 setCreating(false);
 if (res.data) {
 toast.success("Speed tracker created");
 setShowAdd(false);
 setForm({ domain: "" });
 loadMonitors();
 } else {
 toast.error(res.error || "Failed to create speed tracker");
 }
 }

  async function handleMeasure(monitor: SpeedMonitor) {
    setMeasuringId(monitor.id);
    const res = await api.request<any>(`/monitors/speed/${monitor.id}/measure`, {
      method: "POST",
    });
    setMeasuringId(null);
    if (res.data) {
      toast.success("Measurement queued. Results will appear shortly.");
      clearMeasurementPoller(monitor.domain);
      pollForMeasurement(monitor, monitor.last_measured);
    } else {
      toast.error(res.error || "Measurement failed");
    }
  }

 async function handleDelete(monitorId: string) {
 if (!confirm("Delete this speed tracker?")) return;
 const res = await api.request<void>(`/monitors/speed/${monitorId}`, { method: "DELETE" });
 if (!res.error) {
 toast.success("Speed tracker deleted");
 setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
 if (selectedMonitor?.id === monitorId) setSelectedMonitor(null);
 } else {
 toast.error(res.error || "Failed to delete tracker");
 }
 }

 function getTrend(current: number | null, previous: number | null, metric: string) {
 if (current == null || previous == null) return null;
 const improved = current < previous;
 const diff = metric === "cls"
 ? Math.abs(current - previous).toFixed(3)
 : `${Math.abs(Math.round(current - previous))}ms`;
 return { improved, diff };
 }

 // Domains not yet monitored
 const monitoredDomains = new Set(monitors.map((m) => m.domain || (m.url ? new URL(m.url).hostname : "")));
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
 <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">Speed Tracking</h1>
 <p className="mt-3 text-[1.05rem] text-muted-foreground font-light leading-relaxed">
 Track Core Web Vitals (LCP, CLS, TTFB) across your verified domains to ensure maximum performance.
 </p>
 </div>
 {verifiedDomains.length > 0 && (
 <button
 onClick={() => setShowAdd(true)}
 className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-black/5 dark:bg-zinc-100 dark:text-zinc-900"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Add Tracker
 </button>
 )}
 </div>

 {/* Add dialog */}
 {showAdd && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">New Speed Tracker</h2>
 <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 {availableDomains.length === 0 ? (
 <div className="text-center py-4">
 <p className="text-sm text-muted-foreground mb-3">
 {verifiedDomains.length === 0
 ? "No verified domains found. Verify a domain first."
 : "All your verified domains already have speed tracking."}
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
 onSelect={(domain) => setForm({ domain })}
 label="Domain to Track"
 placeholder="Select a verified domain"
 />
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
 <NoDomainsCTA message="Verify a domain to start tracking Core Web Vitals and site performance." />
 ) : monitors.length === 0 ? (
 <div className="relative overflow-hidden rounded-[1.5rem] border border-dashed border-border/60 bg-card/20 px-6 py-24 text-center backdrop-blur-xl">
 <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-muted/50 border border-border/50 mb-6">
 <Gauge className="h-8 w-8 text-muted-foreground" />
 </div>
 <h3 className="mb-2 text-[1.25rem] font-medium tracking-tight">No speed trackers</h3>
 <p className="mx-auto max-w-md text-[0.95rem] text-muted-foreground leading-relaxed">
 Add a tracker to continuously monitor Core Web Vitals and load times on your verified domains.
 </p>
 <button
 onClick={() => setShowAdd(true)}
 className="mt-8 group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-black/5 dark:bg-zinc-100 dark:text-zinc-900"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Add Tracker
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 {monitors.map((monitor) => {
 const lcpRating = monitor.current_lcp != null ? getVitalRating("lcp", monitor.current_lcp) : null;
 const clsRating = monitor.current_cls != null ? getVitalRating("cls", monitor.current_cls) : null;
 const ttfbRating = monitor.current_ttfb != null ? getVitalRating("ttfb", monitor.current_ttfb) : null;
 const lcpTrend = getTrend(monitor.current_lcp, monitor.previous_lcp, "lcp");
 const clsTrend = getTrend(monitor.current_cls, monitor.previous_cls, "cls");
 const ttfbTrend = getTrend(monitor.current_ttfb, monitor.previous_ttfb, "ttfb");

 return (
 <div
 key={monitor.id}
 className={`group flex flex-col gap-5 rounded-[1.5rem] border border-border/40 bg-card/40 p-7 backdrop-blur-xl transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer ${
 selectedMonitor?.id === monitor.id ? "border-teal-500/40 bg-teal-500/5 " : ""
 }`}
 onClick={() =>
 setSelectedMonitor(selectedMonitor?.id === monitor.id ? null : monitor)
 }
 >
 <div className="flex items-start sm:items-center justify-between">
 <div className="flex items-center gap-4">
 <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-background/50 border border-border/50 transition-colors group-hover:text-teal-600 dark:group-hover:text-teal-400 text-muted-foreground">
 <Gauge className="h-5 w-5" />
 </div>
 <div>
 <p className="text-[1.1rem] font-medium tracking-tight text-foreground">{monitor.domain || monitor.url}</p>
 <p className="mt-0.5 text-[0.8rem] text-muted-foreground uppercase tracking-widest">
 {monitor.last_measured
 ? `Measured ${formatRelative(monitor.last_measured)}`
 : "Pending measurement"}
 </p>
 </div>
 </div>
 <div className="flex items-center gap-2 opacity-0 sm:group-hover:opacity-100 transition-opacity">
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleMeasure(monitor);
 }}
 disabled={measuringId === monitor.id}
 className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50"
 title="Run new measurement"
 >
 {measuringId === monitor.id ? (
 <Loader2 className="w-3.5 h-3.5 animate-spin" />
 ) : (
 <RefreshCw className="w-3.5 h-3.5" />
 )}
 Measure
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 handleDelete(monitor.id);
 }}
 className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-500 transition-colors"
 title="Delete"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>

 {monitor.current_lcp != null ? (
 <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
 {/* LCP */}
 <div className={`rounded-xl border p-4 transition-colors ${lcpRating ? getRatingBg(lcpRating) : "bg-card/50 border-border/50"}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[0.7rem] uppercase tracking-widest font-semibold text-muted-foreground">LCP</span>
 {lcpTrend && (
 <span className={`flex items-center gap-1 text-[0.75rem] font-medium ${lcpTrend.improved ? "text-emerald-500" : "text-red-500"}`}>
 {lcpTrend.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
 {lcpTrend.diff}
 </span>
 )}
 </div>
 <div className="flex items-end gap-2">
 <div className={`text-2xl font-bold tracking-tight ${lcpRating ? getRatingColor(lcpRating) : "text-foreground"}`}>
 {Math.round(monitor.current_lcp!)}<span className="text-sm font-medium text-muted-foreground ml-0.5">ms</span>
 </div>
 </div>
 <div className={`mt-2 text-xs font-medium ${lcpRating ? getRatingColor(lcpRating) : "text-muted-foreground"}`}>
 {lcpRating ? getRatingLabel(lcpRating) : "N/A"}
 </div>
 </div>

 {/* CLS */}
 <div className={`rounded-xl border p-4 transition-colors ${clsRating ? getRatingBg(clsRating) : "bg-card/50 border-border/50"}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[0.7rem] uppercase tracking-widest font-semibold text-muted-foreground">CLS</span>
 {clsTrend && (
 <span className={`flex items-center gap-1 text-[0.75rem] font-medium ${clsTrend.improved ? "text-emerald-500" : "text-red-500"}`}>
 {clsTrend.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
 {clsTrend.diff}
 </span>
 )}
 </div>
 <div className="flex items-end gap-2">
 <div className={`text-2xl font-bold tracking-tight ${clsRating ? getRatingColor(clsRating) : "text-foreground"}`}>
 {monitor.current_cls!.toFixed(3)}
 </div>
 </div>
 <div className={`mt-2 text-xs font-medium ${clsRating ? getRatingColor(clsRating) : "text-muted-foreground"}`}>
 {clsRating ? getRatingLabel(clsRating) : "N/A"}
 </div>
 </div>

 {/* TTFB */}
 <div className={`rounded-xl border p-4 transition-colors ${ttfbRating ? getRatingBg(ttfbRating) : "bg-card/50 border-border/50"}`}>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[0.7rem] uppercase tracking-widest font-semibold text-muted-foreground">TTFB</span>
 {ttfbTrend && (
 <span className={`flex items-center gap-1 text-[0.75rem] font-medium ${ttfbTrend.improved ? "text-emerald-500" : "text-red-500"}`}>
 {ttfbTrend.improved ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
 {ttfbTrend.diff}
 </span>
 )}
 </div>
 <div className="flex items-end gap-2">
 <div className={`text-2xl font-bold tracking-tight ${ttfbRating ? getRatingColor(ttfbRating) : "text-foreground"}`}>
 {Math.round(monitor.current_ttfb!)}<span className="text-sm font-medium text-muted-foreground ml-0.5">ms</span>
 </div>
 </div>
 <div className={`mt-2 text-xs font-medium ${ttfbRating ? getRatingColor(ttfbRating) : "text-muted-foreground"}`}>
 {ttfbRating ? getRatingLabel(ttfbRating) : "N/A"}
 </div>
 </div>
 </div>
 ) : (
 <div className="rounded-xl border border-dashed border-border/50 bg-background/30 p-6 text-center">
 <p className="text-[0.95rem] text-muted-foreground">
 No measurements yet. Click &quot;Measure&quot; to run the first core web vitals test.
 </p>
 </div>
 )}
 </div>
 );
 })}

 {/* Chart for selected monitor */}
 {selectedMonitor && (
 <SpeedChart monitorId={selectedMonitor.id} domain={selectedMonitor.domain || selectedMonitor.url} />
 )}
 </div>
 )}
 </div>
 );
}
