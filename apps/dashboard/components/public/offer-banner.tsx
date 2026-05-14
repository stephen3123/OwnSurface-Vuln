"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { X, ArrowRight } from "lucide-react";

const STORAGE_KEY = "ownsurface_offer_dismissed";
const RETURN_STORAGE_KEY = "ownsurface_offer_seen";

export function OfferBanner() {
 const [dismissed, setDismissed] = useState(true); // start hidden to avoid flash
 const [isReturn, setIsReturn] = useState(false);
 const [mounted, setMounted] = useState(false);

 useEffect(() => {
 setMounted(true);
 const wasDismissed = localStorage.getItem(STORAGE_KEY);
 const wasSeen = localStorage.getItem(RETURN_STORAGE_KEY);

 if (wasDismissed) {
 setDismissed(true);
 // If they dismissed before and come back, show the "still here?" variant
 if (wasSeen) {
 setIsReturn(true);
 // Show the return variant after a 2-second delay on their next visit
 const lastDismissed = parseInt(wasDismissed, 10);
 const hoursSince = (Date.now() - lastDismissed) / (1000 * 60 * 60);
 if (hoursSince > 1) {
 // More than 1 hour since dismissal — show return variant
 localStorage.removeItem(STORAGE_KEY);
 setDismissed(false);
 }
 }
 } else {
 setDismissed(false);
 localStorage.setItem(RETURN_STORAGE_KEY, "1");
 }
 }, []);

 function handleDismiss() {
 setDismissed(true);
 localStorage.setItem(STORAGE_KEY, String(Date.now()));
 }

 if (!mounted || dismissed) return null;

 return (
 <div className="relative z-[60] bg-[#050505] border-b border-white/5 text-white shadow-[0_4px_30px_rgba(20,184,166,0.1)]">
 {/* Subtle shimmer gradient overlay */}
 <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,transparent_40%,rgba(20,184,166,0.08)_45%,rgba(20,184,166,0.13)_50%,rgba(20,184,166,0.08)_55%,transparent_60%)] animate-[banner-shimmer_8s_ease-in-out_infinite]" />

 <div className="relative mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-2 sm:px-6 lg:px-10">
 {/* Main content */}
 <div className="flex flex-1 items-center justify-center gap-x-4 gap-y-1 text-center text-[0.78rem] sm:text-[0.82rem]">
 {isReturn ? (
 <>
 <span className="text-white/70">Still here?</span>
 <span className="font-semibold">
 Replace all 6 tools — <span className="text-teal-300">$16/mo</span>
 </span>
 </>
 ) : (
 <>
 <span className="hidden sm:inline text-white/60">
 6 tools. $300+/mo.
 </span>
 <span className="font-semibold tracking-[-0.01em]">
 Replace all 6 —{" "}
 <span className="text-teal-300">$16/mo</span> with 60% off
 annual.
 </span>
 </>
 )}

 <Link
 href="/pricing?offer=annual60"
 className="group inline-flex items-center gap-1.5 rounded-full bg-white/[0.12] px-3.5 py-1 text-[0.72rem] font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/[0.2]"
 >
 <span className="hidden sm:inline">
 {isReturn ? "Switch now" : "See the deal"}
 </span>
 <span className="sm:hidden">Deal</span>
 <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
 </Link>
 </div>

 {/* Dismiss button */}
 <button
 onClick={handleDismiss}
 className="shrink-0 rounded-full p-1 text-white/40 transition-colors hover:bg-card/50 hover:text-white/70"
 aria-label="Dismiss offer"
 >
 <X className="h-3.5 w-3.5" />
 </button>
 </div>
 </div>
 );
}
