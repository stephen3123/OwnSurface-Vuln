"use client";

import type { SeoResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SeoAnalysisProps {
 seo: SeoResult;
}

export function SeoAnalysis({ seo }: SeoAnalysisProps) {
 const titleLen = seo.title?.length || 0;
 const descLen = seo.description?.length || 0;
 const titleOk = titleLen >= 30 && titleLen <= 70;
 const descOk = descLen >= 120 && descLen <= 160;

 const checks = [
 { label: "Sitemap.xml", pass: seo.has_sitemap },
 { label: "Robots.txt", pass: seo.has_robots_txt },
 { label: "Structured Data", pass: seo.has_structured_data },
 { label: "Canonical URL", pass: seo.has_canonical },
 { label: "Title Tag Length", pass: titleOk },
 { label: "Meta Description Length", pass: descOk },
 { label: "H1 Tag Present", pass: seo.h1_count > 0 },
 ];

 const passCount = checks.filter((c) => c.pass).length;
 const scoreColor = seo.score >= 80 ? "text-emerald-600" : seo.score >= 50 ? "text-amber-600" : "text-rose-600";

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border transition-all hover:scale-[1.01]">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground underline decoration-2 underline-offset-8">
 Search Engine Intelligence
 </div>
 <div className="flex items-baseline gap-1.5">
 <span className={cn("text-[1.4rem] font-black tracking-tighter", scoreColor)}>{seo.score}</span>
 <span className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground/40">/100</span>
 </div>
 </div>

 {/* Meta info */}
 <div className="space-y-5 mb-10 px-1">
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground">Document Title</span>
 <span className={cn("text-[0.6rem] font-black uppercase tracking-widest", titleOk ? "text-emerald-600" : "text-amber-600")}>
 {titleLen} chars · {titleOk ? "Optimal" : titleLen < 30 ? "Too Short" : "Too Long"}
 </span>
 </div>
 <p className="text-[0.82rem] bg-muted/30 rounded-2xl p-4 border border-border text-foreground font-black leading-relaxed font-mono">
 {seo.title || "No title tag discovered in crawl"}
 </p>
 </div>
 <div>
 <div className="flex items-center justify-between mb-2">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground">Meta Synopsis</span>
 <span className={cn("text-[0.6rem] font-black uppercase tracking-widest", descOk ? "text-emerald-600" : "text-amber-600")}>
 {descLen} chars · {descOk ? "Optimal" : descLen < 120 ? "Too Short" : "Too Long"}
 </span>
 </div>
 <p className="text-[0.82rem] bg-muted/30 rounded-2xl p-4 border border-border text-foreground font-black leading-relaxed font-mono">
 {seo.description || "No meta description discovered in crawl"}
 </p>
 </div>
 </div>

 {/* Checklist */}
 <div className="mb-10 px-1">
 <div className="flex items-center justify-between mb-4">
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground">
 Protocol Validation
 </h4>
 <span className="text-[0.68rem] font-black text-muted-foreground/60">
 {passCount}/{checks.length} verified
 </span>
 </div>
 <div className="grid gap-2.5">
 {checks.map((check) => (
 <div key={check.label} className={cn(
 "flex items-center gap-4 p-3.5 rounded-2xl border transition-all duration-300 ",
 check.pass
 ? "bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10"
 : "bg-rose-500/5 border-rose-500/10 hover:bg-rose-500/10"
 )}>
 <div className={cn(
 "h-7 w-7 rounded-sm flex items-center justify-center shrink-0 border border-current/20 font-black text-[0.6rem] uppercase tracking-tighter",
 check.pass ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
 )}>
 {check.pass ? "OK" : "NO"}
 </div>
 <span className="text-[0.82rem] font-black tracking-tight text-foreground uppercase">{check.label}</span>
 </div>
 ))}
 </div>
 </div>

 {/* Issues */}
 {seo.meta_issues.length > 0 && (
 <div className="px-1 mt-auto">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
 Discovery Anomalies
 </h4>
 <div className="space-y-2.5">
 {seo.meta_issues.map((issue, i) => (
 <div
 key={i}
 className="flex items-center gap-4 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 transition-all hover:bg-amber-500/10 group"
 >
 <div className="h-8 w-8 rounded-sm bg-amber-500/20 border border-amber-500/20 flex items-center justify-center shrink-0 font-black text-[0.6rem] text-amber-500">
 !
 </div>
 <p className="text-[0.82rem] text-amber-500 leading-relaxed font-black uppercase tracking-tight">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
