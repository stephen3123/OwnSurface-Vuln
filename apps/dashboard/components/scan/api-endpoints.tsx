"use client";

import { Plug, AlertTriangle, BookOpen, GitBranch, FileJson } from "lucide-react";
import { cn } from "@/lib/utils";

interface Endpoint {
 path: string;
 type: string;
 status?: number;
 accessible: boolean;
}

interface APIData {
 endpoints: Endpoint[];
 patterns_found: string[];
 has_swagger: boolean;
 has_graphql: boolean;
 has_openapi: boolean;
 issues: string[];
}

interface APIEndpointsProps {
 apis: APIData;
}

function getTypeBadge(type: string) {
 switch (type.toLowerCase()) {
 case "rest":
 return "bg-blue-500/10 text-blue-400 border-blue-500/20";
 case "graphql":
 return "bg-pink-500/10 text-pink-400 border-pink-500/20";
 case "swagger":
 return "bg-green-500/10 text-green-400 border-green-500/20";
 case "openapi":
 return "bg-teal-500/10 text-teal-700 border-teal-500/20";
 case "websocket":
 return "bg-purple-500/10 text-purple-400 border-purple-500/20";
 default:
 return "bg-slate-500/10 text-slate-400 border-slate-500/20";
 }
}

function getAccessBadge(accessible: boolean) {
 if (accessible) return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
 return "bg-slate-500/10 text-slate-400 border-slate-500/20";
}

export function APIEndpoints({ apis }: APIEndpointsProps) {
 if (apis.endpoints.length === 0 && !apis.has_swagger && !apis.has_graphql && !apis.has_openapi) {
 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
 <Plug className="h-4.5 w-4.5 text-blue-500/60" />
 API Architecture Discovery
 </div>
 <div className="flex items-center gap-4 p-6 rounded-2xl bg-slate-500/5 border border-slate-500/10 ">
 <Plug className="w-5 h-5 text-slate-400 opacity-40 shrink-0" />
 <p className="text-[0.85rem] text-muted-foreground/60 font-light italic">No public API surface discovered during standard crawl.</p>
 </div>
 </div>
 );
 }

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
 <Plug className="h-4.5 w-4.5 text-blue-500/60" />
 API Architecture Intelligence
 </div>
 <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-border/40 text-[0.6rem] font-black text-muted-foreground/40 uppercase tracking-widest">
 {apis.endpoints.length} Routes Identified
 </div>
 </div>

 {/* Feature badges */}
 {(apis.has_swagger || apis.has_graphql || apis.has_openapi) && (
 <div className="flex flex-wrap gap-2 mb-8 px-1">
 {apis.has_swagger && (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[0.62rem] font-black uppercase tracking-widest ">
 <BookOpen className="w-3.5 h-3.5" />
 Swagger Spec Found
 </div>
 )}
 {apis.has_graphql && (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-pink-500/5 text-pink-500 border-pink-500/20 text-[0.62rem] font-black uppercase tracking-widest ">
 <GitBranch className="w-3.5 h-3.5" />
 GraphQL Interface
 </div>
 )}
 {apis.has_openapi && (
 <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-teal-500/5 text-teal-600 border-teal-500/20 text-[0.62rem] font-black uppercase tracking-widest ">
 <FileJson className="w-3.5 h-3.5" />
 OpenAPI Definition
 </div>
 )}
 </div>
 )}

 {/* Endpoints table */}
 {apis.endpoints.length > 0 && (
 <div className="custom-scrollbar overflow-x-auto mb-8 px-1">
 <table className="w-full">
 <thead>
 <tr className="text-left text-[0.6rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/30 border-b border-border/20">
 <th className="pb-3 pr-4">Endpoint Path</th>
 <th className="pb-3 pr-4">Data Type</th>
 <th className="pb-3 pr-4 text-center">Res. Code</th>
 <th className="pb-3 text-center">Exposure</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border/20">
 {apis.endpoints.map((ep, i) => (
 <tr key={i} className="group hover:bg-card/50 transition-colors">
 <td className="py-4 pr-4">
 <span className="font-mono text-[0.7rem] font-bold text-foreground/70 group-hover:text-foreground transition-colors break-all">{ep.path}</span>
 </td>
 <td className="py-4 pr-4">
 <span
 className={cn(
 "inline-flex px-2 py-0.5 rounded-md border text-[0.6rem] font-black uppercase tracking-widest ",
 getTypeBadge(ep.type)
 )}
 >
 {ep.type}
 </span>
 </td>
 <td className="py-4 pr-4 text-center">
 <span className="text-[0.75rem] font-mono font-bold text-muted-foreground/40 group-hover:text-foreground transition-colors">
 {ep.status || "—"}
 </span>
 </td>
 <td className="py-4 text-center">
 <span
 className={cn(
 "inline-flex px-2 py-0.5 rounded-md border text-[0.6rem] font-black uppercase tracking-widest",
 getAccessBadge(ep.accessible)
 )}
 >
 {ep.accessible ? "Public Access" : "Restricted Signature"}
 </span>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}

 {/* Patterns found */}
 {apis.patterns_found.length > 0 && (
 <div className="mb-8 px-1">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
 Architectural Patterns Identified
 </h4>
 <div className="flex flex-wrap gap-2">
 {apis.patterns_found.map((pattern, i) => (
 <span
 key={i}
 className="inline-flex px-3 py-1.5 rounded-xl bg-card/50 border border-border/40 text-[0.72rem] font-mono text-foreground/70 "
 >
 {pattern}
 </span>
 ))}
 </div>
 </div>
 )}

 {/* Issues */}
 {apis.issues.length > 0 && (
 <div className="px-1">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-4">
 Structural Anomalies
 </h4>
 <div className="space-y-2.5">
 {apis.issues.map((issue, i) => (
 <div
 key={i}
 className="flex items-center gap-4 p-4 rounded-2xl bg-orange-500/5 border border-orange-500/10 group hover:bg-orange-500/10 transition-all"
 >
 <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
 <AlertTriangle className="w-4 h-4 text-orange-500/60" />
 </div>
 <p className="text-[0.82rem] text-orange-600/80 leading-relaxed font-light">{issue}</p>
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
