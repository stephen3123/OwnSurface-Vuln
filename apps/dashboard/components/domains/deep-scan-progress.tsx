"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { api } from "@/lib/api-client";
import { Loader2, CheckCircle2, Scan, Globe } from "lucide-react";

interface DeepScanProgressProps {
 pagesFound: number;
 pagesScanned: number;
 currentUrl: string | null;
 domainId: string;
 onComplete: () => void;
}

interface ScanStatus {
 status: "scanning" | "complete" | "error";
 pages_found: number;
 pages_scanned: number;
 current_url: string | null;
}

export function DeepScanProgress({
 pagesFound: initialFound,
 pagesScanned: initialScanned,
 currentUrl: initialUrl,
 domainId,
 onComplete,
}: DeepScanProgressProps) {
 const [found, setFound] = useState(initialFound);
 const [scanned, setScanned] = useState(initialScanned);
 const [currentUrl, setCurrentUrl] = useState(initialUrl);
 const [status, setStatus] = useState<"scanning" | "complete" | "error">("scanning");
 const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
 const onCompleteRef = useRef(onComplete);
 onCompleteRef.current = onComplete;

 const stableOnComplete = useCallback(() => {
 onCompleteRef.current();
 }, []);

 useEffect(() => {
 intervalRef.current = setInterval(async () => {
 const res = await api.request<ScanStatus>(`/domains/${domainId}/deep-scan/status`);
 if (res.data) {
 setFound(res.data.pages_found);
 setScanned(res.data.pages_scanned);
 setCurrentUrl(res.data.current_url);
 setStatus(res.data.status);

 if (res.data.status === "complete" || res.data.status === "error") {
 if (intervalRef.current) clearInterval(intervalRef.current);
 stableOnComplete();
 }
 }
 }, 3000);

 return () => {
 if (intervalRef.current) clearInterval(intervalRef.current);
 };
 }, [domainId, stableOnComplete]);

 // Use pages_found as the target (real discovered count), not max_pages
 const effectiveTarget = found > 0 ? found : Math.max(scanned, 1);
 const percentage = effectiveTarget > 0 ? Math.min(100, Math.round((scanned / effectiveTarget) * 100)) : 0;

 if (status === "complete") {
 return (
 <div className="bg-card border border-emerald-500/20 rounded-xl p-5 mb-6">
 <div className="flex items-center gap-3">
 <CheckCircle2 className="w-6 h-6 text-emerald-400" />
 <div>
 <h3 className="font-semibold text-emerald-400">Scan Complete</h3>
 <p className="text-sm text-muted-foreground">
 Successfully scanned {scanned} of {found} discovered pages.
 </p>
 </div>
 </div>
 </div>
 );
 }

 return (
 <div className="bg-card border border-border rounded-xl p-5 mb-6">
 <div className="flex items-center gap-3 mb-4">
 <div className="relative flex h-10 w-10 items-center justify-center">
 <Scan className="w-5 h-5 text-teal-400 animate-pulse" />
 <div className="absolute inset-0 rounded-full border-2 border-teal-400/30 animate-ping" />
 </div>
 <div>
 <h3 className="font-semibold">Deep Scan in Progress</h3>
 <p className="text-sm text-muted-foreground">
 Crawling and analyzing {found > 0 ? `${found} discovered` : ""} pages
 </p>
 </div>
 </div>

 {/* Progress bar */}
 <div className="mb-3">
 <div className="flex items-center justify-between text-sm mb-1.5">
 <span className="text-muted-foreground">
 {scanned} / {effectiveTarget} pages scanned
 </span>
 <span className="font-medium">{percentage}%</span>
 </div>
 <div className="h-2 bg-secondary rounded-full overflow-hidden">
 <div
 className="h-full bg-teal-500 rounded-full transition-all duration-500 ease-out"
 style={{ width: `${percentage}%` }}
 />
 </div>
 </div>

 {/* Discovered endpoints count */}
 {found > 0 && (
 <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
 <Globe className="w-3 h-3 shrink-0" />
 <span>{found} endpoints discovered on attack surface</span>
 </div>
 )}

 {/* Current URL */}
 {currentUrl && (
 <div className="flex items-center gap-2 text-xs text-muted-foreground">
 <Loader2 className="w-3 h-3 animate-spin shrink-0" />
 <span className="truncate font-mono">{currentUrl}</span>
 </div>
 )}
 </div>
 );
}
