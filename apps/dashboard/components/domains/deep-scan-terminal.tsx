"use client";


import { type DeepScanInfo } from "@/lib/api-client";
import { ActivityTerminal } from "@/components/shared/activity-terminal";
import { getDeepScanEntries, getDeepScanProgress, getDeepScanStats, type DeepScanPageSummary } from "@/components/domains/deep-scan-activity";

interface DeepScanTerminalProps {
 scanId: string;
 domain: string;
 scan: DeepScanInfo | null;
 layout?: "default" | "sidebar";
}

export function DeepScanTerminal({ scanId, domain, scan, layout = "default" }: DeepScanTerminalProps) {
 const status = scan?.status || "pending";
 const pagesScanned = scan?.pages_scanned || 0;
 const results = Array.isArray(scan?.results) ? (scan.results as DeepScanPageSummary[]) : [];
 const completedPages = results.filter((page) => page.status === "success");

 return (
 <ActivityTerminal
 eyebrow="Deep scan session"
 sessionLabel={`ownsurface://deep-scan/${scanId}`}
 status={status}
 progress={getDeepScanProgress(scan)}
 progressLabel={
 status === "complete"
 ? `Deep scan complete — ${pagesScanned} pages analyzed`
 : status === "failed"
 ? "Deep scan failed before completion"
 : "Crawling and analyzing verified-domain pages"
 }
 stats={getDeepScanStats(scan)}
 entries={getDeepScanEntries(scan, domain)}
 emptyMessage="Preparing deep scan session..."
 layout={layout}
 bodyAppend={
 status === "complete" && results.length > 0 ? (
 <>
 <div className="mt-4 mb-2 border-t border-white/8 pt-4 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-white/34">
 Page summary
 </div>
 {results.slice(0, 30).map((page, index) => {
 const security = page.scan_result?.security;
 const score = security?.score;
 const grade = security?.grade;
 const technologies = page.scan_result?.tech_stack || page.scan_result?.technologies || [];

 return (
 <div key={`page-${index}`} className="mb-2 text-white/58">
 <div className="flex flex-wrap items-center gap-2">
 <span className={page.status === "success" ? "text-emerald-300" : "text-red-300"}>
 {page.status === "success" ? "\u2192" : "\u2717"}
 </span>
 <span>{page.url}</span>
 {score !== undefined && (
 <span className={`${score >= 80 ? "text-emerald-300" : score >= 60 ? "text-amber-300" : "text-red-300"}`}>
 [{grade || "?"} {score}/100]
 </span>
 )}
 </div>
 {technologies.length > 0 && (
 <div className="pl-4 text-[0.74rem] text-white/34">
 {technologies.slice(0, 4).map((tech) => tech.name).join(", ")}
 </div>
 )}
 </div>
 );
 })}
 {results.length > 30 && (
 <div className="text-[0.74rem] text-white/30">
 ... and {results.length - 30} more pages in the stored result set
 </div>
 )}
 </>
 ) : null
 }
 footer={
 status === "complete" ? (
 <div className="border-t border-emerald-500/12 bg-emerald-500/4 px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-sm font-black text-white uppercase tracking-widest">✓ DEEP SCAN COMPLETE</p>
 <p className="mt-0.5 text-xs text-white/50">
 {pagesScanned} pages analyzed across {domain || "the target domain"} with {completedPages.length} successful results stored.
 </p>
 </div>
 </div>
 </div>
 ) : status === "failed" ? (
 <div className="border-t border-red-500/12 bg-red-500/4 px-5 py-4 sm:px-6">
 <div className="flex items-center gap-3">
 <div>
 <p className="text-sm font-black text-white uppercase tracking-widest">✗ DEEP SCAN FAILED</p>
 <p className="mt-0.5 text-xs text-white/50">
 The current crawl did not finish cleanly. Review the latest status and rerun if needed.
 </p>
 </div>
 </div>
 </div>
 ) : null
 }
 />
 );
}
