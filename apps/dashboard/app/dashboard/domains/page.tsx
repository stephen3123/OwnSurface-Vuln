"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { VerifyDomainModal } from "@/components/domains/verify-domain-modal";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate } from "@/lib/utils";
import {
 Activity,
 ArrowRight,
 CheckCircle2,
 Clock3,
 ExternalLink,
 Globe,
 Gauge,
 Plus,
 Shield,
 ShieldCheck,
 Trash2,
 Loader2,
} from "lucide-react";

interface VerifiedDomain {
 id: string;
 domain: string;
 status: "verified" | "pending";
 verified_at: string | null;
 created_at: string;
}



export default function DomainsPage() {
 const [domains, setDomains] = useState<VerifiedDomain[]>([]);
 const [loading, setLoading] = useState(true);
 const [showVerify, setShowVerify] = useState(false);
 const [deletingId, setDeletingId] = useState<string | null>(null);

 const loadDomains = useCallback(async () => {
 const res = await api.request<{ domains?: Array<Record<string, unknown>> } | Array<Record<string, unknown>>>("/domains");
 const items = Array.isArray(res.data) ? res.data : (res.data?.domains ?? []);
 setDomains(
 items.map((domain) => ({
 id: String(domain.id),
 domain: String(domain.domain),
 status: domain.verified ? "verified" : "pending",
 verified_at: domain.verified_at ? String(domain.verified_at) : null,
 created_at: String(domain.created_at),
 }))
 );
 setLoading(false);
 }, []);

 useEffect(() => {
 loadDomains();
 }, [loadDomains]);

 async function handleDelete(domain: VerifiedDomain) {
 if (!confirm(`Remove ${domain.domain}? This will delete all associated scan data.`)) return;
 setDeletingId(domain.id);
 const res = await api.request<void>(`/domains/${domain.id}`, { method: "DELETE" });
 setDeletingId(null);
 if (!res.error) {
 toast.success("Domain removed");
 setDomains((current) => current.filter((item) => item.id !== domain.id));
 return;
 }
 toast.error(res.error || "Failed to delete domain");
 }

 const verifiedCount = domains.filter((domain) => domain.status === "verified").length;
 const pendingCount = domains.length - verifiedCount;
 const coverageRate = domains.length === 0 ? 0 : Math.round((verifiedCount / domains.length) * 100);

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 {/* Hero */}
 <section className="mb-10">
 <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
 <div className="max-w-2xl">
 <p className="max-w-xl text-[1.05rem] leading-relaxed text-muted-foreground font-medium">
 Securely verify ownership to unlock intelligent monitoring, compliance checks, and unified web-security workflows across your infrastructure.
 </p>
 </div>

 <button
 onClick={() => setShowVerify(true)}
 className="group relative inline-flex shrink-0 items-center gap-2.5 rounded-xl border border-border/40 bg-card/50 px-6 py-3.5 text-[0.95rem] font-medium text-foreground transition-all hover:bg-accent hover:border-border"
 >
 <Plus className="h-4 w-4 transition-transform group-hover:rotate-90" />
 Verify new domain
 </button>
 </div>
 </section>

 {/* Stats row */}
 <section className="mb-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
 {[
 { label: "Verified domains", value: verifiedCount, icon: ShieldCheck, color: "text-emerald-500", bg: "bg-emerald-500/10" },
 { label: "Pending verification", value: pendingCount, icon: Clock3, color: "text-amber-500", bg: "bg-amber-500/10" },
 { label: "Monitors active", value: verifiedCount, icon: Activity, color: "text-teal-500", bg: "bg-teal-500/10" },
 { label: "Coverage rate", value: `${coverageRate}%`, icon: Gauge, color: "text-blue-500", bg: "bg-blue-500/10" },
 ].map((item) => (
 <div key={item.label} className="card-lift flex flex-col rounded-xl border border-border/40 bg-card/50 p-7 transition-colors hover:bg-muted/30">
 <div className="flex items-center justify-between">
 <p className="text-[0.72rem] font-semibold uppercase tracking-widest text-muted-foreground">{item.label}</p>
 <div className={`flex h-8 w-8 items-center justify-center rounded-full ${item.bg} ${item.color}`}>
 <item.icon className="h-4 w-4" />
 </div>
 </div>
 <p className="mt-4 text-[2.2rem] font-medium tracking-tight text-foreground">{item.value}</p>
 </div>
 ))}
 </section>

 <VerifyDomainModal
 open={showVerify}
 onOpenChange={setShowVerify}
 onVerified={() => {
 setShowVerify(false);
 loadDomains();
 }}
 />

 {loading ? (
 <div className="grid gap-6 xl:grid-cols-2">
 {Array.from({ length: 4 }).map((_, index) => (
 <CardSkeleton key={index} />
 ))}
 </div>
 ) : domains.length === 0 ? (
 <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-background px-6 py-24 text-center">
 <div className="relative z-10">
 <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-xl border border-border bg-accent/50">
 <Globe className="h-8 w-8 text-muted-foreground" />
 </div>
 <h3 className="mt-6 text-2xl font-bold tracking-tight text-foreground">No domains monitored yet</h3>
 <p className="mx-auto mt-3 max-w-lg text-[0.95rem] leading-relaxed text-muted-foreground">
 Add your first domain to unlock continuous uptime monitoring, SSL tracking, and unified web-security scans.
 </p>
 <button
 onClick={() => setShowVerify(true)}
 className="mt-8 inline-flex items-center gap-2.5 rounded-full bg-card px-6 py-3.5 text-[0.95rem] font-medium text-zinc-950 transition-all hover:bg-zinc-200 hover:scale-[1.02] active:scale-[0.98]"
 >
 <Plus className="h-4 w-4" />
 Add your first domain
 </button>
 </div>
 </div>
 ) : (
 <section className="flex flex-col gap-4">
 <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-3 text-[0.75rem] font-semibold uppercase tracking-wider text-muted-foreground">
 <div className="col-span-4">Domain</div>
 <div className="col-span-2">Status</div>
 <div className="col-span-2">Verification</div>
 <div className="col-span-3">Monitoring</div>
 <div className="col-span-1 text-right">Actions</div>
 </div>
 
 <div className="flex flex-col gap-3">
 {domains.map((domain) => {
 const isVerified = domain.status === "verified";

 return (
 <div 
 key={domain.id} 
 className="relative flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 lg:gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:bg-accent/50 hover:border-border"
 >
 <div className="group col-span-4 flex min-w-0 items-center gap-4 cursor-pointer">
 <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted/50 border border-border/50 text-muted-foreground transition-all group-hover:bg-card group-hover:text-foreground">
 <Globe className="h-5 w-5" />
 </div>
 <div className="min-w-0">
 <h3 className="truncate text-[1.1rem] font-medium tracking-tight text-foreground group-hover:text-teal-400 transition-colors">
 {domain.domain}
 </h3>
 <p className="mt-0.5 text-[0.8rem] text-muted-foreground">
 Added {formatDate(domain.created_at)}
 </p>
 </div>
 </div>

 <div className="col-span-2 flex items-center">
 <span
 className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[0.75rem] font-black uppercase tracking-tight ${
 isVerified
 ? "border-emerald-500 bg-emerald-50 text-emerald-900"
 : "border-amber-500/20 bg-amber-50 text-amber-900"
 }`}
 >
 {isVerified ? (
 <>
 <CheckCircle2 className="h-3 w-3" />
 Verified
 </>
 ) : (
 <>
 <Clock3 className="h-3 w-3" />
 Pending
 </>
 )}
 </span>
 </div>

 <div className="col-span-2 flex items-center">
 <div className="flex flex-col">
 <span className="text-[0.85rem] font-medium text-foreground">
 {isVerified ? formatDate(domain.verified_at || domain.created_at) : "Waiting"}
 </span>
 <span className="text-[0.75rem] text-muted-foreground">
 {isVerified ? "Date verified" : "Action required"}
 </span>
 </div>
 </div>

 <div className="col-span-3 flex items-center gap-1.5 flex-wrap">
 {isVerified ? (
 <>
 <Link
 href="/dashboard/monitoring/uptime"
 className="inline-flex items-center gap-1.5 rounded-[0.85rem] border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-600 transition-all dark:hover:text-emerald-400"
 >
 <Activity className="h-3.5 w-3.5" />
 Uptime
 </Link>
 <Link
 href="/dashboard/monitoring/ssl"
 className="inline-flex items-center gap-1.5 rounded-[0.85rem] border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-600 transition-all dark:hover:text-blue-400"
 >
 <Shield className="h-3.5 w-3.5" />
 SSL
 </Link>
 <Link
 href={`/dashboard/domain-scan/new/security?domain=${encodeURIComponent(domain.domain)}`}
 className="inline-flex items-center gap-1.5 rounded-[0.85rem] border border-border/50 bg-background/50 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:border-teal-500/30 hover:bg-teal-500/5 hover:text-teal-600 transition-all dark:hover:text-teal-400"
 >
 <ShieldCheck className="h-3.5 w-3.5" />
 Web Security
 </Link>
 </>
 ) : (
 <button
 onClick={() => setShowVerify(true)}
 className="inline-flex items-center gap-2 rounded-[0.85rem] bg-card px-4 py-2 text-xs font-medium text-zinc-950 hover:bg-zinc-200 transition-colors"
 >
 Complete setup
 <ArrowRight className="h-3 w-3" />
 </button>
 )}
 </div>

 <div className="col-span-1 flex items-center justify-end">
 <button
 onClick={() => handleDelete(domain)}
 disabled={deletingId === domain.id}
 className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-transparent text-muted-foreground transition-all hover:border-red-500/20 hover:bg-red-500/10 hover:text-red-500 disabled:opacity-50"
 title="Delete domain"
 >
 {deletingId === domain.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
 </button>
 </div>
 </div>
 );
 })}
 </div>
 </section>
 )}
 </div>
 );
}
