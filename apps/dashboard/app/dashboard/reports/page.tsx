"use client";

import { useState } from "react";
import { api, type Report } from "@/lib/api-client";
import { revalidateReportCaches, useReports } from "@/lib/dashboard-cache";
import { CopyButton } from "@/components/shared/copy-button";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatDate, truncateUrl } from "@/lib/utils";
import { FileText, Globe, Lock, Trash2, ExternalLink, ScanSearch, Plus } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

export default function ReportsPage() {
 const { data: reports = [], isLoading: loading, mutate } = useReports();

 async function handleToggleVisibility(report: Report) {
 const res = await api.toggleReportVisibility(report.id, !report.is_public);
 if (res.error) {
 toast.error("Toggling visibility is not supported yet");
 return;
 }
 if (res.data) {
 await mutate(
 (prev = []) => prev.map((item) => (item.id === report.id ? { ...item, is_public: !item.is_public } : item)),
 { revalidate: false },
 );
 await revalidateReportCaches();
 toast.success(report.is_public ? "Report set to private" : "Report set to public");
 }
 }

 async function handleDelete(id: string) {
 if (!confirm("Are you sure you want to delete this report?")) return;
 const res = await api.deleteReport(id);
 if (res.error) {
 toast.error(res.error || "Failed to delete");
 return;
 }
 await mutate((prev = []) => prev.filter((report) => report.id !== id), { revalidate: false });
 await revalidateReportCaches();
 toast.success("Report deleted");
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 {loading ? (
 <div className="space-y-3">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : reports.length === 0 ? (
 <div className="dashboard-empty">
 <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">No reports yet</h3>
 <p className="text-sm text-muted-foreground mb-4">
 Scan a website and save the result as a report to share with your team.
 </p>
 <Link
 href="/dashboard/scan"
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium transition-colors"
 >
 <ScanSearch className="w-4 h-4" />
 Scan a website
 </Link>
 </div>
 ) : (
 <div className="shell-panel overflow-hidden rounded-[1.5rem] divide-y divide-border">
 {reports.map((report) => {
 const shareUrl = `${typeof window !== "undefined" ? window.location.origin : ""}/report/${report.slug}`;
 return (
 <div key={report.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <Link
 href={`/dashboard/scan/${report.scan_hash}`}
 className="text-sm font-medium hover:text-teal-700 truncate"
 >
 {truncateUrl(report.url, 50)}
 </Link>
 {report.is_public ? (
 <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
 ) : (
 <Lock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
 )}
 </div>
 <p className="text-xs text-muted-foreground mt-0.5">
 Created {formatDate(report.created_at)}
 </p>
 </div>
 <div className="flex w-full flex-wrap items-center justify-end gap-1.5 sm:w-auto">
 {report.is_public && <CopyButton value={shareUrl} variant="button" label="Copy Link" />}
 <button
 onClick={() => handleToggleVisibility(report)}
 className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-xs"
 title={report.is_public ? "Make private" : "Make public"}
 >
 {report.is_public ? (
 <Lock className="w-4 h-4" />
 ) : (
 <Globe className="w-4 h-4" />
 )}
 </button>
 {report.is_public && (
 <a
 href={shareUrl}
 target="_blank"
 rel="noopener noreferrer"
 className="p-2 rounded-lg hover:bg-accent text-muted-foreground"
 >
 <ExternalLink className="w-4 h-4" />
 </a>
 )}
 <button
 onClick={() => handleDelete(report.id)}
 className="p-2 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
