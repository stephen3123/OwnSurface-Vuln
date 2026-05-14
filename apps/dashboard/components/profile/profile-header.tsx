"use client";

import type { UserProfile } from "@/lib/api-client";
import { FollowButton } from "./follow-button";
import { BadgeGrid } from "./badge-grid";
import { formatNumber } from "@/lib/utils";
import { Scan, Users, UserPlus } from "lucide-react";

interface ProfileHeaderProps {
 profile: UserProfile;
 isOwnProfile?: boolean;
 onFollowToggle?: (following: boolean) => void;
}

export function ProfileHeader({ profile, isOwnProfile = false, onFollowToggle }: ProfileHeaderProps) {
 const topBadges = (profile.badges || []).filter((b) => b.earned_at).slice(0, 5);

 return (
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
 {/* Avatar */}
 <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl">
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={profile.avatar_url || `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(profile.username || profile.name || "user")}`}
 alt={profile.name}
 className="h-20 w-20 rounded-2xl object-cover"
 />
 </div>

 {/* Info */}
 <div className="min-w-0 flex-1 text-center sm:text-left">
 <h1 className="text-xl font-bold">{profile.name}</h1>
 <p className="text-sm text-muted-foreground">@{profile.username}</p>
 {profile.bio && (
 <p className="mt-2 text-sm text-foreground/80 max-w-lg">{profile.bio}</p>
 )}

 {/* Stats */}
 <div className="mt-4 flex items-center justify-center gap-6 sm:justify-start">
 <div className="flex items-center gap-1.5">
 <Scan className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm font-semibold">{formatNumber(profile.published_count)}</span>
 <span className="text-xs text-muted-foreground">published</span>
 </div>
 <div className="flex items-center gap-1.5">
 <Users className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm font-semibold">{formatNumber(profile.follower_count)}</span>
 <span className="text-xs text-muted-foreground">followers</span>
 </div>
 <div className="flex items-center gap-1.5">
 <UserPlus className="h-4 w-4 text-muted-foreground" />
 <span className="text-sm font-semibold">{formatNumber(profile.following_count)}</span>
 <span className="text-xs text-muted-foreground">following</span>
 </div>
 </div>
 </div>

 {/* Follow button */}
 {!isOwnProfile && (
 <div className="shrink-0">
 <FollowButton
 userId={profile.id}
 initialFollowing={profile.is_following || false}
 onToggle={onFollowToggle}
 />
 </div>
 )}
 </div>

 {/* Top badges */}
 {topBadges.length > 0 && (
 <div className="mt-5 border-t border-border pt-4">
 <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
 Top Badges
 </p>
 <div className="flex flex-wrap gap-2">
 {topBadges.map((badge) => (
 <span
 key={badge.id}
 className="rounded-full bg-teal-500/10 px-3 py-1 text-xs font-medium text-teal-700"
 title={badge.description}
 >
 {badge.name}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
