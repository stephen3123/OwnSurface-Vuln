"use client";

import type { ScanResult } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface CompetitorEntry {
 url: string;
 name: string;
 scan?: ScanResult;
 similarity_score?: number;
 shared_tech?: string[];
}

interface CompetitorComparisonTableProps {
 yourDomain: string;
 yourScan?: ScanResult;
 competitors: CompetitorEntry[];
 onScan?: (url: string) => void;
 scanning?: string;
}

function scoreColor(score: number | undefined): string {
 if (score === undefined) return "text-zinc-400";
 if (score >= 80) return "text-emerald-900 bg-emerald-100 px-2 py-0.5 rounded-sm";
 if (score >= 50) return "text-amber-900 bg-amber-100 px-2 py-0.5 rounded-sm";
 return "text-rose-900 bg-rose-100 px-2 py-0.5 rounded-sm";
}

export function CompetitorComparisonTable({
 yourDomain,
 yourScan,
 competitors,
 onScan,
 scanning,
}: CompetitorComparisonTableProps) {
 if (competitors.length === 0 && !yourScan) {
 return (
 <div className="shell-panel py-20 text-center border-2 border-dashed border-border">
 <p className="text-[0.8rem] font-black uppercase tracking-widest text-muted-foreground">Reconnaissance Phase – No competitors identified</p>
 </div>
 );
 }

 const rows = [
 ...(yourScan
 ? [
 {
 domain: yourDomain,
 isYou: true,
 security: yourScan.security?.score,
 seo: yourScan.seo?.score,
 techCount: yourScan.technologies?.length || 0,
 traffic: yourScan.traffic?.traffic_tier || "—",
 hasScan: true,
 },
 ]
 : []),
 ...competitors.map((c) => ({
 domain: c.url,
 isYou: false,
 security: c.scan?.security?.score,
 seo: c.scan?.seo?.score,
 techCount: c.scan?.technologies?.length || 0,
 traffic: c.scan?.traffic?.traffic_tier || "—",
 hasScan: !!c.scan,
 })),
 ];

 return (
 <div className="shell-panel border-2 border-border rounded-2xl overflow-hidden ">
 <div className="overflow-x-auto">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b-2 border-black bg-black text-white">
 <th className="text-left px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">Competitor Domain</th>
 <th className="text-center px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">Security</th>
 <th className="text-center px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">SEO</th>
 <th className="text-center px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">Tech Stack</th>
 <th className="text-center px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">Traffic</th>
 <th className="text-right px-6 py-4 text-[0.65rem] font-black uppercase tracking-[0.2em]">Action</th>
 </tr>
 </thead>
 <tbody>
 {rows.map((row) => (
 <tr
 key={row.domain}
 className={`border-b border-border last:border-0 ${
 row.isYou ? "bg-teal-500/5" : ""
 }`}
 >
 <td className="px-6 py-5">
 <div className="flex items-center gap-3">
 <span className="font-black uppercase tracking-tight text-foreground">{row.domain}</span>
 {row.isYou && (
 <span className="px-2 py-0.5 rounded-sm text-[0.65rem] font-black bg-black text-white">
 YOU
 </span>
 )}
 </div>
 </td>
 <td className="text-center px-6 py-5">
 <span className={cn("inline-block min-w-[3rem] text-[0.75rem] font-black uppercase tracking-tighter", scoreColor(row.security))}>
 {row.hasScan ? (row.security ?? "—") : "—"}
 </span>
 </td>
 <td className="text-center px-6 py-5">
 <span className={cn("inline-block min-w-[3rem] text-[0.75rem] font-black uppercase tracking-tighter", scoreColor(row.seo))}>
 {row.hasScan ? (row.seo ?? "—") : "—"}
 </span>
 </td>
 <td className="text-center px-6 py-5 font-black uppercase text-[0.75rem]">
 {row.hasScan ? row.techCount : "—"}
 </td>
 <td className="text-center px-6 py-5 font-black uppercase text-[0.75rem]">
 {row.hasScan ? row.traffic : "—"}
 </td>
 <td className="text-right px-6 py-5">
 {!row.isYou && !row.hasScan && (
 <button
 onClick={() => onScan?.(row.domain)}
 disabled={scanning === row.domain}
 className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-black text-white text-[0.65rem] font-black uppercase tracking-widest hover:bg-zinc-800 transition-all disabled:opacity-20"
 >
 {scanning === row.domain ? "SCANNING..." : "RUN SCAN"}
 </button>
 )}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 );
}
