"use client";

import { useState, useEffect } from "react";
import { api, type ScanResult } from "@/lib/api-client";
import { CompetitorAddForm } from "@/components/competitors/competitor-add-form";
import {
 CompetitorComparisonTable,
 type CompetitorEntry,
} from "@/components/competitors/competitor-comparison-table";
import {
 CompetitorDigestCard,
 type CompetitorChange,
} from "@/components/competitors/competitor-digest-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { toast } from "sonner";

const STORAGE_KEY = "ownsurface_tracked_competitors";

function loadTrackedFromStorage(): CompetitorEntry[] {
 if (typeof window === "undefined") return [];
 try {
 const raw = localStorage.getItem(STORAGE_KEY);
 return raw ? JSON.parse(raw) : [];
 } catch {
 return [];
 }
}

function saveTrackedToStorage(entries: CompetitorEntry[]) {
 if (typeof window === "undefined") return;
 localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function normalizeCompetitorUrl(input: string): string {
 const trimmed = input.trim();
 const withScheme = trimmed.startsWith("http://") || trimmed.startsWith("https://")
 ? trimmed
 : `https://${trimmed}`;
 const parsed = new URL(withScheme);
 parsed.hash = "";
 parsed.search = "";
 parsed.pathname = parsed.pathname.replace(/\/+$/, "") || "/";
 return parsed.toString().replace(/\/$/, "");
}

export default function CompetitorsPage() {
 const [loading, setLoading] = useState(true);
 const [addLoading, setAddLoading] = useState(false);
 const [scanning, setScanning] = useState<string | undefined>();
 const [yourDomain, setYourDomain] = useState("");
 const [yourScan, setYourScan] = useState<ScanResult | undefined>();
 const [competitors, setCompetitors] = useState<CompetitorEntry[]>([]);
 const [changes, setChanges] = useState<Record<string, CompetitorChange[]>>({});

 useEffect(() => {
 async function load() {
 try {
 const stored = loadTrackedFromStorage();
 setCompetitors(stored);

 // Get verified domains first — competitors are compared against YOUR sites
 const [scansRes, domainsRes] = await Promise.all([
 api.getRecentScans(),
 api.getDomains(),
 ]);

 const verifiedDomains = (domainsRes.data || [])
 .filter((d) => d.verified)
 .map((d) => d.domain.toLowerCase());

 const scans = scansRes.data || [];

 // Find the scan for the user's first verified domain
 let yourScanMatch = null;
 for (const vd of verifiedDomains) {
 yourScanMatch = scans.find((s) => {
 try {
 const scanDomain = new URL(s.url.startsWith("http") ? s.url : `https://${s.url}`).hostname.toLowerCase();
 return scanDomain === vd;
 } catch {
 return false;
 }
 });
 if (yourScanMatch) break;
 }

 if (yourScanMatch) {
 setYourDomain(yourScanMatch.url);
 setYourScan(yourScanMatch);

 if (yourScanMatch.competitors && yourScanMatch.competitors.length > 0) {
 const fromScan: CompetitorEntry[] = yourScanMatch.competitors.map((c) => ({
 url: c.url,
 name: c.name,
 similarity_score: c.similarity_score,
 shared_tech: c.shared_tech,
 }));
 const existingUrls = new Set(stored.map((s) => s.url));
 const merged = [
 ...stored,
 ...fromScan.filter((c) => !existingUrls.has(c.url)),
 ];
 setCompetitors(merged);
 saveTrackedToStorage(merged);
 }

 let domain: string;
 try {
 domain = new URL(yourScanMatch.url.startsWith("http") ? yourScanMatch.url : `https://${yourScanMatch.url}`).hostname;
 } catch {
 domain = yourScanMatch.url;
 }
 const trackRes = await api.getTrackedCompetitors(domain);
 if (trackRes.data && trackRes.data.length > 0) {
 const changeMap: Record<string, CompetitorChange[]> = {};
 trackRes.data.forEach((t) => {
 changeMap[t.competitor_url] = (t.changes ?? []).map((c) => ({
 type: c.type as CompetitorChange["type"],
 description: c.description,
 detected_at: c.detected_at,
 }));
 });
 setChanges(changeMap);
 }
 }
 } catch {
 // graceful fallback
 } finally {
 setLoading(false);
 }
 }
 load();
 }, []);

 async function handleAdd(url: string) {
 setAddLoading(true);
 try {
 const normalizedUrl = normalizeCompetitorUrl(url);
 const alreadyTracked = competitors.some((entry) => normalizeCompetitorUrl(entry.url) === normalizedUrl);

 if (alreadyTracked) {
 toast.error("Competitor already tracked");
 return;
 }

 let name: string;
 try {
 name = new URL(normalizedUrl).hostname;
 } catch {
 name = normalizedUrl;
 }

 const scanRes = await api.scan(normalizedUrl);
 if (scanRes.error) {
 throw new Error(scanRes.error);
 }

 const entry: CompetitorEntry = {
 url: normalizedUrl,
 name,
 scan: scanRes.data,
 };

 setCompetitors((prev) => {
 const updated = [...prev, entry];
 saveTrackedToStorage(updated);
 return updated;
 });
 toast.success("Competitor added");

 if (yourDomain) {
 let domain: string;
 try {
 domain = new URL(yourDomain.startsWith("http") ? yourDomain : `https://${yourDomain}`).hostname;
 } catch {
 domain = yourDomain;
 }
 const trackRes = await api.trackCompetitor(domain, normalizedUrl);
 if (trackRes.error && trackRes.error !== "Competitor tracking is not yet available") {
 toast.error(trackRes.error);
 }
 }
 } catch (err) {
 throw (err instanceof Error ? err : new Error("Failed to add competitor"));
 } finally {
 setAddLoading(false);
 }
 }

 async function handleScan(url: string) {
 setScanning(url);
 const res = await api.scan(url);
 if (res.data) {
 const scan = res.data;
 setCompetitors((prev) => {
 const updated = prev.map((c) =>
 c.url === url ? { ...c, scan } : c
 );
 saveTrackedToStorage(updated);
 return updated;
 });
 }
 setScanning(undefined);
 }

 if (loading) {
 return (
 <div className="dashboard-page mx-auto max-w-5xl space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 <div className="mb-10 pb-6 border-b border-border">
 <h1 className="text-2xl font-medium tracking-tight mb-1">Competitor Intelligence</h1>
 <p className="text-[0.85rem] font-light text-muted-foreground">
 Track competitor tech stacks, security posture, and changes.
 </p>
 </div>

 <div className="shell-panel p-8 mb-8 border border-border bg-card rounded-[2rem] ">
 <h3 className="text-[0.75rem] font-semibold uppercase tracking-widest text-muted-foreground mb-4">Add Competitor</h3>
 <CompetitorAddForm onAdd={handleAdd} loading={addLoading} />
 </div>

 <div className="mb-12">
 <h2 className="text-xl font-medium tracking-tight mb-6">Comparison Matrix</h2>
 <CompetitorComparisonTable
 yourDomain={yourDomain || "your-domain.com"}
 yourScan={yourScan}
 competitors={competitors}
 onScan={handleScan}
 scanning={scanning}
 />
 </div>

 {competitors.length > 0 && (
 <div className="mt-12">
 <h2 className="text-xl font-medium tracking-tight mb-2">Weekly Insight Digest</h2>
 <p className="text-[0.85rem] font-light text-muted-foreground mb-6">
 Recent changes detected across your tracked competitors.
 </p>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 {competitors.map((c) => (
 <CompetitorDigestCard
 key={c.url}
 competitor={c}
 changes={changes[c.url]}
 />
 ))}
 </div>
 </div>
 )}

 {competitors.length === 0 && (
 <div className="shell-panel mt-12 py-20 text-center border border-dashed border-border rounded-[2rem] bg-muted/5">
 <p className="text-[0.85rem] font-medium text-muted-foreground">Initial Reconnaissance Phase – No competitors identified</p>
 </div>
 )}
 </div>
 );
}
