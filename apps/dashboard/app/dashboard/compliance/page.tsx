"use client";

import { useState, useEffect, useMemo } from "react";
import { api } from "@/lib/api-client";
import type { ScanResult, DomainVerification } from "@/lib/api-client";
import { evaluateAllRegulations, evaluateByCountry, getPriorityFixes, type ComplianceResult, type CountryComplianceResult } from "@/lib/compliance/engine";
import dynamic from "next/dynamic";
import { CountryDetailDrawer } from "@/components/compliance/country-detail-drawer";
import { CompliancePriorityList } from "@/components/compliance/compliance-priority-list";
import { LegalDisclaimer } from "@/components/compliance/legal-disclaimer";
import { Globe, Loader2, ChevronDown, Check, X, Minus, Scale, AlertTriangle } from "lucide-react";
import Link from "next/link";

const ComplianceMap = dynamic(
 () => import("@/components/compliance/compliance-map").then((m) => ({ default: m.ComplianceMap })),
 { ssr: false, loading: () => <div className="rounded-xl border border-border/40 bg-card/50 p-6 h-[400px] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground/30" /></div> },
);

interface DomainCompliance {
 domain: string;
 scan: ScanResult;
 results: ComplianceResult[];
 compliant: number;
 partial: number;
 nonCompliant: number;
 score: number;
}

function extractDomain(url: string): string {
 try {
 return new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
 } catch {
 return url;
 }
}

export default function CompliancePage() {
 const [domainData, setDomainData] = useState<DomainCompliance[]>([]);
 const [loading, setLoading] = useState(true);
 const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
 const [drawerCountry, setDrawerCountry] = useState<string | null>(null);
 const [drawerOpen, setDrawerOpen] = useState(false);

 useEffect(() => {
 loadData();
 }, []);

 async function loadData() {
 setLoading(true);
 try {
 const [scansRes, domainsRes] = await Promise.all([
 api.getRecentScans(),
 api.getDomains(),
 ]);

 const verifiedDomains = new Set(
 (domainsRes.data || [])
 .filter((d) => d.verified)
 .map((d) => d.domain.toLowerCase()),
 );

 const scans = (scansRes.data || []).filter((s) => s.status === "complete");

 // Only evaluate verified domains
 const seen = new Set<string>();
 const results: DomainCompliance[] = [];

 for (const scan of scans) {
 const domain = extractDomain(scan.url).toLowerCase();
 if (seen.has(domain)) continue;
 if (verifiedDomains.size > 0 && !verifiedDomains.has(domain)) continue;
 seen.add(domain);

 const regResults = evaluateAllRegulations(scan);
 const compliant = regResults.filter((r) => r.status === "compliant").length;
 const partial = regResults.filter((r) => r.status === "partial").length;
 const nonCompliant = regResults.filter((r) => r.status === "non_compliant").length;
 const totalChecks = regResults.reduce((sum, r) => sum + r.checks.length, 0);
 const passingChecks = regResults.reduce((sum, r) => sum + r.passCount, 0);
 const score = totalChecks > 0 ? Math.round((passingChecks / totalChecks) * 100) : 0;

 results.push({ domain, scan, results: regResults, compliant, partial, nonCompliant, score });
 }

 setDomainData(results);
 if (results.length > 0 && !selectedDomain) {
 setSelectedDomain(results[0].domain);
 }
 } catch {
 // graceful fallback
 } finally {
 setLoading(false);
 }
 }

 const activeDomainData = useMemo(
 () => domainData.find((d) => d.domain === selectedDomain) ?? null,
 [domainData, selectedDomain],
 );

 const countryResults = useMemo<CountryComplianceResult[]>(
 () => activeDomainData ? evaluateByCountry(activeDomainData.scan) : [],
 [activeDomainData],
 );

 const selectedCountryResult = useMemo(
 () => countryResults.find((result) => result.countryCode === drawerCountry) ?? null,
 [countryResults, drawerCountry],
 );

 const fixes = useMemo(
 () => activeDomainData ? getPriorityFixes(activeDomainData.results) : [],
 [activeDomainData],
 );

 if (loading) {
 return (
 <div className="flex min-h-[60vh] items-center justify-center">
 <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/30" />
 </div>
 );
 }

  if (domainData.length === 0) {
    return (
      <div className="dashboard-page mx-auto max-w-5xl space-y-6">
        <div>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
            See how your verified domains comply with global privacy regulations.
          </p>
        </div>
        <div className="rounded-xl border border-border/40 bg-card/50 p-12 text-center">
          <Scale className="mx-auto h-10 w-10 text-muted-foreground/20" />
          <h3 className="mt-4 text-lg font-semibold">No valid domains found</h3>
          <div className="mt-3 text-sm text-muted-foreground max-w-md mx-auto space-y-4">
            <p>To view compliance analysis, your domains must meet two conditions:</p>
            <ol className="text-left list-decimal list-inside space-y-2 bg-muted/40 p-4 rounded-lg border border-border/50">
              <li><strong>Verified Ownership</strong> (via DNS TXT record or meta tag in the Domains tab)</li>
              <li><strong>A Completed Scan</strong> (the domain must have successfully finished a full scan)</li>
            </ol>
          </div>
          <Link
            href="/dashboard/domains"
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground/72 transition-colors hover:border-foreground/12 hover:text-foreground"
          >
            <Globe className="h-4 w-4" />
            Manage Domains
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page mx-auto max-w-5xl space-y-6">
      <div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground mb-3">
          Compliance posture across your eligible domains — {domainData.length} domain{domainData.length !== 1 ? "s" : ""} evaluated against 15 global regulations.
        </p>
        <div className="inline-flex items-center bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20 px-3 py-1.5 rounded-lg text-xs font-medium">
          Note: Only domains that are verified and have a completed scan will appear here.
        </div>
      </div>

 <LegalDisclaimer />

 {/* Portfolio overview — all domains at a glance */}
 <div className="rounded-xl border border-border/40 bg-card/50 p-6">
 <div className="section-kicker">Portfolio overview</div>
 <h3 className="mt-3 text-[1.5rem] font-bold">All domains</h3>
 <div className="mt-5 space-y-3">
 {domainData.map((d) => (
 <button
 key={d.domain}
 onClick={() => setSelectedDomain(d.domain)}
 className={`flex w-full items-center gap-4 rounded-[1.25rem] border p-4 text-left transition-colors ${
 selectedDomain === d.domain
 ? "border-teal-500/30 bg-teal-500/5"
 : "border-border bg-card/78 hover:border-foreground/12"
 }`}
 >
 <div className="flex-1 min-w-0">
 <div className="text-sm font-semibold truncate">{d.domain}</div>
 <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
 <span className="flex items-center gap-1">
 <Check className="h-3 w-3 text-emerald-500" /> {d.compliant}
 </span>
 <span className="flex items-center gap-1">
 <Minus className="h-3 w-3 text-amber-500" /> {d.partial}
 </span>
 <span className="flex items-center gap-1">
 <X className="h-3 w-3 text-red-500" /> {d.nonCompliant}
 </span>
 </div>
 </div>
 <div className="text-right">
 <div className={`text-lg font-bold ${d.score >= 70 ? "text-emerald-600" : d.score >= 40 ? "text-amber-700" : "text-red-600"}`}>
 {d.score}%
 </div>
 <div className="text-[0.6rem] text-muted-foreground">checks passing</div>
 </div>
 <div className="h-8 w-1 rounded-full" style={{
 background: d.score >= 70 ? "#10b981" : d.score >= 40 ? "#f59e0b" : "#ef4444",
 }} />
 </button>
 ))}
 </div>
 </div>

 {/* Selected domain detail */}
 {activeDomainData && (
 <>
 <div className="rounded-xl border border-border/40 bg-card/50 p-6">
 <div className="flex items-center justify-between">
 <div>
 <div className="section-kicker">Detail view</div>
 <h3 className="mt-2 text-lg font-bold">{activeDomainData.domain}</h3>
 </div>
 <div className="flex items-center gap-4 text-sm">
 <span className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
 <span className="text-muted-foreground">{activeDomainData.compliant} compliant</span>
 </span>
 <span className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
 <span className="text-muted-foreground">{activeDomainData.partial} partial</span>
 </span>
 <span className="flex items-center gap-1.5">
 <span className="h-2.5 w-2.5 rounded-full bg-red-500" />
 <span className="text-muted-foreground">{activeDomainData.nonCompliant} non-compliant</span>
 </span>
 </div>
 </div>

 <div className="mt-5 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
 {activeDomainData.results.map((r) => (
 <div key={r.regulation.id} className="rounded-[0.9rem] border border-border bg-card/50 p-3">
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold">{r.regulation.name}</span>
 {r.status === "compliant" ? (
 <Check className="h-3.5 w-3.5 text-emerald-500" />
 ) : r.status === "partial" ? (
 <Minus className="h-3.5 w-3.5 text-amber-500" />
 ) : r.status === "non_compliant" ? (
 <X className="h-3.5 w-3.5 text-red-500" />
 ) : (
 <Minus className="h-3.5 w-3.5 text-slate-400" />
 )}
 </div>
 <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
 <div
 className={`h-full rounded-full ${r.score >= 80 ? "bg-emerald-500" : r.score >= 50 ? "bg-amber-500" : "bg-red-500"}`}
 style={{ width: `${r.score}%` }}
 />
 </div>
 <div className="mt-1.5 text-[0.6rem] text-muted-foreground">
 {r.passCount}/{r.checks.length} &middot; {r.regulation.region}
 </div>
 </div>
 ))}
 </div>
 </div>

 <ComplianceMap results={countryResults} onCountryClick={(code) => { setDrawerCountry(code); setDrawerOpen(true); }} />
 {fixes.length > 0 && <CompliancePriorityList fixes={fixes} />}
 </>
 )}

 <CountryDetailDrawer
 countryCode={drawerCountry}
 country={selectedCountryResult}
 open={drawerOpen}
 onClose={() => setDrawerOpen(false)}
 />
 </div>
 );
}
