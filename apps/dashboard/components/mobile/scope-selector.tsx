"use client";

import { cn } from "@/lib/utils";

export interface MobileScopeConfig {
 manifest_checks: boolean;
 crypto_analysis: boolean;
 storage_analysis: boolean;
 webview_analysis: boolean;
 network_analysis: boolean;
 secret_scanning: boolean;
 dependency_cve: boolean;
 binary_security: boolean;
 framework_analysis: boolean;
 tracker_detection: boolean;
}

interface MobileScopeSelectorProps {
 value: MobileScopeConfig;
 onChange: (scope: MobileScopeConfig) => void;
}

const CHECKS = [
 {
 key: "manifest_checks" as const,
 label: "App Store Checks",
 description: "Manifest/plist analysis, permissions, exported components",
 estimate: "~15s",
 },
 {
 key: "secret_scanning" as const,
 label: "Secret Scanning",
 description: "Detect hardcoded keys and secrets (gitleaks, trufflehog)",
 estimate: "~30s",
 },
 {
 key: "dependency_cve" as const,
 label: "Dependency Analysis",
 description: "CVE scanning with trivy, grype, and osv",
 estimate: "~45s",
 },
 {
 key: "binary_security" as const,
 label: "Binary Security",
 description: "Checksec analysis for ASLR, PIE, stack canaries",
 estimate: "~10s",
 },
 {
 key: "framework_analysis" as const,
 label: "Framework Analysis",
 description: "Auto-detect React Native, Flutter, Xamarin, Cordova",
 estimate: "~10s",
 },
 {
 key: "network_analysis" as const,
 label: "Network Security",
 description: "Certificate pinning, TLS configuration, cleartext traffic",
 estimate: "~20s",
 },
 {
 key: "tracker_detection" as const,
 label: "Tracker Detection",
 description: "Identify embedded trackers via exodus signatures",
 estimate: "~15s",
 },
 {
 key: "crypto_analysis" as const,
 label: "Crypto Analysis",
 description: "Weak crypto, insecure random, hardcoded IVs",
 estimate: "~20s",
 },
 {
 key: "storage_analysis" as const,
 label: "Storage Analysis",
 description: "Insecure data storage, shared prefs, keychain misuse",
 estimate: "~15s",
 },
 {
 key: "webview_analysis" as const,
 label: "WebView Analysis",
 description: "JavaScript interfaces, insecure WebView settings",
 estimate: "~15s",
 },
];

export function MobileScopeSelector({ value, onChange }: MobileScopeSelectorProps) {
 const toggleCheck = (key: keyof MobileScopeConfig) => {
 onChange({ ...value, [key]: !value[key] });
 };

 const selectAll = () => {
 const all: MobileScopeConfig = {
 manifest_checks: true,
 crypto_analysis: true,
 storage_analysis: true,
 webview_analysis: true,
 network_analysis: true,
 secret_scanning: true,
 dependency_cve: true,
 binary_security: true,
 framework_analysis: true,
 tracker_detection: true,
 };
 onChange(all);
 };

 const enabledCount = Object.values(value).filter(Boolean).length;
 const estimateMinutes = Math.ceil(enabledCount * 0.3);

 return (
 <div className="space-y-5">
 <div>
 <div className="mb-4 flex items-center justify-between">
 <h3 className="text-[0.65rem] font-black uppercase tracking-widest text-muted-foreground">RECONNAISSANCE SCOPE</h3>
 <button
 onClick={selectAll}
 className="text-[0.65rem] font-black uppercase tracking-widest text-teal-600 hover:text-teal-500 transition-colors"
 >
 SELECT ALL ARTIFACTS
 </button>
 </div>

 </div>

 {enabledCount > 0 && (
 <div className="rounded-xl bg-muted/30 border border-border px-4 py-3 text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground">
 ESTIMATED INTEL DURATION: ~{estimateMinutes} MINUTE{estimateMinutes !== 1 ? "S" : ""} ({enabledCount} MODULE{enabledCount !== 1 ? "S" : ""} ACTIVE)
 </div>
 )}
 </div>
 );
}
