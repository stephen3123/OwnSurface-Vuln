"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import { Shield, AlertTriangle, FileCheck } from "lucide-react";

interface ScopeContractFormProps {
 domain: string;
 onContractSigned: (contractId: string) => void;
 onCancel: () => void;
}

type ScopeMode = "root_only" | "include_subs" | "custom_list";

const SCOPE_MODES = [
 {
 value: "root_only" as ScopeMode,
 label: "Root Domain Only",
 description: "Only scan the root domain (safest option)",
 },
 {
 value: "include_subs" as ScopeMode,
 label: "Include Subdomains",
 description: "Scan root domain and discovered subdomains you own",
 },
 {
 value: "custom_list" as ScopeMode,
 label: "Custom Target List",
 description: "Specify exactly which targets to include/exclude",
 },
];

export function ScopeContractForm({ domain, onContractSigned, onCancel }: ScopeContractFormProps) {
 const [scopeMode, setScopeMode] = useState<ScopeMode>("root_only");
 const [excludedTargets, setExcludedTargets] = useState("");
 const [includeThirdParty, setIncludeThirdParty] = useState(false);
 const [checks, setChecks] = useState({ ownership: false, authorization: false, liability: false });
 const [signing, setSigning] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const allChecked = checks.ownership && checks.authorization && checks.liability;

 const signContract = async () => {
 if (!allChecked) return;
 setSigning(true);
 setError(null);

 try {
 const excluded = excludedTargets
 .split("\n")
 .map((s) => s.trim())
 .filter(Boolean);

 const res = await api.request<{ contract: { id: string } }>("/offensive-scan/scope-contract", {
 method: "POST",
 body: JSON.stringify({
 domain,
 scope_mode: scopeMode,
 excluded_targets: excluded,
 include_third_party: includeThirdParty,
 }),
 });

 if (!res.data?.contract?.id) {
 setError("Failed to create scope contract");
 return;
 }

 onContractSigned(res.data.contract.id);
 } catch (err: any) {
 setError(err?.message || "Network error — please try again");
 } finally {
 setSigning(false);
 }
 };

 return (
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500/10">
 <FileCheck className="h-5 w-5 text-teal-400" />
 </div>
 <div>
 <h3 className="text-lg font-semibold text-foreground">Scope Contract Required</h3>
 <p className="text-sm text-muted-foreground">
 Define what is in-scope before running offensive tests on <span className="text-foreground font-medium">{domain}</span>
 </p>
 </div>
 </div>

 {/* Scope mode */}
 <div>
 <label className="mb-2 block text-sm font-medium text-muted-foreground">Scope Mode</label>
 <div className="space-y-2">
 {SCOPE_MODES.map((mode) => (
 <button
 key={mode.value}
 onClick={() => setScopeMode(mode.value)}
 className={cn(
 "flex w-full items-start gap-3 rounded-xl border p-3 text-left transition-all ",
 scopeMode === mode.value
 ? "border-teal-500/40 bg-teal-50/50"
 : "border-border bg-card hover:border-border/50"
 )}
 >
 <div
 className={cn(
 "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border",
 scopeMode === mode.value
 ? "border-teal-500 bg-teal-500"
 : "border-white/20"
 )}
 >
 {scopeMode === mode.value && (
 <div className="h-1.5 w-1.5 rounded-full bg-card" />
 )}
 </div>
 <div>
 <div className="text-sm font-medium text-foreground">{mode.label}</div>
 <div className="text-xs text-muted-foreground">{mode.description}</div>
 </div>
 </button>
 ))}
 </div>
 </div>

 {/* Excluded targets */}
 {scopeMode !== "root_only" && (
 <div>
 <label className="mb-2 block text-sm font-medium text-muted-foreground">
 Excluded Targets <span className="text-muted-foreground/40 font-normal">(one per line)</span>
 </label>
 <textarea
 value={excludedTargets}
 onChange={(e) => setExcludedTargets(e.target.value)}
 placeholder={"mail.example.com\nshop.example.com"}
 rows={4}
 className="w-full rounded-xl border border-border bg-card px-4 py-3 text-sm text-foreground placeholder-muted-foreground/30 focus:border-teal-500/50 focus:outline-none "
 />
 </div>
 )}

 {/* Third-party toggle */}
 {scopeMode !== "root_only" && (
 <div className="rounded-xl border border-border bg-card p-4 ">
 <div className="flex items-center justify-between">
 <div>
 <div className="text-sm font-medium text-foreground">Include Third-Party Infrastructure</div>
 <div className="text-xs text-muted-foreground">
 Scan subdomains hosted by third parties (Shopify, Google, etc.)
 </div>
 </div>
 <button
 onClick={() => setIncludeThirdParty(!includeThirdParty)}
 className={cn(
 "relative h-6 w-11 rounded-full transition-colors",
 includeThirdParty ? "bg-red-500" : "bg-muted"
 )}
 >
 <div
 className={cn(
 "absolute top-0.5 h-5 w-5 rounded-full bg-card transition-transform",
 includeThirdParty ? "translate-x-5.5" : "translate-x-0.5"
 )}
 />
 </button>
 </div>
 {includeThirdParty && (
 <div className="mt-3 flex items-start gap-2 rounded-lg bg-red-500/10 p-3">
 <AlertTriangle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
 <p className="text-xs text-red-600 font-medium">
 Scanning third-party infrastructure may violate their terms of service
 and could have legal consequences. Only enable if you have explicit
 authorization from the infrastructure provider.
 </p>
 </div>
 )}
 </div>
 )}

 {/* Legal acknowledgments */}
 <div className="space-y-3 pt-4 border-t border-border">
 <label className="block text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Legal Acknowledgments</label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={checks.ownership}
 onChange={(e) => setChecks({ ...checks, ownership: e.target.checked })}
 className="mt-1 h-4 w-4 rounded border-border/50 bg-card accent-teal-600"
 />
 <span className="text-sm text-zinc-600 leading-relaxed font-medium">
 I confirm that I own or have explicit written authorization to perform
 security testing on <span className="text-foreground font-bold">{domain}</span> and all
 targets included in this scope.
 </span>
 </label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={checks.authorization}
 onChange={(e) => setChecks({ ...checks, authorization: e.target.checked })}
 className="mt-1 h-4 w-4 rounded border-border/50 bg-card accent-teal-600"
 />
 <span className="text-sm text-zinc-600 leading-relaxed font-medium">
 I understand that offensive security testing may cause service disruption
 and I accept full responsibility for any consequences.
 </span>
 </label>

 <label className="flex items-start gap-3 cursor-pointer">
 <input
 type="checkbox"
 checked={checks.liability}
 onChange={(e) => setChecks({ ...checks, liability: e.target.checked })}
 className="mt-1 h-4 w-4 rounded border-border/50 bg-card accent-teal-600"
 />
 <span className="text-sm text-zinc-600 leading-relaxed font-medium">
 I agree that OwnSurface is not liable for any damages resulting from
 offensive scans and I will comply with all applicable laws including
 the Computer Fraud and Abuse Act (CFAA).
 </span>
 </label>
 </div>

 {error && (
 <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-3 text-sm text-red-300">
 {error}
 </div>
 )}

 {/* Actions */}
 <div className="flex items-center gap-3">
 <button
 onClick={signContract}
 disabled={!allChecked || signing}
 className="flex items-center gap-2 rounded-xl bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-teal-700 shadow-teal-500/20 disabled:opacity-50"
 >
 <Shield className="h-4 w-4" />
 {signing ? "Signing..." : "Sign & Accept"}
 </button>
 <button
 onClick={onCancel}
 className="rounded-xl border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
 >
 Cancel
 </button>
 </div>

 <p className="text-[0.65rem] text-muted-foreground font-medium uppercase tracking-wider opacity-60">
 This contract expires in 30 days. Your IP address and browser information will be recorded.
 </p>
 </div>
 );
}
