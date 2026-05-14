"use client";

import { useState, useMemo } from "react";
import type { Issue } from "@/lib/issue-generator";
import { IssueSeverityBadge } from "./issue-severity-badge";
import { formatRelative, cn } from "@/lib/utils";

interface IssueListProps {
 issues: Issue[];
 onSelectIssue?: (issue: Issue) => void;
}

type SortField = "severity" | "date" | "category";

const SEVERITY_ORDER: Record<string, number> = {
 critical: 0,
 high: 1,
 medium: 2,
 low: 3,
 info: 4,
};

const STATUS_STYLES: Record<Issue["status"], string> = {
 open: "bg-red-50 text-red-800 border-red-200",
 resolved: "bg-emerald-50 text-emerald-800 border-emerald-200",
 ignored: "bg-slate-50 text-slate-800 border-slate-200",
};

export function IssueList({ issues, onSelectIssue }: IssueListProps) {
 const [sortBy, setSortBy] = useState<SortField>("severity");
 const [sortAsc, setSortAsc] = useState(false);

 const sorted = useMemo(() => {
 const copy = [...issues];
 copy.sort((a, b) => {
 let cmp = 0;
 switch (sortBy) {
 case "severity":
 cmp = (SEVERITY_ORDER[a.severity] ?? 4) - (SEVERITY_ORDER[b.severity] ?? 4);
 break;
 case "date":
 cmp = new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime();
 break;
 }
 return sortAsc ? -cmp : cmp;
 });
 return copy;
 }, [issues, sortBy, sortAsc]);

 function handleSort(field: SortField) {
 if (sortBy === field) {
 setSortAsc((prev) => !prev);
 } else {
 setSortBy(field);
 setSortAsc(false);
 }
 }

 if (issues.length === 0) {
 return (
 <div className="rounded-[1.5rem] border border-border bg-muted/10 py-16 text-center backdrop-blur-xl">
 <p className="text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">No issues matched</p>
 </div>
 );
 }

 return (
 <div className="space-y-3">
 {/* List header / Sort */}
 <div className="flex items-center justify-between px-6 pb-2">
 <div className="flex items-center gap-6">
 <button 
 onClick={() => handleSort("severity")}
 className={cn(
 "text-[0.65rem] font-medium uppercase tracking-widest transition-colors",
 sortBy === "severity" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
 )}
 >
 Severity
 </button>
 </div>
 <button 
 onClick={() => handleSort("date")}
 className={cn(
 "text-[0.65rem] font-medium uppercase tracking-widest transition-colors",
 sortBy === "date" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
 )}
 >
 Detection Date
 </button>
 </div>

 {/* Rows */}
 <div className="flex flex-col gap-3">
 {sorted.map((issue) => (
 <button
 key={issue.id}
 onClick={() => onSelectIssue?.(issue)}
 className="group relative grid grid-cols-1 md:grid-cols-[1fr_auto] items-center gap-6 rounded-[1.25rem] border border-border bg-card p-6 transition-all hover:border-teal-500/25 hover: text-left"
 >
 <div className="min-w-0 pr-4">
 <div className="flex items-center gap-3 mb-1 flex-wrap">
 <h3 className="text-[1rem] font-semibold tracking-tight text-foreground transition-colors truncate">
 {issue.title}
 </h3>
 <span className="text-[0.6rem] font-medium uppercase tracking-widest text-muted-foreground px-2 py-0.5 rounded-md bg-muted/40 border border-border">
 {issue.category}
 </span>
 </div>
 <div className="flex items-center gap-3 text-[0.72rem] text-muted-foreground">
 <span>{issue.domain}</span>
 <span className="text-muted-foreground/40">•</span>
 <span>{formatRelative(issue.detected_at)}</span>
 </div>
 </div>

 <div className="flex items-center gap-12 shrink-0 md:justify-end">
 <div className="w-20 flex justify-center">
 <IssueSeverityBadge severity={issue.severity} />
 </div>
 <div className="w-40 flex flex-col items-end gap-1">
 <div className={cn("px-4 py-1 rounded-md text-[0.6rem] font-medium uppercase tracking-widest border", STATUS_STYLES[issue.status])}>
 {issue.status}
 </div>
 <div className="text-[0.62rem] font-medium text-muted-foreground/60 uppercase tracking-widest text-right truncate w-full">
 {issue.source}
 </div>
 </div>
 </div>
 </button>
 ))}
 </div>
 </div>
 );
}
