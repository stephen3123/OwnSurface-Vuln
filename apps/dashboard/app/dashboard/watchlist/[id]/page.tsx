"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, type Watchlist, type WatchlistChange } from "@/lib/api-client";
import { ChangeTimeline } from "@/components/watchlist/change-timeline";
import { AlertSettings } from "@/components/watchlist/alert-settings";
import { ScreenshotDiff } from "@/components/scan/screenshot-diff";
import { TechDiffTimeline } from "@/components/scan/tech-diff-timeline";
import { ScanResultSkeleton } from "@/components/shared/loading-skeleton";
import { ErrorState } from "@/components/shared/error-boundary";
import { truncateUrl, formatRelative } from "@/lib/utils";
import { Globe, Plus, Trash2, Loader2, ArrowLeft, X, FileText } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { exportDiffPdf } from "@/lib/export-pdf";
import { useUserPlan } from "@/lib/dashboard-cache";
import type { ScanResult } from "@/lib/api-client";

export default function WatchlistDetailPage() {
 const { id } = useParams<{ id: string }>();
 const [watchlist, setWatchlist] = useState<Watchlist | null>(null);
 const [changes, setChanges] = useState<WatchlistChange[]>([]);
 const [screenshots, setScreenshots] = useState<{ before: string; after: string; beforeDate: string; afterDate: string } | null>(null);
 const [diffEntries, setDiffEntries] = useState<{ scanned_at: string; changes: { change_type: string; description: string }[] }[]>([]);
 const [beforeScan, setBeforeScan] = useState<ScanResult | null>(null);
 const [afterScan, setAfterScan] = useState<ScanResult | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [newUrl, setNewUrl] = useState("");
 const [adding, setAdding] = useState(false);
 const { data: userPlan } = useUserPlan();

 useEffect(() => {
 if (id) loadData();
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [id]);

 async function loadData(showLoading = true) {
 if (showLoading) setLoading(true);
 const wlRes = await api.getWatchlist(id);
 if (wlRes.data) {
 setWatchlist(wlRes.data);
 setChanges((wlRes.data as any).changes || []);

 // Build structured diff entries from changes
 const changesByDate = new Map<string, { change_type: string; description: string }[]>();
 for (const c of ((wlRes.data as any).changes || [])) {
 const date = c.detected_at || "";
 const group = changesByDate.get(date) || [];
 group.push({ change_type: c.change_type, description: c.description });
 changesByDate.set(date, group);
 }
 setDiffEntries(
 Array.from(changesByDate.entries()).map(([date, chs]) => ({
 scanned_at: date,
 changes: chs,
 }))
 );

 // Try to load screenshots from scan history for the first URL
 if (wlRes.data.urls.length > 0) {
 try {
 // Compute SHA-256 hash of URL (same as API)
 const firstUrl = wlRes.data.urls[0];
 const encoder = new TextEncoder();
 const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(firstUrl));
 const hashArray = Array.from(new Uint8Array(hashBuffer));
 const urlHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

 const histRes = await api.getHistory(urlHash);
 const scans = histRes?.data || [];
 if (scans.length >= 2) {
 const latest = scans[0] as any;
 const previous = scans[1] as any;
 setAfterScan(latest as ScanResult);
 setBeforeScan(previous as ScanResult);
 const latestScreenshot = latest?.screenshot;
 const prevScreenshot = previous?.screenshot;
 if (latestScreenshot && prevScreenshot) {
 setScreenshots({
 before: prevScreenshot,
 after: latestScreenshot,
 beforeDate: previous?.scanned_at || "",
 afterDate: latest?.scanned_at || "",
 });
 }
 }
 } catch {
 // History not available, skip screenshots
 }
 }
 } else {
 setError(wlRes.error || "Failed to load watchlist");
 }
 setLoading(false);
 }

 async function handleAddUrl(e: React.FormEvent) {
 e.preventDefault();
 if (!newUrl.trim() || !watchlist) return;
 setAdding(true);
 const finalUrl = newUrl.startsWith("http") ? newUrl : `https://${newUrl}`;
 const updatedUrls = [...watchlist.urls, finalUrl];
 const res = await api.updateWatchlistUrls(id, updatedUrls);
 if (!res.error) {
 setWatchlist((prev) => prev ? { ...prev, urls: updatedUrls } : prev);
 setNewUrl("");
 toast.success("URL added");
 } else {
 toast.error(res.error || "Failed to add URL");
 }
 setAdding(false);
 }

 async function handleRemoveUrl(url: string) {
 if (!watchlist) return;
 const updatedUrls = watchlist.urls.filter((u) => u !== url);
 const res = await api.updateWatchlistUrls(id, updatedUrls);
 if (!res.error) {
 setWatchlist((prev) => prev ? { ...prev, urls: updatedUrls } : prev);
 toast.success("URL removed");
 } else {
 toast.error(res.error || "Failed to remove URL");
 }
 }

 if (loading) return <ScanResultSkeleton />;
 if (error) return <ErrorState message={error} onRetry={loadData} />;
 if (!watchlist) return null;

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 <div className="dashboard-subtle-card">
 <div className="flex items-center justify-between mb-4">
 <Link href="/dashboard/watchlist" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
 <ArrowLeft className="w-4 h-4" />
 Back to Watchlists
 </Link>
 {changes.length > 0 && (
 <button
 onClick={() => {
 const isPro = userPlan?.plan === "pro" || (userPlan?.plan as string) === "business" || (userPlan?.plan as string) === "enterprise";
 exportDiffPdf({
 domain: watchlist.name,
 changes,
 beforeScan,
 afterScan,
 plan: isPro ? "pro" : "free",
 });
 toast.success("Diff PDF downloaded");
 }}
 className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
 >
 <FileText className="w-4 h-4" />
 Export Diff PDF
 </button>
 )}
 </div>
 {watchlist.description && <p className="text-sm text-muted-foreground">{watchlist.description}</p>}
 </div>

 {/* URLs */}
 <div className="bg-card border border-border rounded-xl p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="font-semibold">Monitored URLs ({watchlist.urls.length})</h3>
 </div>

 <form onSubmit={handleAddUrl} className="flex gap-2 mb-4">
 <input
 type="text"
 value={newUrl}
 onChange={(e) => setNewUrl(e.target.value)}
 placeholder="Add a URL to monitor..."
 className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <button
 type="submit"
 disabled={adding}
 className="px-4 py-2 bg-teal-600 hover:bg-teal-500 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center gap-1.5"
 >
 {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
 Add
 </button>
 </form>

 {watchlist.urls.length === 0 ? (
 <p className="text-sm text-muted-foreground py-4 text-center">No URLs added yet.</p>
 ) : (
 <div className="space-y-2">
 {watchlist.urls.map((url) => (
 <div key={url} className="flex items-center justify-between p-3 rounded-lg bg-background border border-border group">
 <div className="flex items-center gap-2 min-w-0">
 <Globe className="w-4 h-4 text-muted-foreground shrink-0" />
 <span className="text-sm truncate">{truncateUrl(url, 60)}</span>
 </div>
 <button
 onClick={() => handleRemoveUrl(url)}
 className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Alert settings */}
 <AlertSettings
 watchlistId={id}
 frequency={watchlist.frequency}
 onUpdate={() => loadData(false)}
 />

 {/* Visual diff */}
 {screenshots && (
 <ScreenshotDiff
 before={screenshots.before}
 after={screenshots.after}
 beforeDate={screenshots.beforeDate}
 afterDate={screenshots.afterDate}
 />
 )}

 {/* Structured diff timeline */}
 {diffEntries.length > 0 && (
 <div className="bg-card border border-border rounded-xl p-5">
 <h3 className="font-semibold mb-4">What Changed</h3>
 <TechDiffTimeline entries={diffEntries} domain={watchlist.name} />
 </div>
 )}

 {/* Raw change timeline */}
 <div className="bg-card border border-border rounded-xl p-5">
 <h3 className="font-semibold mb-4">Change Timeline</h3>
 <ChangeTimeline changes={changes} />
 </div>
 </div>
 );
}
