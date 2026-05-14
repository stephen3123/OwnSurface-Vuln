"use client";

import type { Badge } from "@/lib/api-client";
import { formatRelative, cn } from "@/lib/utils";
import {
 Award,
 Target,
 Users,
 Star,
 Shield,
 Zap,
 Trophy,
 Flame,
 Eye,
 BookOpen,
} from "lucide-react";
import { useState } from "react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
 award: Award,
 target: Target,
 users: Users,
 star: Star,
 shield: Shield,
 zap: Zap,
 trophy: Trophy,
 flame: Flame,
 eye: Eye,
 book: BookOpen,
};

const categoryColors: Record<string, string> = {
 milestone: "border-blue-500/30 bg-blue-500/5",
 skill: "border-emerald-500/30 bg-emerald-500/5",
 social: "border-purple-500/30 bg-purple-500/5",
};

const categoryIconColors: Record<string, string> = {
 milestone: "text-blue-500 bg-blue-500/10",
 skill: "text-emerald-500 bg-emerald-500/10",
 social: "text-purple-500 bg-purple-500/10",
};

interface BadgeGridProps {
 badges: Badge[];
 showUnearned?: boolean;
}

export function BadgeGrid({ badges, showUnearned = false }: BadgeGridProps) {
 const [hoveredId, setHoveredId] = useState<string | null>(null);

 const displayed = showUnearned ? badges : badges.filter((b) => b.earned_at);

 if (displayed.length === 0) {
 return (
 <div className="rounded-xl border border-border bg-card p-8 text-center">
 <Award className="mx-auto h-10 w-10 text-muted-foreground" />
 <p className="mt-3 text-sm text-muted-foreground">No badges earned yet. Keep scanning to unlock achievements.</p>
 </div>
 );
 }

 return (
 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
 {displayed.map((badge) => {
 const Icon = iconMap[badge.icon] || Award;
 const earned = !!badge.earned_at;
 const colorClass = categoryColors[badge.category] || categoryColors.milestone;
 const iconColorClass = categoryIconColors[badge.category] || categoryIconColors.milestone;

 return (
 <div
 key={badge.id}
 className={cn(
 "relative rounded-xl border p-4 text-center transition-all",
 earned ? colorClass : "border-border bg-card opacity-40 grayscale"
 )}
 onMouseEnter={() => setHoveredId(badge.id)}
 onMouseLeave={() => setHoveredId(null)}
 >
 <div
 className={cn(
 "mx-auto flex h-12 w-12 items-center justify-center rounded-xl",
 earned ? iconColorClass : "bg-secondary text-muted-foreground"
 )}
 >
 <Icon className="h-6 w-6" />
 </div>
 <p className="mt-2.5 text-sm font-semibold line-clamp-1">{badge.name}</p>
 {earned && badge.earned_at && (
 <p className="mt-0.5 text-xs text-muted-foreground">
 {formatRelative(badge.earned_at)}
 </p>
 )}
 {!earned && (
 <p className="mt-0.5 text-xs text-muted-foreground">Locked</p>
 )}

 {/* Tooltip */}
 {hoveredId === badge.id && badge.description && (
 <div className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 -translate-y-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-muted-foreground">
 {badge.description}
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}
