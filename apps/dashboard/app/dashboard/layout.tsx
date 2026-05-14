"use client";

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { RouteProgress } from "@/components/layout/route-progress";
import { Loader2 } from "lucide-react";

function AuthGate({ children }: { children: React.ReactNode }) {
 const { isAuthenticated, isLoading } = useAuth();
 const redirected = useRef(false);

 useEffect(() => {
 if (!isLoading && !isAuthenticated && !redirected.current) {
 redirected.current = true;
 const next = window.location.pathname + window.location.search;
 window.location.replace(`/login?next=${encodeURIComponent(next)}`);
 }
 }, [isLoading, isAuthenticated]);

 if (isLoading || !isAuthenticated) {
 return (
 <div className="flex min-h-screen items-center justify-center">
 <div className="dark-panel rounded-[2rem] px-8 py-6 text-center">
 <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-300" />
 <p className="mt-3 text-sm text-white/70">
 {!isLoading && !isAuthenticated
 ? "Redirecting to login…"
 : "Preparing your signal workspace"}
 </p>
 </div>
 </div>
 );
 }

 return <>{children}</>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
 const [sidebarOpen, setSidebarOpen] = useState(false);
 const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

 return (
 <AuthGate>
 <div className="dashboard-shell min-h-screen bg-transparent">
 <RouteProgress />
 <div className="flex min-h-screen items-start bg-transparent">
 <Sidebar
 open={sidebarOpen}
 collapsed={sidebarCollapsed}
 onOpenChange={setSidebarOpen}
 onCollapseChange={setSidebarCollapsed}
 />
 <div className="mx-auto min-w-0 flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
 <Header
 onMenuOpen={() => setSidebarOpen(true)}
 />
 <main className="page-fade min-w-0 overflow-x-clip pb-12 pt-4 sm:pb-14 sm:pt-5 lg:pt-7">
 <div className="mx-auto max-w-[1440px] px-0 sm:px-0">{children}</div>
 </main>
 </div>
 </div>
 </div>
 </AuthGate>
 );
}
