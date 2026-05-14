"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { Check, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type BillingCycle = "monthly" | "annual";

interface PlanSelectorProps {
 currentPlan: string;
}

export function PlanSelector({ currentPlan }: PlanSelectorProps) {
 const [loading, setLoading] = useState(false);
 const [cycle, setCycle] = useState<BillingCycle>("monthly");

 const isPro = currentPlan === "pro" || currentPlan === "business" || currentPlan === "enterprise";

 async function handleUpgrade() {
 if (isPro) {
 toast.info("You are already on the Pro plan");
 return;
 }
 setLoading(true);
 const res = await api.createCheckoutSession(cycle === "annual" ? "pro_annual" : "pro");
 if (res.data?.url) {
 window.location.href = res.data.url;
 } else {
 toast.error(res.error || "Failed to start checkout");
 }
 setLoading(false);
 }

 if (isPro) {
 return (
 <div className="rounded-xl border border-teal-500/40 bg-teal-500/5 p-6">
 <div className="flex items-center gap-2 mb-2">
 <Zap className="w-5 h-5 text-teal-600" />
 <h3 className="text-lg font-bold">Pro Plan</h3>
 </div>
 <p className="text-sm text-muted-foreground">
 You have full access to all features. Manage your subscription via the billing portal above.
 </p>
 </div>
 );
 }

 const isAnnual = cycle === "annual";
 const price = isAnnual ? 279 : 29;
 const perMonth = isAnnual ? "23.25" : "29";

 return (
 <div className="space-y-5">
 {/* Billing cycle toggle */}
 <div className="flex items-center justify-center">
 <div className="inline-flex items-center rounded-full border border-border bg-secondary/50 p-1">
 <button
 onClick={() => setCycle("monthly")}
 className={`relative rounded-full px-5 py-2 text-sm font-semibold transition-all ${
 !isAnnual
 ? "bg-foreground text-background"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 Monthly
 </button>
 <button
 onClick={() => setCycle("annual")}
 className={`relative flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all ${
 isAnnual
 ? "bg-foreground text-background"
 : "text-muted-foreground hover:text-foreground"
 }`}
 >
 Annual
 <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold tracking-wide ${
 isAnnual ? "bg-teal-500 text-white" : "bg-teal-500/15 text-teal-700"
 }`}>
 SAVE $120
 </span>
 </button>
 </div>
 </div>

 {/* Plan cards */}
 <div className="grid gap-5 sm:grid-cols-2">
 {/* Free plan */}
 <div className="rounded-2xl border border-border bg-card p-6 flex flex-col">
 <h3 className="text-lg font-bold">Free</h3>
 <div className="mt-3 flex items-baseline gap-1">
 <span className="text-3xl font-bold tracking-tight">$0</span>
 <span className="text-sm text-muted-foreground">/forever</span>
 </div>
 <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
 Get started with essential website intelligence.
 </p>
 <ul className="mt-5 space-y-2.5 flex-1">
 {[
 "3 scans per day",
 "All 26 scanner modules",
 "1 verified domain",
 "1 watchlist, 1 collection",
 "3 saved reports",
 "3-day scan history",
 "1 API key (10 calls/day)",
 ].map((f) => (
 <li key={f} className="flex items-start gap-2 text-sm text-muted-foreground">
 <Check className="w-3.5 h-3.5 text-muted-foreground/60 mt-0.5 shrink-0" />
 {f}
 </li>
 ))}
 </ul>
 <div className="mt-6 rounded-xl border border-border bg-secondary/50 py-2.5 text-center text-sm font-semibold text-muted-foreground">
 Current plan
 </div>
 </div>

 {/* Pro plan */}
 <div className="relative rounded-2xl border-2 border-teal-500/60 bg-card p-6 flex flex-col">
 <div className="absolute -top-3 left-1/2 -translate-x-1/2">
 <span className="rounded-full bg-teal-600 px-4 py-1 text-[0.65rem] font-bold uppercase tracking-[0.15em] text-white">
 Recommended
 </span>
 </div>
 <div className="flex items-center gap-2">
 <Zap className="w-5 h-5 text-teal-600" />
 <h3 className="text-lg font-bold">Pro</h3>
 </div>
 <div className="mt-3 flex items-baseline gap-1">
 <span className="text-3xl font-bold tracking-tight">${price}</span>
 <span className="text-sm text-muted-foreground">/{isAnnual ? "year" : "month"}</span>
 </div>
 {isAnnual && (
 <p className="mt-1 text-xs text-teal-700 font-medium">${perMonth}/mo billed annually</p>
 )}
 <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
 Everything you need for professional website intelligence.
 </p>
 <ul className="mt-5 space-y-2.5 flex-1">
 {[
 "Unlimited scans",
 "Unlimited deep scans (500 pages)",
 "Unlimited attack surface audits",
 "Unlimited uptime + SSL + speed monitoring",
 "Bulk scanning (1,000 URLs/job)",
 "PDF export + scheduled reports",
 "Webhooks + enrichment",
 "10 API keys (10K calls/day)",
 "365-day scan history",
 ].map((f) => (
 <li key={f} className="flex items-start gap-2 text-sm">
 <Check className="w-3.5 h-3.5 text-teal-600 mt-0.5 shrink-0" />
 {f}
 </li>
 ))}
 </ul>
 <button
 onClick={handleUpgrade}
 disabled={loading}
 className="mt-6 w-full flex items-center justify-center gap-2 rounded-xl bg-teal-600 hover:bg-teal-500 py-3 text-sm font-semibold text-white transition-colors disabled:opacity-50"
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <>
 <Zap className="w-4 h-4" />
 Upgrade to Pro — ${price}/{isAnnual ? "year" : "month"}
 </>
 )}
 </button>
 </div>
 </div>
 </div>
 );
}
