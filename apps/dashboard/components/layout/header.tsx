"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { getDashboardTitle } from "@/lib/dashboard-route-metadata";
import { GlobalSearchPanel } from "@/components/layout/global-search-panel";
import { NotificationDropdown } from "@/components/layout/notification-dropdown";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { GitCompareArrows, LogOut, Menu, Settings, CreditCard } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface HeaderProps {
 onMenuOpen: () => void;
}

export function Header({ onMenuOpen }: HeaderProps) {
 const pathname = usePathname();
 const router = useRouter();
 const { user, logout } = useAuth();
 const [menuOpen, setMenuOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);
 const title = getDashboardTitle(pathname);

 useEffect(() => {
 function handleClick(e: MouseEvent) {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 setMenuOpen(false);
 }
 }
 document.addEventListener("mousedown", handleClick);
 return () => document.removeEventListener("mousedown", handleClick);
 }, []);

 return (
 <header className="relative z-40">
 {/* Main header bar */}
 <div className="rounded-xl border border-border bg-card px-3 py-3 sm:px-5 sm:py-3.5">
 <div className="flex items-center justify-between gap-3 sm:gap-4">
 <div className="flex min-w-0 flex-1 items-start gap-3 overflow-hidden">
 <button
 onClick={onMenuOpen}
 className="mt-1 flex h-10 w-10 items-center justify-center rounded-md border border-border bg-transparent hover:bg-accent text-foreground lg:hidden"
 >
 <Menu className="h-5 w-5" />
 </button>

 <div className="min-w-0 flex-1 overflow-hidden">
 <h1 className="truncate text-[1.35rem] font-bold leading-none text-foreground sm:text-[1.95rem]">{title}</h1>
 </div>
 </div>

 <div className="flex items-center gap-2 self-stretch sm:gap-2.5">
 <GlobalSearchPanel />

 <Link
 href="/dashboard/domains/compare"
 className="hidden h-10 items-center gap-2 rounded-md border border-border bg-transparent hover:bg-accent px-3.5 text-sm font-semibold text-foreground lg:flex"
 >
 <GitCompareArrows className="h-4 w-4" />
 Compare
 </Link>

 <NotificationDropdown />

 <div className="relative" ref={menuRef}>
 <button
 onClick={() => setMenuOpen(!menuOpen)}
 className="flex items-center gap-2 rounded-md border border-border bg-transparent px-2.5 py-2 hover:bg-accent sm:gap-3 sm:px-3"
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={`https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(user?.email || user?.name || "user")}`}
 alt={user?.name || "User"}
 className="h-9 w-9 rounded-md"
 />
 <div className="hidden text-left sm:block">
 <p className="max-w-40 truncate text-[0.95rem] font-semibold leading-5 text-foreground">{user?.name}</p>
 <p className="max-w-40 truncate text-xs leading-4 text-muted-foreground">{user?.email}</p>
 </div>
 </button>

 {menuOpen && (
 <div className="absolute right-0 top-full z-50 mt-3 w-60 rounded-xl border border-border bg-card p-2 ">
 <div className="border-b border-border px-3 pb-3 pt-2">
 <p className="truncate text-sm font-semibold">{user?.name}</p>
 <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
 </div>
 <button
 onClick={() => {
 setMenuOpen(false);
 router.push("/dashboard/settings");
 }}
 className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
 >
 <Settings className="h-4 w-4" />
 Settings
 </button>
 <button
 onClick={() => {
 setMenuOpen(false);
 router.push("/dashboard/billing");
 }}
 className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-muted-foreground hover:bg-accent hover:text-foreground"
 >
 <CreditCard className="h-4 w-4" />
 Billing & plans
 </button>
 <button
 onClick={async () => {
 setMenuOpen(false);
 await logout();
 window.location.replace("/login");
 }}
 className="mt-1 flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-sm text-red-500 hover:bg-red-500/8"
 >
 <LogOut className="h-4 w-4" />
 Sign Out
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Breadcrumbs bar */}
 <div className="mt-2 px-1 sm:px-2">
 <Breadcrumbs />
 </div>
 </header>
 );
}
