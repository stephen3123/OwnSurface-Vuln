"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
 CheckCircle2,
 Scan,
 Globe,
 Eye,
 Shield,
 ArrowRight,
 X,
} from "lucide-react";

interface OnboardingGuideProps {
 hasScans: boolean;
 hasVerifiedDomains: boolean;
 hasWatchlists: boolean;
 hasDeepScans: boolean;
}

export function OnboardingGuide({
 hasScans,
 hasVerifiedDomains,
 hasWatchlists,
 hasDeepScans,
}: OnboardingGuideProps) {
 const [dismissed, setDismissed] = useState(false);

 useEffect(() => {
 const stored = localStorage.getItem("xray-onboarding-dismissed");
 if (stored === "true") setDismissed(true);
 }, []);

 const steps = [
 {
 id: "scan",
 label: "Run your first scan",
 description: "Enter any URL to get a full intelligence report in seconds.",
 href: "/dashboard/scan",
 icon: Scan,
 completed: hasScans,
 },
 {
 id: "verify",
 label: "Verify a domain you own",
 description: "Unlock deep scanning, monitoring, and unified web-security workflows for your sites.",
 href: "/dashboard/domains",
 icon: Globe,
 completed: hasVerifiedDomains,
 },
 {
 id: "watchlist",
 label: "Set up a watchlist",
 description: "Monitor competitors or key sites for technology and security changes.",
 href: "/dashboard/watchlist",
 icon: Eye,
 completed: hasWatchlists,
 },
 {
 id: "deep",
 label: "Launch Web Security",
 description: "Run security scan, pentest, or API security on a verified domain from one place.",
 href: "/dashboard/domain-scan",
 icon: Shield,
 completed: hasDeepScans,
 },
 ];

 const completedCount = steps.filter((s) => s.completed).length;
 const allComplete = completedCount === steps.length;
 const progressPercent = (completedCount / steps.length) * 100;

 if (dismissed || allComplete) return null;

 function handleDismiss() {
 setDismissed(true);
 localStorage.setItem("xray-onboarding-dismissed", "true");
 }

 return (
 <div className="shell-panel rounded-[1.7rem]">
 <div className="p-6">
 {/* Header */}
 <div className="flex items-start justify-between gap-4">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[hsl(var(--ink))]">
 <CheckCircle2 className="h-5 w-5 text-teal-300" />
 </div>
 <div>
 <h3 className="text-[0.95rem] font-semibold text-foreground">Get started with OwnSurface</h3>
 <p className="text-sm text-muted-foreground">
 {completedCount} of {steps.length} steps complete
 </p>
 </div>
 </div>
 <button
 onClick={handleDismiss}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
 aria-label="Dismiss onboarding"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 {/* Progress bar */}
 <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-teal-500/10">
 <div
 className="h-full rounded-full bg-teal-600 transition-all duration-700 ease-out"
 style={{ width: `${Math.max(progressPercent, 4)}%` }}
 />
 </div>

 {/* Steps */}
 <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
 {steps.map((step) => {
 const StepIcon = step.icon;
 return (
 <Link
 key={step.id}
 href={step.href}
 className={`group flex items-start gap-3 rounded-[1.25rem] border p-4 transition-all ${
 step.completed
 ? "border-emerald-500/20 bg-emerald-500/5"
 : "border-border bg-background hover:bg-accent hover:border-teal-500/25"
 }`}
 >
 <div
 className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.7rem] ${
 step.completed
 ? "bg-emerald-500/12 text-emerald-600"
 : "bg-teal-500/10 text-teal-400 group-hover:bg-teal-500/15"
 }`}
 >
 {step.completed ? (
 <CheckCircle2 className="h-4 w-4" />
 ) : (
 <StepIcon className="h-4 w-4" />
 )}
 </div>
 <div className="min-w-0 flex-1">
 <p
 className={`text-sm font-semibold ${
 step.completed ? "text-emerald-700 line-through decoration-emerald-400/40" : "text-foreground"
 }`}
 >
 {step.label}
 </p>
 <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
 {step.description}
 </p>
 </div>
 {!step.completed && (
 <ArrowRight className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity" />
 )}
 </Link>
 );
 })}
 </div>
 </div>
 </div>
 );
}
