"use client";

import { useState, useEffect } from "react";
import { api, type Collection } from "@/lib/api-client";
import { CollectionCard } from "@/components/collections/collection-card";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function CollectionsPage() {
 const [collections, setCollections] = useState<Collection[]>([]);
 const [loading, setLoading] = useState(true);
 const [showModal, setShowModal] = useState(false);

 // New collection form
 const [title, setTitle] = useState("");
 const [description, setDescription] = useState("");
 const [visibility, setVisibility] = useState<"public" | "private">("private");
 const [creating, setCreating] = useState(false);

 useEffect(() => {
 loadCollections();
 }, []);

 async function loadCollections() {
 setLoading(true);
 const res = await api.getCollections();
 if (res.data) setCollections(res.data);
 setLoading(false);
 }

 async function handleCreate(e: React.FormEvent) {
 e.preventDefault();
 if (!title.trim()) {
 toast.error("Title is required");
 return;
 }
 setCreating(true);
 const res = await api.createCollection({
 title: title.trim(),
 description: description.trim(),
 visibility,
 });
 if (res.error) {
 toast.error(res.error);
 } else {
 toast.success("Collection created");
 setShowModal(false);
 setTitle("");
 setDescription("");
 setVisibility("private");
 loadCollections();
 }
 setCreating(false);
 }

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 {/* Header */}
 <div className="shell-panel flex items-center justify-between rounded-[1.75rem] p-5 sm:p-6">
 <div>
 <h2 className="text-xl font-black uppercase tracking-tighter">Collections</h2>
 <p className="text-[0.8rem] font-black uppercase tracking-tight text-muted-foreground underline decoration-1 underline-offset-4">Organize your scans into curated collections</p>
 </div>
 <button
 onClick={() => setShowModal(true)}
 className="flex items-center gap-2 rounded-xl bg-black px-6 py-3 text-[0.7rem] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 hover:translate-y-[-2px]"
 >
 NEW COLLECTION
 </button>
 </div>

 {/* Grid */}
 {loading ? (
 <div className="flex items-center justify-center py-20">
 <div className="text-[0.7rem] font-black uppercase tracking-[0.5em] animate-pulse">Synchronizing...</div>
 </div>
 ) : collections.length === 0 ? (
 <div className="shell-panel py-20 text-center border-2 border-dashed border-border">
 <p className="text-[0.8rem] font-black uppercase tracking-widest text-muted-foreground">Initial Discovery Phase – No collections identified</p>
 </div>
 ) : (
 <div className="grid gap-4 sm:grid-cols-2">
 {collections.map((collection) => (
 <CollectionCard key={collection.id} collection={collection} />
 ))}
 </div>
 )}

 {/* Create Modal */}
 {showModal && (
 <div className="fixed inset-0 z-50 flex items-center justify-center">
 <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
 <div className="relative mx-4 w-full max-w-lg rounded-2xl border border-border bg-card p-6">
 <div className="flex items-center justify-between mb-8 pb-4 border-b border-border">
 <h2 className="text-xl font-black uppercase tracking-tighter">New Collection</h2>
 <button
 onClick={() => setShowModal(false)}
 className="text-[0.8rem] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
 >
 CLOSE [X]
 </button>
 </div>

 <form onSubmit={handleCreate} className="space-y-4">
 <div>
 <label className="block text-[0.65rem] font-black uppercase tracking-widest mb-2 text-muted-foreground">Collection Title</label>
 <input
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="MY COLLECTION"
 className="w-full rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-black transition-all"
 />
 </div>

 <div>
 <label className="block text-[0.65rem] font-black uppercase tracking-widest mb-2 text-muted-foreground">Description (Context)</label>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="EXECUTIVE SUMMARY"
 rows={2}
 className="w-full resize-none rounded-xl border-2 border-border bg-card px-4 py-3 text-sm font-black uppercase tracking-tight outline-none focus:border-black transition-all"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-2">Visibility</label>
 <div className="flex gap-2">
 <button
 type="button"
 onClick={() => setVisibility("private")}
 className={cn(
 "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[0.7rem] font-black uppercase tracking-widest transition-all",
 visibility === "private"
 ? "border-black bg-black text-white"
 : "border-border text-muted-foreground hover:border-black hover:text-foreground"
 )}
 >
 PRIVATE
 </button>
 <button
 type="button"
 onClick={() => setVisibility("public")}
 className={cn(
 "flex flex-1 items-center justify-center gap-2 rounded-xl border-2 px-4 py-3 text-[0.7rem] font-black uppercase tracking-widest transition-all",
 visibility === "public"
 ? "border-black bg-black text-white"
 : "border-border text-muted-foreground hover:border-black hover:text-foreground"
 )}
 >
 PUBLIC
 </button>
 </div>
 </div>

 <div className="flex justify-end gap-3 pt-6">
 <button
 type="button"
 onClick={() => setShowModal(false)}
 className="rounded-xl px-6 py-3 text-[0.7rem] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
 >
 CANCEL
 </button>
 <button
 type="submit"
 disabled={creating || !title.trim()}
 className="rounded-xl bg-black px-8 py-3 text-[0.7rem] font-black uppercase tracking-widest text-white transition-all hover:bg-zinc-800 disabled:opacity-20"
 >
 {creating ? "CREATING..." : "CONFIRM CREATION"}
 </button>
 </div>
 </form>
 </div>
 </div>
 )}
 </div>
 );
}
