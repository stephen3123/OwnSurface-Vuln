"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { useVerifiedDomains } from "@/hooks/use-verified-domains";
import { NoDomainsCTA } from "@/components/monitoring/domain-picker";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import {
 Activity,
 Shield,
 Gauge,
 AlertTriangle,
 ArrowRight,
 CheckCircle2,
 XCircle,
 Clock,
 Globe,
} from "lucide-react";

interface MonitoringSummary {
 uptime: { total: number; up: number; down: number };
 ssl: { total: number; healthy: number; expiring: number; expiring_soon?: number; expired?: number };
 speed: { total: number; tracked: number; good?: number; needs_improvement?: number; poor?: number };
}

interface RecentAlert {
 id: string;
 type: "uptime" | "ssl" | "speed";
 severity: "critical" | "warning" | "info";
 title: string;
 description: string;
 domain: string;
 created_at: string;
}

export default function MonitoringPage() {
 const [summary, setSummary] = useState<MonitoringSummary | null>(null);
 const [alerts, setAlerts] = useState<RecentAlert[]>([]);
 const [loading, setLoading] = useState(true);
 const { domains: verifiedDomains, loading: domainsLoading } = useVerifiedDomains();

 useEffect(() => {
 async function load() {
 const [summaryRes, alertsRes] = await Promise.all([
 api.request<MonitoringSummary>("/monitoring/summary"),
 api.request<RecentAlert[]>("/monitoring/alerts?limit=10"),
 ]);
 if (summaryRes.data) setSummary(summaryRes.data);
 setAlerts(alertsRes.data || []);
 setLoading(false);
 }
 load();
 }, []);

 const monitorCards = [
 {
 title: "Uptime Monitors",
 href: "/dashboard/monitoring/uptime",
 
 color: "text-emerald-400",
 bgColor: "bg-emerald-500/10",
 stats: summary
 ? [
 { label: "Total", value: summary.uptime.total },
 { label: "Up", value: summary.uptime.up, color: "text-emerald-400" },
 { label: "Down", value: summary.uptime.down, color: "text-red-400" },
 ]
 : [],
 },
 {
 title: "SSL Certificates",
 href: "/dashboard/monitoring/ssl",
 
 color: "text-blue-400",
 bgColor: "bg-blue-500/10",
 stats: summary
 ? [
 { label: "Total", value: summary.ssl.total },
 { label: "Expiring Soon", value: summary.ssl.expiring_soon ?? summary.ssl.expiring ?? 0, color: "text-yellow-400" },
 { label: "Expired", value: summary.ssl.expired ?? 0, color: "text-red-400" },
 ]
 : [],
 },
 {
 title: "Speed Tracking",
 href: "/dashboard/monitoring/speed",
 
 color: "text-teal-400",
 bgColor: "bg-teal-500/10",
 stats: summary
 ? [
 { label: "Total", value: summary.speed.total },
 { label: "Good", value: summary.speed.good ?? summary.speed.tracked ?? 0, color: "text-emerald-400" },
 { label: "Needs Work", value: summary.speed.needs_improvement ?? 0, color: "text-yellow-400" },
 { label: "Poor", value: summary.speed.poor ?? 0, color: "text-red-400" },
 ]
 : [],
 },
 ];

 function getAlertIcon(alert: RecentAlert) {
 switch (alert.type) {
 case "uptime":
 return alert.severity === "critical" ? XCircle : CheckCircle2;
 case "ssl":
 return Shield;
 case "speed":
 return Gauge;
 default:
 return AlertTriangle;
 }
 }

 function getAlertColor(severity: string) {
 switch (severity) {
 case "critical":
 return "text-red-400";
 case "warning":
 return "text-yellow-400";
 default:
 return "text-blue-400";
 }
 }

 const pageLoading = loading || domainsLoading;

 if (pageLoading) {
 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-4">
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 <div className="mb-10">
 <p className="max-w-2xl text-[1.05rem] leading-relaxed text-muted-foreground font-medium">
 Track uptime, SSL certificates, and site performance across your verified domains. Continuous monitoring helps ensure perfect user experiences.
 </p>
 </div>

 {/* No verified domains — show CTA */}
 {verifiedDomains.length === 0 ? (
 <NoDomainsCTA message="Verify a domain to unlock monitoring. All monitors are scoped to your verified domains for security." />
 ) : (
 <>
 {/* Verified domains summary */}
 <div className="mb-8 rounded-xl border border-border bg-card p-6 transition-colors hover:border-border/80">
 <div className="mb-4 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <h3 className="text-[0.75rem] font-semibold tracking-wider uppercase text-muted-foreground">Verified Domains Covered</h3>
 </div>
 <Link
 href="/dashboard/domains"
 className="text-xs font-medium text-teal-600 hover:text-teal-500 transition-colors"
 >
 Manage domains
 </Link>
 </div>
 <div className="flex flex-wrap gap-2.5">
 {verifiedDomains.map((d) => (
 <span
 key={d.id}
 className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/60 px-3.5 py-1.5 text-[0.85rem] font-medium text-foreground backdrop-blur-md"
 >
 <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" />
 {d.domain}
 </span>
 ))}
 </div>
 </div>

 {/* Monitor type cards */}
 <div className="mb-10 grid gap-4 grid-cols-1 md:grid-cols-3">
 {monitorCards.map((card) => (
 <Link
 key={card.href}
 href={card.href}
 className="group relative overflow-hidden rounded-xl border border-border bg-card p-7 transition-all duration-300 hover:border-border hover:bg-accent/50"
 >
            <div className="flex items-start justify-between mb-8">
              <h3 className="text-[1.1rem] font-medium tracking-tight text-foreground">{card.title}</h3>
              <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-translate group-hover:translate-x-1 group-hover:opacity-100 mt-1" />
            </div>
            <div className="flex items-center justify-between gap-4">
              {card.stats.map((stat) => (
                <div key={stat.label}>
                  <div className={`text-[1.8rem] font-medium tracking-tight leading-none ${stat.color || ""}`}>
                    {stat.value}
                  </div>
                  <div className="mt-2 text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/60">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
 </Link>
 ))}
 </div>

 {/* Recent alerts */}
 <div>
 <h2 className="mb-4 text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground">Recent Alerts</h2>
 {alerts.length === 0 ? (
 <div className="relative overflow-hidden rounded-xl border border-dashed border-border bg-background p-8 text-center">
 <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-emerald-400 opacity-80" />
 <h3 className="mb-1 text-[1.1rem] font-medium tracking-tight">All systems operational</h3>
 <p className="mx-auto max-w-sm text-sm text-muted-foreground">No recent alerts. Your monitors are currently perfectly healthy.</p>
 </div>
 ) : (
 <div className="flex flex-col gap-3">
 {alerts.map((alert) => {
 const Icon = getAlertIcon(alert);
 const color = getAlertColor(alert.severity);
 return (
 <div
 key={alert.id}
 className="group flex flex-col sm:flex-row sm:items-center gap-4 rounded-xl border border-border bg-card p-5 transition-all duration-300 hover:bg-accent/50 hover:border-border"
 >
 <div className="flex sm:w-1/3 min-w-0 items-start gap-3">
 <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/50 border border-border/50 ${color}`}>
 <Icon className="h-4 w-4" />
 </div>
 <div className="min-w-0">
 <p className="truncate text-[0.95rem] font-medium text-foreground">{alert.title}</p>
 <p className="mt-0.5 text-xs text-muted-foreground">{alert.domain}</p>
 </div>
 </div>
 <div className="sm:w-1/2 min-w-0 flex items-center">
 <p className="truncate text-[0.85rem] text-muted-foreground">{alert.description}</p>
 </div>
 <div className="sm:w-1/6 flex sm:justify-end items-center gap-1.5 text-xs text-muted-foreground">
 <Clock className="h-3 w-3" />
 {formatRelative(alert.created_at)}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 </>
 )}
 </div>
 );
}
