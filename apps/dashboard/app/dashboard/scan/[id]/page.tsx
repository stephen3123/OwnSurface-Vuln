"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, type ScanResult } from "@/lib/api-client";
import { ScanResultCard } from "@/components/scan/scan-result-card";
import { ScanResultSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-boundary";
import { ScanProgressStages, type ScanStage } from "@/components/shared/scan-progress-stages";

function deriveScanStage(scan: ScanResult | null, waitingForResult: boolean): ScanStage {
 if (!scan && waitingForResult) return "connecting";
 if (!scan) return "connecting";
 if (scan.status === "pending") return "connecting";
 if (scan.status === "scanning") return "crawling";
 if (scan.status === "complete") return "complete";
 return "analyzing";
}

export default function ScanDetailPage() {
 const { id } = useParams<{ id: string }>();
 const [scan, setScan] = useState<ScanResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [waitingForResult, setWaitingForResult] = useState(false);

 useEffect(() => {
 if (!id) return;
 loadScan();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [id]);

 async function loadScan() {
 setLoading(true);
 setError("");
 const res = await api.getScan(id);
 if (res.data) {
 setWaitingForResult(false);
 // If still scanning, poll
 if (res.data.status === "pending" || res.data.status === "scanning") {
 setScan(res.data);
 setTimeout(loadScan, 2000);
 } else {
 setScan(res.data);
 }
 } else {
 const message = (res.error || "").toLowerCase();
 const shouldPoll =
 message.includes("not found") ||
 message.includes("no scan result returned");

 if (shouldPoll) {
 setWaitingForResult(true);
 setTimeout(loadScan, 2000);
 } else {
 setWaitingForResult(false);
 setError(res.error || "Failed to load scan");
 }
 }
 setLoading(false);
 }

 if (loading && !scan) {
 return (
 <div className="dashboard-page mx-auto max-w-6xl min-w-0 overflow-hidden">
 <ScanResultSkeleton />
 </div>
 );
 }

 if (error) {
 return (
 <div className="dashboard-page mx-auto max-w-6xl min-w-0 overflow-hidden">
 <ErrorState message={error} onRetry={loadScan} />
 </div>
 );
 }

 // Show progress stages for in-progress scans
 if (waitingForResult || (scan && (scan.status === "pending" || scan.status === "scanning"))) {
 const stage = deriveScanStage(scan, waitingForResult);
 const progressText = scan?.status === "scanning"
 ? `Analyzing technology, security, SEO, and ${scan.technologies?.length || 0} more dimensions...`
 : "The scan has started. Preparing intelligence report...";

 return (
 <div className="dashboard-page mx-auto max-w-6xl min-w-0 overflow-hidden">
 <ScanProgressStages
 currentStage={stage}
 progress={progressText}
 url={scan?.url}
 />
 </div>
 );
 }

 if (!scan) return null;

 return (
 <div className="dashboard-page mx-auto max-w-6xl min-w-0 overflow-hidden">
 <ScanResultCard scan={scan} />
 </div>
 );
}
