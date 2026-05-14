"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type UserProfile } from "@/lib/api-client";
import { ProfileHeader } from "@/components/profile/profile-header";
import { BadgeGrid } from "@/components/profile/badge-grid";
import { PublicNav } from "@/components/layout/public-nav";
import { Footer } from "@/components/layout/footer";
import { Loader2, ArrowLeft, Lock } from "lucide-react";

export default function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadProfile = useCallback(async () => {
    if (!username) return;
    setLoading(true);
    const res = await api.getPublicProfile(username);
    if (res.data) {
      setProfile(res.data);
    } else {
      setError(res.error || "User not found");
    }
    setLoading(false);
  }, [username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-teal-700" />
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-background">
        <div className="mx-auto max-w-3xl px-4 py-16">
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <p className="text-sm text-muted-foreground">{error || "User not found"}</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 hover:text-teal-600"
            >
              <ArrowLeft className="h-4 w-4" />
              Go home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background bg-dot-grid text-foreground">
      <PublicNav />
      <main className="mx-auto max-w-3xl space-y-6 px-4 py-8">
        <ProfileHeader profile={profile} />

        {!profile.is_public ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <Lock className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">This profile is private.</p>
          </div>
        ) : (
          <>
            {/* Badges */}
            {(profile.badges || []).filter((b) => b.earned_at).length > 0 && (
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                  Badges
                </h2>
                <BadgeGrid badges={profile.badges || []} />
              </div>
            )}
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}
