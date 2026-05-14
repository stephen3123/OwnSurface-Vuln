"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { api } from "@/lib/api-client";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import {
 Radio,
 TrendingUp,
 TrendingDown,
 Minus,
 ArrowRight,
 Flame,
 Zap,
 Globe,
 ExternalLink,
} from "lucide-react";

interface TechTrend {
 name: string;
 category: string;
 trend: "rising" | "stable" | "declining";
 adoption_count: number;
 change_7d: number;
}

interface RadarInsight {
 title: string;
 description: string;
 type: "opportunity" | "alert" | "trend";
}

interface RadarNews {
 id: number;
 title: string;
 description: string;
 url: string;
 published_timestamp: string;
 reading_time_minutes: number;
 tags: string[];
}

function getTrendIcon(trend: string) {
 switch (trend) {
 case "rising":
 return TrendingUp;
 case "declining":
 return TrendingDown;
 default:
 return Minus;
 }
}

function getTrendColor(trend: string) {
 switch (trend) {
 case "rising":
 return "text-emerald-600 bg-emerald-500/10";
 case "declining":
 return "text-red-500 bg-red-500/10";
 default:
 return "text-muted-foreground bg-slate-500/10";
 }
}

function getCategoryIcon(category: string) {
 if (category.toLowerCase().includes("framework") || category.toLowerCase().includes("frontend")) {
 return Zap;
 }
 if (category.toLowerCase().includes("analytics") || category.toLowerCase().includes("marketing")) {
 return Flame;
 }
 return Globe;
}

// Map tech names to their official icon URLs (SVG favicons / CDN logos)
const TECH_ICONS: Record<string, string> = {
 "Next.js": "https://cdn.simpleicons.org/nextdotjs/ffffff",
 "Tailwind CSS": "https://cdn.simpleicons.org/tailwindcss",
 "React": "https://cdn.simpleicons.org/react",
 "Cloudflare": "https://cdn.simpleicons.org/cloudflare",
 "Vercel": "https://cdn.simpleicons.org/vercel/ffffff",
 "Google Analytics": "https://cdn.simpleicons.org/googleanalytics",
 "WordPress": "https://cdn.simpleicons.org/wordpress",
 "Stripe": "https://cdn.simpleicons.org/stripe",
 "Vue.js": "https://cdn.simpleicons.org/vuedotjs",
 "Angular": "https://cdn.simpleicons.org/angular",
 "Shopify": "https://cdn.simpleicons.org/shopify",
 "AWS": "https://cdn.simpleicons.org/amazonaws",
 "Node.js": "https://cdn.simpleicons.org/nodedotjs",
 "Python": "https://cdn.simpleicons.org/python",
 "TypeScript": "https://cdn.simpleicons.org/typescript",
 "Docker": "https://cdn.simpleicons.org/docker",
 "GitHub": "https://cdn.simpleicons.org/github",
 "Nginx": "https://cdn.simpleicons.org/nginx",
 "jQuery": "https://cdn.simpleicons.org/jquery",
 "Bootstrap": "https://cdn.simpleicons.org/bootstrap",
 "Laravel": "https://cdn.simpleicons.org/laravel",
 "Ruby on Rails": "https://cdn.simpleicons.org/rubyonrails",
 "Gatsby": "https://cdn.simpleicons.org/gatsby",
 "Svelte": "https://cdn.simpleicons.org/svelte",
 "Nuxt.js": "https://cdn.simpleicons.org/nuxtdotjs",
 "Remix": "https://cdn.simpleicons.org/remix/ffffff",
 "Astro": "https://cdn.simpleicons.org/astro",
 "Wix": "https://cdn.simpleicons.org/wix",
 "Squarespace": "https://cdn.simpleicons.org/squarespace/ffffff",
 "Webflow": "https://cdn.simpleicons.org/webflow",
 "Plausible": "https://cdn.simpleicons.org/plausibleanalytics",
 "Fathom": "https://cdn.simpleicons.org/fathom",
 "Supabase": "https://cdn.simpleicons.org/supabase",
 "Firebase": "https://cdn.simpleicons.org/firebase",
 "MongoDB": "https://cdn.simpleicons.org/mongodb",
 "PostgreSQL": "https://cdn.simpleicons.org/postgresql",
 "Redis": "https://cdn.simpleicons.org/redis",
 "Prisma": "https://cdn.simpleicons.org/prisma",
};

function TechIcon({ name, category }: { name: string; category: string }) {
 const iconUrl = TECH_ICONS[name];
 const CatIcon = getCategoryIcon(category);

 if (iconUrl) {
 return (
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.75rem] bg-background border border-border">
 <Image src={iconUrl} alt={name} width={20} height={20} className="h-5 w-5" unoptimized />
 </div>
 );
 }

 return (
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.75rem] bg-background border border-border">
 <CatIcon className="h-4 w-4 text-muted-foreground" />
 </div>
 );
}

export function TechRadarBox() {
 const [trends, setTrends] = useState<TechTrend[]>([]);
 const [insights, setInsights] = useState<RadarInsight[]>([]);
 const [news, setNews] = useState<RadarNews[]>([]);
 const [loading, setLoading] = useState(true);

 useEffect(() => {
 async function load() {
 try {
 const [res, newsRes] = await Promise.allSettled([
 api.request<{ trends: TechTrend[]; insights: RadarInsight[] }>("/radar/trends"),
 fetch("https://dev.to/api/articles?tag=security&per_page=4")
 ]);

 if (res.status === "fulfilled" && res.value.data?.trends?.length) {
 setTrends(res.value.data.trends.slice(0, 8));
 setInsights(res.value.data.insights?.slice(0, 2) || []);
 } else {
 setTrends([]);
 setInsights([]);
 }

 if (newsRes.status === "fulfilled" && newsRes.value.ok) {
 const data = await newsRes.value.json();
 setNews(data);
 }
 } catch {
 setTrends([]);
 setInsights([]);
 } finally {
 setLoading(false);
 }
 }
 load();
 }, []);

 if (loading) {
 return (
 <div className="rounded-xl border border-border bg-card p-6">
 <CardSkeleton />
 </div>
 );
 }

 const risingTech = trends.filter((t) => t.trend === "rising");
 const otherTech = trends.filter((t) => t.trend !== "rising");

 return (
 <div className="rounded-xl border border-border bg-card p-6 h-full flex flex-col">
 <div className="dashboard-toolbar">
 <div className="flex items-center gap-3">
 
 <div>
 <div className="section-kicker">Tech Radar</div>
 <h3 className="mt-1 text-lg font-bold text-foreground">Trending technologies</h3>
 </div>
 </div>
 <Link
 href="/dashboard/radar"
 className="inline-flex items-center gap-1 text-sm font-semibold text-teal-400 hover:text-teal-300 transition-colors"
 >
 Full radar
 <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>

 {trends.length === 0 ? (
 <div className="mt-5 space-y-4">
 <div className="mb-2 flex items-center gap-2">
 <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
 Latest Security Intel
 </span>
 </div>

 {news.length > 0 ? (
 <div className="grid gap-3">
 {news.map((item) => (
 <a
 key={item.id}
 href={item.url}
 target="_blank"
 rel="noopener noreferrer"
 className="group flex flex-col gap-1.5 rounded-lg border border-border bg-background px-4 py-4 transition-colors hover:border-teal-500/25 hover:bg-accent"
 >
 <div className="flex items-start justify-between gap-3">
 <h4 className="text-sm font-semibold leading-tight text-foreground transition-colors group-hover:text-teal-400">
 {item.title}
 </h4>
 <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-40 transition-opacity group-hover:opacity-100" />
 </div>
 <p className="line-clamp-2 text-xs leading-relaxed text-muted-foreground">
 {item.description}
 </p>
 <div className="mt-1 flex items-center gap-2 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/70">
 <span>{new Date(item.published_timestamp).toLocaleDateString()}</span>
 <span>•</span>
 <span>{item.reading_time_minutes} min read</span>
 </div>
 </a>
 ))}
 </div>
 ) : (
 <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border/80 bg-background py-10 text-center">
 <Radio className="mb-3 h-10 w-10 text-muted-foreground/40" />
 <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Insufficient Data</h4>
 <p className="mt-2 max-w-[220px] text-xs leading-5 text-muted-foreground">
 Run network scans to automatically populate the ecosystem radar with technology trends.
 </p>
 </div>
 )}
 </div>
 ) : (
 <>
 {/* Rising technologies */}
 <div className="mt-5">
 <div className="mb-3 flex items-center gap-2">
 <span className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
 Rising this week
 </span>
 </div>
 <div className="grid gap-2">
 {risingTech.slice(0, 4).map((tech) => {
 const TrendIcon = getTrendIcon(tech.trend);
 const trendColor = getTrendColor(tech.trend);
 return (
 <div
 key={tech.name}
 className="flex items-center gap-3 rounded-md border border-border bg-background px-4 py-3 transition-colors hover:border-teal-500/15 hover:bg-accent"
 >
 <TechIcon name={tech.name} category={tech.category} />
 <div className="min-w-0 flex-1">
 <p className="truncate text-sm font-semibold text-foreground">{tech.name}</p>
 <p className="truncate text-[0.65rem] text-muted-foreground">{tech.category}</p>
 </div>
 <div className="flex items-center gap-1.5 shrink-0">
 <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${trendColor}`}>
 <TrendIcon className="h-3 w-3" />
 {tech.change_7d > 0 ? "+" : ""}
 {tech.change_7d}%
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Other notable tech */}
 {otherTech.length > 0 && (
 <div className="mt-4">
 <div className="flex flex-wrap gap-2">
 {otherTech.slice(0, 4).map((tech) => {
 const TrendIcon = getTrendIcon(tech.trend);
 const trendColor = getTrendColor(tech.trend);
 return (
 <span
 key={tech.name}
 className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1.5 text-xs"
 >
 <span className="font-semibold text-foreground">{tech.name}</span>
 <span className={`flex items-center gap-0.5 ${trendColor.split(" ")[0]}`}>
 <TrendIcon className="h-3 w-3" />
 {tech.change_7d > 0 ? "+" : ""}
 {tech.change_7d}%
 </span>
 </span>
 );
 })}
 </div>
 </div>
 )}

 {/* Insights */}
 {insights.length > 0 && (
 <div className="mt-5 space-y-2">
 <div className="mb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
 Market signals
 </div>
 {insights.map((insight, idx) => (
 <div
 key={idx}
 className={`rounded-md border px-4 py-3 ${
 insight.type === "alert"
 ? "border-amber-500/15 bg-amber-500/[0.04]"
 : "border-emerald-500/15 bg-emerald-500/[0.04]"
 }`}
 >
 <p className="text-sm font-semibold text-foreground">{insight.title}</p>
 <p className="mt-1 text-xs leading-5 text-muted-foreground">{insight.description}</p>
 </div>
 ))}
 </div>
 )}
 </>
 )}
 </div>
 );
}
