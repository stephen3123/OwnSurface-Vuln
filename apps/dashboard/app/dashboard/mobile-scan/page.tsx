"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { PageIntro } from "@/components/dashboard/page-intro";
import { SelectableModeCard } from "@/components/dashboard/selectable-mode-card";
import { FileUploader } from "@/components/mobile/file-uploader";
import { MobileScopeSelector, type MobileScopeConfig } from "@/components/mobile/scope-selector";
import { Loader2, Smartphone, Play, Clock, AlertTriangle } from "lucide-react";

interface Domain {
 id: string;
 domain: string;
 verified: boolean;
}


interface MobileScan {
 id: string;
 app_name: string;
 package_name: string;
 platform: "android" | "ios";
 scan_mode: "appstore_check" | "security_audit" | "offensive_pentest";
 status: string;
 severity_critical: number;
 severity_high: number;
 severity_medium: number;
 severity_low: number;
 created_at: string;
}

type ScanMode = "scan" | "pentest" | "appstore_check";

const SCAN_MODES = [
 {
 value: "appstore_check" as const,
 label: "Store Check",
 description: "Manifest analysis, permissions, store compliance",
 badge: "Free",
 badgeColor: "bg-green-500/10 text-green-400",
 activeBadgeColor: "border border-emerald-400/25 bg-emerald-400/15 text-emerald-200",
 },
 {
 value: "scan" as const,
 label: "Security Scan",
 description: "Full static analysis, secrets, dependencies, binary checks",
 badge: "Pro",
 badgeColor: "bg-teal-500/10 text-teal-400",
 activeBadgeColor: "border border-teal-400/25 bg-teal-400/15 text-teal-100",
 },
 {
 value: "pentest" as const,
 label: "Pentest",
 description: "Dynamic analysis, API fuzzing, runtime hooking",
 badge: "Pro + Verified",
 badgeColor: "bg-orange-500/10 text-orange-400",
 activeBadgeColor: "border border-orange-400/25 bg-orange-400/15 text-orange-100",
 },
];

export default function MobileScanPage() {
 const { isAuthenticated, isLoading: authLoading } = useAuth();
 const router = useRouter();
 const [scans, setScans] = useState<MobileScan[]>([]);
 const [loading, setLoading] = useState(true);
 const [starting, setStarting] = useState(false);
 const [selectedFile, setSelectedFile] = useState<File | null>(null);
 const [uploadProgress, setUploadProgress] = useState(0);
 const [scanMode, setScanMode] = useState<ScanMode>("scan");
 const [domains, setDomains] = useState<Domain[]>([]);
 const [selectedDomain, setSelectedDomain] = useState("");
 const [scope, setScope] = useState<MobileScopeConfig>({
 manifest_checks: true,
 crypto_analysis: true,
 storage_analysis: true,
 webview_analysis: true,
 network_analysis: true,
 secret_scanning: true,
 dependency_cve: true,
 binary_security: true,
 framework_analysis: true,
 tracker_detection: true,
 });

 useEffect(() => {
 if (authLoading) return;
 if (!isAuthenticated) {
 setLoading(false);
 return;
 }

 Promise.all([
 api.request<{ domains: Domain[] }>("/domains"),
 api.request<{ scans: MobileScan[] }>("/mobile-scan"),
 ])
 .then(([domainsRes, scansRes]) => {
 const verified = (domainsRes.data?.domains || []).filter((d: Domain) => d.verified);
 setDomains(verified);
 if (verified.length > 0) setSelectedDomain(verified[0].domain);
 setScans(scansRes.data?.scans || []);
 })
 .finally(() => setLoading(false));
 }, [isAuthenticated, authLoading]);

 const startScan = async () => {
 if (!selectedFile || !isAuthenticated) return;
 setStarting(true);
 setUploadProgress(0);

 try {
 const formData = new FormData();
 formData.append("file", selectedFile);
 formData.append("scan_mode", scanMode);
 formData.append("scope", JSON.stringify(scope));

 if (scanMode === "pentest") {
 if (!selectedDomain) {
 console.error("No domain selected");
 setStarting(false);
 return;
 }
 formData.append("domain", selectedDomain);
 }

 const xhr = new XMLHttpRequest();
 xhr.withCredentials = true; // Essential for session cookies with raw XHR
 xhr.upload.addEventListener("progress", (e) => {
 if (e.lengthComputable) {
 setUploadProgress(Math.round((e.loaded / e.total) * 100));
 }
 });

 const response = await new Promise<any>((resolve, reject) => {
 xhr.onload = () => {
 try {
 resolve(JSON.parse(xhr.responseText));
 } catch {
 reject(new Error("Invalid response"));
 }
 };
 xhr.onerror = () => reject(new Error("Upload failed"));
 const publicApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
 const apiUrl = publicApiUrl ? `${publicApiUrl}/api/v1` : "/api/v1";
 xhr.open("POST", `${apiUrl}/mobile-scan`);
 xhr.send(formData);
 });

 if (response.scan?.id) {
 router.push(`/dashboard/mobile-scan/${response.scan.id}/scanning`);
 }
 } catch (error) {
 console.error("Failed to start scan:", error);
 } finally {
 setStarting(false);
 setUploadProgress(0);
 }
 };

 if (loading) {
 return (
 <div className="flex justify-center py-20">
 <Loader2 className="h-8 w-8 animate-spin text-teal-300" />
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-8">
 <PageIntro description="Launch security scan, pentest, or store-check workflows for APK and IPA files from one shared app-security flow." />

 {/* New scan launcher */}
 <div className="rounded-lg border border-border/40 bg-card p-6">
 <h2 className="mb-6 text-lg font-medium tracking-tight text-foreground">Launch App Security</h2>

 {/* File upload */}
 <div className="mb-5">
 <label className="mb-3 block text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 APP BINARY (APK/IPA)
 </label>
 <FileUploader
 onFileSelect={setSelectedFile}
 selectedFile={selectedFile}
 uploadProgress={starting ? uploadProgress : undefined}
 />
 </div>

 {/* Scan mode selector */}
 <div className="mb-5">
 <label className="mb-3 block text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 APP SECURITY MODE
 </label>
 <div className="grid gap-2 sm:grid-cols-3">
 {SCAN_MODES.map((mode) => (
 <SelectableModeCard
 key={mode.value}
 title={mode.label}
 description={mode.description}
 selected={scanMode === mode.value}
 onClick={() => setScanMode(mode.value)}
 badge={
 <span className={cn(
 "rounded-md px-2 py-0.5 text-[10px] font-medium uppercase tracking-widest",
 scanMode === mode.value ? mode.activeBadgeColor : mode.badgeColor,
 )}>
 {mode.badge}
 </span>
 }
 />
 ))}
 </div>
 </div>

 {/* Scope selector */}
 <MobileScopeSelector value={scope} onChange={setScope} />

 {/* Domain selector for offensive mode */}
 {scanMode === "pentest" && (
 <div className="mb-5 border-t border-white/10 pt-5">
 <label className="mb-3 block text-[0.65rem] font-semibold uppercase tracking-widest text-muted-foreground">
 TARGET API INFRASTRUCTURE
 </label>
 {domains.length === 0 ? (
 <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
 <div className="flex items-center gap-2 text-amber-900">
 <span className="text-xs font-medium uppercase tracking-widest">Scope Restriction</span>
 </div>
 <p className="mt-2 text-[0.8rem] text-amber-900/60 font-medium">
 You need a verified domain to use Pentest mode. Please verify ownership in Domains first.
 </p>
 </div>
 ) : (
 <>
 <select
 value={selectedDomain}
 onChange={(e) => setSelectedDomain(e.target.value)}
 className="w-full rounded-lg border border-border/40 bg-card px-5 py-3.5 text-sm font-medium text-foreground focus:border-teal-500/40 focus:ring-1 focus:ring-teal-500/20 outline-none transition-all"
 >
 {domains.map((d) => (
 <option key={d.id} value={d.domain}>
 {d.domain}
 </option>
 ))}
 </select>
 <p className="mt-3 text-[0.7rem] text-slate-900 font-medium uppercase tracking-widest opacity-40">
 * Dynamic analyzer will bridge API traffic through the selected domain to isolate application behavior.
 </p>
 </>
 )}
 </div>
 )}

 <button
 onClick={startScan}
 disabled={starting || !selectedFile || (scanMode === "pentest" && domains.length === 0)}
 className="mt-8 flex items-center justify-center gap-3 rounded-xl bg-foreground px-10 py-4 text-[0.95rem] font-bold text-background transition-all hover:bg-foreground/90 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
 >
 {starting ? (
 <span className="animate-pulse">ANALYZING...</span>
 ) : (
 <span>START APP SECURITY</span>
 )}
 </button>
 </div>

 {/* Previous scans */}
 {scans.length > 0 && (
 <div className="mt-10">
 <h2 className="mb-4 text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground px-1">Recent App Runs</h2>
 <div className="space-y-2">
 {scans.map((scan) => (
 <button
 key={scan.id}
 onClick={() =>
 router.push(
  scan.status === "running" || scan.status === "pending"
   ? `/dashboard/mobile-scan/${scan.id}/scanning`
   : `/dashboard/mobile-scan/${scan.id}`,
 )
 }
 className="group relative flex w-full items-center gap-6 rounded-lg border border-border bg-card px-6 py-5 text-left transition-all hover:border-teal-500/30"
 >
 <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-muted/30 font-medium text-[0.65rem] ${
 scan.platform === "android" ? "text-emerald-700" : "text-slate-700"
 }`}>
 {scan.platform === "android" ? "APK" : "IPA"}
 </div>
 <div className="min-w-0 flex-1">
 <div className={cn("truncate text-[1rem] font-medium text-foreground", !scan.app_name && "animate-pulse")}>
 {scan.app_name || scan.package_name || "Processing App..."}
 </div>
 <div className="flex items-center gap-2 text-[0.72rem] font-medium text-muted-foreground mt-0.5">
 <span className="rounded-md bg-muted px-2 py-0.5 text-[0.6rem] uppercase tracking-widest text-muted-foreground">
 {scan.scan_mode === "appstore_check"
 ? "Store Check"
 : scan.scan_mode === "offensive_pentest"
 ? "Pentest"
 : "Security Scan"}
 </span>
 <span>{new Date(scan.created_at).toLocaleDateString()}</span>
 </div>
 </div>
 <div className="flex items-center gap-3">
 {scan.severity_critical > 0 && (
 <span className="rounded-md border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-widest text-red-400">
 {scan.severity_critical} CRITICAL
 </span>
 )}
 {scan.severity_high > 0 && (
 <span className="rounded-md border border-orange-500/20 bg-orange-500/10 px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-widest text-orange-400">
 {scan.severity_high} HIGH
 </span>
 )}
 <span
 className={`rounded-md border px-2.5 py-1 text-[0.6rem] font-medium uppercase tracking-widest ${
 scan.status === "complete"
 ? "border-emerald-200 bg-emerald-50 text-emerald-700"
 : scan.status === "running"
 ? "border-blue-200 bg-blue-50 text-blue-700 animate-pulse"
 : "border-slate-200 bg-slate-50 text-slate-700"
 }`}
 >
 {scan.status}
 </span>
 </div>
 </button>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
