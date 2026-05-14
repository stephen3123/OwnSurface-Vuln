"use client";

import { useEffect, useRef, type ReactNode } from "react";


export interface ActivityTerminalEntry {
 id: string;
 timestamp?: string;
 label?: string;
 message: string;
 detail?: string;
 tone?: "default" | "muted" | "accent" | "success" | "warning" | "danger";
}

export interface ActivityTerminalStat {
 label: string;
 value: string;
 meta?: string;
 tone?: "default" | "accent" | "success" | "danger";
}

interface ActivityTerminalProps {
 eyebrow: string;
 sessionLabel: string;
 status: string;
 progress: number;
 progressLabel: string;
 stats: ActivityTerminalStat[];
 entries: ActivityTerminalEntry[];
 emptyMessage: string;
 footer?: ReactNode;
 bodyAppend?: ReactNode;
 layout?: "default" | "sidebar";
}

function isActive(status: string): boolean {
 return status === "running" || status === "scanning" || status === "pending";
}

function getEntryToneClass(tone: ActivityTerminalEntry["tone"]): string {
 switch (tone) {
 case "success":
 return "text-emerald-700";
 case "warning":
 return "text-amber-700";
 case "danger":
 return "text-red-700";
 case "accent":
 return "text-teal-700";
 case "muted":
 return "text-muted-foreground opacity-70";
 default:
 return "text-zinc-600";
 }
}

function getStatToneClass(tone: ActivityTerminalStat["tone"]): string {
 switch (tone) {
 case "success":
 return "text-emerald-700";
 case "danger":
 return "text-red-700";
 case "accent":
 return "text-teal-700";
 default:
 return "text-foreground";
 }
}

export function ActivityTerminal({
 eyebrow,
 sessionLabel,
 status,
 progress,
 progressLabel,
 stats,
 entries,
 emptyMessage,
 footer,
 bodyAppend,
 layout = "default",
}: ActivityTerminalProps) {
 const bodyRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 if (bodyRef.current) {
 bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
 }
 }, [entries.length, status, bodyAppend]);

 return (
 <div className={`shell-panel flex flex-col overflow-hidden border border-border bg-card ${layout === 'sidebar' ? 'rounded-2xl h-[calc(100vh-2rem)] sticky top-4' : 'rounded-[2rem]'}`}>
 <div className={`border-b border-border bg-card ${layout === 'sidebar' ? 'px-6 py-6' : 'px-6 py-8 sm:px-10'}`}>
 <div className={`flex flex-col gap-6 ${layout === 'sidebar' ? '' : 'lg:flex-row lg:items-end lg:justify-between'}`}>
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-3">
 <span className="text-[0.68rem] font-bold uppercase tracking-[0.2em] text-muted-foreground">
 {eyebrow}
 </span>
 {isActive(status) && (
 <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-teal-400 border border-teal-500/20">
 <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-teal-500" />
 Live Focus
 </span>
 )}
 {status === "complete" && (
 <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/20">
 ✓ COMPLETE
 </span>
 )}
 {status === "failed" && (
 <span className="inline-flex items-center gap-1.5 rounded-md bg-red-500/10 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-widest text-red-400 border border-red-500/20">
 ✗ FAILED
 </span>
 )}
 </div>

 <div className="flex flex-wrap items-center gap-3">
 <span className="font-mono text-[0.8rem] font-medium text-foreground/80">{sessionLabel}</span>
 </div>
 </div>

 {layout !== "sidebar" && (
 <div className={`grid gap-6 ${stats.length >= 4 ? "sm:grid-cols-4" : "sm:grid-cols-3"} lg:min-w-[30rem]`}>
 {stats.map((stat) => (
 <div key={stat.label}>
 <div className="mb-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
 {stat.label}
 </div>
 <div className={`text-2xl font-medium tracking-tight ${getStatToneClass(stat.tone)}`}>
 {stat.value}
 </div>
 {stat.meta && <div className="mt-1 text-[0.65rem] font-medium uppercase tracking-widest text-muted-foreground">{stat.meta}</div>}
 </div>
 ))}
 </div>
 )}
 </div>

 <div className={`rounded-lg border border-border/40 bg-card/50 ${layout === 'sidebar' ? 'mt-6 p-5' : 'mt-8 p-6 sm:p-8'}`}>
 <div className="mb-4 flex flex-wrap items-center justify-between text-[0.75rem] font-semibold uppercase tracking-widest text-foreground gap-4">
 <span className="inline-flex items-center gap-2.5">
 {isActive(status) ? (
 <span className="relative flex h-2.5 w-2.5 shrink-0">
 <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
 <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-teal-500"></span>
 </span>
 ) : (
 "▪"
 )}{" "}
 <span className="break-words leading-relaxed">{progressLabel}</span>
 </span>
 <span className="font-mono text-xl font-bold tracking-tight text-foreground">{progress}%</span>
 </div>
 <div className="h-3 w-full overflow-hidden rounded-md bg-background border border-border/40">
 <div
 className={`h-full rounded-full transition-all duration-700 ${
 status === "complete"
 ? "bg-emerald-500"
 : status === "failed"
 ? "bg-red-500"
 : "bg-teal-500"
 }`}
 style={{ width: `${progress}%` }}
 />
 </div>
 </div>
 </div>

 <div className={`flex flex-col flex-1 border-t border-border/40 bg-[#0A0A0B] ${layout === 'sidebar' ? 'p-4 overflow-hidden' : 'px-6 py-6 sm:px-10'}`}>
 <h4 className="mb-3 shrink-0 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-muted-foreground/60">Engagement Output Logs</h4>
 <div
 ref={bodyRef}
 className={`custom-scrollbar overflow-y-auto rounded-lg border border-border/40 bg-card font-mono ${
 layout === 'sidebar' 
 ? 'flex-1 p-3 text-[0.68rem] leading-relaxed h-0' 
 : 'h-[340px] p-6 text-[0.75rem] leading-7'
 }`}
 >
 {entries.length === 0 && (
 <div className="font-medium text-muted-foreground">
 {emptyMessage}
 </div>
 )}

 <div className={`flex flex-col ${layout === 'sidebar' ? 'gap-1.5' : 'gap-2'}`}>
 {entries.map((entry) => (
 <div key={entry.id} className={`flex items-start ${layout === 'sidebar' ? 'gap-2' : 'gap-3'} ${getEntryToneClass(entry.tone)}`}>
 {entry.timestamp && (
 <span className={`select-none whitespace-nowrap text-zinc-400 ${
 layout === 'sidebar' ? 'text-[0.6rem] opacity-60 mt-0.5' : 'mt-0.5 hidden sm:inline-flex'
 }`}>
 [{entry.timestamp.split('T')[1]?.replace('Z','') || entry.timestamp}]
 </span>
 )}
 {entry.label && (
 <span className={`shrink-0 rounded bg-white/5 px-1.5 py-0.5 font-bold uppercase tracking-wider text-muted-foreground border border-border/40 ${
 layout === 'sidebar' ? 'text-[0.55rem] leading-none' : 'text-[0.6rem] mt-0.5'
 }`}>
 {entry.label}
 </span>
 )}
 <span className={`font-medium break-words leading-relaxed min-w-0 ${layout === 'sidebar' ? 'mt-[1px]' : 'mt-0.5 flex-1'}`}>
 {entry.message}
 </span>
 {entry.detail && (
 <div className={`w-full font-medium text-zinc-500 ${
 layout === 'sidebar' ? 'pl-4 text-[0.6rem] mt-0.5' : 'pl-[5.5rem] sm:pl-[12rem] text-[0.7rem]'
 }`}>
 {entry.detail}
 </div>
 )}
 </div>
 ))}
 </div>

 {bodyAppend}
 </div>
 </div>

 {footer}
 </div>
 );
}
