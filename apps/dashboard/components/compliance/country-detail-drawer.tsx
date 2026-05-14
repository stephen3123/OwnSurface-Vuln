"use client";

import { useEffect, useRef } from "react";
import { X, Check, AlertTriangle, HelpCircle, ExternalLink, ChevronDown, ChevronRight, Shield } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import type { CountryComplianceResult } from "@/lib/compliance/engine";

interface CountryDetailDrawerProps {
 countryCode: string | null;
 country: CountryComplianceResult | null;
 open: boolean;
 onClose: () => void;
}

const COUNTRY_NAMES: Record<string, string> = {
 AT: "Austria", BE: "Belgium", BG: "Bulgaria", HR: "Croatia", CY: "Cyprus",
 CZ: "Czechia", DK: "Denmark", EE: "Estonia", FI: "Finland", FR: "France",
 DE: "Germany", GR: "Greece", HU: "Hungary", IE: "Ireland", IT: "Italy",
 LV: "Latvia", LT: "Lithuania", LU: "Luxembourg", MT: "Malta", NL: "Netherlands",
 PL: "Poland", PT: "Portugal", RO: "Romania", SK: "Slovakia", SI: "Slovenia",
 ES: "Spain", SE: "Sweden", IS: "Iceland", LI: "Liechtenstein", NO: "Norway",
 GB: "United Kingdom", US: "United States", CA: "Canada", BR: "Brazil",
 ZA: "South Africa", SG: "Singapore", TH: "Thailand", AU: "Australia",
 JP: "Japan", CN: "China", IN: "India", KR: "South Korea", TR: "Turkey",
 CH: "Switzerland",
};

const COUNTRY_FLAGS: Record<string, string> = {
 AT: "🇦🇹", BE: "🇧🇪", BG: "🇧🇬", HR: "🇭🇷", CY: "🇨🇾",
 CZ: "🇨🇿", DK: "🇩🇰", EE: "🇪🇪", FI: "🇫🇮", FR: "🇫🇷",
 DE: "🇩🇪", GR: "🇬🇷", HU: "🇭🇺", IE: "🇮🇪", IT: "🇮🇹",
 LV: "🇱🇻", LT: "🇱🇹", LU: "🇱🇺", MT: "🇲🇹", NL: "🇳🇱",
 PL: "🇵🇱", PT: "🇵🇹", RO: "🇷🇴", SK: "🇸🇰", SI: "🇸🇮",
 ES: "🇪🇸", SE: "🇸🇪", IS: "🇮🇸", LI: "🇱🇮", NO: "🇳🇴",
 GB: "🇬🇧", US: "🇺🇸", CA: "🇨🇦", BR: "🇧🇷",
 ZA: "🇿🇦", SG: "🇸🇬", TH: "🇹🇭", AU: "🇦🇺",
 JP: "🇯🇵", CN: "🇨🇳", IN: "🇮🇳", KR: "🇰🇷", TR: "🇹🇷",
 CH: "🇨🇭",
};

function StatusBadge({ status }: { status: string }) {
 const styles: Record<string, string> = {
 compliant: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
 non_compliant: "bg-red-500/10 text-red-400 border-red-500/20",
 partial: "bg-amber-500/10 text-amber-400 border-amber-500/20",
 unknown: "bg-slate-500/10 text-slate-400 border-slate-500/20",
 };
 const labels: Record<string, string> = {
 compliant: "Compliant",
 non_compliant: "Non-Compliant",
 partial: "Partial",
 unknown: "Unknown",
 };

 return (
 <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${styles[status] ?? styles.unknown}`}>
 {labels[status] ?? "Unknown"}
 </span>
 );
}

function CheckIcon({ result }: { result: "pass" | "fail" | "unknown" }) {
 if (result === "pass") return <Check className="h-3.5 w-3.5 text-emerald-400" />;
 if (result === "fail") return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
 return <HelpCircle className="h-3.5 w-3.5 text-slate-400" />;
}

export function CountryDetailDrawer({ countryCode, country, open, onClose }: CountryDetailDrawerProps) {
 const [expanded, setExpanded] = useState<string | null>(null);
 const [mounted, setMounted] = useState(false);
 const backdropRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 setMounted(true);
 return () => setMounted(false);
 }, []);

 useEffect(() => {
 if (open) setExpanded(null);
 }, [open, countryCode]);

 useEffect(() => {
 function handleEsc(e: KeyboardEvent) {
 if (e.key === "Escape") onClose();
 }
 if (open) document.addEventListener("keydown", handleEsc);
 return () => document.removeEventListener("keydown", handleEsc);
 }, [open, onClose]);

 if (!mounted || !open || !countryCode) return null;

 const name = COUNTRY_NAMES[countryCode] ?? countryCode;
 const flag = COUNTRY_FLAGS[countryCode] ?? "";

 return createPortal((
 <>
 <div
 ref={backdropRef}
 className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
 onClick={onClose}
 />
 <div className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-border bg-[var(--color-surface,#0a0a0f)] text-foreground">
 <div className="flex items-center justify-between border-b border-border px-6 py-4">
 <div className="flex items-center gap-3">
 <span className="text-2xl">{flag}</span>
 <div>
 <h2 className="text-lg font-semibold">{name}</h2>
 {country ? <StatusBadge status={country.overallStatus} /> : null}
 </div>
 </div>
 <button onClick={onClose} className="rounded-lg p-2 hover:bg-white/5 transition-colors">
 <X className="h-5 w-5" />
 </button>
 </div>

 <div className="flex-1 overflow-y-auto px-6 py-5">
 {country ? (
 <div className="space-y-4">
 {country.regulations.map((reg) => {
 const isExpanded = expanded === reg.regulation.id;
 return (
 <div key={reg.regulation.id} className="rounded-xl border border-border overflow-hidden">
 <button
 onClick={() => setExpanded(isExpanded ? null : reg.regulation.id)}
 className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-white/[0.02] transition-colors"
 >
 {isExpanded ? (
 <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
 ) : (
 <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
 )}
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className="text-sm font-semibold">{reg.regulation.name}</span>
 <StatusBadge status={reg.status} />
 </div>
 <p className="mt-0.5 text-xs text-muted-foreground truncate">
 {reg.regulation.full_name}
 </p>
 </div>
 <span className="text-sm font-bold text-muted-foreground">{reg.score}%</span>
 </button>

 {isExpanded && (
 <div className="border-t border-border px-4 py-3 space-y-3">
 <p className="text-xs text-muted-foreground">{reg.regulation.description}</p>

 <div className="space-y-2">
 {reg.checks.map(({ check, result }) => (
 <div
 key={check.id}
 className="flex items-start gap-2.5 rounded-lg bg-white/[0.02] px-3 py-2"
 >
 <CheckIcon result={result} />
 <div className="min-w-0 flex-1">
 <p className="text-xs font-medium">{check.title}</p>
 <p className="text-[11px] text-muted-foreground">{check.description}</p>
 </div>
 </div>
 ))}
 </div>

 <div className="flex items-start gap-2 rounded-lg bg-amber-500/5 border border-amber-500/10 px-3 py-2">
 <Shield className="h-3.5 w-3.5 text-amber-400 mt-0.5 shrink-0" />
 <p className="text-[11px] text-amber-300/70">{reg.regulation.penalty_info}</p>
 </div>

 <a
 href={reg.regulation.url}
 target="_blank"
 rel="noopener noreferrer"
 className="inline-flex items-center gap-1.5 text-xs text-teal-400 hover:text-teal-300 transition-colors"
 >
 Read full regulation
 <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 )}
 </div>
 );
 })}
 </div>
 ) : (
 <div className="rounded-xl border border-border bg-card/40 p-4">
 <p className="text-sm font-medium">No compliance details available</p>
 <p className="mt-1 text-xs text-muted-foreground">
 The selected country did not resolve to a compliance result for the current domain.
 </p>
 </div>
 )}
 </div>
 </div>
 </>
 ), document.body);
}
