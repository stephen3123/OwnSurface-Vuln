"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { api } from "@/lib/api-client";
import { ArrowLeft, Ban, CheckCircle2, Loader2, Smartphone, XCircle } from "lucide-react";

interface MobileScanProgress {
 id: string;
 status: string;
 app_name: string | null;
 package_name: string | null;
 platform: "android" | "ios";
 scan_mode: "appstore_check" | "security_audit" | "offensive_pentest";
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 severity_info: number;
 tools_used: string[];
 started_at: string | null;
}

const FINAL_STATUSES = new Set(["complete", "failed", "cancelled"]);

const MODE_META: Record<MobileScanProgress["scan_mode"], { label: string; summary: string }> = {
 appstore_check: {
  label: "Store Check",
  summary: "Running compliance, permissions, and store-readiness checks for the uploaded app.",
 },
 security_audit: {
  label: "Security Scan",
  summary: "Running the unified static app-security audit across binaries, secrets, and dependencies.",
 },
 offensive_pentest: {
  label: "Pentest",
  summary: "Running the unified app pentest flow, including verified-domain bridge checks.",
 },
};

function StatusIcon({ status }: { status: string }) {
 switch (status) {
 case "complete":
  return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
 case "failed":
  return <XCircle className="h-4 w-4 text-red-500" />;
 case "cancelled":
  return <Ban className="h-4 w-4 text-muted-foreground" />;
 default:
  return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
 }
}

export default function MobileScanScanningPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [scan, setScan] = useState<MobileScanProgress | null>(null);
 const [loading, setLoading] = useState(true);
 const [cancelling, setCancelling] = useState(false);
 const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

 const loadScan = useCallback(async () => {
  const res = await api.request<{ scan: MobileScanProgress }>(`/mobile-scan/${id}`);

  if (res.data?.scan) {
   setScan(res.data.scan);
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
  if (!scan || FINAL_STATUSES.has(scan.status)) {
   if (scan && !redirectTimerRef.current) {
    redirectTimerRef.current = setTimeout(() => {
     router.replace(`/dashboard/mobile-scan/${id}`);
    }, 1600);
   }
   return;
  }

  const interval = setInterval(loadScan, 3000);
  return () => clearInterval(interval);
 }, [id, loadScan, router, scan]);

 useEffect(() => {
  return () => {
   if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
  };
 }, []);

 const handleCancel = async () => {
  setCancelling(true);
  const res = await api.request(`/mobile-scan/${id}/cancel`, { method: "POST" });
  if (res.error) {
   toast.error(res.error);
  } else {
   toast.success("App Security run cancelled");
   loadScan();
  }
  setCancelling(false);
 };

 if (loading || !scan) {
  return (
   <div className="flex items-center justify-center py-20">
    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
   </div>
  );
 }

 const meta = MODE_META[scan.scan_mode];

 return (
  <div className="dashboard-page mx-auto max-w-4xl space-y-6">
   <div className="space-y-3">
    <Link
     href="/dashboard/mobile-scan"
     className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
    >
     <ArrowLeft className="h-4 w-4" />
     Back to App Security
    </Link>

    <div className="flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border/40 bg-card/50 p-6">
     <div className="space-y-2">
      <div className="flex items-center gap-3">
       <Smartphone className="h-6 w-6 text-teal-600" />
       <h1 className="text-2xl font-bold text-foreground">
        {scan.app_name || scan.package_name || "App Security"}
       </h1>
      </div>
      <p className="text-sm font-medium text-foreground">{meta.label}</p>
      <p className="max-w-2xl text-sm text-muted-foreground">{meta.summary}</p>
     </div>

     <div className="flex items-center gap-3">
      {!FINAL_STATUSES.has(scan.status) && (
       <button
        onClick={handleCancel}
        disabled={cancelling}
        className="rounded-xl border border-border/50 px-4 py-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50"
       >
        {cancelling ? "Cancelling..." : "Cancel"}
       </button>
      )}
      <div className="inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
       <StatusIcon status={scan.status} />
       <span className="capitalize">{scan.status}</span>
      </div>
     </div>
    </div>
   </div>

   <div className="grid gap-4 sm:grid-cols-5">
    {[
     { label: "Critical", value: scan.severity_critical, color: "text-red-600" },
     { label: "High", value: scan.severity_high, color: "text-orange-600" },
     { label: "Medium", value: scan.severity_medium, color: "text-amber-600" },
     { label: "Low", value: scan.severity_low, color: "text-blue-600" },
     { label: "Info", value: scan.severity_info, color: "text-slate-600" },
    ].map((item) => (
     <div key={item.label} className="rounded-xl border border-border/40 bg-card/50 p-4 text-center">
      <div className={`text-2xl font-bold ${item.color}`}>{item.value}</div>
      <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">{item.label}</div>
     </div>
    ))}
   </div>

   <div className="rounded-2xl border border-border/40 bg-card/50 p-6">
    <h2 className="mb-3 text-sm font-medium text-foreground">Run activity</h2>
    <p className="text-sm text-muted-foreground">
     {scan.tools_used.length > 0
      ? `Using ${scan.tools_used.length} supporting tools while the shared app-security flow is running.`
      : "Preparing analysis tools and extracting app metadata."}
    </p>
    {scan.tools_used.length > 0 && (
     <div className="mt-4 flex flex-wrap gap-2">
      {scan.tools_used.map((tool) => (
       <span
        key={tool}
        className="rounded-full border border-border/50 bg-background px-3 py-1 text-xs text-muted-foreground"
       >
        {tool}
       </span>
      ))}
     </div>
    )}
   </div>

   {FINAL_STATUSES.has(scan.status) && (
    <div className="rounded-xl border border-teal-500/20 bg-teal-500/5 px-4 py-3 text-sm text-teal-700">
     Final status reached. Opening the shared App Security result page...
    </div>
   )}
  </div>
 );
}
