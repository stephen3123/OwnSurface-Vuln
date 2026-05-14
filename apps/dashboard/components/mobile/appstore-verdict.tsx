"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

interface AppStoreVerdictProps {
 verdict: {
 verdict: "pass" | "fail" | "warning";
 blockers: any[];
 warnings: any[];
 passed: string[];
 };
}

const VERDICT_CONFIG = {
 pass: {
 label: "PASS",
 text: "text-emerald-900",
 bg: "bg-emerald-50 border-emerald-200",
 title: "READY FOR DEPLOYMENT",
 },
 fail: {
 label: "FAIL",
 text: "text-red-950",
 bg: "bg-red-50 border-red-200",
 title: "INTELLIGENCE BLOCKERS FOUND",
 },
 warning: {
 label: "WARN",
 text: "text-amber-950",
 bg: "bg-amber-50 border-amber-200",
 title: "OPERATIONAL WARNINGS",
 },
};

export function AppStoreVerdict({ verdict }: AppStoreVerdictProps) {
 const [blockersExpanded, setBlockersExpanded] = useState(true);
 const [warningsExpanded, setWarningsExpanded] = useState(false);
 const config = VERDICT_CONFIG[verdict.verdict];

 return (
 <div className={cn("shell-panel rounded-[2rem] p-8 border h-fit", config.bg)}>
 {/* Verdict header */}
 <div className="flex items-center gap-6">
 <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-[1.25rem] border font-medium text-[0.85rem]", config.text, config.bg, "brightness-95")}>
 {config.label}
 </div>
 <div className="flex-1">
 <h3 className={cn("text-[1.25rem] font-medium tracking-tighter leading-tight", config.text)}>
 {verdict.verdict === "fail"
 ? `${verdict.blockers.length} ${config.title}`
 : verdict.verdict === "warning"
 ? `${verdict.warnings.length} ${config.title}`
 : config.title}
 </h3>
 <p className={cn("mt-1 text-[0.62rem] font-medium uppercase tracking-widest opacity-60", config.text)}>
 {verdict.passed.length} INTEGRITY CHECKS VERIFIED
 </p>
 </div>
 </div>

 <div className="mt-6 space-y-4">
 {/* Blockers list */}
 {verdict.blockers.length > 0 && (
 <div className="rounded-[1.5rem] border border-red-300 bg-red-100/50 p-4">
 <button
 onClick={() => setBlockersExpanded(!blockersExpanded)}
 className="flex w-full items-center justify-between px-2 py-1 text-left text-[0.65rem] font-medium uppercase tracking-widest text-red-950 hover:opacity-70 transition-all"
 >
 <span>{blockersExpanded ? "[-]" : "[+]"} BLOCKERS ({verdict.blockers.length})</span>
 </button>
 {blockersExpanded && (
 <div className="mt-3 space-y-2">
 {verdict.blockers.map((blocker: any, i: number) => (
 <div
 key={i}
 className="rounded-[1rem] bg-card/50 border border-red-200 px-5 py-4 text-sm"
 >
 <div className="font-medium text-red-950 uppercase tracking-tight">
 {blocker.title || blocker}
 </div>
 {blocker.description && (
 <div className="mt-2 text-[0.8rem] text-red-950/60 font-medium">
 {blocker.description}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {/* Warnings list */}
 {verdict.warnings.length > 0 && (
 <div className="rounded-[1.5rem] border border-amber-300 bg-amber-100/50 p-4">
 <button
 onClick={() => setWarningsExpanded(!warningsExpanded)}
 className="flex w-full items-center justify-between px-2 py-1 text-left text-[0.65rem] font-medium uppercase tracking-widest text-amber-950 hover:opacity-70 transition-all"
 >
 <span>{warningsExpanded ? "[-]" : "[+]"} WARNINGS ({verdict.warnings.length})</span>
 </button>
 {warningsExpanded && (
 <div className="mt-3 space-y-2">
 {verdict.warnings.map((warning: any, i: number) => (
 <div
 key={i}
 className="rounded-[1rem] bg-card/50 border border-amber-200 px-5 py-4 text-sm"
 >
 <div className="font-medium text-amber-950 uppercase tracking-tight">
 {warning.title || warning}
 </div>
 {warning.description && (
 <div className="mt-2 text-[0.8rem] text-amber-950/60 font-medium">
 {warning.description}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 </div>
 );
}
