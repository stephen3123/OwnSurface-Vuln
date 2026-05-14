"use client";

import { CheckCircle2, Loader2, Circle } from "lucide-react";

export type ScanStage = "connecting" | "crawling" | "analyzing" | "complete";

interface ScanProgressStagesProps {
 currentStage: ScanStage;
 progress?: string; // e.g. "12/47 pages"
 url?: string;
}

const STAGES: { id: ScanStage; label: string }[] = [
 { id: "connecting", label: "Connecting" },
 { id: "crawling", label: "Crawling" },
 { id: "analyzing", label: "Analyzing" },
 { id: "complete", label: "Complete" },
];

function getStageIndex(stage: ScanStage): number {
 return STAGES.findIndex((s) => s.id === stage);
}

export function ScanProgressStages({ currentStage, progress, url }: ScanProgressStagesProps) {
 const currentIndex = getStageIndex(currentStage);
 const progressPercent = currentStage === "complete" ? 100 : ((currentIndex + 0.5) / STAGES.length) * 100;

 return (
 <div className="shell-panel rounded-[1.6rem] px-6 py-8 sm:py-10">
 {/* Animated scanner ring */}
 <div className="mx-auto mb-6 w-20 h-20 relative">
 <div className="absolute inset-0 border-4 border-teal-500/15 rounded-full" />
 {currentStage !== "complete" ? (
 <div className="absolute inset-0 border-4 border-teal-500 rounded-full border-t-transparent animate-spin" />
 ) : (
 <div className="absolute inset-0 flex items-center justify-center">
 <CheckCircle2 className="h-10 w-10 text-emerald-500" />
 </div>
 )}
 </div>

 {/* URL */}
 {url && (
 <p className="mx-auto mb-2 max-w-lg wrap-anywhere text-center text-lg font-bold text-foreground">
 {currentStage === "complete" ? "Scan complete" : `Scanning ${url}`}
 </p>
 )}

 {/* Progress detail */}
 {progress && currentStage !== "complete" && (
 <p className="mb-6 text-center text-sm text-muted-foreground">{progress}</p>
 )}

 {/* Progress bar */}
 <div className="mx-auto mb-6 max-w-md">
 <div className="h-2 w-full overflow-hidden rounded-full bg-teal-500/10">
 <div
 className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-400 transition-all duration-700 ease-out"
 style={{ width: `${progressPercent}%` }}
 />
 </div>
 </div>

 {/* Stage indicators */}
 <div className="mx-auto flex max-w-md items-center justify-between">
 {STAGES.map((stage, index) => {
 const isComplete = index < currentIndex || currentStage === "complete";
 const isCurrent = index === currentIndex && currentStage !== "complete";

 return (
 <div key={stage.id} className="flex flex-col items-center gap-1.5">
 <div className="flex h-8 w-8 items-center justify-center">
 {isComplete ? (
 <CheckCircle2 className="h-5 w-5 text-emerald-500" />
 ) : isCurrent ? (
 <Loader2 className="h-5 w-5 animate-spin text-teal-500" />
 ) : (
 <Circle className="h-5 w-5 text-muted-foreground/30" />
 )}
 </div>
 <span
 className={`text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${
 isComplete
 ? "text-emerald-600"
 : isCurrent
 ? "text-teal-600"
 : "text-muted-foreground/50"
 }`}
 >
 {stage.label}
 </span>
 </div>
 );
 })}
 </div>
 </div>
 );
}
