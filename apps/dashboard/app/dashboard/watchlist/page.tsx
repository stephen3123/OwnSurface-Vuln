"use client";

import { useState, useEffect } from "react";
import { api, type Watchlist } from "@/lib/api-client";
import { WatchlistCard } from "@/components/watchlist/watchlist-card";
import { CardSkeleton } from "@/components/shared/loading-skeleton";
import { Eye, Plus, Loader2, X } from "lucide-react";
import { toast } from "sonner";

export default function WatchlistPage() {
 const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
 const [loading, setLoading] = useState(true);
 const [showCreate, setShowCreate] = useState(false);
 const [creating, setCreating] = useState(false);
 const [form, setForm] = useState({ name: "", description: "", urls: "", frequency: "weekly" });

 useEffect(() => {
 loadWatchlists();
 }, []);

 async function loadWatchlists() {
 const res = await api.getWatchlists();
 if (res.data) setWatchlists(res.data);
 setLoading(false);
 }

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!form.name.trim()) return;
 setCreating(true);
 const urls = form.urls
 .split("\n")
 .map((u) => u.trim())
 .filter(Boolean);
 const res = await api.createWatchlist({
 name: form.name,
 description: form.description,
 urls,
 frequency: form.frequency,
 });
 if (res.data) {
 toast.success("Watchlist created");
 setShowCreate(false);
 setForm({ name: "", description: "", urls: "", frequency: "weekly" });
 loadWatchlists();
 } else {
 toast.error(res.error || "Failed to create watchlist");
 }
 setCreating(false);
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 <div className="dashboard-toolbar-end">
 <button
 onClick={() => setShowCreate(true)}
 className="flex items-center gap-2 px-4 py-2 bg-card text-zinc-950 hover:bg-zinc-200 rounded-lg text-sm font-medium transition-colors"
 >
 <Plus className="w-4 h-4" />
 New Watchlist
 </button>
 </div>

 {/* Create dialog */}
 {showCreate && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
 <div className="bg-card border border-border rounded-xl p-6 w-full max-w-md mx-4">
 <div className="flex items-center justify-between mb-4">
 <h2 className="text-lg font-semibold">New Watchlist</h2>
 <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-accent rounded-md">
 <X className="w-5 h-5" />
 </button>
 </div>
 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Name</label>
 <input
 type="text"
 required
 value={form.name}
 onChange={(e) => setForm({ ...form, name: e.target.value })}
 placeholder="My Watchlist"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Description</label>
 <input
 type="text"
 value={form.description}
 onChange={(e) => setForm({ ...form, description: e.target.value })}
 placeholder="Optional description"
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">URLs (one per line)</label>
 <textarea
 value={form.urls}
 onChange={(e) => setForm({ ...form, urls: e.target.value })}
 placeholder={"https://example.com\nhttps://another-site.com"}
 rows={4}
 className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-teal-500/40 resize-none"
 />
 </div>
 <div>
 <label className="block text-sm font-medium mb-1.5">Check Frequency</label>
 <div className="flex gap-2">
 {["daily", "weekly", "monthly"].map((f) => (
 <button
 key={f}
 type="button"
 onClick={() => setForm({ ...form, frequency: f })}
 className={`px-4 py-2 rounded-lg text-sm capitalize ${
 form.frequency === f
 ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
 : "bg-background border border-border text-muted-foreground"
 }`}
 >
 {f}
 </button>
 ))}
 </div>
 </div>
 <div className="flex gap-3 pt-2">
 <button
 type="button"
 onClick={() => setShowCreate(false)}
 className="flex-1 py-2.5 bg-secondary rounded-lg text-sm font-medium"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={creating}
 className="flex-1 py-2.5 bg-card text-zinc-950 hover:bg-zinc-200 rounded-lg text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
 >
 {creating && <Loader2 className="w-4 h-4 animate-spin" />}
 Create
 </button>
 </div>
 </form>
 </div>
 </div>
 )}

 {/* List */}
 {loading ? (
 <div className="space-y-4">
 {Array.from({ length: 3 }).map((_, i) => (
 <CardSkeleton key={i} />
 ))}
 </div>
 ) : watchlists.length === 0 ? (
 <div className="dashboard-empty">
 <Eye className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
 <h3 className="font-semibold mb-1">No watchlists yet</h3>
 <p className="text-sm text-muted-foreground mb-4">Create a watchlist to monitor websites for changes.</p>
 <button
 onClick={() => setShowCreate(true)}
 className="inline-flex items-center gap-2 px-4 py-2 bg-card text-zinc-950 hover:bg-zinc-200 rounded-lg text-sm font-medium"
 >
 <Plus className="w-4 h-4" />
 Create Watchlist
 </button>
 </div>
 ) : (
 <div className="space-y-4">
 {watchlists.map((wl) => (
 <WatchlistCard key={wl.id} watchlist={wl} />
 ))}
 </div>
 )}
 </div>
 );
}
