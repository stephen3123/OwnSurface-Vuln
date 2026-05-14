"use client";

import type { Competitor } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CompetitorListProps {
 competitors: Competitor[];
}

export function CompetitorList({ competitors }: CompetitorListProps) {
 if (competitors.length === 0) return null;

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border border-border transition-all hover:bg-card/50">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground underline decoration-2 underline-offset-8">
 Market Intelligence Baseline
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/5 border border-black/10 text-[0.62rem] font-black text-foreground uppercase tracking-widest">
 {competitors.length} Global Peers
 </div>
 </div>

 <div className="custom-scrollbar overflow-x-auto pr-1">
 <table className="w-full">
 <thead>
 <tr className="text-left text-[0.65rem] font-black uppercase tracking-[0.25em] text-foreground border-b border-border">
 <th className="pb-4 pr-4">Competitive Entity</th>
 <th className="pb-4 pr-4">Identity Match</th>
 <th className="pb-4 pr-4">Technological Overlap</th>
 <th className="pb-4 w-10 text-right" />
 </tr>
 </thead>
 <tbody className="divide-y divide-border/20">
 {competitors.map((comp) => (
 <tr key={comp.url} className="group hover:bg-card/50 transition-colors">
 <td className="py-5 pr-4">
 <div className="flex flex-col gap-0.5">
 <span className="text-[0.85rem] font-black tracking-tight text-foreground uppercase">{comp.name}</span>
 <span className="text-[0.65rem] text-muted-foreground font-black tracking-tight uppercase">{comp.url}</span>
 </div>
 </td>
 <td className="py-5 pr-4">
 <div className="flex items-center gap-3">
 <div className="w-24 h-2 bg-muted border border-border rounded-none overflow-hidden">
 <div
 className="h-full bg-emerald-600 transition-all duration-700"
 style={{ width: `${comp.similarity_score}%` }}
 />
 </div>
 <span className="text-[0.75rem] font-black text-foreground font-mono tracking-tighter">
 {comp.similarity_score}%
 </span>
 </div>
 </td>
 <td className="py-5 pr-4">
 <div className="flex flex-wrap gap-1.5">
 {(comp.shared_tech || (comp as any).shared_technologies || []).slice(0, 3).map((t: string) => (
 <span
 key={t}
 className="px-2 py-0.5 rounded-sm bg-muted border border-border text-[0.55rem] font-black uppercase tracking-widest text-foreground "
 >
 {t}
 </span>
 ))}
 {(comp.shared_tech || (comp as any).shared_technologies || []).length > 3 && (
 <span className="text-[0.65rem] font-black text-muted-foreground flex items-center px-1">
 +{(comp.shared_tech || (comp as any).shared_technologies || []).length - 3}
 </span>
 )}
 </div>
 </td>
 <td className="py-5 text-right">
 <a
 href={comp.url.startsWith("http") ? comp.url : `https://${comp.url}`}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1 text-[0.65rem] font-black uppercase tracking-widest text-foreground hover:underline underline-offset-4"
 >
 View
 </a>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
