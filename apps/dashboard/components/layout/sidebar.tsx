"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DASHBOARD_NAV_GROUPS } from "@/lib/dashboard-route-metadata";
import {
 ChevronLeft,
 ChevronRight,
 X,
} from "lucide-react";

interface SidebarProps {
 open: boolean;
 collapsed: boolean;
 onOpenChange: (open: boolean) => void;
 onCollapseChange: (collapsed: boolean) => void;
}

export function Sidebar({
 open,
 collapsed,
 onOpenChange,
 onCollapseChange,
}: SidebarProps) {
 const pathname = usePathname();

 function isActive(href: string) {
 if (href === "/dashboard") return pathname === "/dashboard";
 return pathname.startsWith(href);
 }

 return (
 <>
 {open && (
 <button
 className="fixed inset-0 z-40 bg-[hsl(var(--ink))]/30 backdrop-blur-sm lg:hidden"
 onClick={() => onOpenChange(false)}
 aria-label="Close navigation"
 />
 )}

 <aside
 className={cn(
 "bg-card border-r border-border fixed inset-y-0 left-0 z-50 flex w-[min(260px,100vw)] flex-col overflow-hidden rounded-none py-3 transition-all duration-300 sm:w-[min(280px,100vw)] sm:py-3.5 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:translate-x-0",
 collapsed ? "px-3 lg:w-[80px]" : "px-3.5 lg:w-[260px]",
 open ? "translate-x-0" : "-translate-x-[115%] lg:translate-x-0"
 )}
 >
 <div
 className={cn(
 "px-1 pb-4",
 collapsed ? "flex flex-col items-center gap-3 pb-5" : "flex items-center justify-between"
 )}
 >
 <Link
 href="/dashboard"
 className={cn("flex items-center gap-2", collapsed && "justify-center")}
 aria-label="OwnSurface dashboard"
 >
 {collapsed ? (
 <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5 text-lg font-bold tracking-tight text-foreground">
 O<span className="text-teal-400">.</span>
 </span>
 ) : (
 <span className="block text-[1.55rem] font-black tracking-[-0.06em] leading-none [background-image:linear-gradient(90deg,hsl(var(--foreground))_0%,hsl(var(--foreground))_82%,rgba(94,234,212,0.92)_100%)] bg-clip-text text-transparent">
 OwnSurface
 </span>
 )}
 </Link>

 <div className={cn("flex items-center gap-2", collapsed && "flex-col")}>
 <button
 onClick={() => onCollapseChange(!collapsed)}
 className={cn(
 "hidden items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent lg:flex",
 collapsed ? "h-11 w-11 rounded-md" : "h-10 w-10"
 )}
 aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
 >
 {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
 </button>
 <button
 onClick={() => onOpenChange(false)}
 className="flex h-10 w-10 items-center justify-center rounded-md text-muted-foreground hover:bg-accent lg:hidden"
 aria-label="Close sidebar"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 </div>

 <nav className="sidebar-scrollbar flex-1 overflow-y-auto px-1 py-2">
 <div className="space-y-5">
 {DASHBOARD_NAV_GROUPS.map((group) => (
 <div key={group.label}>
 <div
 className={cn(
 "mb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70",
 collapsed ? "px-0" : "px-2"
 )}
 >
 {!collapsed ? (
 group.label
 ) : (
 <span
 className="mx-auto block h-px w-8 rounded-full bg-border"
 aria-hidden="true"
 />
 )}
 </div>
 <div className={cn("space-y-1.5", collapsed && "space-y-2")}>
 {group.items.map((item) => (
 <Link
 key={item.href}
 href={item.href}
 onClick={() => onOpenChange(false)}
 className={cn(
 "group flex items-center text-[0.98rem] font-medium transition-all",
 collapsed
 ? "mx-auto h-12 w-12 justify-center rounded-md px-0 py-0"
 : "gap-3 rounded-md px-3 py-2.5",
 isActive(item.href)
 ? "bg-accent text-foreground font-semibold"
 : "text-muted-foreground hover:bg-accent hover:text-foreground"
 )}
 title={collapsed ? item.label : undefined}
 >
 <span
 className={cn(
 "flex h-9 w-9 shrink-0 items-center justify-center rounded-md",
 collapsed && !isActive(item.href) && "bg-transparent",
 isActive(item.href) ? "bg-teal-500/10" : "bg-transparent"
 )}
 >
 <item.icon
 className={cn(
 "h-[18px] w-[18px]",
 isActive(item.href) ? "text-teal-600" : "text-muted-foreground group-hover:text-foreground"
 )}
 />
 </span>
 {!collapsed && <span>{item.label}</span>}
 </Link>
 ))}
 </div>
 </div>
 ))}
 </div>
 </nav>
 </aside>
 </>
 );
}
