"use client";

import { useState } from "react";
import { Wrench, ExternalLink, Copy, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getRemediation } from "@/lib/remediations";
import type { Remediation } from "@/lib/remediations";
import { toast } from "sonner";

interface FixItPanelProps {
 issueSource: string;
 issueTitle: string;
 techStack?: string[];
}

const DIFFICULTY_STYLES: Record<Remediation["difficulty"], string> = {
 easy: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
 medium: "bg-amber-500/10 text-amber-400 border-amber-500/20",
 hard: "bg-red-500/10 text-red-400 border-red-500/20",
};

function CodeBlock({ code, language }: { code: string; language?: string }) {
 const [copied, setCopied] = useState(false);

 async function handleCopy() {
 try {
 await navigator.clipboard.writeText(code);
 setCopied(true);
 toast.success("Copied to clipboard");
 setTimeout(() => setCopied(false), 2000);
 } catch {
 toast.error("Failed to copy");
 }
 }

 return (
 <div className="relative mt-2 rounded-lg border border-border bg-background overflow-hidden">
 <div className="flex items-center justify-between px-3 py-1.5 border-b border-border bg-secondary/50">
 {language && (
 <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wide">
 {language}
 </span>
 )}
 <button
 onClick={handleCopy}
 className="p-1 rounded-md hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
 >
 {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
 </button>
 </div>
 <pre className="p-3 overflow-x-auto text-xs leading-relaxed">
 <code className="font-mono">{code}</code>
 </pre>
 </div>
 );
}

export function FixItPanel({ issueSource, issueTitle, techStack }: FixItPanelProps) {
 const remediation = getRemediation(issueSource, issueTitle, techStack);

 if (!remediation) {
 return (
 <div className="shell-panel rounded-[1.7rem] p-6">
 <div className="flex items-center gap-2 mb-3">
 <Wrench className="w-4 h-4 text-muted-foreground" />
 <h3 className="text-sm font-medium">Fix It</h3>
 </div>
 <p className="text-sm text-muted-foreground">
 No automated fix guidance available for this issue type.
 </p>
 </div>
 );
 }

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center justify-between mb-8 px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-muted-foreground/60">
 <Wrench className="h-4.5 w-4.5 text-emerald-500/60" />
 Automated Remediation Protocol
 </div>
 <div className="flex items-center gap-3">
 <span
 className={cn(
 "px-3 py-1 rounded-full text-[0.6rem] font-medium uppercase tracking-widest border ",
 DIFFICULTY_STYLES[remediation.difficulty],
 )}
 >
 {remediation.difficulty}
 </span>
 <span className="px-3 py-1 rounded-full text-[0.6rem] font-medium uppercase tracking-widest bg-card/50 border border-border/20 text-muted-foreground/60">
 {remediation.estimated_time}
 </span>
 </div>
 </div>

 <div className="mb-8 px-1">
 <h4 className="text-[1rem] font-semibold tracking-tight text-foreground/90 mb-2">{remediation.title}</h4>
 <p className="text-[0.82rem] text-muted-foreground/70 font-light leading-relaxed">{remediation.description}</p>
 </div>

 <div className="space-y-6 px-1">
 {remediation.steps.map((step) => (
 <div key={step.order} className="flex gap-5">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/5 text-emerald-600/60 text-[0.7rem] font-medium border border-emerald-500/10 ">
 {step.order}
 </div>
 <div className="flex-1 min-w-0">
 <h5 className="text-[0.9rem] font-semibold tracking-tight text-foreground/80 mb-1.5">{step.title}</h5>
 <p className="text-[0.8rem] text-muted-foreground/60 font-light leading-relaxed mb-3">{step.description}</p>
 {step.code && <CodeBlock code={step.code} language={step.language} />}
 </div>
 </div>
 ))}
 </div>

 {remediation.references.length > 0 && (
 <div className="mt-10 pt-8 border-t border-border/10 px-1">
 <p className="text-[0.62rem] font-medium uppercase tracking-[0.25em] text-muted-foreground/30 mb-4">Verification Artifacts</p>
 <div className="flex flex-wrap gap-4">
 {remediation.references.map((ref) => (
 <a
 key={ref.url}
 href={ref.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-2 text-[0.72rem] font-medium text-emerald-600/60 hover:text-emerald-600 transition-colors bg-emerald-500/5 px-4 py-2 rounded-xl border border-emerald-500/10 hover:bg-emerald-500/10 group"
 >
 <ExternalLink className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
 {ref.title}
 </a>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
