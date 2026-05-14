"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export interface ScopeConfig {
 // Phase 3 — Core Offensive
 sqli_testing: boolean;
 xss_testing: boolean;
 csrf_testing: boolean;
 ssrf_testing: boolean;
 jwt_testing: boolean;
 auth_bypass_testing: boolean;
 // Phase 4 — Discovery & Recon
 deep_subdomain_enum: boolean;
 port_scan: boolean;
 deep_directory_bruteforce: boolean;
 cloud_bucket_check: boolean;
 secret_scanning: boolean;
 active_waf_detection: boolean;
 // Phase 5 — App-Layer
 path_traversal: boolean;
 open_redirect_deep: boolean;
 idor_testing: boolean;
 rate_limit_testing: boolean;
 user_enumeration: boolean;
 session_testing: boolean;
 graphql_testing: boolean;
 api_fuzzing: boolean;
 // Phase 6 — Advanced Offensive
 xss_browser_verify: boolean;
 stored_xss_testing: boolean;
 content_type_manipulation: boolean;
 cross_page_scanning: boolean;
 csrf_xss_combo: boolean;
}

interface ScopeSelectorProps {
 value: ScopeConfig;
 onChange: (scope: ScopeConfig) => void;
 rateLimit: string;
 onRateLimitChange: (rate: string) => void;
}

interface CheckItem {
 key: keyof ScopeConfig;
 label: string;
 description: string;
 estimate: string;
}

interface CheckPhase {
 title: string;
 description: string;
 checks: CheckItem[];
}

const PHASES: CheckPhase[] = [
 {
 title: "Core Offensive",
 description: "Injection, forgery, and authentication attack vectors",
 checks: [
 { key: "sqli_testing", label: "SQL Injection", description: "Test URL parameters and forms via sqlmap", estimate: "~30s" },
 { key: "xss_testing", label: "Cross-Site Scripting", description: "Test for reflected and DOM-based XSS", estimate: "~45s" },
 { key: "csrf_testing", label: "CSRF", description: "Check forms for missing anti-forgery tokens via XSRFProbe", estimate: "~15s" },
 { key: "ssrf_testing", label: "SSRF", description: "Test URL parameters for server-side request forgery via SSRFmap", estimate: "~30s" },
 { key: "jwt_testing", label: "JWT Security", description: "Test JWT implementation weaknesses via jwt_tool", estimate: "~20s" },
 { key: "auth_bypass_testing", label: "Auth Bypass", description: "Test admin paths and authorization bypass techniques", estimate: "~45s" },
 ],
 },
 {
 title: "Discovery & Recon",
 description: "Subdomain enumeration, port scanning, and asset discovery",
 checks: [
 { key: "deep_subdomain_enum", label: "Subdomain Discovery", description: "Enumerate subdomains via subfinder and probe with httpx", estimate: "~60s" },
 { key: "port_scan", label: "Port Scan", description: "Scan for open ports and services via naabu", estimate: "~45s" },
 { key: "deep_directory_bruteforce", label: "Directory Bruteforce", description: "Discover hidden paths and files via ffuf", estimate: "~90s" },
 { key: "cloud_bucket_check", label: "Cloud Bucket Check", description: "Find misconfigured S3/GCS/Azure buckets via S3Scanner", estimate: "~30s" },
 { key: "secret_scanning", label: "Secret Scanning", description: "Detect exposed secrets and keys via gitleaks + trufflehog", estimate: "~30s" },
 { key: "active_waf_detection", label: "WAF Detection", description: "Identify WAF/IPS products and bypass rules via WhatWaf", estimate: "~20s" },
 ],
 },
 {
 title: "App-Layer",
 description: "Application logic, session, and API vulnerability testing",
 checks: [
 { key: "path_traversal", label: "Path Traversal", description: "Test for directory traversal and local file inclusion", estimate: "~30s" },
 { key: "open_redirect_deep", label: "Open Redirect", description: "Test URL parameters for open redirect vulnerabilities", estimate: "~20s" },
 { key: "idor_testing", label: "IDOR", description: "Test API endpoints for insecure direct object references", estimate: "~30s" },
 { key: "rate_limit_testing", label: "Rate Limit Testing", description: "Check if critical endpoints enforce rate limits", estimate: "~15s" },
 { key: "user_enumeration", label: "User Enumeration", description: "Test login/register/reset for username enumeration", estimate: "~20s" },
 { key: "session_testing", label: "Session Security", description: "Test for session fixation, cookie flags, and rotation", estimate: "~15s" },
 { key: "graphql_testing", label: "GraphQL Security", description: "Test GraphQL introspection, batching, and DoS via GraphQL Cop", estimate: "~30s" },
 { key: "api_fuzzing", label: "API Fuzzing", description: "Fuzz discovered API endpoints with malformed payloads via wfuzz", estimate: "~60s" },
 ],
 },
 {
 title: "Advanced Offensive",
 description: "Browser-verified exploits, stored XSS, and chained attacks",
 checks: [
 { key: "xss_browser_verify", label: "XSS Browser Verify", description: "Verify XSS payloads execute in a real browser via Playwright", estimate: "~60s" },
 { key: "stored_xss_testing", label: "Stored XSS", description: "Test form submissions for persistent cross-site scripting", estimate: "~45s" },
 { key: "content_type_manipulation", label: "Content-Type Manipulation", description: "Test API endpoints with mismatched content-type headers", estimate: "~20s" },
 { key: "cross_page_scanning", label: "Cross-Page Scan", description: "Crawl and test up to 20 pages for vulnerabilities", estimate: "~90s" },
 { key: "csrf_xss_combo", label: "CSRF + XSS Combo", description: "Test for chained CSRF-to-XSS attack vectors", estimate: "~30s" },
 ],
 },
];

const ALL_KEYS: (keyof ScopeConfig)[] = PHASES.flatMap((p) => p.checks.map((c) => c.key));

const RATE_LIMITS = [
 { value: "conservative", label: "Conservative", description: "500ms delay, safe for production" },
 { value: "moderate", label: "Moderate", description: "200ms delay, balanced speed/safety" },
 { value: "aggressive", label: "Aggressive", description: "50ms delay, faster but louder" },
];

export function ScopeSelector({ value, onChange, rateLimit, onRateLimitChange }: ScopeSelectorProps) {
 const [expandedPhases, setExpandedPhases] = useState<Record<string, boolean>>({
 "Core Offensive": true,
 "Discovery & Recon": false,
 "App-Layer": false,
 "Advanced Offensive": false,
 });

 const toggleCheck = (key: keyof ScopeConfig) => {
 onChange({ ...value, [key]: !value[key] });
 };

 const selectAll = () => {
 const all = {} as ScopeConfig;
 for (const key of ALL_KEYS) {
 all[key] = true;
 }
 onChange(all);
 };

 const deselectAll = () => {
 const none = {} as ScopeConfig;
 for (const key of ALL_KEYS) {
 none[key] = false;
 }
 onChange(none);
 };

 const selectPhase = (phase: CheckPhase, enabled: boolean) => {
 const updated = { ...value };
 for (const check of phase.checks) {
 updated[check.key] = enabled;
 }
 onChange(updated);
 };

 const togglePhaseExpand = (title: string) => {
 setExpandedPhases((prev) => ({ ...prev, [title]: !prev[title] }));
 };

 const enabledCount = ALL_KEYS.filter((k) => value[k]).length;
 const totalCount = ALL_KEYS.length;

 // Estimate based on sum of enabled check estimates (parse numbers from estimate strings)
 const estimateSeconds = PHASES.flatMap((p) => p.checks)
 .filter((c) => value[c.key])
 .reduce((sum, c) => {
 const match = c.estimate.match(/(\d+)/);
 return sum + (match ? parseInt(match[1], 10) : 30);
 }, 0);
 const estimateMinutes = Math.ceil(estimateSeconds / 60);

 return (
 <div className="space-y-5">
 {/* Header with global controls */}
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-foreground">Security Tests</h3>
 <p className="text-xs text-muted-foreground">{enabledCount} of {totalCount} modules selected</p>
 </div>
 <div className="flex items-center gap-3">
 <button
 onClick={deselectAll}
 className="text-xs text-muted-foreground hover:text-foreground"
 >
 Deselect All
 </button>
 <button
 onClick={selectAll}
 className="text-xs text-teal-600 font-semibold hover:text-teal-700"
 >
 Select All ({totalCount})
 </button>
 </div>
 </div>

 {/* Phase sections */}
 {PHASES.map((phase) => {
 const phaseEnabled = phase.checks.filter((c) => value[c.key]).length;
 const phaseTotal = phase.checks.length;
 const isExpanded = expandedPhases[phase.title];

 return (
 <div key={phase.title} className="rounded-xl border border-border/40 overflow-hidden bg-card/50 ">
 {/* Phase header — clickable to expand/collapse */}
 <button
 onClick={() => togglePhaseExpand(phase.title)}
 className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-muted/30"
 >
 <div className="flex items-center gap-3">
 <svg
 className={cn(
 "h-3.5 w-3.5 text-muted-foreground transition-transform",
 isExpanded && "rotate-90"
 )}
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 >
 <path d="M9 18l6-6-6-6" />
 </svg>
 <div>
 <div className="text-sm font-medium text-foreground">{phase.title}</div>
 <div className="text-xs text-muted-foreground">{phase.description}</div>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <span className={cn(
 "text-xs tabular-nums font-medium",
 phaseEnabled === phaseTotal ? "text-teal-600" :
 phaseEnabled > 0 ? "text-muted-foreground" : "text-muted-foreground/50"
 )}>
 {phaseEnabled}/{phaseTotal}
 </span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 selectPhase(phase, phaseEnabled < phaseTotal);
 }}
 className={cn(
 "rounded-lg px-2 py-0.5 text-xs transition-colors",
 phaseEnabled === phaseTotal
 ? "bg-teal-500/15 text-teal-400 hover:bg-teal-500/25"
 : "bg-muted text-muted-foreground hover:bg-muted/80"
 )}
 >
 {phaseEnabled === phaseTotal ? "All" : "Enable All"}
 </button>
 </div>
 </button>

 {/* Phase checks */}
 {isExpanded && (
 <div className="grid gap-2 px-4 pb-4 sm:grid-cols-2">
 {phase.checks.map((check) => (
 <button
 key={check.key}
 onClick={() => toggleCheck(check.key)}
 className={cn(
 "flex items-start gap-3 rounded-xl border p-3 text-left transition-all ",
 value[check.key]
 ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
 : "border-border/40 bg-card hover:border-border/80"
 )}
 >
 <div
 className={cn(
 "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border text-xs",
 value[check.key]
 ? "border-teal-500 bg-teal-500 text-teal-950"
 : "border-border bg-muted/20"
 )}
 >
 {value[check.key] && "✓"}
 </div>
 <div>
 <div className="text-[0.9rem] font-medium text-foreground">{check.label}</div>
 <div className="text-[0.8rem] text-muted-foreground leading-tight">{check.description}</div>
 <div className="mt-1 text-[0.75rem] font-medium text-muted-foreground/40 uppercase tracking-widest">{check.estimate}</div>
 </div>
 </button>
 ))}
 </div>
 )}
 </div>
 );
 })}

 {/* Rate limit */}
 <div>
 <h3 className="mb-3 text-sm font-semibold text-foreground">Request Rate</h3>
 <div className="grid gap-2 sm:grid-cols-3">
 {RATE_LIMITS.map((rate) => (
 <button
 key={rate.value}
 onClick={() => onRateLimitChange(rate.value)}
 className={cn(
 "rounded-xl border p-3 text-left transition-all ",
 rateLimit === rate.value
 ? "border-teal-500/40 bg-teal-500/10 text-teal-400"
 : "border-border/40 bg-card hover:border-border/80"
 )}
 >
 <div className="text-sm font-medium text-foreground">{rate.label}</div>
 <div className="text-xs text-muted-foreground">{rate.description}</div>
 </button>
 ))}
 </div>
 </div>

 {/* Estimated duration */}
 {enabledCount > 0 && (
 <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground font-medium border border-border/50">
 Estimated duration: ~{estimateMinutes} minute{estimateMinutes !== 1 ? "s" : ""} ({enabledCount} test{enabledCount !== 1 ? "s" : ""})
 </div>
 )}
 </div>
 );
}
