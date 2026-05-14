"use client";

import Link from "next/link";
import type { Collection } from "@/lib/api-client";
import { formatRelative } from "@/lib/utils";

interface CollectionCardProps {
 collection: Collection;
}

export function CollectionCard({ collection }: CollectionCardProps) {
 return (
 <Link
 href={`/dashboard/collections/${collection.id}`}
 className="group block rounded-2xl border-2 border-border bg-card p-6 transition-all hover:border-black hover:"
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border-2 border-black bg-black text-white font-black text-[0.6rem] uppercase">
 COL
 </div>
 <div className="min-w-0">
 <h3 className="font-black uppercase tracking-tight group-hover:underline decoration-2 underline-offset-4 transition-all line-clamp-1">
 {collection.title}
 </h3>
 {collection.description && (
 <p className="mt-0.5 text-[0.7rem] font-black uppercase tracking-tight text-muted-foreground line-clamp-1">
 {collection.description}
 </p>
 )}
 </div>
 </div>
 <span className="text-xl font-black text-zinc-300 transition-all group-hover:text-foreground group-hover:translate-x-1">→</span>
 </div>

 {/* Preview thumbnails */}
 {(collection.preview_urls || []).length > 0 && (
 <div className="mt-3 flex gap-2">
 {(collection.preview_urls || []).slice(0, 3).map((url, i) => (
 <div
 key={i}
 className="flex h-8 flex-1 items-center justify-center rounded-md bg-accent/50 px-2"
 >
 <span className="truncate text-xs text-muted-foreground">{url.replace(/^https?:\/\//, "").split("/")[0]}</span>
 </div>
 ))}
 </div>
 )}

 {/* Footer */}
 <div className="mt-4 flex items-center gap-4 text-[0.6rem] font-black uppercase tracking-widest text-muted-foreground">
 <div className="flex items-center gap-1 bg-muted px-2 py-0.5 rounded-sm">
 <span>{collection.item_count} ITEMS</span>
 </div>
 <div className="flex items-center gap-1">
 {collection.visibility === "public" ? (
 <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-sm border border-emerald-100 uppercase">Public</span>
 ) : (
 <span className="text-rose-700 bg-rose-50 px-2 py-0.5 rounded-sm border border-rose-100 uppercase">Private</span>
 )}
 </div>
 <span className="ml-auto font-black uppercase underline decoration-1 underline-offset-2">UPDATED {formatRelative(collection.updated_at)}</span>
 </div>
 </Link>
 );
}
