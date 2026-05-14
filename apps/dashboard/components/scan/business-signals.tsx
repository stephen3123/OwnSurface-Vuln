"use client";

import type { BusinessSignal } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface BusinessSignalsProps {
 signals: BusinessSignal[];
}

export function BusinessSignals({ signals }: BusinessSignalsProps) {
 if (signals.length === 0) return null;

 return (
 <div className="shell-panel rounded-[2rem] p-8 h-full border border-border ">
 <div className="flex items-center gap-2 mb-8 text-[0.7rem] font-black uppercase tracking-[0.3em] text-foreground px-1 underline decoration-2 underline-offset-8">
 Market Signals
 </div>

 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 px-1">
 {signals.map((signal, i) => {
 return (
 <div key={i} className="group relative flex items-center gap-4 p-4 rounded-2xl bg-card border border-border transition-all hover:bg-muted/30">
 <div className="relative h-10 w-10 shrink-0 rounded-sm bg-muted border border-border flex items-center justify-center font-black text-[0.6rem] text-muted-foreground uppercase tracking-widest">
 {signal.type.substring(0, 3)}
 </div>

 <div className="flex-1 min-w-0">
 <div className="flex items-center justify-between gap-2 mb-0.5">
 <p className="text-sm font-black tracking-tight text-foreground uppercase">{signal.label}</p>
 </div>
 <p className="text-[0.7rem] leading-relaxed text-muted-foreground font-black uppercase tracking-tight line-clamp-1">{signal.detail}</p>
 </div>

 <div className="shrink-0 flex flex-col items-end gap-1">
 <div className="stat-number text-[0.75rem] font-black tracking-tighter text-teal-600">{signal.confidence}%</div>
 <div className="text-[0.55rem] font-black uppercase tracking-widest text-muted-foreground/40 font-mono">Conf</div>
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );
}
