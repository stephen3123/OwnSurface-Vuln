"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api-client";
import { formatRelative } from "@/lib/utils";
import {
 ArrowRight,
 Globe,
 Loader2,
 Shield,
 Swords,
 FileCode2,
 Plus,
} from "lucide-react";

type ScanMode = "security" | "pentest" | "api";

interface DomainScan {
 id: string;
 domain: string;
 mode: ScanMode;
 status: string;
 total_findings: number;
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 severity_info: number;
 started_at: string | null;
 completed_at: string | null;
 created_at: string;
}

const MODE_META: Record<ScanMode, { label: string; icon: typeof Shield; color: string; desc: string }> = {
 security: { label: "Security Scan", icon: Shield, color: "text-blue-600", desc: "Deep scan + attack surface audit" },
 pentest: { label: "Pentest", icon: Swords, color: "text-red-600", desc: "Full offensive scan (26 modules)" },
 api: { label: "API Security", icon: FileCode2, color: "text-amber-600", desc: "OpenAPI spec + endpoint attacks" },
};

export default function DomainScanListPage() {
 const [scans, setScans] = useState<DomainScan[]>([]);
 const [loading, setLoading] = useState(true);

 const fetchScans = useCallback(async () => {
 const res = await api.getDomainScans();
 if (res.data?.scans) setScans(res.data.scans);
 setLoading(false);
 }, []);

 useEffect(() => { fetchScans(); }, [fetchScans]);

 const statusBadge = (status: string) => {
 const colors: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  running: "bg-blue-500/10 text-blue-400",
  complete: "bg-emerald-500/10 text-emerald-400",
  partial_failure: "bg-amber-500/10 text-amber-400",
  cancelled: "bg-muted text-muted-foreground",
  failed: "bg-red-500/10 text-red-400",
 };
 return (
  <span className={`px-2 py-0.5 rounded-md text-xs font-medium ${colors[status] || colors.pending}`}>
  {status === "partial_failure" ? "Partial" : status}
  </span>
 );
 };

 if (loading) {
 return (
 <div className="flex items-center justify-center py-20">
 <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 {/* Header */}
 <div className="mb-10">
 <p className="max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground font-medium">
 Launch verified-domain security scans from one place. Web Security combines deep scanning, pentest orchestration, and API security under a single workflow.
 </p>
 </div>

 {/* Mode cards */}
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
 {(Object.entries(MODE_META) as [ScanMode, typeof MODE_META["security"]][]).map(([mode, meta]) => (
 <Link
  key={mode}
  href={`/dashboard/domain-scan/new/${mode}`}
  className="group relative flex flex-col items-start rounded-xl border border-border/40 bg-card/50 p-6 transition-colors hover:border-border hover:bg-accent/50"
  >
  <div className="flex items-center gap-3 mb-2">
   <meta.icon className={`w-5 h-5 ${meta.color}`} />
   <span className="font-medium text-foreground">{meta.label}</span>
  </div>
  <p className="text-sm text-muted-foreground">{meta.desc}</p>
  <div className="flex items-center gap-1 mt-3 text-xs text-muted-foreground group-hover:text-teal-400 transition-colors">
   <Plus className="w-3.5 h-3.5" /> Start scan
  </div>
  </Link>
 ))}
 </div>

 {/* Scan history */}
 <h2 className="mb-4 text-[0.75rem] font-medium uppercase tracking-widest text-muted-foreground">Recent Scans</h2>
 {scans.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/40 bg-card/50 py-16 text-center">
  <Globe className="w-10 h-10 mx-auto mb-3 opacity-50 text-muted-foreground" />
  <p className="text-sm text-muted-foreground">No domain scans yet. Start one above.</p>
  </div>
 ) : (
 <div className="space-y-3">
 {scans.map((scan) => {
 const meta = MODE_META[scan.mode];
 const Icon = meta?.icon || Shield;
 const href =
  scan.status === "pending" || scan.status === "running"
   ? `/dashboard/domain-scan/${scan.id}/scanning`
   : `/dashboard/domain-scan/${scan.id}`;
 return (
  <Link
  key={scan.id}
  href={href}
  className="group flex items-center justify-between p-5 rounded-xl border border-border/40 bg-card/50 transition-colors hover:border-border hover:bg-accent/50"
  >
  <div className="flex items-center gap-4">
   <Icon className={`w-5 h-5 ${meta?.color || "text-muted-foreground"}`} />
   <div>
   <div className="flex items-center gap-2">
    <span className="font-medium text-foreground">{scan.domain}</span>
    {statusBadge(scan.status)}
   </div>
   <p className="text-xs text-muted-foreground mt-0.5">
    {meta?.label} &middot; {formatRelative(scan.created_at)}
   </p>
   </div>
  </div>
  <div className="flex items-center gap-4">
   {scan.total_findings > 0 && (
   <div className="flex items-center gap-2 text-xs">
    {scan.severity_critical > 0 && (
    <span className="px-1.5 py-0.5 rounded-md bg-red-500/10 text-red-400 font-medium">
     {scan.severity_critical}C
    </span>
    )}
    {scan.severity_high > 0 && (
    <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 text-orange-400 font-medium">
     {scan.severity_high}H
    </span>
    )}
    {(scan.severity_medium + scan.severity_low + scan.severity_info) > 0 && (
    <span className="px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground">
     +{scan.severity_medium + scan.severity_low + scan.severity_info}
    </span>
    )}
   </div>
   )}
   <ArrowRight className="w-4 h-4 text-muted-foreground" />
  </div>
  </Link>
 );
 })}
 </div>
 )}
 </div>
 );
}
