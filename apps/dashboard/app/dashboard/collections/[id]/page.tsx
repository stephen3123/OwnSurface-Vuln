"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { api, type Collection, type CollectionItem } from "@/lib/api-client";
import { formatRelative, truncateUrl } from "@/lib/utils";
import {
 ArrowLeft,
 Edit2,
 Trash2,
 Loader2,
 Plus,
 Globe,
 Lock,
 X,
 ExternalLink,
 FolderOpen,
} from "lucide-react";
import { toast } from "sonner";

export default function CollectionDetailPage() {
 const { id } = useParams<{ id: string }>();
 const router = useRouter();
 const [collection, setCollection] = useState<(Collection & { items: CollectionItem[] }) | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState("");
 const [editing, setEditing] = useState(false);
 const [editTitle, setEditTitle] = useState("");
 const [editDescription, setEditDescription] = useState("");
 const [saving, setSaving] = useState(false);
 const [deleting, setDeleting] = useState(false);

 // Add item form
 const [showAddItem, setShowAddItem] = useState(false);
 const [addUrl, setAddUrl] = useState("");
 const [addTitle, setAddTitle] = useState("");
 const [addNotes, setAddNotes] = useState("");
 const [adding, setAdding] = useState(false);

 const loadCollection = useCallback(async () => {
 if (!id) return;
 setLoading(true);
 const res = await api.getCollection(id);
 if (res.data) {
 setCollection(res.data);
 setEditTitle(res.data.title);
 setEditDescription(res.data.description);
 } else {
 setError(res.error || "Collection not found");
 }
 setLoading(false);
 }, [id]);

 useEffect(() => {
 loadCollection();
 }, [loadCollection]);

 async function handleSaveEdit(e: React.FormEvent) {
 e.preventDefault();
 if (!id) return;
 setSaving(true);
 const res = await api.updateCollection(id, {
 title: editTitle.trim(),
 description: editDescription.trim(),
 });
 if (res.error) {
 toast.error(res.error);
 } else {
 toast.success("Collection updated");
 setEditing(false);
 loadCollection();
 }
 setSaving(false);
 }

 async function handleDelete() {
 if (!id) return;
 if (!confirm("Are you sure you want to delete this collection?")) return;
 setDeleting(true);
 const res = await api.deleteCollection(id);
 if (res.error) {
 toast.error(res.error);
 setDeleting(false);
 } else {
 toast.success("Collection deleted");
 router.push("/dashboard/collections");
 }
 }

 async function handleAddItem(e: React.FormEvent) {
 e.preventDefault();
 if (!id || !addUrl.trim()) return;
 setAdding(true);
 const res = await api.addToCollection(id, {
 scan_hash: "",
 url: addUrl.trim(),
 title: addTitle.trim() || addUrl.trim(),
 notes: addNotes.trim(),
 });
 if (res.error) {
 toast.error(res.error);
 } else {
 toast.success("Item added");
 setShowAddItem(false);
 setAddUrl("");
 setAddTitle("");
 setAddNotes("");
 loadCollection();
 }
 setAdding(false);
 }

 async function handleRemoveItem(itemId: string) {
 if (!id) return;
 const res = await api.removeFromCollection(id, itemId);
 if (res.error) {
 toast.error(res.error);
 } else {
 loadCollection();
 }
 }

 if (loading) {
 return (
 <div className="dashboard-page mx-auto max-w-3xl flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
 </div>
 );
 }

 if (error || !collection) {
 return (
 <div className="dashboard-page mx-auto max-w-3xl">
 <div className="rounded-xl border border-border bg-card p-12 text-center">
 <p className="text-sm text-muted-foreground">{error || "Collection not found"}</p>
 <Link
 href="/dashboard/collections"
 className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-600"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to collections
 </Link>
 </div>
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-3xl">
 {/* Back */}
 <Link
 href="/dashboard/collections"
 className="inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
 >
 <ArrowLeft className="h-4 w-4" />
 Back to collections
 </Link>

 {/* Header */}
 <div className="rounded-xl border border-border bg-card p-6">
 {editing ? (
 <form onSubmit={handleSaveEdit} className="space-y-3">
 <input
 type="text"
 value={editTitle}
 onChange={(e) => setEditTitle(e.target.value)}
 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <textarea
 value={editDescription}
 onChange={(e) => setEditDescription(e.target.value)}
 rows={2}
 className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <div className="flex gap-2">
 <button
 type="submit"
 disabled={saving}
 className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
 >
 {saving && <Loader2 className="h-4 w-4 animate-spin" />}
 Save
 </button>
 <button
 type="button"
 onClick={() => setEditing(false)}
 className="rounded-lg px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-accent"
 >
 Cancel
 </button>
 </div>
 </form>
 ) : (
 <div className="flex items-start justify-between">
 <div>
 <div className="flex items-center gap-2">
 <h1 className="text-xl font-bold">{collection.title}</h1>
 <span className="flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-xs text-muted-foreground">
 {collection.visibility === "public" ? (
 <><Globe className="h-3 w-3" /> Public</>
 ) : (
 <><Lock className="h-3 w-3" /> Private</>
 )}
 </span>
 </div>
 {collection.description && (
 <p className="mt-1 text-sm text-muted-foreground">{collection.description}</p>
 )}
 <p className="mt-2 text-xs text-muted-foreground">
 {collection.item_count} items -- Updated {formatRelative(collection.updated_at)}
 </p>
 </div>
 <div className="flex gap-2">
 <button
 onClick={() => setEditing(true)}
 className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground hover:bg-accent hover:text-foreground"
 >
 <Edit2 className="h-4 w-4" />
 </button>
 <button
 onClick={handleDelete}
 disabled={deleting}
 className="flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/20 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
 >
 {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
 </button>
 </div>
 </div>
 )}
 </div>

 {/* Add item */}
 <div>
 {showAddItem ? (
 <div className="rounded-xl border border-border bg-card p-5">
 <div className="flex items-center justify-between mb-4">
 <h3 className="text-sm font-semibold">Add Item</h3>
 <button
 onClick={() => setShowAddItem(false)}
 className="text-muted-foreground hover:text-foreground"
 >
 <X className="h-4 w-4" />
 </button>
 </div>
 <form onSubmit={handleAddItem} className="space-y-3">
 <input
 type="url"
 value={addUrl}
 onChange={(e) => setAddUrl(e.target.value)}
 placeholder="https://example.com"
 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <input
 type="text"
 value={addTitle}
 onChange={(e) => setAddTitle(e.target.value)}
 placeholder="Title (optional)"
 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <textarea
 value={addNotes}
 onChange={(e) => setAddNotes(e.target.value)}
 placeholder="Notes (optional)"
 rows={2}
 className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 <button
 type="submit"
 disabled={adding || !addUrl.trim()}
 className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-500 disabled:opacity-50"
 >
 {adding && <Loader2 className="h-4 w-4 animate-spin" />}
 Add
 </button>
 </form>
 </div>
 ) : (
 <button
 onClick={() => setShowAddItem(true)}
 className="flex items-center gap-2 rounded-xl border border-dashed border-border bg-card px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-teal-500/30 hover:text-teal-700 w-full justify-center"
 >
 <Plus className="h-4 w-4" />
 Add Item
 </button>
 )}
 </div>

 {/* Items list */}
 {(collection.items || []).length === 0 ? (
 <div className="rounded-xl border border-border bg-card py-12 text-center">
 <FolderOpen className="mx-auto h-10 w-10 text-muted-foreground" />
 <p className="mt-3 text-sm text-muted-foreground">This collection is empty. Add items to get started.</p>
 </div>
 ) : (
 <div className="divide-y divide-border rounded-xl border border-border bg-card">
 {(collection.items || []).map((item) => (
 <div key={item.id} className="flex items-center gap-4 p-4">
 <div className="min-w-0 flex-1">
 <p className="text-sm font-medium truncate">{item.title}</p>
 <p className="text-xs text-muted-foreground truncate">{truncateUrl(item.url, 60)}</p>
 {item.notes && (
 <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{item.notes}</p>
 )}
 <p className="mt-1 text-xs text-muted-foreground">{formatRelative(item.added_at)}</p>
 </div>
 <div className="flex items-center gap-1.5">
 <a
 href={item.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground"
 >
 <ExternalLink className="h-4 w-4" />
 </a>
 <button
 onClick={() => handleRemoveItem(item.id)}
 className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
 >
 <Trash2 className="h-4 w-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
}
