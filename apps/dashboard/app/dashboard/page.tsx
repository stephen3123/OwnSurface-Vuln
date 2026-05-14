"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api-client";
import { revalidateAfterScan, useDashboardHomeData } from "@/lib/dashboard-cache";
import { ScanInput } from "@/components/scan/scan-input";
import { MetricCard } from "@/components/dashboard/metric-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { OnboardingGuide } from "@/components/dashboard/onboarding-guide";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { TechRadarBox } from "@/components/dashboard/tech-radar-box";
import { formatNumber, formatRelative, getSecurityColor, getSecurityGrade, truncateUrl } from "@/lib/utils";
import {
 AlertTriangle,
 ArrowRight,
 Bell,
 Eye,
 FolderOpen,
 Globe,
 ScanSearch,
 ShieldAlert,
 TrendingUp,
 Zap,
} from "lucide-react";

type AttentionItem = {
 id: string;
 title: string;
 body: string;
 meta: string;
 href: string;
 badge: string;
 icon: typeof Bell;
};

export default function DashboardHome() {
 const router = useRouter();
 const [scanning, setScanning] = useState(false);
 const { data: homeData, isLoading: loading } = useDashboardHomeData();

 const plan = homeData?.plan || null;
 const safeRecentScans = Array.isArray(homeData?.recentScans) ? homeData.recentScans : [];
 const uniqueRecentScans = useMemo(
  () => {
   const seen = new Set<string>();

   return safeRecentScans.filter((scan, index) => {
    const key = scan.scan_id || scan.hash || `${scan.url}-${scan.scanned_at}-${index}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
   });
  },
  [safeRecentScans],
 );
 const safeWatchlists = Array.isArray(homeData?.watchlists) ? homeData.watchlists : [];
 const safeWatchlistChanges = Array.isArray(homeData?.watchlistChanges) ? homeData.watchlistChanges : [];
 const safeNotifications = Array.isArray(homeData?.notifications) ? homeData.notifications : [];
 const safeReports = Array.isArray(homeData?.reports) ? homeData.reports : [];
 const safeDomains = Array.isArray(homeData?.domains) ? homeData.domains : [];

 async function handleScan(url: string) {
 setScanning(true);
 const res = await api.scan(url);
 if (res.data?.hash) {
 await revalidateAfterScan(res.data.hash);
 router.push(`/dashboard/scan/${res.data.hash}`);
 } else {
 toast.error(res.error || "Scan could not be started");
 }
 setScanning(false);
 }

 const verifiedDomains = safeDomains.filter((domain) => domain.verified);
 const unreadNotifications = safeNotifications.filter((notification) => !notification.read);

 // Unified activity feed — merge notifications, watchlist changes, and low-score scans
 const activityItems: AttentionItem[] = [
 ...unreadNotifications.slice(0, 3).map((notification) => ({
 id: notification.id,
 title: notification.title,
 body: notification.body || "Review this workspace notification.",
 meta: formatRelative(notification.created_at),
 href: notification.link || "/dashboard/notifications",
 badge: notification.type,
 icon: notification.type === "system" ? ShieldAlert : Bell,
 })),
 ...safeWatchlistChanges.slice(0, 2).map((change) => ({
 id: change.id,
 title: change.watchlist_name,
 body: change.description,
 meta: formatRelative(change.detected_at),
 href: `/dashboard/watchlist/${change.id}`,
 badge: change.change_type.replace(/_/g, " "),
 icon: AlertTriangle,
 })),
 ...uniqueRecentScans
 .filter((scan) => scan.security.score < 60)
 .slice(0, 2)
 .map((scan, idx) => ({
 id: `${scan.hash}-${idx}`,
 title: truncateUrl(scan.url, 42),
 body: `Security posture is ${getSecurityGrade(scan.security.score)} — needs attention.`,
 meta: formatRelative(scan.scanned_at),
 href: `/dashboard/scan/${scan.hash}`,
 badge: "review",
 icon: ShieldAlert,
 })),
 ].slice(0, 5);

 // Onboarding state
 const hasScans = uniqueRecentScans.length > 0;
 const hasVerifiedDomains = verifiedDomains.length > 0;
 const hasWatchlists = safeWatchlists.length > 0;
 const hasDeepScans = false; // Would need API check for this

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 {/* Onboarding Guide — only shows for new users */}
 {!loading && (
 <OnboardingGuide
 hasScans={hasScans}
 hasVerifiedDomains={hasVerifiedDomains}
 hasWatchlists={hasWatchlists}
 hasDeepScans={hasDeepScans}
 />
 )}

 {/* Hero Header & Stats Grid */}
 <div className="grid gap-6">
 <div>
 <h2 className="text-2xl font-bold tracking-tight text-foreground">
 Security Command Center
 </h2>
 <p className="mt-1 text-sm text-muted-foreground">
 Run Quick Scan, Web Security, App Security, GEO Intelligence, and live radar from one place.
 </p>
 </div>

 {/* Scan Input as Command Box */}
 <div className="rounded-xl border border-border bg-card p-6">
 <ScanInput
 onScan={handleScan}
 loading={scanning}
 size="large"
 placeholder="Scan domain, competitor homepage, pricing page, docs portal, or owned property"
 />
 </div>

 {/* Flat Stats Grid */}
 {!loading && (
 <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
 <MetricCard
 label="Scans today"
 value={formatNumber(plan?.scans_today || 0)}
 sub={plan?.scans_limit === -1 ? "Unlimited" : `of ${plan?.scans_limit ?? 0} total`}
 className="card-lift border-border bg-card px-5 py-4"
 />
 <MetricCard
 label="Watchlists"
 value={String(safeWatchlists.length)}
 sub="active monitors"
 className="card-lift border-border bg-card px-5 py-4"
 />
 <MetricCard
 label="Verified Domains"
 value={String(verifiedDomains.length)}
 sub="monitored assets"
 className="card-lift border-border bg-card px-5 py-4"
 />
 <MetricCard
 label="Unread Alerts"
 value={String(unreadNotifications.length)}
 sub="require attention"
 className="card-lift border-border bg-card px-5 py-4"
 />
 </div>
 )}
 </div>

 {/* Quick Actions Row */}
 <QuickActions />

 {/* Main Grid: Telemetry & Feeds */}
 <div className="grid items-stretch gap-6 lg:grid-cols-[1.2fr_0.8fr]">
 
 {/* Left Column: Combined Activity & Intel */}
 <div className="flex flex-col gap-6">
 {/* Unified Activity Feed */}
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="dashboard-toolbar">
 <div>
 <h3 className="text-lg font-bold uppercase tracking-tight text-foreground">Activity & Attention</h3>
 <p className="text-xs text-muted-foreground font-medium">Notifications and items that need review</p>
 </div>
 <Link href="/dashboard/notifications" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors">
 All alerts
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>

 <div className="mt-5 space-y-2">
 {loading ? (
 <CardSkeleton />
 ) : activityItems.length === 0 ? (
 <div className="rounded-lg border border-border bg-background p-6 text-center text-sm text-muted-foreground">
 <Bell className="mx-auto mb-3 h-8 w-8 text-muted-foreground/30" />
 <p className="font-medium text-foreground">All clear</p>
 </div>
 ) : (
 <div className="flex flex-col gap-2">
 {activityItems.slice(0, 3).map((item) => (
 <Link
 key={item.id}
 href={item.href}
 className="flex items-start gap-4 rounded-lg border border-border bg-background px-4 py-4 transition-all hover:bg-accent hover:border-teal-500/25"
 >
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-orange-500/10 text-orange-500">
 <item.icon className="h-4 w-4" />
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-sm font-bold text-foreground truncate">{item.title}</p>
 <p className="mt-1 text-[0.8rem] leading-5 text-muted-foreground line-clamp-1">{item.body}</p>
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Recent Scans */}
 <div className="rounded-xl border border-border bg-card p-6 flex flex-col flex-1">
 <div className="dashboard-toolbar">
 <div>
 <div className="section-kicker">Recent scans</div>
 <h3 className="mt-3 text-[2.2rem] font-black tracking-tighter">Intelligence</h3>
 </div>
 <Link href="/dashboard/history" className="inline-flex items-center gap-1 text-sm font-semibold text-teal-400 hover:text-teal-300">
 View history
 </Link>
 </div>

 {loading ? (
 <div className="mt-6 flex-1"><CardSkeleton /></div>
 ) : uniqueRecentScans.length === 0 ? (
 <div className="mt-6 flex-1 flex flex-col justify-center items-center p-8 border border-dashed border-border rounded-xl">
 <ScanSearch className="h-8 w-8 text-muted-foreground/40 mb-2" />
 <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Awaiting Intel</p>
 </div>
 ) : (
 <div className="mt-6 space-y-2 flex-1">
 {uniqueRecentScans.slice(0, 4).map((scan) => (
 <Link
 key={scan.scan_id || scan.hash || `${scan.url}-${scan.scanned_at}`}
 href={`/dashboard/scan/${scan.hash}`}
 className="group flex items-center justify-between rounded-lg border border-border bg-background px-4 py-4 transition-all hover:bg-accent hover:border-teal-500/25"
 >
 <div className="min-w-0 flex-1 pr-4">
 <p className="truncate text-sm font-bold text-foreground transition-colors group-hover:text-teal-400">{truncateUrl(scan.url, 48)}</p>
 <p className="mt-1 text-[0.65rem] font-bold text-muted-foreground opacity-60 uppercase">{formatRelative(scan.scanned_at)}</p>
 </div>
 <div className={`text-sm font-black ${getSecurityColor(scan.security.score)}`}>
 {getSecurityGrade(scan.security.score)}
 </div>
 </Link>
 ))}
 </div>
 )}
 </div>
 </div>

 {/* Right Column: Tech Radar */}
 <div className="h-full flex flex-col">
 <TechRadarBox />
 </div>
 </div>
 </div>
 );
}
