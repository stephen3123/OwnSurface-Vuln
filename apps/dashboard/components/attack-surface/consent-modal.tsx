"use client";

import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X, ShieldAlert } from "lucide-react";

export interface AuditScope {
 domain: string;
 checks: {
 port_scan: boolean;
 subdomain_enum: boolean;
 directory_bruteforce: boolean;
 header_analysis: boolean;
 ssl_analysis: boolean;
 dns_zone_transfer: boolean;
 email_security: boolean;
 waf_detection: boolean;
 vulnerability_testing: boolean;
 };
 max_depth: number;
 rate_limit: "conservative" | "moderate" | "aggressive";
}

interface ConsentModalProps {
 open: boolean;
 onClose: () => void;
 onConsent: (domain: string, scope: AuditScope) => void;
 verifiedDomains: string[];
}

const CHECK_DESCRIPTIONS: { key: keyof AuditScope["checks"]; label: string; description: string }[] = [
 { key: "port_scan", label: "Port Scan", description: "Scan common ports for exposed services." },
 { key: "subdomain_enum", label: "Subdomain Enumeration", description: "Discover subdomains via DNS and certificate transparency." },
 { key: "directory_bruteforce", label: "Directory Bruteforce", description: "Check for common admin panels, backups, and sensitive paths." },
 { key: "header_analysis", label: "Header Analysis", description: "Inspect HTTP security headers and server configuration." },
 { key: "ssl_analysis", label: "SSL/TLS Analysis", description: "Review certificates, cipher suites, and transport posture." },
 { key: "dns_zone_transfer", label: "DNS Zone Transfer", description: "Attempt zone transfer to identify DNS misconfigurations." },
 { key: "email_security", label: "Email Security", description: "Check SPF, DMARC, DKIM, and mail configuration." },
 { key: "waf_detection", label: "WAF Detection", description: "Detect WAF and CDN protection layers." },
 { key: "vulnerability_testing", label: "Vulnerability Testing (Tier 3)", description: "Run Nuclei templates for known CVEs, misconfigurations, and default credentials. Deeper but slower." },
];

const RATE_LIMITS: { value: AuditScope["rate_limit"]; label: string; description: string }[] = [
 { value: "conservative", label: "Conservative", description: "Slow, minimal footprint" },
 { value: "moderate", label: "Moderate", description: "Balanced speed and stealth" },
 { value: "aggressive", label: "Aggressive", description: "Fast, higher detection risk" },
];

export function ConsentModal({ open, onClose, onConsent, verifiedDomains }: ConsentModalProps) {
 const [domain, setDomain] = useState("");
 const [checks, setChecks] = useState<AuditScope["checks"]>({
 port_scan: true,
 subdomain_enum: true,
 directory_bruteforce: true,
 header_analysis: true,
 ssl_analysis: true,
 dns_zone_transfer: true,
 email_security: true,
 waf_detection: true,
 vulnerability_testing: false,
 });
 const [maxDepth, setMaxDepth] = useState(3);
 const [rateLimit, setRateLimit] = useState<AuditScope["rate_limit"]>("moderate");
 const [consented, setConsented] = useState(false);

 useEffect(() => {
 if (open) {
 setDomain("");
 setConsented(false);
 }
 }, [open]);
 const selectedDomain = domain;
 const isValidDomain = /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z]{2,})+$/.test(selectedDomain);
 const selectedChecks = Object.values(checks).filter(Boolean).length;
 const canSubmit = selectedDomain.length > 0 && isValidDomain && consented && selectedChecks > 0;

 function handleSubmit() {
 if (!canSubmit) return;
 onConsent(selectedDomain, {
 domain: selectedDomain,
 checks,
 max_depth: maxDepth,
 rate_limit: rateLimit,
 });
 }

 function toggleCheck(key: keyof AuditScope["checks"]) {
 setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
 }

 function toggleAll(on: boolean) {
 const updated = { ...checks };
 for (const key of Object.keys(updated) as (keyof AuditScope["checks"])[]) {
 updated[key] = on;
 }
 setChecks(updated);
 }

 function handleOpenChange(isOpen: boolean) {
 if (!isOpen) {
 setTimeout(() => onClose(), 0);
 }
 }

 return (
 <Dialog.Root open={open} onOpenChange={handleOpenChange}>
 <Dialog.Portal>
 <Dialog.Overlay className="fixed inset-0 z-50 bg-[rgba(7,18,20,0.34)] backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
 
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6" style={{ pointerEvents: "none" }}>
 <Dialog.Content 
 className="flex max-h-[calc(100dvh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-border/40 bg-[#0A0A0B] shadow-2xl sm:max-h-[calc(100dvh-4rem)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
 style={{ pointerEvents: "auto" }}
 >
 <Dialog.Title className="sr-only">Attack surface audit</Dialog.Title>
 <div className="flex items-start justify-between border-b border-border/80 px-6 py-5 sm:px-8">
 <div className="flex items-center gap-3">
 <div className="flex h-11 w-11 items-center justify-center rounded-full bg-amber-500/12">
 <ShieldAlert className="h-5 w-5 text-amber-600" />
 </div>
 <div>
 <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Consent required</p>
 <h2 className="mt-1 text-xl font-bold tracking-[-0.03em] text-foreground">Attack surface audit</h2>
 <p className="mt-1 text-sm text-muted-foreground">Configure scope, confirm authorization, and start a verified-domain security probe.</p>
 </div>
 </div>
 <Dialog.Close asChild>
 <button className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-black/5 hover:text-foreground">
 <X className="h-5 w-5" />
 <span className="sr-only">Close</span>
 </button>
 </Dialog.Close>
 </div>

 <div className="grid min-h-0 flex-1 gap-0 overflow-hidden lg:grid-cols-[1.15fr_0.85fr]">
 <div className="min-h-0 space-y-7 overflow-y-auto px-6 py-6 sm:px-8">
 <div>
 <label className="section-kicker">Target domain</label>
 {verifiedDomains.length === 0 ? (
 <p className="mt-3 text-sm text-muted-foreground">No verified domains. Go to Domains to verify one first.</p>
 ) : (
 <div className="mt-3 flex flex-wrap gap-2">
 {verifiedDomains.map((d) => (
 <button
 key={d}
 onClick={() => setDomain(d)}
 className={`inline-flex items-center gap-2 rounded-md border px-4 py-2.5 text-sm font-medium transition-colors ${
 domain === d
 ? "border-teal-500/30 bg-teal-500/10 text-teal-400"
 : "border-border/40 bg-card text-foreground hover:border-teal-500/30 hover:bg-teal-500/5"
 }`}
 >
 {d}
 </button>
 ))}
 </div>
 )}
 </div>

 <div>
 <div className="flex items-center justify-between">
 <label className="section-kicker">Scan scope</label>
 <div className="flex items-center gap-3 text-[0.72rem] font-medium">
 <button onClick={() => toggleAll(true)} className="text-teal-700 transition-colors hover:text-teal-600">Select all</button>
 <button onClick={() => toggleAll(false)} className="text-muted-foreground transition-colors hover:text-foreground">Clear all</button>
 </div>
 </div>

 <div className="mt-4 overflow-hidden rounded-lg border border-border/40 bg-card/50">
 {CHECK_DESCRIPTIONS.map(({ key, label, description }, index) => (
 <label
 key={key}
 className={`flex cursor-pointer items-start gap-3 px-4 py-3.5 transition-colors hover:bg-accent ${index !== CHECK_DESCRIPTIONS.length - 1 ? "border-b border-border/40" : ""}`}
 >
 <input
 type="checkbox"
 checked={checks[key]}
 onChange={() => toggleCheck(key)}
 className="mt-0.5 h-4 w-4 rounded border-border/40 bg-background text-teal-500 accent-teal-500"
 />
 <div className="min-w-0">
 <div className="text-sm font-medium text-foreground">{label}</div>
 <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
 </div>
 </label>
 ))}
 </div>
 </div>

 <div className="grid gap-6 sm:grid-cols-[1fr_1.15fr]">
 <div>
 <label className="section-kicker">Rate limit</label>
 <div className="mt-3 space-y-2">
 {RATE_LIMITS.map(({ value, label, description }) => (
 <button
 key={value}
 onClick={() => setRateLimit(value)}
 className={`flex w-full items-start justify-between rounded-lg border px-4 py-3 text-left transition-colors ${
 rateLimit === value
 ? "border-teal-500/30 bg-teal-500/10"
 : "border-border/40 bg-card/50 hover:border-border"
 }`}
 >
 <div>
 <div className="text-sm font-medium text-foreground">{label}</div>
 <div className="mt-1 text-xs text-muted-foreground">{description}</div>
 </div>
 <div className={`mt-1 h-2.5 w-2.5 rounded-full ${rateLimit === value ? "bg-teal-500" : "bg-border"}`} />
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="section-kicker">Max depth</label>
 <div className="mt-4 rounded-lg border border-border/40 bg-card/50 px-4 py-4">
 <div className="flex items-center justify-between text-sm text-foreground">
 <span>Depth {maxDepth}</span>
 <span className="text-xs text-muted-foreground">{maxDepth === 1 ? "Shallow" : maxDepth === 5 ? "Deep" : "Balanced"}</span>
 </div>
 <input
 type="range"
 min={1}
 max={5}
 value={maxDepth}
 onChange={(e) => setMaxDepth(Number(e.target.value))}
 className="mt-4 w-full accent-teal-600"
 />
 <div className="mt-2 flex justify-between text-[0.68rem] text-muted-foreground">
 <span>1</span>
 <span>5</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="min-h-0 overflow-y-auto border-t border-border/40 bg-card/30 px-6 py-6 lg:border-l lg:border-t-0 sm:px-8">
 <div className="space-y-6">
 <div>
 <label className="section-kicker">Audit summary</label>
 <div className="mt-4 space-y-4">
 <div>
 <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Selected target</div>
 <div className="mt-2 text-base font-semibold text-foreground">{selectedDomain || "Choose a domain"}</div>
 </div>
 <div>
 <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Checks enabled</div>
 <div className="mt-2 text-base font-semibold text-foreground">{selectedChecks}</div>
 </div>
 <div>
 <div className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Execution profile</div>
 <div className="mt-2 text-base font-semibold capitalize text-foreground">{rateLimit}</div>
 </div>
 </div>
 </div>

 <div className="border-t border-border/80 pt-6">
 <label className="section-kicker">Authorization</label>
 <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-amber-500/20 bg-amber-500/10 p-4">
 <input
 type="checkbox"
 checked={consented}
 onChange={(e) => setConsented(e.target.checked)}
 className="mt-0.5 h-4 w-4 rounded border-amber-500/40 bg-background accent-amber-500"
 />
 <div>
 <div className="text-sm font-medium text-amber-500">Legal authorization confirmed</div>
 <div className="mt-1 text-xs leading-5 text-muted-foreground">
 I confirm I have explicit authorization to perform security testing on this domain and understand the scan may be detected by security monitoring systems.
 </div>
 </div>
 </label>
 </div>

 <div className="border-t border-border/80 pt-6 text-sm leading-6 text-muted-foreground">
 This audit is designed for verified or explicitly authorized domains only. Adjust scope carefully to match your operational and legal requirements.
 </div>
 </div>
 </div>
 </div>

 <div className="shrink-0 border-t border-border/40 bg-[#0A0A0B] px-6 py-4 sm:px-8">
 <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
 <div className="text-xs text-muted-foreground">The audit will start immediately after consent is confirmed.</div>
 <div className="flex gap-3">
 <button
 onClick={onClose}
 className="rounded-md border border-border/40 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
 >
 Cancel
 </button>
 <button
 onClick={handleSubmit}
 disabled={!canSubmit}
 className="rounded-md bg-teal-500 px-6 py-2.5 text-sm font-bold text-teal-950 transition-colors hover:bg-teal-400 disabled:cursor-not-allowed disabled:opacity-40"
 >
 Start audit
 </button>
 </div>
 </div>
 </div>
 </Dialog.Content>
 </div>
 </Dialog.Portal>
 </Dialog.Root>
 );
}
