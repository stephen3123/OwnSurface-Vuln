"use client";

import type { Watchlist } from "@/lib/api-client";
import { formatRelative } from "@/lib/utils";
import Link from "next/link";
import { Eye, Globe, Bell, ChevronRight } from "lucide-react";

interface WatchlistCardProps {
 watchlist: Watchlist;
}

export function WatchlistCard({ watchlist }: WatchlistCardProps) {
 return (
 <Link
 href={`/dashboard/watchlist/${watchlist.id}`}
 className="block bg-card border border-border rounded-xl p-5 hover:border-teal-500/30 transition-all group"
 >
 <div className="flex items-start justify-between">
 <div className="flex items-start gap-3">
 <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
 <Eye className="w-5 h-5 text-blue-400" />
 </div>
 <div>
 <h3 className="font-semibold group-hover:text-teal-400 transition-colors">
 {watchlist.name}
 </h3>
 {watchlist.description && (
 <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{watchlist.description}</p>
 )}
 </div>
 </div>
 <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
 </div>
 <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
 <div className="flex items-center gap-1">
 <Globe className="w-3.5 h-3.5" />
 <span>{watchlist.urls.length} URLs</span>
 </div>
 <div className="flex items-center gap-1">
 <Bell className="w-3.5 h-3.5" />
 <span className="capitalize">{watchlist.frequency}</span>
 </div>
 {watchlist.recent_changes > 0 && (
 <span className="px-2 py-0.5 bg-teal-500/10 text-teal-400 rounded-full font-medium">
 {watchlist.recent_changes} changes
 </span>
 )}
 <span className="ml-auto">Updated {formatRelative(watchlist.updated_at)}</span>
 </div>
 </Link>
 );
}
