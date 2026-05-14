"use client";

import { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { EmptyStateCard } from "@/components/dashboard/empty-state-card";
import { HeroPanel } from "@/components/dashboard/hero-panel";
import { PageIntro } from "@/components/dashboard/page-intro";
import { TabRail } from "@/components/dashboard/tab-rail";
import { formatRelative, truncateUrl } from "@/lib/utils";
import {
 Radio,
 TrendingUp,
 Shield,
 MessageSquare,
 ExternalLink,
 Loader2,
 ArrowUpRight,
 Clock,
 Flame,
 Heart,
 RefreshCw,
 BookOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface TrendingStory {
 id: string;
 title: string;
 url: string | null;
 domain: string | null;
 source: "hackernews";
 points: number;
 comments: number;
 author: string;
 time: string;
}

interface SecurityAlert {
 id: string;
 cve_id: string;
 description: string;
 severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
 score: number;
 published: string;
 source: "nvd";
}

interface CommunityPost {
 id: string;
 title: string;
 url: string;
 source: "devto" | "reddit";
 author: string;
 reactions: number;
 comments: number;
 tags: string[];
 time: string;
 cover_image?: string;
 description?: string;
 reading_time?: number;
 author_image?: string;
}

interface TechPulseEntry {
 name: string;
 category: string;
 count: number;
 percentage: number;
}

interface RadarFeed {
 trending: TrendingStory[];
 security: SecurityAlert[];
 community: CommunityPost[];
 fetched_at: string;
}

type ActiveSection = "trending" | "security" | "community" | "techpulse";

const SECTIONS = [
 { id: "trending" as const, label: "Trending", icon: Flame },
 { id: "security" as const, label: "Security", icon: Shield },
 { id: "community" as const, label: "Community", icon: MessageSquare },
 { id: "techpulse" as const, label: "Tech Pulse", icon: TrendingUp },
];

const SEVERITY_STYLES: Record<string, { bg: string; border: string; text: string; glow: string }> = {
 CRITICAL: { bg: "bg-red-500/8", border: "border-red-500/20", text: "text-red-500", glow: "" },
 HIGH: { bg: "bg-orange-500/8", border: "border-orange-500/20", text: "text-orange-500", glow: "" },
 MEDIUM: { bg: "bg-amber-500/8", border: "border-amber-500/20", text: "text-amber-600", glow: "" },
 LOW: { bg: "bg-blue-500/8", border: "border-blue-500/20", text: "text-blue-500", glow: "" },
};

const CATEGORY_COLORS: Record<string, string> = {
 frontend: "bg-blue-500",
 backend: "bg-green-500",
 cms: "bg-teal-500",
 analytics: "bg-yellow-500",
 hosting: "bg-orange-500",
 cdn: "bg-cyan-500",
 security: "bg-red-500",
 framework: "bg-indigo-500",
 database: "bg-emerald-500",
 ecommerce: "bg-pink-500",
};

function TimeAgo({ time }: { time: string }) {
 if (!time) return null;
 return <span className="text-xs text-muted-foreground">{formatRelative(time)}</span>;
}

function FaviconImg({ domain }: { domain: string }) {
 return (
 // eslint-disable-next-line @next/next/no-img-element
 <img
 src={`https://www.google.com/s2/favicons?domain=${domain}&sz=32`}
 alt=""
 width={16}
 height={16}
 className="h-4 w-4 rounded-sm"
 loading="lazy"
 />
 );
}

export default function RadarPage() {
 const [feed, setFeed] = useState<RadarFeed | null>(null);
 const [techPulse, setTechPulse] = useState<TechPulseEntry[]>([]);
 const [loading, setLoading] = useState(true);
 const [refreshing, setRefreshing] = useState(false);
 const [activeSection, setActiveSection] = useState<ActiveSection>("trending");

 const loadFeed = useCallback(async (isRefresh = false) => {
 if (isRefresh) setRefreshing(true);
 else setLoading(true);

 try {
 const res = await fetch("/api/radar");
 if (res.ok) {
 const data: RadarFeed = await res.json();
 setFeed(data);
 }
 } catch {
 // graceful fallback
 }

 try {
 const scansRes = await api.getRecentScans();
 const scans = scansRes.data || [];
 const techCounts: Record<string, { name: string; category: string; count: number }> = {};
 for (const scan of scans) {
 if (scan.status !== "complete") continue;
 for (const tech of scan.technologies || []) {
 const key = tech.name.toLowerCase();
 if (!techCounts[key]) {
 techCounts[key] = { name: tech.name, category: tech.category, count: 0 };
 }
 techCounts[key].count++;
 }
 }
 const total = scans.filter((s) => s.status === "complete").length || 1;
 const entries = Object.values(techCounts)
 .map((t) => ({ ...t, percentage: Math.round((t.count / total) * 100) }))
 .sort((a, b) => b.count - a.count)
 .slice(0, 20);
 setTechPulse(entries);
 } catch {
 // graceful fallback
 }

 setLoading(false);
 setRefreshing(false);
 }, []);

 useEffect(() => {
 loadFeed();
 }, [loadFeed]);

 const trending = feed?.trending || [];
 const security = feed?.security || [];
 const community = feed?.community || [];

 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-6">
 {/* Header */}
 <div className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
 <PageIntro
 description="Live tech trends, security alerts, and developer community, updated every 5 minutes."
 actions={
 <>
 {feed?.fetched_at && (
 <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
 <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
 Live &middot; {formatRelative(feed.fetched_at)}
 </span>
 )}
 <button
 onClick={() => loadFeed(true)}
 disabled={refreshing}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground transition-colors hover:border-foreground/12 hover:text-foreground disabled:opacity-50"
 >
 <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
 Refresh
 </button>
 </>
 }
 />
 </div>

 {/* Section tabs */}
 <TabRail
 items={SECTIONS.map((section) => {
 const Icon = section.icon;
 const count = section.id === "trending" ? trending.length
 : section.id === "security" ? security.length
 : section.id === "community" ? community.length
 : techPulse.length;

 return {
 key: section.id,
 label: section.label,
 icon: <Icon className="h-4 w-4" />,
 badge: count > 0 ? (
 <span className={cn(
 "rounded-full px-1.5 py-0.5 text-[0.6rem] font-bold",
 activeSection === section.id ? "bg-foreground/20 text-foreground" : "bg-muted text-muted-foreground",
 )}>
 {count}
 </span>
 ) : undefined,
 };
 })}
 value={activeSection}
 onChange={setActiveSection}
 />

 {loading ? (
 <div className="flex items-center justify-center py-20">
 <div className="text-center">
 <Loader2 className="mx-auto h-8 w-8 animate-spin text-muted-foreground/30" />
 <p className="mt-3 text-sm text-muted-foreground">Loading radar feed...</p>
 </div>
 </div>
 ) : (
 <>
 {/* ====== TRENDING ====== */}
 {activeSection === "trending" && (
 <div className="space-y-4">
 {trending.length === 0 ? (
 <EmptyStateCard icon={Flame} title="No trending stories right now." body="Check back soon." />
 ) : (
 <>
 {/* Featured top story */}
{trending[0] && (
 <a
 href={trending[0].url || `https://news.ycombinator.com/item?id=${trending[0].id}`}
 target="_blank"
 rel="noopener noreferrer"
 className="group block transition-colors hover:border-teal-400/25"
 >
 <HeroPanel>
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-white/72 backdrop-blur-sm">
 <Flame className="h-3.5 w-3.5 text-orange-400" />
 Top Story
 </div>
 <div className="inline-flex items-center gap-2 rounded-full border border-teal-400/15 bg-teal-400/8 px-3 py-1.5 text-[0.68rem] font-medium text-teal-100/80">
 <span className="h-2 w-2 rounded-full bg-teal-300" />
 Hacker News
 </div>
 </div>

 <h2 className="mt-5 max-w-4xl text-[1.55rem] font-bold leading-[1.12] text-white transition-colors group-hover:text-teal-200 sm:text-[2rem]">
 {trending[0].title}
 </h2>

 <div className="mt-5 flex flex-wrap items-center gap-2.5 text-sm text-white/78">
 {trending[0].domain && (
 <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur-sm">
 <FaviconImg domain={trending[0].domain} />
 <span>{trending[0].domain}</span>
 </span>
 )}
 <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur-sm">
 <ArrowUpRight className="h-3.5 w-3.5 text-orange-300" />
 {trending[0].points} points
 </span>
 <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur-sm">
 <MessageSquare className="h-3.5 w-3.5 text-white/65" />
 {trending[0].comments} comments
 </span>
 <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 backdrop-blur-sm">
 <Clock className="h-3.5 w-3.5 text-white/65" />
 {formatRelative(trending[0].time)}
 </span>
 </div>
 </HeroPanel>
 </a>
)}

 {/* Rest of the stories */}
 <div className="grid gap-4 sm:grid-cols-2">
 {trending.slice(1).map((story, i) => (
 <a
 key={story.id}
 href={story.url || `https://news.ycombinator.com/item?id=${story.id}`}
 target="_blank"
 rel="noopener noreferrer"
 className="group flex h-full flex-col gap-4 rounded-[0.95rem] border border-border bg-card/78 p-5 transition-colors hover:border-teal-500/20 hover:bg-teal-500/[0.02]"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.7rem] bg-muted text-xs font-bold text-muted-foreground">
 {story.domain ? <FaviconImg domain={story.domain} /> : (i + 2)}
 </div>
 <div className="min-w-0">
 <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground/70">
 Trending #{i + 2}
 </p>
 {story.domain && (
 <p className="mt-1 truncate text-xs text-muted-foreground">{truncateUrl(story.domain, 26)}</p>
 )}
 </div>
 </div>
 <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground/30 transition-colors group-hover:text-teal-400" />
 </div>

 <div className="flex-1">
 <h3 className="text-[0.95rem] font-semibold leading-6 text-foreground transition-colors group-hover:text-teal-400 line-clamp-3">
 {story.title}
 </h3>
 </div>

 <div className="flex flex-wrap items-center gap-2 text-[0.72rem] text-muted-foreground">
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1">
 <ArrowUpRight className="h-3 w-3 text-orange-400" />
 {story.points} pts
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1">
 <MessageSquare className="h-3 w-3" />
 {story.comments} comments
 </span>
 <span className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-background/55 px-2.5 py-1">
 <Clock className="h-3 w-3" />
 {formatRelative(story.time)}
 </span>
 </div>
 </a>
 ))}
 </div>
 </>
 )}
 </div>
 )}

 {/* ====== SECURITY ====== */}
 {activeSection === "security" && (
 <div className="space-y-3">
 {security.length === 0 ? (
 <EmptyStateCard icon={Shield} title="No critical CVEs in the last 7 days." body="That is good news." />
 ) : (
 security.map((alert) => {
 const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.MEDIUM;
 return (
 <a
 key={alert.id}
 href={`https://nvd.nist.gov/vuln/detail/${alert.cve_id}`}
 target="_blank"
 rel="noopener noreferrer"
 className={`group block rounded-[0.95rem] border ${style.border} ${style.bg} p-5 transition-colors ${style.glow}`}
 >
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex flex-wrap items-center gap-2.5">
 <span className="font-mono text-sm font-bold text-foreground">{alert.cve_id}</span>
 <span className={`inline-flex items-center gap-1 rounded-full border ${style.border} px-2.5 py-0.5 text-[0.6rem] font-bold ${style.text}`}>
 <Shield className="h-2.5 w-2.5" />
 {alert.severity}
 </span>
 {alert.score > 0 && (
 <span className={`text-lg font-black ${style.text}`}>{alert.score.toFixed(1)}</span>
 )}
 </div>
 <p className="mt-3 text-sm leading-6 text-foreground/70">{alert.description}</p>
 <div className="mt-3">
 <TimeAgo time={alert.published} />
 </div>
 </div>
 <ExternalLink className={`h-4 w-4 shrink-0 text-muted-foreground/30 group-hover:${style.text} transition-colors`} />
 </div>
 </a>
 );
 })
 )}
 </div>
 )}

 {/* ====== COMMUNITY ====== */}
 {activeSection === "community" && (
 <div className="space-y-4">
 {community.length === 0 ? (
 <EmptyStateCard icon={MessageSquare} title="No community posts loaded." />
 ) : (
 <>
 {/* Featured posts with cover images */}
 {community.filter((p) => p.cover_image).length > 0 && (
 <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
 {community
 .filter((p) => p.cover_image)
 .slice(0, 3)
 .map((post) => (
 <a
 key={`${post.source}-${post.id}`}
 href={post.url}
 target="_blank"
 rel="noopener noreferrer"
 className="group overflow-hidden rounded-[0.95rem] border border-border bg-card/78 transition-colors hover:border-teal-500/20"
 >
 {post.cover_image && (
 <div className="relative h-36 w-full overflow-hidden bg-muted">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={post.cover_image}
 alt=""
 className="h-full w-full object-cover transition-transform group-hover:scale-105"
 loading="lazy"
 />
 <div className="absolute bottom-2 left-2">
 <span className={cn(
 "inline-flex items-center rounded-md px-2 py-0.5 text-[0.55rem] font-bold uppercase tracking-wider text-white backdrop-blur-sm",
 post.source === "devto" ? "bg-indigo-600/80" : "bg-orange-600/80",
 )}>
 {post.source === "devto" ? "DEV.TO" : "REDDIT"}
 </span>
 </div>
 </div>
 )}
 <div className="p-4">
 <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-teal-400 transition-colors line-clamp-2">
 {post.title}
 </h3>
 <div className="mt-2 flex items-center gap-2.5 text-xs text-muted-foreground">
 {post.author_image && (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={post.author_image} alt="" className="h-4 w-4 rounded-full" loading="lazy" />
 )}
 <span>{post.author}</span>
 <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{post.reactions}</span>
 {post.reading_time && <span className="flex items-center gap-0.5"><BookOpen className="h-3 w-3" />{post.reading_time} min</span>}
 </div>
 </div>
 </a>
 ))}
 </div>
 )}

 {/* Text-only posts */}
 <div className="space-y-2">
 {community
 .filter((p) => !p.cover_image || !community.filter((x) => x.cover_image).slice(0, 3).includes(p))
 .map((post) => (
 <a
 key={`${post.source}-${post.id}`}
 href={post.url}
 target="_blank"
 rel="noopener noreferrer"
 className="group flex items-start gap-3.5 rounded-[0.95rem] border border-border bg-card/78 p-4 transition-colors hover:border-teal-500/20"
 >
 <div className={cn(
 "flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.7rem] text-[0.55rem] font-bold uppercase tracking-wider",
 post.source === "devto" ? "bg-indigo-500/10 text-indigo-600" : "bg-orange-500/10 text-orange-600",
 )}>
 {post.source === "devto" ? "DEV" : "R/"}
 </div>
 <div className="flex-1 min-w-0">
 <h3 className="text-[0.82rem] font-semibold leading-snug text-foreground group-hover:text-teal-400 transition-colors line-clamp-2">
 {post.title}
 </h3>
 {post.description && (
 <p className="mt-1 text-xs leading-5 text-muted-foreground/70 line-clamp-2">{post.description}</p>
 )}
 <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[0.68rem] text-muted-foreground">
 {post.author_image && (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={post.author_image} alt="" className="h-3.5 w-3.5 rounded-full" loading="lazy" />
 )}
 <span>{post.author}</span>
 <span className="flex items-center gap-0.5"><Heart className="h-3 w-3" />{post.reactions}</span>
 <span className="flex items-center gap-0.5"><MessageSquare className="h-3 w-3" />{post.comments}</span>
 <TimeAgo time={post.time} />
 </div>
 {post.tags.length > 0 && (
 <div className="mt-1.5 flex flex-wrap gap-1">
 {post.tags.slice(0, 3).map((tag) => (
 <span key={tag} className="rounded-md bg-muted border border-border/40 px-1.5 py-0.5 text-[0.55rem] font-medium text-muted-foreground">
 {tag}
 </span>
 ))}
 </div>
 )}
 </div>
 </a>
 ))}
 </div>
 </>
 )}
 </div>
 )}

 {/* ====== TECH PULSE ====== */}
 {activeSection === "techpulse" && (
 <div className="space-y-5">
 {techPulse.length === 0 ? (
 <EmptyStateCard icon={TrendingUp} title="No technology pulse data yet." body="Scan some sites to build your tech pulse. The more you scan, the richer this gets." />
 ) : (
 <>
 {/* Top 3 as hero cards */}
 <div className="grid gap-4 sm:grid-cols-3">
 {techPulse.slice(0, 3).map((tech, i) => {
 const barColor = CATEGORY_COLORS[tech.category.toLowerCase()] || "bg-teal-500";
 const medals = ["bg-amber-400", "bg-slate-400", "bg-orange-400"];
 return (
 <div key={tech.name} className="rounded-xl border border-border/40 bg-card/50 p-5">
 <div className="flex items-center justify-between">
 <div className={`flex h-8 w-8 items-center justify-center rounded-full ${medals[i]} text-xs font-black text-white`}>
 {i + 1}
 </div>
 <span className="rounded-md bg-muted px-1.5 py-0.5 text-[0.55rem] font-medium uppercase tracking-wider text-muted-foreground">
 {tech.category}
 </span>
 </div>
 <h3 className="mt-4 text-lg font-bold">{tech.name}</h3>
 <p className="mt-1 text-xs text-muted-foreground">
 Found in {tech.count} site{tech.count !== 1 ? "s" : ""} ({tech.percentage}%)
 </p>
 <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-muted">
 <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${Math.min(tech.percentage, 100)}%` }} />
 </div>
 </div>
 );
 })}
 </div>

 {/* Rest as list */}
 {techPulse.length > 3 && (
 <div className="rounded-xl border border-border/40 bg-card/50 p-6">
 <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Full breakdown</h3>
 <div className="mt-4 space-y-2.5">
 {techPulse.slice(3).map((tech, i) => {
 const barColor = CATEGORY_COLORS[tech.category.toLowerCase()] || "bg-teal-500";
 return (
 <div key={tech.name} className="flex items-center gap-3">
 <span className="w-5 text-right text-xs font-bold text-muted-foreground/50">{i + 4}</span>
 <div className={`h-2.5 w-2.5 rounded-full ${barColor}`} />
 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium">{tech.name}</span>
 <span className="text-xs text-muted-foreground">{tech.percentage}%</span>
 </div>
 <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
 <div className={`h-full rounded-full ${barColor}`} style={{ width: `${Math.min(tech.percentage, 100)}%` }} />
 </div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 )}
 </>
 )}
 </div>
 )}
 </>
 )}
 </div>
 );
}
