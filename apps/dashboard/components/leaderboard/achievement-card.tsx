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

const categoryStyles: Record<string, { border: string; bg: string; iconBg: string; iconText: string }> = {
 milestone: {
 border: "border-blue-500/30",
 bg: "bg-blue-500/5",
 iconBg: "bg-blue-500/10",
 iconText: "text-blue-500",
 },
 skill: {
 border: "border-emerald-500/30",
 bg: "bg-emerald-500/5",
 iconBg: "bg-emerald-500/10",
 iconText: "text-emerald-500",
 },
 social: {
 border: "border-purple-500/30",
 bg: "bg-purple-500/5",
 iconBg: "bg-purple-500/10",
 iconText: "text-purple-500",
 },
};

interface AchievementCardProps {
 badge: Badge;
}

export function AchievementCard({ badge }: AchievementCardProps) {
 const Icon = iconMap[badge.icon] || Award;
 const style = categoryStyles[badge.category] || categoryStyles.milestone;

 return (
 <div
 className={cn(
 "rounded-xl border p-4 transition-all",
 style.border,
 style.bg,
 ""
 )}
 >
 <div className="flex items-start gap-3">
 <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", style.iconBg)}>
 <Icon className={cn("h-5 w-5", style.iconText)} />
 </div>
 <div className="min-w-0 flex-1">
 <h4 className="text-sm font-semibold">{badge.name}</h4>
 <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{badge.description}</p>
 {badge.earned_at && (
 <p className="mt-1.5 text-xs text-muted-foreground">
 Earned {formatRelative(badge.earned_at)}
 </p>
 )}
 </div>
 </div>
 </div>
 );
}
