"use client";

import { cn } from "@/lib/utils";

interface IssueStatsCardProps {
 label: string;
 count: number;
 color: string;
}

export function IssueStatsCard({ label, count, color }: IssueStatsCardProps) {
 return (
 <div className="card-lift bg-card/50 rounded-xl p-6 border border-border/40 flex flex-col justify-center gap-1 transition-all hover:border-border">
 <div className={cn("text-[0.62rem] font-medium uppercase tracking-[0.2em] opacity-70 mb-1", color)}>
 {label}
 </div>
 <div className="text-3xl font-semibold tracking-tighter text-foreground">
 {count}
 </div>
 </div>
 );
}
