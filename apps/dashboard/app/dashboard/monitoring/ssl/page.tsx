"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { useVerifiedDomains } from "@/hooks/use-verified-domains";
import { DomainPicker, NoDomainsCTA } from "@/components/monitoring/domain-picker";
import { SslStatusCard } from "@/components/monitoring/ssl-status-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { toast } from "sonner";
import { Shield, Plus, Loader2, X, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface SslMonitor {
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

export default function SslMonitoringPage() {
 const [monitors, setMonitors] = useState<SslMonitor[]>([]);
 const [loading, setLoading] = useState(true);
 const [showAdd, setShowAdd] = useState(false);
 const [creating, setCreating] = useState(false);
 const [form, setForm] = useState({ domain: "", alert_days: "30" });
 const { domains: verifiedDomains, loading: domainsLoading } = useVerifiedDomains();

 const loadMonitors = useCallback(async () => {
 try {
 const res = await api.request<any>("/monitors/ssl");
 const data = res.data;
 const arr = Array.isArray(data) ? data : Array.isArray(data?.monitors) ? data.monitors : Array.isArray(data?.ssl_monitors) ? data.ssl_monitors : [];
 // Transform API data to match component interface
 const mapped: SslMonitor[] = arr.map((m: any) => {
 const validTo = m.valid_to ? new Date(m.valid_to) : null;
 const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : -1;
 return {
 id: m.id,
 domain: m.domain,
 issuer: m.issuer || "Unknown",
 valid_from: m.valid_from || "",
 valid_to: m.valid_to || "",
 days_remaining: m.days_remaining ?? daysRemaining,
 subject: m.subject || m.domain,
 serial_number: m.serial_number || "",
 chain_length: m.chain_length ?? (m.subject_alt_names?.length || 1),
 chain_valid: m.chain_valid ?? m.is_valid ?? false,
 last_checked: m.last_checked || m.last_checked_at || "",
 alert_days: m.alert_days ?? m.alert_days_before_expiry ?? 30,
 created_at: m.created_at || "",
 };
 });
 setMonitors(mapped);
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
 const res = await api.request<SslMonitor>("/monitors/ssl", {
 method: "POST",
 body: JSON.stringify({
 domain: form.domain,
 alert_days: parseInt(form.alert_days),
 }),
 });
 setCreating(false);
 if (res.data) {
 toast.success("SSL monitor created");
 setShowAdd(false);
 setForm({ domain: "", alert_days: "30" });
 loadMonitors();
 } else {
 toast.error(res.error || "Failed to create SSL monitor");
 }
 }

 async function handleDelete(monitorId: string) {
 if (!confirm("Delete this SSL monitor?")) return;
 const res = await api.request<void>(`/monitors/ssl/${monitorId}`, { method: "DELETE" });
 if (!res.error) {
 toast.success("SSL monitor deleted");
 setMonitors((prev) => prev.filter((m) => m.id !== monitorId));
 } else {
 toast.error(res.error || "Failed to delete monitor");
 }
 }

 async function handleUpdateAlertDays(monitorId: string, alertDays: number) {
 const res = await api.request<SslMonitor>(`/monitors/ssl/${monitorId}`, {
 method: "PUT",
 body: JSON.stringify({ alert_days: alertDays }),
 });
 if (res.data) {
 toast.success("Alert settings updated");
 setMonitors((prev) => prev.map((m) => (m.id === monitorId ? { ...m, alert_days: alertDays } : m)));
 } else {
 toast.error(res.error || "Failed to update settings");
 }
 }

 // Domains not yet monitored
 const monitoredDomains = new Set(monitors.map((m) => m.domain));
 const availableDomains = verifiedDomains.filter((d) => !monitoredDomains.has(d.domain));

 // Sort: expired first, then by days remaining
 const sortedMonitors = [...monitors].sort((a, b) => a.days_remaining - b.days_remaining);

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
 <h1 className="text-3xl font-medium tracking-tight text-foreground sm:text-4xl">SSL Certificate Monitoring</h1>
 <p className="mt-3 text-[1.05rem] text-muted-foreground font-light leading-relaxed">
 Track certificate expiry dates across your verified domains to ensure continuous security.
 </p>
 </div>
 {verifiedDomains.length > 0 && (
 <button
 onClick={() => setShowAdd(true)}
 className="group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-black/5 dark:bg-zinc-100 dark:text-zinc-900"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Add SSL Monitor
 </button>
 )}
 </div>

 {/* Add dialog */}
 {showAdd && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card/40 backdrop-blur-xl border border-border rounded-[1.5rem] p-6 transition-all duration-300 hover:border-border/80 hover:bg-card/80 hover: w-full max-w-md mx-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">New SSL Monitor</h2>
 <button onClick={() => setShowAdd(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 {availableDomains.length === 0 ? (
 <div className="text-center py-4">
 <p className="text-sm text-muted-foreground mb-3">
 {verifiedDomains.length === 0
 ? "No verified domains found. Verify a domain first."
 : "All your verified domains already have SSL monitoring."}
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
 label="Domain"
 placeholder="Select a verified domain"
  className="bg-background"
 />
 <div>
 <label className="block text-sm font-medium mb-1.5">Alert Before Expiry</label>
 <div className="flex gap-2">
 {[
 { value: "7", label: "7 days" },
 { value: "14", label: "14 days" },
 { value: "30", label: "30 days" },
 { value: "60", label: "60 days" },
 ].map((opt) => (
 <button
 key={opt.value}
 type="button"
 onClick={() => setForm({ ...form, alert_days: opt.value })}
 className={`px-4 py-2 rounded-lg text-sm font-medium ${
 form.alert_days === opt.value
  ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
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
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {Array.from({ length: 4 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : verifiedDomains.length === 0 ? (
 <NoDomainsCTA message="Verify a domain to start tracking SSL certificates and get notified before they expire." />
 ) : monitors.length === 0 ? (
 <div className="relative overflow-hidden rounded-[1.5rem] border border-dashed border-border/60 bg-card/20 px-6 py-24 text-center backdrop-blur-xl">
 <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[1.5rem] bg-muted/50 border border-border/50 mb-6">
 <Shield className="h-8 w-8 text-muted-foreground" />
 </div>
 <h3 className="mb-2 text-[1.25rem] font-medium tracking-tight">No SSL monitors</h3>
 <p className="mx-auto max-w-md text-[0.95rem] text-muted-foreground leading-relaxed">
 Add SSL monitoring to continuously track certificate validity across your verified domains.
 </p>
 <button
 onClick={() => setShowAdd(true)}
 className="mt-8 group inline-flex shrink-0 items-center gap-2.5 rounded-full bg-foreground px-6 py-3.5 text-[0.95rem] font-medium text-background transition-all hover:bg-foreground/90 hover:scale-[1.02] active:scale-[0.98] shadow-black/5 dark:bg-zinc-100 dark:text-zinc-900"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Add SSL Monitor
 </button>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {sortedMonitors.map((monitor) => (
 <SslStatusCard
 key={monitor.id}
 monitor={monitor}
 onDelete={() => handleDelete(monitor.id)}
 onUpdateAlertDays={(days) => handleUpdateAlertDays(monitor.id, days)}
 />
 ))}
 </div>
 )}
 </div>
 );
}
