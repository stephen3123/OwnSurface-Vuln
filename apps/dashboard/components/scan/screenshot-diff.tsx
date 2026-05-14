"use client";

import { useState } from "react";
import { SplitSquareHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ScreenshotDiffProps {
 before: string; // base64 PNG
 after: string; // base64 PNG
 beforeDate: string;
 afterDate: string;
}

function formatDate(iso: string): string {
 return new Date(iso).toLocaleDateString("en-US", {
 month: "short",
 day: "numeric",
 year: "numeric",
 });
}

export function ScreenshotDiff({ before, after, beforeDate, afterDate }: ScreenshotDiffProps) {
 const [sliderPos, setSliderPos] = useState(50);
 const [mode, setMode] = useState<"slider" | "side">("slider");

 if (!before || !after) return null;

 const beforeSrc = `data:image/png;base64,${before}`;
 const afterSrc = `data:image/png;base64,${after}`;

 return (
 <div className="shell-panel space-y-6 rounded-[2rem] p-8 border-border/40 transition-all hover:bg-card/50">
 <div className="flex items-center justify-between px-1">
 <div className="flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.2em] text-muted-foreground/60">
 <SplitSquareHorizontal className="h-4.5 w-4.5 text-purple-500/60" />
 Visual Comparison Engine
 </div>
 <div className="flex gap-1 rounded-xl border border-border/20 bg-card/50 p-1 ">
 <button
 onClick={() => setMode("slider")}
 className={cn(
 "rounded-lg px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-widest transition-all",
 mode === "slider" ? "bg-card text-foreground " : "text-muted-foreground/40 hover:text-foreground/60"
 )}
 >
 Slider
 </button>
 <button
 onClick={() => setMode("side")}
 className={cn(
 "rounded-lg px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-widest transition-all",
 mode === "side" ? "bg-card text-foreground " : "text-muted-foreground/40 hover:text-foreground/60"
 )}
 >
 Side by side
 </button>
 </div>
 </div>

 {mode === "slider" ? (
 <div className="relative overflow-hidden rounded-2xl border border-border/20 ">
 {/* After image (full) */}
 <img src={afterSrc} alt="After" className="block w-full" />

 {/* Before image (clipped) */}
 <div
 className="absolute inset-0 overflow-hidden"
 style={{ width: `${sliderPos}%` }}
 >
 <img
 src={beforeSrc}
 alt="Before"
 className="block w-full"
 style={{ minWidth: "100%", width: `${10000 / sliderPos}%`, maxWidth: `${10000 / sliderPos}%` }}
 />
 </div>

 {/* Slider line */}
 <div
 className="absolute inset-y-0 z-10 w-0.5 bg-purple-500/60"
 style={{ left: `${sliderPos}%` }}
 >
 <div className="absolute left-1/2 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-purple-500/60 bg-card ">
 <SplitSquareHorizontal className="h-4 w-4 text-purple-600/60" />
 </div>
 </div>

 {/* Slider input */}
 <input
 type="range"
 min={5}
 max={95}
 value={sliderPos}
 onChange={(e) => setSliderPos(Number(e.target.value))}
 className="absolute inset-0 z-20 h-full w-full cursor-ew-resize opacity-0"
 />

 {/* Labels */}
 <div className="absolute left-3 top-3 z-10 rounded-xl bg-black/50 backdrop-blur-sm px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-widest text-white/80">
 Before · {formatDate(beforeDate)}
 </div>
 <div className="absolute right-3 top-3 z-10 rounded-xl bg-black/50 backdrop-blur-sm px-3 py-1.5 text-[0.6rem] font-black uppercase tracking-widest text-white/80">
 After · {formatDate(afterDate)}
 </div>
 </div>
 ) : (
 <div className="grid gap-4 md:grid-cols-2">
 <div className="space-y-3">
 <div className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30 px-1">
 Before · {formatDate(beforeDate)}
 </div>
 <img
 src={beforeSrc}
 alt="Before"
 className="w-full rounded-2xl border border-border/20 "
 />
 </div>
 <div className="space-y-3">
 <div className="text-[0.62rem] font-black uppercase tracking-[0.25em] text-muted-foreground/30 px-1">
 After · {formatDate(afterDate)}
 </div>
 <img
 src={afterSrc}
 alt="After"
 className="w-full rounded-2xl border border-border/20 "
 />
 </div>
 </div>
 )}
 </div>
 );
}
