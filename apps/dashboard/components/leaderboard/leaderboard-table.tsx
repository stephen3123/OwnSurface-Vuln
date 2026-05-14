"use client";

import type { LeaderboardEntry } from "@/lib/api-client";
import { formatNumber, cn } from "@/lib/utils";
import { Medal, Trophy, Award } from "lucide-react";

interface LeaderboardTableProps {
 entries: LeaderboardEntry[];
 page: number;
 onPageChange: (page: number) => void;
 pageSize?: number;
}

function RankDisplay({ rank }: { rank: number }) {
 if (rank === 1) {
 return (
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-500/10">
 <Trophy className="h-4 w-4 text-yellow-500" />
 </div>
 );
 }
 if (rank === 2) {
 return (
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-300/10">
 <Medal className="h-4 w-4 text-slate-400" />
 </div>
 );
 }
 if (rank === 3) {
 return (
 <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600/10">
 <Award className="h-4 w-4 text-amber-600" />
 </div>
 );
 }
 return (
 <div className="flex h-8 w-8 items-center justify-center text-sm font-semibold text-muted-foreground">
 {rank}
 </div>
 );
}

export function LeaderboardTable({ entries, page, onPageChange, pageSize = 20 }: LeaderboardTableProps) {
 const totalPages = Math.max(1, Math.ceil(entries.length / pageSize));
 const paginated = entries.slice((page - 1) * pageSize, page * pageSize);

 if (entries.length === 0) {
 return (
 <div className="rounded-xl border border-border bg-card p-12 text-center">
 <Trophy className="mx-auto h-10 w-10 text-muted-foreground" />
 <p className="mt-3 text-sm text-muted-foreground">No leaderboard data available yet.</p>
 </div>
 );
 }

 return (
 <div>
 <div className="overflow-hidden rounded-xl border border-border bg-card">
 <div className="overflow-x-auto">
 <table className="min-w-[38rem] w-full">
 <thead>
 <tr className="border-b border-border bg-accent/30">
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
 <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
 <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:table-cell">Scans</th>
 <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Published</th>
 <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">Likes</th>
 <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">Followers</th>
 </tr>
 </thead>
 <tbody className="divide-y divide-border">
 {paginated.map((entry) => (
 <tr
 key={entry.user_id}
 className={cn(
 "transition-colors hover:bg-accent/30",
 entry.is_current_user && "bg-teal-500/5 hover:bg-teal-500/10"
 )}
 >
 <td className="px-4 py-3">
 <RankDisplay rank={entry.rank} />
 </td>
 <td className="px-4 py-3">
 <div className="flex items-center gap-3">
 <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-500/10 text-sm font-bold text-teal-700">
 {entry.avatar_url ? (
 <img
 src={entry.avatar_url}
 alt={entry.name}
 className="h-9 w-9 rounded-full object-cover"
 />
 ) : (
 entry.name?.charAt(0)?.toUpperCase() || "U"
 )}
 </div>
 <div className="min-w-0">
 <p className={cn("text-sm font-semibold truncate", entry.is_current_user && "text-teal-700")}>
 {entry.name || entry.username}
 {entry.is_current_user && <span className="ml-1.5 text-xs text-teal-600">(You)</span>}
 </p>
 <p className="text-xs text-muted-foreground truncate">@{entry.username}</p>
 </div>
 </div>
 </td>
 <td className="hidden px-4 py-3 text-right text-sm font-medium sm:table-cell">
 {formatNumber(entry.scan_count)}
 </td>
 <td className="hidden px-4 py-3 text-right text-sm font-medium md:table-cell">
 {formatNumber(entry.published_count)}
 </td>
 <td className="hidden px-4 py-3 text-right text-sm font-medium md:table-cell">
 {formatNumber(entry.like_count)}
 </td>
 <td className="px-4 py-3 text-right text-sm font-medium">
 {formatNumber(entry.follower_count)}
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>

 {/* Pagination */}
 {totalPages > 1 && (
 <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
 <button
 onClick={() => onPageChange(page - 1)}
 disabled={page <= 1}
 className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
 >
 Previous
 </button>
 <span className="text-sm text-muted-foreground">
 Page {page} of {totalPages}
 </span>
 <button
 onClick={() => onPageChange(page + 1)}
 disabled={page >= totalPages}
 className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-accent disabled:opacity-50"
 >
 Next
 </button>
 </div>
 )}
 </div>
 );
}
