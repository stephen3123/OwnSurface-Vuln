"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { Shield, AlertTriangle, Check, X, Play } from "lucide-react";

interface ClassifiedTarget {
 host: string;
 classification: "same-owner" | "third-party" | "unknown";
 confidence: number;
 reason: string;
 provider?: string;
}

interface TargetConfirmationProps {
 scanId: string;
 domain: string;
 targets: ClassifiedTarget[];
 onConfirmed: () => void;
}

export function TargetConfirmation({
 scanId,
 domain,
 targets,
 onConfirmed,
}: TargetConfirmationProps) {
 const [selected, setSelected] = useState<Set<string>>(() => {
 // Pre-select same-owner targets
 const initial = new Set<string>();
 for (const t of targets) {
 if (t.classification === "same-owner") {
 initial.add(t.host);
 }
 }
 return initial;
 });
 const [confirming, setConfirming] = useState(false);

 const toggleTarget = (host: string) => {
 setSelected((prev) => {
 const next = new Set(prev);
 if (next.has(host)) next.delete(host);
 else next.add(host);
 return next;
 });
 };

 const confirmTargets = async () => {
 setConfirming(true);

 try {
 await fetch(
 `${process.env.NEXT_PUBLIC_API_URL}/api/v1/offensive-scan/${scanId}/confirm-targets`,
 {
 method: "POST",
 headers: {
 "Content-Type": "application/json",
 },
 credentials: "include",
 body: JSON.stringify({
 confirmed_targets: Array.from(selected),
 }),
 }
 );
 onConfirmed();
 } catch (error) {
 console.error("Failed to confirm targets:", error);
 } finally {
 setConfirming(false);
 }
 };

 const sameOwner = targets.filter((t) => t.classification === "same-owner");
 const thirdParty = targets.filter((t) => t.classification === "third-party");
 const unknown = targets.filter((t) => t.classification === "unknown");

 return (
 <div className="space-y-6">
 <div>
 <h3 className="text-lg font-semibold text-white">Review Discovered Targets</h3>
 <p className="mt-1 text-sm text-white/50">
 We found {targets.length} subdomains for {domain}. Review and confirm which
 targets should be included in the active scan.
 </p>
 </div>

 {/* Summary */}
 <div className="grid grid-cols-3 gap-3">
 <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-3 text-center">
 <div className="text-xl font-bold text-green-400">{sameOwner.length}</div>
 <div className="text-xs text-green-400/60">Same Owner</div>
 </div>
 <div className="rounded-xl bg-red-500/5 border border-red-500/20 p-3 text-center">
 <div className="text-xl font-bold text-red-400">{thirdParty.length}</div>
 <div className="text-xs text-red-400/60">Third-Party</div>
 </div>
 <div className="rounded-xl bg-yellow-500/5 border border-yellow-500/20 p-3 text-center">
 <div className="text-xl font-bold text-yellow-400">{unknown.length}</div>
 <div className="text-xs text-yellow-400/60">Unknown</div>
 </div>
 </div>

 {/* Target list */}
 <div className="space-y-1 max-h-96 overflow-y-auto">
 {/* Same-owner targets */}
 {sameOwner.length > 0 && (
 <div className="mb-3">
 <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-green-400">
 <Check className="h-3 w-3" />
 Same Owner (pre-selected)
 </div>
 {sameOwner.map((t) => (
 <TargetRow
 key={t.host}
 target={t}
 checked={selected.has(t.host)}
 onToggle={() => toggleTarget(t.host)}
 color="green"
 />
 ))}
 </div>
 )}

 {/* Third-party targets */}
 {thirdParty.length > 0 && (
 <div className="mb-3">
 <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-red-400">
 <X className="h-3 w-3" />
 Third-Party (not selected)
 </div>
 {thirdParty.map((t) => (
 <TargetRow
 key={t.host}
 target={t}
 checked={selected.has(t.host)}
 onToggle={() => toggleTarget(t.host)}
 color="red"
 disabled
 />
 ))}
 </div>
 )}

 {/* Unknown targets */}
 {unknown.length > 0 && (
 <div className="mb-3">
 <div className="mb-1.5 flex items-center gap-2 text-xs font-medium text-yellow-400">
 <AlertTriangle className="h-3 w-3" />
 Unknown (review carefully)
 </div>
 {unknown.map((t) => (
 <TargetRow
 key={t.host}
 target={t}
 checked={selected.has(t.host)}
 onToggle={() => toggleTarget(t.host)}
 color="yellow"
 />
 ))}
 </div>
 )}
 </div>

 {/* Confirm */}
 <div className="flex items-center justify-between">
 <span className="text-sm text-white/50">
 {selected.size} target{selected.size !== 1 ? "s" : ""} selected
 </span>
 <button
 onClick={confirmTargets}
 disabled={selected.size === 0 || confirming}
 className="flex items-center gap-2 rounded-xl bg-teal-500 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-teal-400 disabled:opacity-50"
 >
 <Play className="h-4 w-4" />
 {confirming ? "Confirming..." : "Confirm & Start Active Scan"}
 </button>
 </div>
 </div>
 );
}

function TargetRow({
 target,
 checked,
 onToggle,
 color,
 disabled = false,
}: {
 target: ClassifiedTarget;
 checked: boolean;
 onToggle: () => void;
 color: "green" | "red" | "yellow";
 disabled?: boolean;
}) {
 const borderColor = {
 green: "border-green-500/20",
 red: "border-red-500/20",
 yellow: "border-yellow-500/20",
 }[color];

 return (
 <button
 onClick={disabled ? undefined : onToggle}
 disabled={disabled}
 className={cn(
 "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-all",
 borderColor,
 checked ? "bg-white/[0.03]" : "bg-transparent",
 disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-white/[0.02]"
 )}
 >
 <div
 className={cn(
 "flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]",
 checked
 ? "border-teal-500 bg-teal-500 text-white"
 : "border-white/20"
 )}
 >
 {checked && "✓"}
 </div>
 <div className="flex-1 min-w-0">
 <div className="truncate text-sm text-white/80">{target.host}</div>
 <div className="truncate text-xs text-white/30">{target.reason}</div>
 </div>
 {target.provider && (
 <span className="shrink-0 rounded-md bg-white/5 px-2 py-0.5 text-xs text-white/40">
 {target.provider}
 </span>
 )}
 <span className="shrink-0 text-xs text-white/30">
 {Math.round(target.confidence * 100)}%
 </span>
 </button>
 );
}
