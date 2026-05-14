"use client";

import type { CompetitorEntry } from "./competitor-comparison-table";
import { formatRelative } from "@/lib/utils";
import { cn } from "@/lib/utils";

export interface CompetitorChange {
 type: "tech_added" | "tech_removed" | "score_change" | "new_page";
 description: string;
 detected_at: string;
}

interface CompetitorDigestCardProps {
 competitor: CompetitorEntry;
 changes?: CompetitorChange[];
}

function changeMarker(type: CompetitorChange["type"]) {
 switch (type) {
 case "tech_added":
 return "[+]";
 case "tech_removed":
 return "[-]";
 case "score_change":
 return "[Δ]";
 case "new_page":
 return "[N]";
 }
}

function changeColor(type: CompetitorChange["type"]): string {
 switch (type) {
 case "tech_added":
 return "text-emerald-900 bg-emerald-100";
 case "tech_removed":
 return "text-rose-900 bg-rose-100";
 case "score_change":
 return "text-amber-900 bg-amber-100";
 case "new_page":
 return "text-blue-900 bg-blue-100";
 }
}

export function CompetitorDigestCard({ competitor, changes }: CompetitorDigestCardProps) {
 return (
 <div className="shell-panel border-2 border-border rounded-2xl p-6 ">
 <div className="flex items-start justify-between mb-6">
 <div>
 <h3 className="text-lg font-black uppercase tracking-tighter">{competitor.name || competitor.url}</h3>
 <p className="text-[0.65rem] font-black uppercase tracking-[0.2em] text-muted-foreground mt-1 underline decoration-1 underline-offset-4">{competitor.url}</p>
 </div>
 <div className="flex items-center gap-2">
 {competitor.similarity_score !== undefined && (
 <span className="px-3 py-1 rounded-sm text-[0.65rem] font-black uppercase tracking-widest bg-black text-white ">
 {Math.round(competitor.similarity_score * 100)}% MATCH
 </span>
 )}
 </div>
 </div>

 {competitor.shared_tech && competitor.shared_tech.length > 0 && (
 <div className="flex flex-wrap gap-2 mb-6">
 {competitor.shared_tech.map((tech) => (
 <span key={tech} className="px-2 py-1 rounded-sm bg-muted border border-border text-[0.6rem] font-black uppercase tracking-widest text-foreground">
 {tech}
 </span>
 ))}
 </div>
 )}

 {!changes || changes.length === 0 ? (
 <p className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground italic">Stability Phase – No changes detected</p>
 ) : (
 <div className="space-y-4 pt-4 border-t border-border">
 {changes.map((change, i) => {
 return (
 <div key={i} className="flex items-start gap-4 p-3 rounded-xl bg-muted/30 border border-border/50 group transition-all hover:bg-card hover:border-black">
 <div className={cn("px-1.5 py-0.5 rounded-sm font-black text-[0.6rem] shrink-0 mt-0.5", changeColor(change.type))}>
 {changeMarker(change.type)}
 </div>
 <div className="min-w-0 flex-1">
 <p className="text-[0.75rem] font-black uppercase tracking-tight text-foreground leading-tight group-hover:underline decoration-1 underline-offset-2">{change.description}</p>
 <p className="text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground mt-1 underline decoration-1 underline-offset-2">{formatRelative(change.detected_at)}</p>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
