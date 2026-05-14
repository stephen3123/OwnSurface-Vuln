"use client";

import type { ScanResult } from "@/lib/api-client";
import { formatDateTime, cn } from "@/lib/utils";
import { ArrowRight, Plus, Minus, GitCompareArrows } from "lucide-react";

interface WebsiteDiffProps {
 before: ScanResult;
 after: ScanResult;
}

export function WebsiteDiff({ before, after }: WebsiteDiffProps) {
 const beforeTechNames = new Set(before.technologies.map((t) => t.name));
 const afterTechNames = new Set(after.technologies.map((t) => t.name));

 const added = after.technologies.filter((t) => !beforeTechNames.has(t.name));
 const removed = before.technologies.filter((t) => !afterTechNames.has(t.name));
 const securityDelta = after.security.score - before.security.score;
 const seoDelta = after.seo.score - before.seo.score;

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
 <GitCompareArrows className="h-4.5 w-4.5 text-blue-500/60" />
 Architectural Delta Analysis
 </div>

 <div className="flex items-center gap-4 text-[0.7rem] text-muted-foreground/50 mb-8 px-1 font-bold">
 <span className="px-3 py-1.5 rounded-xl bg-card/50 border border-border/20 ">{formatDateTime(before.scanned_at)}</span>
 <ArrowRight className="w-4 h-4 text-muted-foreground/30" />
 <span className="px-3 py-1.5 rounded-xl bg-card/50 border border-border/20 ">{formatDateTime(after.scanned_at)}</span>
 </div>

 <div className="grid md:grid-cols-2 gap-6 px-1">
 {/* Tech changes */}
 <div>
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30 mb-4">
 Technology Mutations
 </h4>
 {added.length === 0 && removed.length === 0 ? (
 <p className="text-[0.82rem] text-muted-foreground/50 font-light italic">No technology mutations detected between snapshots.</p>
 ) : (
 <div className="space-y-2.5">
 {added.map((t) => (
 <div key={t.name} className="flex items-center gap-3 p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 transition-all hover:bg-emerald-500/8 group">
 <div className="h-7 w-7 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0">
 <Plus className="w-3.5 h-3.5 text-emerald-600" />
 </div>
 <span className="text-[0.82rem] font-bold tracking-tight text-emerald-600/80">{t.name}</span>
 {t.version && <span className="text-[0.65rem] font-bold text-emerald-600/40 bg-emerald-500/5 px-1.5 py-0.5 rounded-md border border-emerald-500/10">{t.version}</span>}
 </div>
 ))}
 {removed.map((t) => (
 <div key={t.name} className="flex items-center gap-3 p-3.5 rounded-2xl bg-rose-500/5 border border-rose-500/10 transition-all hover:bg-rose-500/8 group">
 <div className="h-7 w-7 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0">
 <Minus className="w-3.5 h-3.5 text-rose-600" />
 </div>
 <span className="text-[0.82rem] font-bold tracking-tight text-rose-600/80">{t.name}</span>
 {t.version && <span className="text-[0.65rem] font-bold text-rose-600/40 bg-rose-500/5 px-1.5 py-0.5 rounded-md border border-rose-500/10">{t.version}</span>}
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Score changes */}
 <div>
 <h4 className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30 mb-4">
 Score Trajectory
 </h4>
 <div className="space-y-3">
 {[
 { label: "Security Score", before: before.security.score, after: after.security.score, delta: securityDelta },
 { label: "SEO Score", before: before.seo.score, after: after.seo.score, delta: seoDelta },
 { label: "Technologies", before: before.technologies.length, after: after.technologies.length, delta: after.technologies.length - before.technologies.length },
 ].map((item) => (
 <div key={item.label} className="flex items-center justify-between p-4 rounded-2xl bg-card/50 border border-border/20 transition-all hover:bg-card group">
 <span className="text-[0.82rem] font-bold tracking-tight text-foreground/70 group-hover:text-foreground transition-colors">{item.label}</span>
 <div className="flex items-center gap-3">
 <span className="text-[0.75rem] font-bold text-muted-foreground/40">{item.before}</span>
 <ArrowRight className="w-3 h-3 text-muted-foreground/20" />
 <span className="text-[0.82rem] font-black tracking-tighter text-foreground/80">{item.after}</span>
 {item.delta !== 0 && (
 <span className={cn(
 "text-[0.65rem] font-black tracking-tight px-2 py-0.5 rounded-md border ",
 item.delta > 0
 ? "text-emerald-600 bg-emerald-500/10 border-emerald-500/20"
 : "text-rose-600 bg-rose-500/10 border-rose-500/20"
 )}>
 {item.delta > 0 ? "+" : ""}{item.delta}
 </span>
 )}
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </div>
 );
}
