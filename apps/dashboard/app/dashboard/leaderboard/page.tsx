"use client";

import { useState, useEffect, useCallback } from "react";
import { api, type LeaderboardEntry, type Badge } from "@/lib/api-client";
import { LeaderboardTable } from "@/components/leaderboard/leaderboard-table";
import { AchievementCard } from "@/components/leaderboard/achievement-card";
import { cn } from "@/lib/utils";
import { Loader2, Trophy, Calendar, CalendarDays, Infinity } from "lucide-react";

type Period = "weekly" | "monthly" | "all_time";

const periodTabs: { key: Period; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
 { key: "weekly", label: "Weekly", icon: Calendar },
 { key: "monthly", label: "Monthly", icon: CalendarDays },
 { key: "all_time", label: "All Time", icon: Infinity },
];

export default function LeaderboardPage() {
 const [period, setPeriod] = useState<Period>("weekly");
 const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
 const [badges, setBadges] = useState<Badge[]>([]);
 const [loading, setLoading] = useState(true);
 const [page, setPage] = useState(1);

 const loadLeaderboard = useCallback(async (p: Period) => {
 setLoading(true);
 const res = await api.getLeaderboard(p);
 if (res.data) setEntries(res.data);
 setLoading(false);
 }, []);

 useEffect(() => {
 setPage(1);
 loadLeaderboard(period);
 }, [period, loadLeaderboard]);

 useEffect(() => {
 api.getMyBadges().then((res) => {
 if (res.data) setBadges(res.data);
 });
 }, []);

 return (
 <div className="dashboard-page mx-auto max-w-4xl">
 {/* Header */}
 <div className="shell-panel flex flex-col gap-4 rounded-[1.75rem] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
 <div>
 <h2 className="text-lg font-bold">Leaderboard</h2>
 <p className="text-sm text-muted-foreground">See how you rank among the community</p>
 </div>
 </div>

 {/* Period tabs */}
 <div className="flex gap-1 rounded-xl bg-card border border-border p-1 self-start w-fit">
 {periodTabs.map((tab) => (
 <button
 key={tab.key}
 onClick={() => setPeriod(tab.key)}
 className={cn(
 "flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
 period === tab.key
 ? "bg-teal-600 text-white"
 : "text-muted-foreground hover:bg-accent hover:text-foreground"
 )}
 >
 <tab.icon className="h-4 w-4" />
 {tab.label}
 </button>
 ))}
 </div>

 {/* Leaderboard */}
 {loading ? (
 <div className="flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
 </div>
 ) : (
 <LeaderboardTable
 entries={entries}
 page={page}
 onPageChange={setPage}
 />
 )}

 {/* Achievements */}
 {badges.length > 0 && (
 <div>
 <div className="flex items-center gap-2 mb-4">
 <Trophy className="h-5 w-5 text-teal-700" />
 <h3 className="text-lg font-bold">Your Achievements</h3>
 </div>
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {badges
 .filter((b) => b.earned_at)
 .map((badge) => (
 <AchievementCard key={badge.id} badge={badge} />
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
