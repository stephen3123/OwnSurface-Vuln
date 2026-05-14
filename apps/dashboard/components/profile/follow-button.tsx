"use client";

import { useState } from "react";
import { api } from "@/lib/api-client";
import { UserPlus, UserCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowButtonProps {
 userId: string;
 initialFollowing: boolean;
 onToggle?: (following: boolean) => void;
}

export function FollowButton({ userId, initialFollowing, onToggle }: FollowButtonProps) {
 const [following, setFollowing] = useState(initialFollowing);
 const [loading, setLoading] = useState(false);

 async function handleToggle() {
 if (loading) return;
 setLoading(true);

 const res = following
 ? await api.unfollowUser(userId)
 : await api.followUser(userId);

 if (!res.error) {
 const next = !following;
 setFollowing(next);
 onToggle?.(next);
 }
 setLoading(false);
 }

 return (
 <button
 onClick={handleToggle}
 disabled={loading}
 className={cn(
 "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors disabled:opacity-50",
 following
 ? "bg-teal-500/10 text-teal-700 hover:bg-red-500/10 hover:text-red-500"
 : "bg-teal-600 text-white hover:bg-teal-500"
 )}
 >
 {loading ? (
 <Loader2 className="h-4 w-4 animate-spin" />
 ) : following ? (
 <UserCheck className="h-4 w-4" />
 ) : (
 <UserPlus className="h-4 w-4" />
 )}
 {following ? "Following" : "Follow"}
 </button>
 );
}
