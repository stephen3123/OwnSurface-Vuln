"use client";

import type { Issue } from "@/lib/issue-generator";
import { IssueSeverityBadge } from "./issue-severity-badge";
import { formatRelative, cn } from "@/lib/utils";
import * as Dialog from "@radix-ui/react-dialog";

interface IssueDetailDrawerProps {
 issue: Issue | null;
 open: boolean;
 onClose: () => void;
 onStatusChange?: (id: string, status: Issue["status"]) => void;
}

const STATUS_STYLES: Record<Issue["status"], string> = {
 open: "bg-red-50 text-red-800 border-red-200",
 resolved: "bg-emerald-50 text-emerald-800 border-emerald-200",
 ignored: "bg-slate-50 text-slate-800 border-slate-200",
};

export function IssueDetailDrawer({ issue, open, onClose, onStatusChange }: IssueDetailDrawerProps) {
 function handleOpenChange(isOpen: boolean) {
 if (!isOpen) {
 setTimeout(() => onClose(), 0);
 }
 }

 return (
 <Dialog.Root open={open} onOpenChange={handleOpenChange}>
 <Dialog.Portal>
 {/* Backdrop */}
 <Dialog.Overlay 
 className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm transition-opacity duration-300"
 />

 {/* Drawer */}
 <Dialog.Content
 className="fixed inset-y-0 right-0 z-50 flex w-full max-w-xl flex-col bg-card border-l border-border transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right rounded-none"
 >
 {/* Header */}
 <div className="relative flex flex-col p-10 pb-8 bg-muted/5 overflow-hidden">
 <div className="flex items-start justify-between mb-6 relative z-10">
 <div className="flex-1 min-w-0 pr-6">
 <Dialog.Title className="text-3xl font-semibold tracking-tighter leading-tight text-foreground">{issue?.title || "Intelligence Detail"}</Dialog.Title>
 <Dialog.Description className="sr-only">Detailed vulnerability analysis and remediation steps.</Dialog.Description>
 </div>
 <Dialog.Close asChild>
 <button className="shrink-0 rounded-2xl p-3 bg-muted border border-border text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground active:scale-95 ">
 X
 </button>
 </Dialog.Close>
 </div>

 {issue && (
 <div className="flex items-center gap-4 relative z-10">
 <IssueSeverityBadge severity={issue.severity} size="md" />
 <span className="text-[0.62rem] font-medium uppercase tracking-[0.2em] text-muted-foreground border border-border rounded-lg px-3 py-1 bg-card ">{issue.category}</span>
 </div>
 )}
 </div>

 {issue && (
 <div className="flex-1 overflow-y-auto px-10 py-0 space-y-10 pb-12 relative z-10">
 {/* Metadata Grid */}
 <div className="grid grid-cols-1 gap-4">
 {[
 { label: "Target Infrastructure", value: issue.domain },
 { label: "Intelligence Vector", value: issue.source },
 { label: "Remediation Protocol", value: issue.auto_fixable ? "Automated Patching Available" : "Manual Intervention Required" },
 ].map((item, idx) => (
 <div key={idx} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-muted/30 border border-border transition-all hover:bg-muted/50">
 <div className="flex items-center gap-4">
 <span className="text-[0.7rem] font-medium uppercase tracking-[0.15em] text-muted-foreground/80 leading-none">{item.label}</span>
 </div>
 <span className="text-[0.8rem] font-medium text-foreground">{item.value}</span>
 </div>
 ))}
 </div>

 {/* Description Section */}
 <div>
 <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted-foreground/60 mb-4 ml-1">Technical Forensics</p>
 <div className="rounded-[2rem] bg-muted/10 p-8 border border-border leading-relaxed text-[0.92rem] text-foreground whitespace-pre-wrap ">
 {issue.description}
 </div>
 </div>

 {/* Timeline View */}
 <div>
 <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted-foreground/60 mb-4 ml-1">Incident Horizon</p>
 <div className="flex items-center gap-5 rounded-[1.5rem] bg-muted/30 border border-border p-5 transition-all hover:bg-muted/50">
 <div>
 <p className="text-[0.65rem] font-medium uppercase tracking-[0.15em] text-muted-foreground/80 leading-none mb-1.5">Initial Detection Timestamp</p>
 <p className="text-[0.9rem] font-medium text-foreground">{formatRelative(issue.detected_at)}</p>
 </div>
 </div>
 </div>

 {/* Status Transition Control */}
 <div>
 <p className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-muted-foreground/60 mb-4 ml-1">Lifecycle Operations</p>
 <div className="grid grid-cols-2 gap-4">
 {(["open", "resolved", "ignored"] as Issue["status"][]).map((status) => (
 <button
 key={status}
 onClick={() => onStatusChange?.(issue.id, status)}
 className={cn(
 "px-5 py-4 rounded-2.5xl text-[0.65rem] font-medium uppercase tracking-[0.2em] border transition-all flex items-center justify-center gap-3 active:scale-95 text-foreground",
 issue.status === status 
 ? STATUS_STYLES[status]
 : "bg-muted/20 text-muted-foreground border-border hover:bg-muted/40 hover:text-foreground"
 )}
 >
 {status}
 </button>
 ))}
 </div>
 </div>
 {/* Fix It Suggestion */}
 {issue.auto_fixable && (
 <div className="relative overflow-hidden rounded-[2rem] border border-emerald-500/20 bg-emerald-500/5 p-6 ">
 <p className="relative z-10 text-[0.8rem] font-medium uppercase tracking-widest text-emerald-600 mb-2 leading-none">Smart Remediation</p>
 <p className="relative z-10 text-xs leading-relaxed text-emerald-600/60">
 This issue can be automatically resolved via patch injection. Fix available in the next deployment cycle.
 </p>
 </div>
 )}
 </div>
 )}
 </Dialog.Content>
 </Dialog.Portal>
 </Dialog.Root>
 );
}
