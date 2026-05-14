"use client";

import type { ScanResult } from "@/lib/api-client";
import { getSecurityGrade, getSecurityColor, truncateUrl } from "@/lib/utils";
import { Trophy, Minus } from "lucide-react";

interface ComparisonTableProps {
 siteA: ScanResult;
 siteB: ScanResult;
}

interface ComparisonRow {
 label: string;
 valueA: string | number;
 valueB: string | number;
 rawA: number;
 rawB: number;
 higherIsBetter: boolean;
 format?: "score" | "count" | "text" | "boolean";
}

function getWinner(rawA: number, rawB: number, higherIsBetter: boolean): "a" | "b" | "tie" {
 if (rawA === rawB) return "tie";
 if (higherIsBetter) return rawA > rawB ? "a" : "b";
 return rawA < rawB ? "a" : "b";
}

function getCellHighlight(winner: "a" | "b" | "tie", side: "a" | "b") {
 if (winner === "tie") return "";
 if (winner === side) return "bg-emerald-500/10 text-emerald-400";
 return "bg-red-500/5 text-red-400/80";
}

export function ComparisonTable({ siteA, siteB }: ComparisonTableProps) {
 const rows: ComparisonRow[] = [
 {
 label: "Security Score",
 valueA: `${siteA.security.score}/100 (${getSecurityGrade(siteA.security.score)})`,
 valueB: `${siteB.security.score}/100 (${getSecurityGrade(siteB.security.score)})`,
 rawA: siteA.security.score,
 rawB: siteB.security.score,
 higherIsBetter: true,
 },
 {
 label: "SEO Score",
 valueA: `${siteA.seo.score}/100`,
 valueB: `${siteB.seo.score}/100`,
 rawA: siteA.seo.score,
 rawB: siteB.seo.score,
 higherIsBetter: true,
 },
 {
 label: "Security Headers",
 valueA: `${(siteA.security?.headers || []).filter((h: any) => h.present).length}/${(siteA.security?.headers || []).length}`,
 valueB: `${(siteB.security?.headers || []).filter((h: any) => h.present).length}/${(siteB.security?.headers || []).length}`,
 rawA: (siteA.security?.headers || []).filter((h: any) => h.present).length,
 rawB: (siteB.security?.headers || []).filter((h: any) => h.present).length,
 higherIsBetter: true,
 },
 {
 label: "Security Issues",
 valueA: `${(siteA.security?.issues || []).length}`,
 valueB: `${(siteB.security?.issues || []).length}`,
 rawA: (siteA.security?.issues || []).length,
 rawB: (siteB.security?.issues || []).length,
 higherIsBetter: false,
 },
 {
 label: "Technologies",
 valueA: `${(siteA.technologies || []).length}`,
 valueB: `${(siteB.technologies || []).length}`,
 rawA: (siteA.technologies || []).length,
 rawB: (siteB.technologies || []).length,
 higherIsBetter: true,
 },
 {
 label: "Sitemap",
 valueA: siteA.seo.has_sitemap ? "Yes" : "No",
 valueB: siteB.seo.has_sitemap ? "Yes" : "No",
 rawA: siteA.seo.has_sitemap ? 1 : 0,
 rawB: siteB.seo.has_sitemap ? 1 : 0,
 higherIsBetter: true,
 },
 {
 label: "Robots.txt",
 valueA: siteA.seo.has_robots_txt ? "Yes" : "No",
 valueB: siteB.seo.has_robots_txt ? "Yes" : "No",
 rawA: siteA.seo.has_robots_txt ? 1 : 0,
 rawB: siteB.seo.has_robots_txt ? 1 : 0,
 higherIsBetter: true,
 },
 {
 label: "Structured Data",
 valueA: siteA.seo.has_structured_data ? "Yes" : "No",
 valueB: siteB.seo.has_structured_data ? "Yes" : "No",
 rawA: siteA.seo.has_structured_data ? 1 : 0,
 rawB: siteB.seo.has_structured_data ? 1 : 0,
 higherIsBetter: true,
 },
 {
 label: "Social Presence",
 valueA: `${siteA.social_links.length} platform${siteA.social_links.length !== 1 ? "s" : ""}`,
 valueB: `${siteB.social_links.length} platform${siteB.social_links.length !== 1 ? "s" : ""}`,
 rawA: siteA.social_links.length,
 rawB: siteB.social_links.length,
 higherIsBetter: true,
 },
 {
 label: "Traffic Tier",
 valueA: siteA.traffic?.traffic_tier || "Unknown",
 valueB: siteB.traffic?.traffic_tier || "Unknown",
 rawA: siteA.traffic?.tranco_rank ? 1000000 - siteA.traffic.tranco_rank : 0,
 rawB: siteB.traffic?.tranco_rank ? 1000000 - siteB.traffic.tranco_rank : 0,
 higherIsBetter: true,
 },
 ];

 // Tech stack overlap
 const techA = new Set(siteA.technologies.map((t) => t.name.toLowerCase()));
 const techB = new Set(siteB.technologies.map((t) => t.name.toLowerCase()));
 const sharedTech = [...techA].filter((t) => techB.has(t));
 const uniqueA = [...techA].filter((t) => !techB.has(t));
 const uniqueB = [...techB].filter((t) => !techA.has(t));

 // Overall winner count
 let winsA = 0;
 let winsB = 0;
 rows.forEach((row) => {
 const w = getWinner(row.rawA, row.rawB, row.higherIsBetter);
 if (w === "a") winsA++;
 if (w === "b") winsB++;
 });

 return (
 <div className="space-y-6">
 {/* Overall winner banner */}
 <div className="bg-card border border-border rounded-xl p-4 sm:p-5">
 <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
 <div className="text-center flex-1">
 <p className="text-sm font-medium truncate">{truncateUrl(siteA.url, 40)}</p>
 <p className="text-2xl font-bold mt-1">{winsA}</p>
 <p className="text-xs text-muted-foreground">wins</p>
 </div>
 <div className="flex flex-col items-center px-2 sm:px-4">
 <Trophy className={`w-6 h-6 ${winsA > winsB ? "text-emerald-400" : winsB > winsA ? "text-emerald-400" : "text-yellow-400"}`} />
 <span className="text-xs text-muted-foreground mt-1">vs</span>
 </div>
 <div className="text-center flex-1">
 <p className="text-sm font-medium truncate">{truncateUrl(siteB.url, 40)}</p>
 <p className="text-2xl font-bold mt-1">{winsB}</p>
 <p className="text-xs text-muted-foreground">wins</p>
 </div>
 </div>
 </div>

 {/* Comparison table */}
 <div className="bg-card border border-border rounded-xl overflow-hidden">
 <div className="overflow-x-auto">
 <div className="grid min-w-[40rem] grid-cols-[1fr_1fr_auto_1fr] gap-0">
 {/* Header */}
 <div className="p-3 border-b border-border bg-secondary/30 text-sm font-medium truncate">
 {truncateUrl(siteA.url, 30)}
 </div>
 <div className="p-3 border-b border-l border-border bg-secondary/30 text-sm font-medium text-center">
 Metric
 </div>
 <div className="p-3 border-b border-l border-border bg-secondary/30 text-center">
 <Trophy className="w-4 h-4 text-muted-foreground mx-auto" />
 </div>
 <div className="p-3 border-b border-l border-border bg-secondary/30 text-sm font-medium text-right truncate">
 {truncateUrl(siteB.url, 30)}
 </div>

 {/* Rows */}
 {rows.map((row) => {
 const winner = getWinner(row.rawA, row.rawB, row.higherIsBetter);
 return (
 <div key={row.label} className="contents">
 <div
 className={`p-3 border-b border-border text-sm ${getCellHighlight(winner, "a")}`}
 >
 {row.valueA}
 </div>
 <div className="p-3 border-b border-l border-border text-sm text-center text-muted-foreground">
 {row.label}
 </div>
 <div className="p-3 border-b border-l border-border text-center flex items-center justify-center">
 {winner === "a" && <span className="text-xs text-emerald-400 font-medium">A</span>}
 {winner === "b" && <span className="text-xs text-emerald-400 font-medium">B</span>}
 {winner === "tie" && <Minus className="w-3.5 h-3.5 text-muted-foreground" />}
 </div>
 <div
 className={`p-3 border-b border-l border-border text-sm text-right ${getCellHighlight(winner, "b")}`}
 >
 {row.valueB}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 </div>

 {/* Tech stack overlap */}
 <div className="bg-card border border-border rounded-xl p-5">
 <h3 className="text-sm font-semibold mb-4">Tech Stack Comparison</h3>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <div>
 <p className="text-xs font-medium text-muted-foreground mb-2">
 Only in {truncateUrl(siteA.url, 20)} ({uniqueA.length})
 </p>
 <div className="flex flex-wrap gap-1.5">
 {uniqueA.map((t) => (
 <span
 key={t}
 className="px-2 py-0.5 text-xs rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20"
 >
 {t}
 </span>
 ))}
 {uniqueA.length === 0 && (
 <span className="text-xs text-muted-foreground">None</span>
 )}
 </div>
 </div>
 <div>
 <p className="text-xs font-medium text-muted-foreground mb-2">
 Shared ({sharedTech.length})
 </p>
 <div className="flex flex-wrap gap-1.5">
 {sharedTech.map((t) => (
 <span
 key={t}
 className="px-2 py-0.5 text-xs rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
 >
 {t}
 </span>
 ))}
 {sharedTech.length === 0 && (
 <span className="text-xs text-muted-foreground">None</span>
 )}
 </div>
 </div>
 <div>
 <p className="text-xs font-medium text-muted-foreground mb-2">
 Only in {truncateUrl(siteB.url, 20)} ({uniqueB.length})
 </p>
 <div className="flex flex-wrap gap-1.5">
 {uniqueB.map((t) => (
 <span
 key={t}
 className="px-2 py-0.5 text-xs rounded-md bg-orange-500/10 text-orange-400 border border-orange-500/20"
 >
 {t}
 </span>
 ))}
 {uniqueB.length === 0 && (
 <span className="text-xs text-muted-foreground">None</span>
 )}
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
