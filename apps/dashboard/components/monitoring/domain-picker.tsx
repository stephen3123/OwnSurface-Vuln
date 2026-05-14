"use client";

import { Globe, CheckCircle2, ChevronDown } from "lucide-react";
import type { VerifiedDomain } from "@/hooks/use-verified-domains";
import { cn } from "@/lib/utils";

interface DomainPickerProps {
 domains: VerifiedDomain[];
 selected: string;
 onSelect: (domain: string) => void;
 label?: string;
 placeholder?: string;
 className?: string;
}

export function DomainPicker({
 domains,
 selected,
 onSelect,
 label = "Select domain",
 placeholder = "Choose a verified domain",
 className,
}: DomainPickerProps) {
 return (
 <div>
 <label className="block text-sm font-medium mb-1.5">{label}</label>
 <div className="relative">
 <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
 <select
 value={selected}
 onChange={(e) => onSelect(e.target.value)}
 className={cn(
 "w-full appearance-none pl-9 pr-10 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40 cursor-pointer",
 className
 )}
 >
 <option value="">{placeholder}</option>
 {domains.map((d) => (
 <option key={d.id} value={d.domain}>
 {d.domain}
 </option>
 ))}
 </select>
 <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
 </div>
 </div>
 );
}

interface NoDomainsCTAProps {
 message?: string;
}

export function NoDomainsCTA({ message }: NoDomainsCTAProps) {
 return (
 <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5 text-center">
 <Globe className="w-8 h-8 text-amber-400 mx-auto mb-3" />
 <h3 className="font-semibold text-sm mb-1">No verified domains</h3>
 <p className="text-xs text-muted-foreground mb-4 max-w-sm mx-auto">
 {message || "Verify a domain first to start monitoring. Monitors are scoped to your verified domains."}
 </p>
 <a
 href="/dashboard/domains"
 className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium text-white transition-colors"
 >
 <CheckCircle2 className="w-4 h-4" />
 Verify a domain
 </a>
 </div>
 );
}
