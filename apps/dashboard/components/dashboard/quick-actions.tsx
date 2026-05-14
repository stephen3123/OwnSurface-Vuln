"use client";

import Link from "next/link";
import { DASHBOARD_QUICK_ACTIONS } from "@/lib/dashboard-route-metadata";

export function QuickActions() {
 return (
 <div className="flex flex-wrap items-center gap-3">
 {DASHBOARD_QUICK_ACTIONS.map((action) => {
 const Icon = action.icon;
 return (
 <Link
 key={action.href}
 href={action.href}
 className="group flex flex-1 items-center justify-center sm:justify-start lg:justify-center gap-3 rounded-lg border border-border bg-card px-4 py-3.5 hover:border-teal-500/30 hover:bg-accent transition-all min-w-[140px]"
 >
 <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-teal-500/10 transition-colors group-hover:bg-teal-500/15">
 <Icon className="h-4 w-4 text-teal-400" />
 </div>
 <span className="text-[0.75rem] font-bold tracking-wide text-muted-foreground group-hover:text-foreground transition-colors">
 {action.label}
 </span>
 </Link>
 );
 })}
 </div>
 );
}
