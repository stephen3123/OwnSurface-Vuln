"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { useUserPlan } from "@/lib/dashboard-cache";
import { UsageMeter } from "@/components/billing/usage-meter";
import { PlanSelector } from "@/components/billing/plan-selector";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { CreditCard, ExternalLink, Loader2, Shield, Zap } from "lucide-react";
import { toast } from "sonner";

export default function BillingPage() {
 const [portalLoading, setPortalLoading] = useState(false);
 const { data: plan, isLoading: loading } = useUserPlan();

 async function handleManageBilling() {
 setPortalLoading(true);
 const res = await api.createPortalSession();
 if (res.data?.url) {
 window.location.href = res.data.url;
 } else {
 toast.error(res.error || "Failed to open billing portal");
 }
 setPortalLoading(false);
 }

 if (loading) {
 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 <CardSkeleton />
 <CardSkeleton />
 </div>
 );
 }

 const isPro = plan?.plan === "pro";

 return (
 <div className="dashboard-page mx-auto max-w-4xl space-y-6">
 {/* Current plan */}
 {plan && (
 <div className="shell-panel rounded-[1.5rem] p-6 sm:p-7">
 <div className="flex items-center justify-between mb-6">
 <div className="flex items-center gap-3">
 <div className={`flex items-center justify-center w-10 h-10 rounded-xl ${isPro ? "bg-teal-500/10" : "bg-secondary"}`}>
 {isPro ? <Zap className="w-5 h-5 text-teal-600" /> : <Shield className="w-5 h-5 text-muted-foreground" />}
 </div>
 <div>
 <h3 className="text-lg font-semibold">Current Plan</h3>
 <p className={`font-medium capitalize mt-0.5 ${isPro ? "text-teal-700" : "text-muted-foreground"}`}>
 {plan.plan}
 </p>
 </div>
 </div>
 {isPro && (
 <button
 onClick={handleManageBilling}
 disabled={portalLoading}
 className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
 >
 {portalLoading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <CreditCard className="w-4 h-4" />
 )}
 Manage Billing
 <ExternalLink className="w-3.5 h-3.5" />
 </button>
 )}
 </div>

 {/* Usage meters */}
 <div className="space-y-4">
 <UsageMeter used={plan.scans_today} limit={plan.scans_limit} label="Daily Scans" />
 <UsageMeter used={plan.watchlists_count} limit={plan.watchlists_limit} label="Watchlists" />
 {isPro && (
 <>
 <UsageMeter used={plan.api_calls_today} limit={plan.api_calls_limit} label="API Calls Today" />
 </>
 )}
 </div>

 {/* Feature access summary for current plan */}
 <div className="mt-6 pt-6 border-t border-border">
 <h4 className="text-sm font-medium text-muted-foreground mb-3">Feature Access</h4>
 <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
 {[
 { label: "Deep Scan", active: plan.has_deep_scan },
 { label: "Attack Surface", active: plan.has_attack_surface },
 { label: "Monitoring", active: plan.has_monitoring },
 { label: "Bulk Scan", active: plan.has_bulk_scan },
 { label: "PDF Export", active: plan.has_pdf_export },
 { label: "Webhooks", active: plan.has_webhooks },
 { label: "MCP Server", active: plan.has_mcp },
 { label: "Enrichment API", active: plan.has_enrichment },
 ].map(({ label, active }) => (
 <div
 key={label}
 className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${
 active
 ? "bg-teal-500/10 text-teal-700"
 : "bg-secondary text-muted-foreground"
 }`}
 >
 <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-teal-500" : "bg-muted-foreground/40"}`} />
 {label}
 </div>
 ))}
 </div>
 </div>

 {/* Plan details */}
 <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
 <span>History: {plan.history_days === 365 ? "1 year" : `${plan.history_days} days`}</span>
 <span>Reports: {plan.reports_limit === -1 ? "Unlimited" : plan.reports_limit}</span>
 <span>Collections: {plan.collections_limit === -1 ? "Unlimited" : plan.collections_limit}</span>
 </div>
 </div>
 )}

 {/* Upgrade / plan selector */}
 <div>
 <h2 className="dashboard-section-title mb-4">
 {isPro ? "Plan Details" : "Upgrade Your Plan"}
 </h2>
 <PlanSelector currentPlan={plan?.plan || "free"} />
 </div>
 </div>
 );
}
