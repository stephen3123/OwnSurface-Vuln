"use client";

import type { BulkJob } from "@/lib/api-client";
import { formatRelative, truncateUrl, getSecurityGrade, getSecurityColor } from "@/lib/utils";
import Link from "next/link";
import { Loader2, CheckCircle, XCircle, Clock } from "lucide-react";

interface BulkResultsTableProps {
 job: BulkJob;
}

function getStatusIcon(status: string) {
 switch (status) {
 case "complete":
 return <CheckCircle className="w-4 h-4 text-emerald-400" />;
 case "failed":
 return <XCircle className="w-4 h-4 text-red-400" />;
 case "running":
 return <Loader2 className="w-4 h-4 text-teal-700 animate-spin" />;
 default:
 return <Clock className="w-4 h-4 text-muted-foreground" />;
 }
}

export function BulkResultsTable({ job }: BulkResultsTableProps) {
 const progress = job.total_urls > 0 ? ((job.completed_urls + job.failed_urls) / job.total_urls) * 100 : 0;

 return (
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-3">
 {getStatusIcon(job.status)}
 <div>
 <span className="text-sm font-medium capitalize">{job.status}</span>
 <span className="text-xs text-muted-foreground ml-2">{formatRelative(job.created_at)}</span>
 </div>
 </div>
 <span className="text-sm text-muted-foreground">
 {job.completed_urls}/{job.total_urls} complete
 </span>
 </div>

 {/* Progress bar */}
 <div className="h-2 bg-background rounded-full overflow-hidden mb-4">
 <div
 className="h-full rounded-full bg-teal-500 transition-all duration-500"
 style={{ width: `${progress}%` }}
 />
 </div>

 {/* Results table */}
 {job.results && job.results.length > 0 && (
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-border text-left">
 <th className="pb-2 font-medium text-muted-foreground">URL</th>
 <th className="pb-2 font-medium text-muted-foreground">Tech</th>
 <th className="pb-2 font-medium text-muted-foreground">Security</th>
 <th className="pb-2 font-medium text-muted-foreground">SEO</th>
 <th className="pb-2 w-10" />
 </tr>
 </thead>
 <tbody>
 {job.results.map((scan) => (
 <tr key={scan.hash} className="border-b border-border/50">
 <td className="py-2.5">
 <span className="truncate block max-w-[250px]">{truncateUrl(scan.url, 40)}</span>
 </td>
 <td className="py-2.5 text-muted-foreground">{scan.technologies.length}</td>
 <td className="py-2.5">
 <span className={`font-medium ${getSecurityColor(scan.security.score)}`}>
 {getSecurityGrade(scan.security.score)}
 </span>
 </td>
 <td className="py-2.5 text-muted-foreground">{scan.seo.score}/100</td>
 <td className="py-2.5">
 <Link
 href={`/dashboard/scan/${scan.hash}`}
 className="text-xs text-teal-700 hover:text-teal-600"
 >
 View
 </Link>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 );
}
