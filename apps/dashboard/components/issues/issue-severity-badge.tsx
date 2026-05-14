"use client";

import type { Issue } from "@/lib/issue-generator";
import { cn } from "@/lib/utils";

const SEVERITY_STYLES: Record<Issue["severity"], string> = {
 critical: "bg-red-50 text-red-700 border-red-200",
 high: "bg-orange-50 text-orange-700 border-orange-200",
 medium: "bg-amber-50 text-amber-700 border-amber-200",
 low: "bg-emerald-50 text-emerald-700 border-emerald-200",
 info: "bg-slate-50 text-slate-700 border-slate-200",
};

interface IssueSeverityBadgeProps {
 severity: Issue["severity"];
 size?: "sm" | "md";
 hideLabel?: boolean;
}

export function IssueSeverityBadge({ severity, size = "sm" }: IssueSeverityBadgeProps) {
 return (
 <span
 className={cn(
 "inline-flex items-center rounded-md border transition-all font-medium uppercase tracking-widest px-2.5 py-1 text-[0.6rem]",
 SEVERITY_STYLES[severity]
 )}
 >
 {severity}
 </span>
 );
}
