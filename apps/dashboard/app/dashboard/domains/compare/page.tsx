"use client";

import { useState } from "react";
import { api, type ScanResult } from "@/lib/api-client";
import { ComparisonTable } from "@/components/domains/comparison-table";
import { toast } from "sonner";
import { ArrowLeftRight, Loader2, Search } from "lucide-react";

export default function DomainComparePage() {
 const [urlA, setUrlA] = useState("");
 const [urlB, setUrlB] = useState("");
 const [scanA, setScanA] = useState<ScanResult | null>(null);
 const [scanB, setScanB] = useState<ScanResult | null>(null);
 const [loading, setLoading] = useState(false);

 function normalizeUrl(input: string): string {
 let url = input.trim();
 if (!url) return url;
 if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
 return url;
 }

 async function handleCompare(e: React.FormEvent) {
 e.preventDefault();
 const cleanA = normalizeUrl(urlA);
 const cleanB = normalizeUrl(urlB);
 if (!cleanA || !cleanB) return;
 if (cleanA === cleanB) {
 toast.error("Please enter two different URLs");
 return;
 }

 setLoading(true);
 setScanA(null);
 setScanB(null);

 const [resA, resB] = await Promise.all([api.scan(cleanA), api.scan(cleanB)]);

 if (resA.error) {
 toast.error(`Failed to scan ${cleanA}: ${resA.error}`);
 }
 if (resB.error) {
 toast.error(`Failed to scan ${cleanB}: ${resB.error}`);
 }

 // Only set data if the scan actually completed (not pending/scanning with empty defaults)
 const statusA = resA.data?.status;
 const statusB = resB.data?.status;

 if (resA.data && statusA !== "pending" && statusA !== "scanning") {
 setScanA(resA.data);
 } else if (resA.data) {
 toast.error(`Scan for ${cleanA} is still processing. Try again in a few seconds.`);
 }
 if (resB.data && statusB !== "pending" && statusB !== "scanning") {
 setScanB(resB.data);
 } else if (resB.data) {
 toast.error(`Scan for ${cleanB} is still processing. Try again in a few seconds.`);
 }
 setLoading(false);
 }

 function handleSwap() {
 setUrlA(urlB);
 setUrlB(urlA);
 setScanA(scanB);
 setScanB(scanA);
 }

 return (
 <div className="dashboard-page mx-auto max-w-5xl">
 <div className="mb-6">
 <h1 className="text-xl font-semibold mb-1">Compare Domains</h1>
 <p className="text-sm text-muted-foreground">
 Scan two websites side by side to compare security, SEO, performance, and tech stack.
 </p>
 </div>

 <form onSubmit={handleCompare} className="bg-card border border-border rounded-xl p-4 sm:p-6 mb-6">
 <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
 <div className="flex-1">
 <label className="block text-sm font-medium mb-1.5">Site A</label>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 required
 value={urlA}
 onChange={(e) => setUrlA(e.target.value)}
 placeholder="https://example.com"
 className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 </div>

 <button
 type="button"
 onClick={handleSwap}
 className="self-center p-2 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors"
 title="Swap URLs"
 >
 <ArrowLeftRight className="w-4 h-4" />
 </button>

 <div className="flex-1">
 <label className="block text-sm font-medium mb-1.5">Site B</label>
 <div className="relative">
 <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
 <input
 type="text"
 required
 value={urlB}
 onChange={(e) => setUrlB(e.target.value)}
 placeholder="https://competitor.com"
 className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 </div>

 <button
 type="submit"
 disabled={loading}
 className="flex w-full items-center justify-center gap-2 rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-medium whitespace-nowrap transition-colors disabled:opacity-50 hover:bg-teal-500 sm:w-auto"
 >
 {loading ? (
 <Loader2 className="w-4 h-4 animate-spin" />
 ) : (
 <ArrowLeftRight className="w-4 h-4" />
 )}
 Compare
 </button>
 </div>
 </form>

 {loading && (
 <div className="text-center py-16">
 <Loader2 className="w-10 h-10 animate-spin text-teal-700 mx-auto mb-4" />
 <h3 className="font-semibold mb-1">Scanning both sites...</h3>
 <p className="text-sm text-muted-foreground">
 Analyzing security, SEO, performance, and technology
 </p>
 </div>
 )}

 {!loading && scanA && scanB && (
 <ComparisonTable siteA={scanA} siteB={scanB} />
 )}

 {!loading && !scanA && !scanB && (
 <div className="dashboard-empty">
 <ArrowLeftRight className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">Enter two URLs to compare</h3>
 <p className="text-sm text-muted-foreground">
 See how your site stacks up against competitors across all dimensions.
 </p>
 </div>
 )}
 </div>
 );
}
