import { cn } from "@/lib/utils";

interface OwnSurfaceLogoProps {
 className?: string;
 markClassName?: string;
 showWordmark?: boolean;
 subtitle?: string | null;
 tone?: "light" | "dark";
 markStyle?: "tile" | "bare";
 wordmarkStyle?: "stacked" | "inline-domain";
 nameClassName?: string;
 subtitleClassName?: string;
}

export function OwnSurfaceLogo({
 className,
 markClassName,
 showWordmark = true,
 subtitle = null,
 tone = "light",
 markStyle = "tile",
 wordmarkStyle = "stacked",
 nameClassName,
 subtitleClassName,
}: OwnSurfaceLogoProps) {
 const isDark = tone === "dark";
 const isBare = markStyle === "bare";
 const isInlineDomain = wordmarkStyle === "inline-domain";

 return (
 <div className={cn("flex items-center gap-3", className)}>
 <div
 className={cn(
 isBare
 ? "flex h-12 w-12 items-center justify-center"
 : "relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[1rem] bg-[linear-gradient(145deg,rgba(7,18,20,0.98),rgba(15,40,42,0.94))] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_16px_34px_rgba(9,23,22,0.18)] ring-1 ring-black/5",
 markClassName
 )}
 >
 {!isBare ? (
 <div className="absolute inset-[4px] rounded-[0.82rem] border border-white/8 bg-[radial-gradient(circle_at_24%_18%,rgba(56,243,220,0.2),transparent_40%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0))]" />
 ) : null}
 <svg viewBox="0 0 64 64" aria-hidden="true" className={cn("relative", isBare ? "h-11 w-11" : "h-8 w-8")} fill="none">
 <path
 d="M13 33c0-10.9 8.9-19.8 19.8-19.8 6.1 0 11.6 2.8 15.2 7.2"
 stroke={isBare ? "rgba(12,22,24,0.22)" : "rgba(215,255,250,0.18)"}
 strokeWidth="2.2"
 strokeLinecap="round"
 />
 <path
 d="M16.8 36.7c0 9.1 7.4 16.5 16.5 16.5 5.6 0 10.6-2.8 13.6-7"
 stroke={isBare ? "rgba(12,22,24,0.18)" : "rgba(215,255,250,0.16)"}
 strokeWidth="2"
 strokeLinecap="round"
 />
 <path
 d="M20.8 31.9c0-6.8 5.5-12.3 12.3-12.3 3.9 0 7.5 1.8 9.8 4.7"
 stroke={isBare ? "rgba(18,184,166,0.55)" : "rgba(56,243,220,0.4)"}
 strokeWidth="1.8"
 strokeLinecap="round"
 />
 <path
 d="M43.4 21.7c-2.1-2.9-5.5-4.6-9.8-4.6-5.8 0-10 3-10 7.3 0 3.8 2.8 5.7 8.3 7l3.2.8c3 .7 4.6 1.5 4.6 3.6 0 2.5-2.7 4.4-6.8 4.4-3.9 0-7.1-1.5-9.5-4.5"
 stroke={isBare ? "rgba(11,23,24,0.94)" : "rgba(247,252,252,0.96)"}
 strokeWidth={isBare ? "3.3" : "3.5"}
 strokeLinecap="round"
 strokeLinejoin="round"
 />
 <circle cx="46.2" cy="19.3" r="3.25" fill={isBare ? "rgb(20 184 166)" : "rgb(56 243 220)"} />
 <circle
 cx="46.2"
 cy="19.3"
 r="6.6"
 stroke={isBare ? "rgba(20,184,166,0.18)" : "rgba(56,243,220,0.22)"}
 strokeWidth="1.4"
 />
 </svg>
 </div>

 {showWordmark ? (
 <div>
 {isInlineDomain ? (
 <div
 className={cn(
 "text-[1.05rem] font-semibold tracking-[-0.05em]",
 isDark ? "text-white" : "text-foreground",
 nameClassName
 )}
 >
 <span>OwnSurface</span>
 </div>
 ) : (
 <>
 <div
 className={cn(
 "text-sm font-semibold uppercase tracking-[0.28em]",
 isDark ? "text-white/82" : "text-muted-foreground",
 nameClassName
 )}
 >
 OwnSurface
 </div>
 {subtitle ? (
 <div
 className={cn(
 "text-base font-semibold tracking-[-0.04em]",
 isDark ? "text-white" : "text-foreground",
 subtitleClassName
 )}
 >
 {subtitle}
 </div>
 ) : null}
 </>
 )}
 </div>
 ) : null}
 </div>
 );
}
