"use client";

import { useState } from "react";
import { Mail, Copy, Check, Users, Phone } from "lucide-react";

interface EmailPatternsData {
 found_emails: string[];
 pattern: string | null;
 confidence: number;
 team_page_url: string | null;
 contact_page_url: string | null;
}

interface EmailPatternsProps {
 emailPatterns: EmailPatternsData;
}

import { cn } from "@/lib/utils";

function ConfidenceBadge({ confidence }: { confidence: number }) {
 if (confidence >= 0.7) {
 return (
 <span className="inline-flex px-2 py-0.5 rounded-md border bg-emerald-500/5 text-emerald-600/70 border-emerald-500/20 text-[0.6rem] font-black uppercase tracking-widest transition-all hover:bg-emerald-500/10">
 High confidence
 </span>
 );
 }
 if (confidence >= 0.4) {
 return (
 <span className="inline-flex px-2 py-0.5 rounded-md border bg-orange-500/5 text-orange-600/70 border-orange-500/20 text-[0.6rem] font-black uppercase tracking-widest transition-all hover:bg-orange-500/10">
 Medium confidence
 </span>
 );
 }
 return (
 <span className="inline-flex px-2 py-0.5 rounded-md border bg-slate-500/5 text-slate-500/70 border-border/40 text-[0.6rem] font-black uppercase tracking-widest transition-all hover:bg-slate-500/10">
 Low confidence
 </span>
 );
}

function CopyableEmail({ email }: { email: string }) {
 const [copied, setCopied] = useState(false);

 function handleCopy() {
 try {
 navigator.clipboard.writeText(email);
 } catch {
 const textarea = document.createElement("textarea");
 textarea.value = email;
 textarea.style.position = "fixed";
 textarea.style.opacity = "0";
 document.body.appendChild(textarea);
 textarea.select();
 document.execCommand("copy");
 document.body.removeChild(textarea);
 }
 setCopied(true);
 setTimeout(() => setCopied(false), 2000);
 }

 return (
 <button
 onClick={handleCopy}
 className={cn(
 "group relative flex items-center gap-3 px-4 py-2 rounded-xl border transition-all duration-300",
 copied
 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600"
 : "bg-card/50 border-border/40 hover:bg-card hover:border-border/60 text-muted-foreground/80 hover:text-foreground "
 )}
 >
 <Mail className={cn("h-3.5 w-3.5", copied ? "text-emerald-500" : "text-blue-500/40 opacity-40 transition-opacity group-hover:opacity-100")} />
 <span className="text-[0.8rem] font-mono font-bold tracking-tight">{email}</span>
 <div className="flex w-3.5 justify-center">
 {copied ? (
 <Check className="h-3 w-3 animate-in zoom-in duration-300" />
 ) : (
 <Copy className="h-3 w-3 opacity-0 transition-all duration-300 group-hover:opacity-100" />
 )}
 </div>
 </button>
 );
}

export function EmailPatternsCard({ emailPatterns }: EmailPatternsProps) {
 if (!emailPatterns || (emailPatterns.found_emails.length === 0 && !emailPatterns.pattern)) {
 return null;
 }

 return (
 <div className="shell-panel flex h-full flex-col p-8 rounded-[2rem] border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60 px-1">
 <Mail className="h-4.5 w-4.5 text-blue-500/60" />
 Communication Intelligence
 </div>

 {/* Pattern detection */}
 {emailPatterns.pattern && (
 <div className="relative mb-10 overflow-hidden rounded-[1.6rem] border border-blue-500/10 bg-blue-500/5 p-6 group transition-all hover:bg-blue-500/8">
 <div className="relative z-10">
 <div className="flex items-center justify-between mb-4">
 <span className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-blue-600/40">Architectural Signature</span>
 <ConfidenceBadge confidence={emailPatterns.confidence} />
 </div>
 <div className="flex items-baseline gap-2">
 <code className="text-xl font-mono font-black text-blue-700/80 tracking-tighter">
 {emailPatterns.pattern}
 </code>
 </div>
 </div>
 <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -translate-y-16 translate-x-16 blur-3xl" />
 </div>
 )}

 {/* Found emails */}
 {emailPatterns.found_emails.length > 0 && (
 <div className="mb-10 px-1">
 <h4 className="text-[0.62rem] font-bold uppercase tracking-[0.25em] text-muted-foreground/40 mb-6">
 Public Communication Channels
 </h4>
 <div className="flex flex-wrap gap-3">
 {emailPatterns.found_emails.map((email) => (
 <CopyableEmail key={email} email={email} />
 ))}
 </div>
 </div>
 )}

 {/* Page links */}
 {(emailPatterns.team_page_url || emailPatterns.contact_page_url) && (
 <div className="mt-auto pt-4 flex flex-col gap-3 px-1">
 <p className="text-[0.6rem] font-black text-muted-foreground/20 uppercase tracking-[0.2em] mb-1">Source Nodes Discovered</p>
 <div className="flex flex-wrap gap-3">
 {emailPatterns.team_page_url && (
 <a
 href={emailPatterns.team_page_url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/40 bg-card/50 text-[0.75rem] font-bold text-muted-foreground/60 transition-all hover:bg-card hover:text-foreground hover:border-border/60 "
 >
 <Users className="h-4 w-4" />
 Infrastructure Team
 </a>
 )}
 {emailPatterns.contact_page_url && (
 <a
 href={emailPatterns.contact_page_url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-3 px-4 py-2.5 rounded-xl border border-border/40 bg-card/50 text-[0.75rem] font-bold text-muted-foreground/60 transition-all hover:bg-card hover:text-foreground hover:border-border/60 "
 >
 <Phone className="h-4 w-4" />
 Channel Directory
 </a>
 )}
 </div>
 </div>
 )}
 </div>
 );
}
