"use client";

import { useState, useEffect } from "react";
import { api, type BulkJob } from "@/lib/api-client";
import { CsvUploader } from "@/components/bulk/csv-uploader";
import { BulkResultsTable } from "@/components/bulk/bulk-results-table";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Layers, Loader2, Download } from "lucide-react";
import { toast } from "sonner";

export default function BulkScanPage() {
 const [urls, setUrls] = useState<string[]>([]);
 const [pastedUrls, setPastedUrls] = useState("");
 const [jobs, setJobs] = useState<BulkJob[]>([]);
 const [loading, setLoading] = useState(true);
 const [starting, setStarting] = useState(false);

 useEffect(() => {
 loadJobs();
 
 // Set up polling for running jobs
 const interval = setInterval(() => {
   const hasRunningJobs = jobs.some(job => job.status === 'running' || job.status === 'queued');
   if (hasRunningJobs) {
     loadJobs();
   }
 }, 3000); // Poll every 3 seconds

 return () => clearInterval(interval);
}, [jobs.length, jobs.some(j => j.status === 'running' || j.status === 'queued')]);

 async function loadJobs() {
 const res = await api.getBulkJobs();
 if (res.data) setJobs(res.data);
 setLoading(false);
 }

 async function handleRefresh() {
 setLoading(true);
 await loadJobs();
 }

 function handleCsvUrls(parsed: string[]) {
 setUrls(parsed);
 setPastedUrls(parsed.join("\n"));
 }

 async function handleStart() {
 const finalUrls = pastedUrls
 .split("\n")
 .map((u) => u.trim())
 .filter(Boolean)
 .map((u) => (u.startsWith("http") ? u : `https://${u}`));

 if (finalUrls.length === 0) {
 toast.error("Please enter at least one URL");
 return;
 }
 if (finalUrls.length > 500) {
 toast.error("Maximum 500 URLs per batch");
 return;
 }

 setStarting(true);
 const res = await api.createBulkScan(finalUrls);
 if (res.data) {
 toast.success(`Bulk scan started with ${finalUrls.length} URLs`);
 setUrls([]);
 setPastedUrls("");
 loadJobs();
 } else {
 toast.error(res.error || "Failed to start bulk scan");
 }
 setStarting(false);
 }

 function handleDownloadCsv(job: BulkJob) {
 if (!job.results) return;
 const header = "URL,Technologies,Security Grade,Security Score,SEO Score\n";
 const rows = job.results.map((r) => {
 const techs = r.technologies.map((t) => t.name).join("; ");
 return `"${r.url}","${techs}","${r.security.grade}",${r.security.score},${r.seo.score}`;
 });
 const csv = header + rows.join("\n");
 const blob = new Blob([csv], { type: "text/csv" });
 const url = URL.createObjectURL(blob);
 const a = document.createElement("a");
 a.href = url;
 a.download = `xrayai-bulk-${job.id}.csv`;
 a.click();
 URL.revokeObjectURL(url);
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">

 {/* Manual paste */}
 <div className="shell-panel rounded-[1.5rem] p-5 sm:p-6">
 <label className="block text-sm font-medium mb-1.5">Paste URLs (one per line)</label>
 <textarea
 value={pastedUrls}
 onChange={(e) => setPastedUrls(e.target.value)}
 placeholder={"https://example.com\nhttps://another-site.com\nhttps://third-site.com"}
 rows={6}
 className="w-full px-3 py-2.5 bg-card border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40 resize-none font-mono"
 />
 <div className="flex items-center justify-between mt-2">
 <span className="text-xs text-muted-foreground">
 {pastedUrls.split("\n").filter((u) => u.trim()).length} URLs
 </span>
 <button
 onClick={handleStart}
 disabled={starting || !pastedUrls.trim()}
 className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
 >
 {starting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers className="w-4 h-4" />}
 Start Bulk Scan
 </button>
 </div>
 </div>

 {/* Jobs */}
 <div>
 <div className="flex items-center justify-between mb-4">
 <h2 className="dashboard-section-title">Scan jobs</h2>
 <button
 onClick={handleRefresh}
 disabled={loading}
 className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
 >
 <Loader2 className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
 Refresh
 </button>
 </div>
 {loading ? (
 <div className="space-y-4">
 {Array.from({ length: 2 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : jobs.length === 0 ? (
 <div className="text-center py-12 bg-card border border-border rounded-xl">
 <Layers className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <p className="text-muted-foreground">No bulk scan jobs yet.</p>
 </div>
 ) : (
 <div className="space-y-4">
 {jobs.map((job) => (
 <div key={job.id}>
 <BulkResultsTable job={job} />
 {job.status === "complete" && job.results && (
 <div className="flex justify-end mt-2">
 <button
 onClick={() => handleDownloadCsv(job)}
 className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium"
 >
 <Download className="w-4 h-4" />
 Download CSV
 </button>
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
