"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import {
 ArrowLeft,
 Ban,
 CheckCircle2,
 Clock3,
 FileCode2,
 Loader2,
 Shield,
 Swords,
 XCircle,
} from "lucide-react";

type ScanMode = "security" | "pentest" | "api";

interface ChildStatus {
 id: string;
 status: string;
 pages_found?: number;
 pages_scanned?: number;
 endpoints_found?: number;
 severity_critical?: number;
 severity_high?: number;
 severity_medium?: number;
 severity_low?: number;
 severity_info?: number;
}

interface DomainScanDetail {
 scan: {
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
  created_at: string;
 };
 children: {
  deep_scan?: ChildStatus;
  attack_surface?: ChildStatus;
  offensive?: ChildStatus;
  api_spec?: ChildStatus;
 };
}

const MODE_META: Record<ScanMode, { label: string; icon: typeof Shield; summary: string }> = {
 security: {
  label: "Security Scan",
  icon: Shield,
  summary: "Running deep scan and attack-surface analysis for your verified domain.",
 },
 pentest: {
  label: "Pentest",
  icon: Swords,
  summary: "Running deep scan, attack-surface analysis, and offensive testing together.",
 },
 api: {
  label: "API Security",
  icon: FileCode2,
  summary: "Parsing the API spec and executing the unified API-security checks.",
 },
};

const FINAL_STATUSES = new Set(["complete", "partial_failure", "failed", "cancelled"]);

function StatusIcon({ status }: { status: string }) {
 switch (status) {
 case "complete":
  return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
 case "failed":
 case "partial_failure":
  return <XCircle className="h-4 w-4 text-red-500" />;
 case "cancelled":
  return <Ban className="h-4 w-4 text-muted-foreground" />;
 default:
  return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
 }
}

function ChildRow({ label, child }: { label: string; child: ChildStatus }) {
 const detail =
  child.pages_found !== undefined
   ? `${child.pages_scanned || 0}/${child.pages_found} pages scanned`
   : child.endpoints_found !== undefined
    ? `${child.endpoints_found} endpoints discovered`
    : child.severity_critical !== undefined
     ? `${(child.severity_critical || 0) + (child.severity_high || 0) + (child.severity_medium || 0) + (child.severity_low || 0) + (child.severity_info || 0)} findings`
     : "Preparing results";

 return (
  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-card/50 px-4 py-3">
   <div>
    <p className="text-sm font-medium text-foreground">{label}</p>
    <p className="text-xs text-muted-foreground">{detail}</p>
   </div>
   <div className="flex items-center gap-2 text-xs text-muted-foreground">
    <StatusIcon status={child.status} />
    <span className="capitalize">{child.status.replace("_", " ")}</span>
   </div>
  </div>
 );
}

export default function DomainScanScanningPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [data, setData] = useState<DomainScanDetail | null>(null);
 const [loading, setLoading] = useState(true);
 const [cancelling, setCancelling] = useState(false);
 const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const loadScan = useCallback(async () => {
  const res = await api.getDomainScan(id);

  if (res.data) {
   setData(res.data);
   setLoading(false);
   return;
  }

  if (res.error) {
   toast.error(res.error);
   setLoading(false);
  }
 }, [id]);

 useEffect(() => {
  loadScan();
 }, [loadScan]);

 useEffect(() => {
  if (!data || FINAL_STATUSES.has(data.scan.status)) {
   if (data && !redirectTimerRef.current) {
    redirectTimerRef.current = setTimeout(() => {
     router.replace(`/dashboard/domain-scan/${id}`);
    }, 1600);
   }
   return;
  }

  const interval = setInterval(loadScan, 3000);
  return () => clearInterval(interval);
 }, [data, id, loadScan, router]);

 useEffect(() => {
  return () => {
   if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  };
 }, []);

 const handleCancel = async () => {
  setCancelling(true);
  const res = await api.cancelDomainScan(id);
  if (res.error) {
   toast.error(res.error);
  } else {
   toast.success("Web Security scan cancelled");
   loadScan();
  }
  setCancelling(false);
 };

 const meta = useMemo(() => {
  if (!data) return MODE_META.security;
  return MODE_META[data.scan.mode] || MODE_META.security;
 }, [data]);

 if (loading || !data) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
   </div>
  );
 }

 const Icon = meta.icon;

 return (
  <div className="dashboard-page mx-auto max-w-4xl space-y-6">
   <div className="space-y-3">
    <Link
     href="/dashboard/domain-scan"
     className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
     <ArrowLeft className="h-4 w-4" />
     Back to Web Security
    </Link>

    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/40 bg-card/50 p-6">
     <div className="space-y-2">
      <div className="flex items-center gap-3">
       <Icon className="h-6 w-6 text-teal-600" />
       <h1 className="text-2xl font-bold text-foreground">{data.scan.domain}</h1>
      </div>
      <p className="text-sm font-medium text-foreground">{meta.label}</p>
      <p className="max-w-2xl text-sm text-muted-foreground">{meta.summary}</p>
     </div>

     <div className="flex items-center gap-3">
      {!FINAL_STATUSES.has(data.scan.status) && (
       <button
        onClick={handleCancel}
        disabled={cancelling}
        className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
       >
        {cancelling ? "Cancelling..." : "Cancel"}
       </button>
      )}
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
       <StatusIcon status={data.scan.status} />
       <span className="capitalize">{data.scan.status.replace("_", " ")}</span>
      </div>
     </div>
    </div>
   </div>

   <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
    <div className="mb-4 flex items-center gap-2 text-sm font-medium text-foreground">
     <Clock3 className="h-4 w-4 text-teal-600" />
     Shared scan progress
    </div>
    <div className="space-y-3">
     {data.children.deep_scan && <ChildRow label="Deep Scan" child={data.children.deep_scan} />}
     {data.children.attack_surface && <ChildRow label="Attack Surface" child={data.children.attack_surface} />}
     {data.children.offensive && <ChildRow label="Offensive Testing" child={data.children.offensive} />}
     {data.children.api_spec && <ChildRow label="API Security" child={data.children.api_spec} />}
    </div>
   </div>

   <div className="grid gap-4 sm:grid-cols-5">
    {[
     { label: "Critical", value: data.scan.severity_critical, color: "text-red-600" },
     { label: "High", value: data.scan.severity_high, color: "text-orange-600" },
     { label: "Medium", value: data.scan.severity_medium, color: "text-amber-600" },
     { label: "Low", value: data.scan.severity_low, color: "text-blue-600" },
     { label: "Info", value: data.scan.severity_info, color: "text-slate-600" },
    ].map((item) => (
     <div key={item.label} className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{item.label}</div>
     </div>
    ))}
   </div>

   {FINAL_STATUSES.has(data.scan.status) && (
    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-700">
     Final status reached. Opening the shared Web Security result page...
    </div>
   )}
  </div>
 );
}
