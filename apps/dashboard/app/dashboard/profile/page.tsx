"use client";

import { useState, useEffect } from "react";
import { api, type UserProfile } from "@/lib/api-client";
import { BadgeGrid } from "@/components/profile/badge-grid";
import { formatNumber, formatDate, getSecurityGrade, getSecurityColor } from "@/lib/utils";
import { Loader2, User, Save, Scan, Users, Eye, EyeOff, Globe, ArrowRight, History } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface DeepScanEntry {
 id: string;
 domain: string;
 status: string;
 overall_score: number;
 pages_found: number;
 pages_scanned: number;
 started_at: string;
 completed_at: string | null;
}

export default function ProfilePage() {
 const [profile, setProfile] = useState<UserProfile | null>(null);
 const [loading, setLoading] = useState(true);
 const [saving, setSaving] = useState(false);
 const [deepScans, setDeepScans] = useState<DeepScanEntry[]>([]);
 const [scansLoading, setScansLoading] = useState(true);

 const [username, setUsername] = useState("");
 const [bio, setBio] = useState("");
 const [avatarUrl, setAvatarUrl] = useState("");
 const [isPublic, setIsPublic] = useState(true);

 useEffect(() => {
 loadProfile();
 loadDeepScans();
 }, []);

 async function loadProfile() {
 setLoading(true);
 const res = await api.getMyProfile();
 if (res.data) {
 setProfile(res.data);
 setUsername(res.data.username);
 setBio(res.data.bio);
 setAvatarUrl(res.data.avatar_url);
 setIsPublic(res.data.is_public);
 }
 setLoading(false);
 }

 async function loadDeepScans() {
 setScansLoading(true);
 const res = await api.request<{ deep_scans: any[] }>("/deep-scan");
 const items = res.data?.deep_scans || (Array.isArray(res.data) ? res.data : []);
 setDeepScans(
 items.map((s: any) => ({
 id: s.id || "",
 domain: s.domain || "",
 status: s.status || "unknown",
 overall_score: s.overall_score || 0,
 pages_found: s.pages_found || 0,
 pages_scanned: s.pages_scanned || 0,
 started_at: s.started_at || s.created_at || "",
 completed_at: s.completed_at || null,
 }))
 );
 setScansLoading(false);
 }

 async function handleSave(e: React.FormEvent) {
 e.preventDefault();
 setSaving(true);
 const res = await api.updateMyProfile({
 username: username.trim(),
 bio: bio.trim(),
 avatar_url: avatarUrl.trim(),
 is_public: isPublic,
 });
 if (res.error) {
 toast.error(res.error);
 } else {
 toast.success("Profile updated");
 if (res.data) setProfile(res.data);
 }
 setSaving(false);
 }

 if (loading) {
 return (
 <div className="dashboard-page mx-auto max-w-2xl flex items-center justify-center py-16">
 <Loader2 className="h-8 w-8 animate-spin text-teal-700" />
 </div>
 );
 }

 return (
 <div className="dashboard-page mx-auto max-w-2xl">
 {/* Stats */}
 {profile && (
 <div className="grid grid-cols-3 gap-4">
 <div className="rounded-xl border border-border bg-card p-4 text-center">
 <Scan className="mx-auto h-5 w-5 text-teal-700" />
 <p className="mt-1.5 text-xl font-bold">{formatNumber(profile.published_count)}</p>
 <p className="text-xs text-muted-foreground">Published</p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 text-center">
 <Users className="mx-auto h-5 w-5 text-teal-700" />
 <p className="mt-1.5 text-xl font-bold">{formatNumber(profile.follower_count)}</p>
 <p className="text-xs text-muted-foreground">Followers</p>
 </div>
 <div className="rounded-xl border border-border bg-card p-4 text-center">
 <Users className="mx-auto h-5 w-5 text-teal-700" />
 <p className="mt-1.5 text-xl font-bold">{formatNumber(profile.following_count)}</p>
 <p className="text-xs text-muted-foreground">Following</p>
 </div>
 </div>
 )}

 {/* Edit Form */}
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="flex items-center gap-2 mb-5">
 <User className="h-5 w-5 text-teal-700" />
 <h3 className="font-semibold">Edit Profile</h3>
 </div>

 <form onSubmit={handleSave} className="space-y-4">
 <div>
 <label className="block text-sm font-medium mb-1.5">Username</label>
 <input
 type="text"
 value={username}
 onChange={(e) => setUsername(e.target.value)}
 placeholder="your-username"
 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-1.5">Bio</label>
 <textarea
 value={bio}
 onChange={(e) => setBio(e.target.value)}
 placeholder="Tell others about yourself..."
 rows={3}
 className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>

 <div>
 <label className="block text-sm font-medium mb-1.5">Avatar URL</label>
 <input
 type="url"
 value={avatarUrl}
 onChange={(e) => setAvatarUrl(e.target.value)}
 placeholder="https://example.com/avatar.jpg"
 className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-teal-500/40"
 />
 </div>

 <div>
 <label className="flex items-center justify-between cursor-pointer">
 <div className="flex items-center gap-2">
 {isPublic ? (
 <Eye className="h-4 w-4 text-teal-700" />
 ) : (
 <EyeOff className="h-4 w-4 text-muted-foreground" />
 )}
 <span className="text-sm font-medium">Public profile</span>
 </div>
 <div
 onClick={() => setIsPublic(!isPublic)}
 className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
 isPublic ? "bg-teal-500" : "bg-secondary"
 }`}
 >
 <div
 className={`w-5 h-5 rounded-full bg-card transition-transform ${
 isPublic ? "translate-x-4" : "translate-x-0"
 }`}
 />
 </div>
 </label>
 <p className="mt-1 text-xs text-muted-foreground ml-6">
 {isPublic
 ? "Your profile and published scans are visible to everyone."
 : "Only you can see your profile."}
 </p>
 </div>

 <button
 type="submit"
 disabled={saving}
 className="flex items-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-teal-500 disabled:opacity-50"
 >
 {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
 Save Profile
 </button>
 </form>
 </div>

 {/* Deep Scan History */}
 <div className="rounded-xl border border-border bg-card p-6">
 <div className="flex items-center justify-between mb-5">
 <div className="flex items-center gap-2">
 <History className="h-5 w-5 text-teal-700" />
 <h3 className="font-semibold">Deep Scan History</h3>
 </div>
 <Link
 href="/dashboard/domains"
 className="text-xs font-medium text-teal-700 hover:text-teal-600 transition-colors"
 >
 View all domains
 </Link>
 </div>

 {scansLoading ? (
 <div className="flex items-center justify-center py-8">
 <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
 </div>
 ) : deepScans.length === 0 ? (
 <div className="text-center py-8">
 <Globe className="mx-auto h-8 w-8 text-muted-foreground" />
 <p className="mt-2 text-sm text-muted-foreground">No deep scans yet.</p>
 <Link
 href="/dashboard/domains"
 className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-600"
 >
 Verify a domain to get started <ArrowRight className="h-3.5 w-3.5" />
 </Link>
 </div>
 ) : (
 <div className="space-y-3">
 {deepScans.map((entry) => {
 const grade = getSecurityGrade(entry.overall_score);
 const gradeColor = getSecurityColor(entry.overall_score);
 return (
 <Link
 key={entry.id}
 href={`/dashboard/attack-surface/${entry.id}`}
 className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4 hover:border-teal-500/25 transition-colors"
 >
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <Globe className="h-4 w-4 text-teal-700 shrink-0" />
 <p className="text-sm font-semibold truncate">{entry.domain}</p>
 <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.6rem] font-medium uppercase tracking-wider ${
 entry.status === "complete" ? "bg-emerald-500/10 text-emerald-700" : "bg-amber-500/10 text-amber-700"
 }`}>
 {entry.status}
 </span>
 </div>
 <p className="mt-1 text-xs text-muted-foreground">
 {entry.pages_scanned} pages scanned — {formatDate(entry.completed_at || entry.started_at)}
 </p>
 </div>
 <div className="text-right shrink-0">
 <div className={`text-xl font-bold ${gradeColor}`}>{grade}</div>
 <div className="text-[0.6rem] uppercase tracking-wider text-muted-foreground">{entry.overall_score}/100</div>
 </div>
 </Link>
 );
 })}
 </div>
 )}
 </div>

 {/* Badges */}
 {profile && (profile.badges || []).length > 0 && (
 <div>
 <h3 className="dashboard-section-title mb-4">Your Badges</h3>
 <BadgeGrid badges={profile.badges || []} showUnearned />
 </div>
 )}
 </div>
 );
}
