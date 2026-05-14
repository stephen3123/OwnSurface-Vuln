"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Shield, Globe, Search, BarChart3, Activity } from "lucide-react";
import type { ShowcaseScan } from "@/lib/api-client";

// ─── Fallback data ───

const FALLBACK_SCANS: ShowcaseScan[] = [
 { domain: "stripe.com", url: "https://stripe.com", category: "saas", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "Next.js", category: "Framework", confidence: 0.95 }, { name: "Ruby", category: "Backend", confidence: 0.9 }, { name: "Go", category: "Backend", confidence: 0.85 }, { name: "Cloudflare", category: "CDN", confidence: 1 }], security_grade: "A+", security_score: 95, seo_score: 91, traffic_rank: 142, estimated_visits: "580000000", company_name: "Stripe", company_industry: "Financial Technology", ai_summary: "Financial infrastructure platform powering online payments for internet businesses worldwide.", scanned_at: new Date().toISOString() },
 { domain: "github.com", url: "https://github.com", category: "devtools", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "Ruby on Rails", category: "Framework", confidence: 0.95 }, { name: "Go", category: "Backend", confidence: 0.9 }, { name: "Elasticsearch", category: "Search", confidence: 0.85 }, { name: "Fastly", category: "CDN", confidence: 1 }], security_grade: "A", security_score: 90, seo_score: 88, traffic_rank: 3, estimated_visits: "2400000000", company_name: "GitHub", company_industry: "Developer Tools", ai_summary: "World's largest software development platform hosting over 200 million repositories.", scanned_at: new Date().toISOString() },
 { domain: "vercel.com", url: "https://vercel.com", category: "devtools", tech_stack: [{ name: "Next.js", category: "Framework", confidence: 1 }, { name: "React", category: "Frontend", confidence: 1 }, { name: "TypeScript", category: "Language", confidence: 0.95 }, { name: "Vercel", category: "Hosting", confidence: 1 }], security_grade: "A+", security_score: 96, seo_score: 93, traffic_rank: 1200, estimated_visits: "42000000", company_name: "Vercel", company_industry: "Cloud Platform", ai_summary: "Frontend cloud platform enabling developers to build and deploy web applications with zero configuration.", scanned_at: new Date().toISOString() },
 { domain: "notion.so", url: "https://notion.so", category: "saas", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "TypeScript", category: "Language", confidence: 0.95 }, { name: "Cloudflare", category: "CDN", confidence: 1 }, { name: "Segment", category: "Analytics", confidence: 0.9 }], security_grade: "A", security_score: 88, seo_score: 85, traffic_rank: 89, estimated_visits: "320000000", company_name: "Notion", company_industry: "Productivity", ai_summary: "All-in-one workspace combining notes, docs, databases, and project management for teams.", scanned_at: new Date().toISOString() },
 { domain: "cloudflare.com", url: "https://cloudflare.com", category: "security", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "Next.js", category: "Framework", confidence: 0.95 }, { name: "Cloudflare Workers", category: "Edge", confidence: 1 }], security_grade: "A+", security_score: 98, seo_score: 90, traffic_rank: 78, estimated_visits: "410000000", company_name: "Cloudflare", company_industry: "Cybersecurity", ai_summary: "Global cloud network providing CDN, DDoS protection, DNS, and zero-trust security services.", scanned_at: new Date().toISOString() },
 { domain: "openai.com", url: "https://openai.com", category: "ai", tech_stack: [{ name: "Next.js", category: "Framework", confidence: 1 }, { name: "React", category: "Frontend", confidence: 1 }, { name: "Python", category: "Backend", confidence: 0.9 }, { name: "Cloudflare", category: "CDN", confidence: 0.95 }], security_grade: "A", security_score: 92, seo_score: 87, traffic_rank: 25, estimated_visits: "1800000000", company_name: "OpenAI", company_industry: "Artificial Intelligence", ai_summary: "AI research company building general-purpose artificial intelligence systems.", scanned_at: new Date().toISOString() },
 { domain: "shopify.com", url: "https://shopify.com", category: "ecommerce", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "Ruby on Rails", category: "Framework", confidence: 0.95 }, { name: "Cloudflare", category: "CDN", confidence: 1 }], security_grade: "A+", security_score: 94, seo_score: 92, traffic_rank: 68, estimated_visits: "680000000", company_name: "Shopify", company_industry: "E-commerce", ai_summary: "Commerce platform powering millions of online stores worldwide.", scanned_at: new Date().toISOString() },
 { domain: "linear.app", url: "https://linear.app", category: "saas", tech_stack: [{ name: "React", category: "Frontend", confidence: 1 }, { name: "Next.js", category: "Framework", confidence: 0.95 }, { name: "TypeScript", category: "Language", confidence: 0.95 }], security_grade: "A+", security_score: 96, seo_score: 89, traffic_rank: 4500, estimated_visits: "12000000", company_name: "Linear", company_industry: "Project Management", ai_summary: "Modern project management tool built for speed and developer workflows.", scanned_at: new Date().toISOString() },
];

function formatVisits(visits: string | null): string {
 if (!visits) return "—";
 const n = parseInt(visits, 10);
 if (isNaN(n)) return visits;
 if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
 if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
 if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
 return n.toLocaleString();
}

function gradeColor(grade: string | null): string {
 if (!grade) return "text-muted-foreground";
 if (grade.startsWith("A")) return "text-emerald-600";
 if (grade === "B") return "text-amber-600";
 return "text-red-500";
}

function timeSince(dateStr: string): string {
 const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
 if (seconds < 60) return "just now";
 const minutes = Math.floor(seconds / 60);
 if (minutes < 60) return `${minutes}m ago`;
 const hours = Math.floor(minutes / 60);
 if (hours < 24) return `${hours}h ago`;
 return `${Math.floor(hours / 24)}d ago`;
}

const CYCLE_MS = 5000;

export function LiveIntelligenceBox() {
 const [scans, setScans] = useState<ShowcaseScan[]>([]);
 const [index, setIndex] = useState(0);
 const [visible, setVisible] = useState(true);
 const [paused, setPaused] = useState(false);

 useEffect(() => {
 const apiBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080") + "/api/v1";
 fetch(`${apiBase}/showcase`, { credentials: "include" })
 .then((r) => (r.ok ? r.json() : null))
 .then((data) => {
 if (Array.isArray(data) && data.length > 0) {
 setScans([...data].sort(() => Math.random() - 0.5));
 } else {
 setScans(FALLBACK_SCANS);
 }
 })
 .catch(() => setScans(FALLBACK_SCANS));
 }, []);

 const advance = useCallback(() => {
 setVisible(false);
 setTimeout(() => {
 setIndex((i) => (i + 1) % (scans.length || 1));
 setVisible(true);
 }, 400);
 }, [scans.length]);

 useEffect(() => {
 if (paused || scans.length <= 1) return;
 const t = setInterval(advance, CYCLE_MS);
 return () => clearInterval(t);
 }, [paused, advance, scans.length]);

 if (scans.length === 0) return null;
 const scan = scans[index % scans.length];

 return (
 <div
 className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-10"
 onMouseEnter={() => setPaused(true)}
 onMouseLeave={() => setPaused(false)}
 >
 {/* Minimal header */}
 <div className="flex items-center justify-between mb-4">
 <div className="flex items-center gap-2.5">
 <span className="relative flex h-2 w-2">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
 <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
 </span>
 <span className="text-[0.65rem] font-semibold uppercase tracking-[0.26em] text-teal-800/60">
 Live intelligence
 </span>
 </div>
 <div className="flex items-center gap-1">
 {scans.map((_, i) => (
 <button
 key={i}
 onClick={() => { setVisible(false); setTimeout(() => { setIndex(i); setVisible(true); }, 300); }}
 className={`h-1 rounded-full transition-all duration-300 ${
 i === index % scans.length
 ? "w-5 bg-teal-600"
 : "w-1.5 bg-black/10 hover:bg-black/20"
 }`}
 />
 ))}
 </div>
 </div>

 {/* Card — no border, no box, just content with fade */}
 <div
 className="transition-all duration-400 ease-out"
 style={{
 opacity: visible ? 1 : 0,
 transform: visible ? "translateY(0)" : "translateY(8px)",
 }}
 >
 {/* Domain row */}
 <div className="flex items-center justify-between gap-4">
 <div className="flex items-center gap-3 min-w-0">
 <Globe className="h-4 w-4 text-teal-700/50 shrink-0" />
 <span className="text-xl font-semibold tracking-[-0.03em] text-[hsl(var(--ink))] truncate">
 {scan.domain}
 </span>
 {scan.company_name && (
 <span className="hidden sm:inline text-sm text-muted-foreground/70 truncate">
 {scan.company_name}
 </span>
 )}
 </div>
 <span className="text-[0.68rem] text-muted-foreground/50 shrink-0">
 {timeSince(scan.scanned_at)}
 </span>
 </div>

 {/* Tech + metrics in one row */}
 <div className="mt-3 flex items-center gap-6 flex-wrap">
 {/* Tech chips */}
 <div className="flex items-center gap-1.5 flex-wrap">
 {scan.tech_stack.slice(0, 5).map((t) => (
 <span
 key={t.name}
 className="text-[0.7rem] font-medium text-muted-foreground/80 bg-black/[0.03] rounded-md px-2 py-0.5"
 >
 {t.name}
 </span>
 ))}
 </div>

 {/* Divider */}
 <div className="hidden sm:block h-4 w-px bg-black/8" />

 {/* Inline metrics */}
 <div className="flex items-center gap-5 text-[0.78rem]">
 {scan.security_grade && (
 <span className={`flex items-center gap-1.5 font-bold ${gradeColor(scan.security_grade)}`}>
 <Shield className="h-3.5 w-3.5" />
 {scan.security_grade}
 </span>
 )}
 {scan.seo_score != null && (
 <span className="flex items-center gap-1.5 text-muted-foreground">
 <Search className="h-3.5 w-3.5 text-teal-700/50" />
 <span className="font-semibold text-[hsl(var(--ink))]">{scan.seo_score}</span>
 <span className="text-[0.65rem] text-muted-foreground/60">/100</span>
 </span>
 )}
 {scan.traffic_rank && (
 <span className="hidden md:flex items-center gap-1.5 text-muted-foreground">
 <BarChart3 className="h-3.5 w-3.5 text-teal-700/50" />
 <span className="font-semibold text-[hsl(var(--ink))]">#{scan.traffic_rank.toLocaleString()}</span>
 </span>
 )}
 {scan.estimated_visits && (
 <span className="hidden lg:flex items-center gap-1.5 text-muted-foreground">
 <Activity className="h-3.5 w-3.5 text-teal-700/50" />
 <span className="font-semibold text-[hsl(var(--ink))]">{formatVisits(scan.estimated_visits)}</span>
 <span className="text-[0.65rem] text-muted-foreground/60">/mo</span>
 </span>
 )}
 </div>
 </div>

 {/* AI summary — one line */}
 {scan.ai_summary && (
 <p className="mt-2.5 text-[0.82rem] leading-relaxed text-muted-foreground/70 line-clamp-1">
 {scan.ai_summary}
 </p>
 )}
 </div>

 {/* Subtle separator */}
 <div className="mt-4 h-px bg-gradient-to-r from-transparent via-black/6 to-transparent" />
 </div>
 );
}
