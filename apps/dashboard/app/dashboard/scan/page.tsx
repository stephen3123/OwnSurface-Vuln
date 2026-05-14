"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api-client";
import { revalidateAfterScan, useDomains, useRecentScans } from "@/lib/dashboard-cache";
import { ScanInput } from "@/components/scan/scan-input";
import { ScanResultSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative, truncateUrl, getSecurityGrade, getSecurityColor } from "@/lib/utils";
import { Scan, Loader2, ExternalLink, ScanSearch } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

function ScanContent() {
 const router = useRouter();
 const searchParams = useSearchParams();
 const urlParam = searchParams.get("url");

 const [scanning, setScanning] = useState(false);
 const [lastScannedDomain, setLastScannedDomain] = useState<string | null>(null);
 const recentScansResponse = useRecentScans();
 const domainsResponse = useDomains();
 const recentScans = (recentScansResponse.data || []).slice(0, 10);
 const loading = recentScansResponse.isLoading || domainsResponse.isLoading;
 const verifiedDomains = useMemo(
 () =>
 (domainsResponse.data || [])
 .filter((domain) => domain.verified)
 .map((domain) => domain.domain.toLowerCase()),
 [domainsResponse.data],
 );

 useEffect(() => {
 if (urlParam) {
 handleScan(urlParam);
 }
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [urlParam]);

 async function handleScan(url: string) {
 setScanning(true);
 try {
 const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname.toLowerCase();
 setLastScannedDomain(hostname);
 } catch {
 setLastScannedDomain(null);
 }
 const res = await api.scan(url);
 if (res.data?.hash) {
 await revalidateAfterScan(res.data.hash);
 router.push(`/dashboard/scan/${res.data.hash}`);
 } else {
 toast.error(res.error || "Scan could not be started");
 setScanning(false);
 }
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 <div className="mb-8">
 <ScanInput onScan={handleScan} loading={scanning} size="large" placeholder="https://example.com" />
 </div>

 {scanning && (
 <div className="text-center py-12">
 <Loader2 className="w-10 h-10 animate-spin text-teal-700 mx-auto mb-4" />
 <h3 className="font-semibold mb-1">Scanning...</h3>
 <p className="text-sm text-muted-foreground">Analyzing the website across 6 dimensions</p>
 </div>
 )}

 {/* Verified domain banner */}
 {!scanning && verifiedDomains.length > 0 && (
 <div className="rounded-[1.25rem] border border-teal-500/20 bg-teal-500/5 p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <p className="text-sm font-medium text-teal-800">Your verified domains</p>
 <p className="mt-0.5 text-xs text-teal-700/70">Run verified-domain web security scans without leaving the dashboard.</p>
 </div>
 <Link
 href="/dashboard/domain-scan/new/security"
 className="inline-flex items-center gap-2 rounded-full bg-teal-600 px-4 py-2 text-xs font-semibold text-white hover:bg-teal-500 transition-colors"
 >
 <ScanSearch className="h-3.5 w-3.5" />
 Web Security
 </Link>
 </div>
 </div>
 )}

 {/* Recent scans */}
 <div>
 <h2 className="dashboard-section-title mb-4">Recent scans</h2>
 {loading ? (
 <ScanResultSkeleton />
 ) : recentScans.length === 0 ? (
 <div className="text-center py-12 bg-card border border-border rounded-xl">
 <Scan className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground">No scans yet. Enter a URL above.</p>
 </div>
 ) : (
 <div className="bg-card border border-border rounded-xl divide-y divide-border">
 {recentScans.map((scan, index) => (
 <Link
 key={`${scan.hash}-${index}`}
 href={`/dashboard/scan/${scan.hash}`}
 className="flex items-center justify-between p-4 hover:bg-accent/50 transition-colors group first:rounded-t-xl last:rounded-b-xl"
 >
 <div className="flex-1 min-w-0">
 <p className="text-sm font-medium truncate group-hover:text-teal-700 transition-colors">
 {truncateUrl(scan.url, 60)}
 </p>
 <p className="text-xs text-muted-foreground mt-0.5">
 {scan.technologies.length} technologies &middot; Security{" "}
 <span className={getSecurityColor(scan.security.score)}>
 {getSecurityGrade(scan.security.score)}
 </span>{" "}
 &middot; {formatRelative(scan.scanned_at)}
 </p>
 </div>
 <ExternalLink className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ml-4" />
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}

export default function ScanPage() {
 return (
 <Suspense fallback={<div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}>
 <ScanContent />
 </Suspense>
 );
}
