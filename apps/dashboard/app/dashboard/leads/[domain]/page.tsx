"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { api, type DomainProfileResponse } from "@/lib/api-client";
import { useUserPlan } from "@/lib/dashboard-cache";
import Link from "next/link";
import {
 Building2,
 Globe,
 Mail,
 MapPin,
 Users,
 Calendar,
 Shield,
 TrendingUp,
 ExternalLink,
 Lock,
 Loader2,
 ArrowLeft,
 CreditCard,
 MessageCircle,
 Megaphone,
 Briefcase,
 Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function DomainProfilePage() {
 const params = useParams();
 const domain = params.domain as string;
 const { data: userPlan } = useUserPlan();
 const isPro = userPlan?.plan === "pro";

 const [profile, setProfile] = useState<DomainProfileResponse | null>(null);
 const [loading, setLoading] = useState(true);
 const [error, setError] = useState<string | null>(null);

 useEffect(() => {
 if (!domain) return;
 setLoading(true);
 api.getDomainProfile(domain).then((res) => {
 if (res.error) setError(res.error);
 else if (res.data) setProfile(res.data);
 setLoading(false);
 });
 }, [domain]);

 if (loading) {
 return (
 <div className="flex items-center justify-center py-24">
 <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
 </div>
 );
 }

 if (error || !profile) {
 return (
 <div className="space-y-4">
 <Link href="/dashboard/leads" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
 <ArrowLeft className="h-4 w-4" /> Back to Leads
 </Link>
 <div className="shell-panel rounded-[1.9rem] p-8 text-center">
 <p className="text-muted-foreground">{error || "Domain profile not found"}</p>
 <p className="mt-2 text-sm text-muted-foreground">
 Try scanning this domain first to build its profile.
 </p>
 </div>
 </div>
 );
 }

 const socialLinks = Array.isArray(profile.social_links)
 ? profile.social_links
 : [];

 return (
 <div className="space-y-6">
 {/* Back link */}
 <Link href="/dashboard/leads" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
 <ArrowLeft className="h-4 w-4" /> Back to Leads
 </Link>

 {/* Header card */}
 <div className="shell-panel rounded-[1.9rem] p-6">
 <div className="flex items-start gap-4">
 {profile.logo_url ? (
 <img
 src={profile.logo_url}
 alt={profile.company_name || domain}
 className="h-16 w-16 shrink-0 rounded-2xl object-contain bg-card p-1 border border-border"
 />
 ) : (
 <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 text-xl font-bold">
 {(profile.company_name || domain).charAt(0).toUpperCase()}
 </div>
 )}
 <div className="flex-1 min-w-0">
 <h1 className="text-2xl font-bold">{profile.company_name || domain}</h1>
 <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
 <span className="flex items-center gap-1">
 <Globe className="h-3.5 w-3.5" /> {profile.domain}
 </span>
 {profile.industry && (
 <span className="flex items-center gap-1">
 <Building2 className="h-3.5 w-3.5" /> {profile.industry}
 </span>
 )}
 {profile.location && (
 <span className="flex items-center gap-1">
 <MapPin className="h-3.5 w-3.5" /> {profile.location}
 </span>
 )}
 {profile.employees_range && (
 <span className="flex items-center gap-1">
 <Users className="h-3.5 w-3.5" /> {profile.employees_range} employees
 </span>
 )}
 {profile.founded && (
 <span className="flex items-center gap-1">
 <Calendar className="h-3.5 w-3.5" /> Founded {profile.founded}
 </span>
 )}
 </div>
 {profile.description && (
 <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{profile.description}</p>
 )}
 </div>
 </div>
 </div>

 <div className="grid gap-6 lg:grid-cols-2">
 {/* Contact info */}
 <div className="shell-panel rounded-[1.9rem] p-6">
 <h2 className="mb-4 flex items-center gap-2 font-semibold">
 <Mail className="h-5 w-5 text-teal-600" />
 Contact Information
 </h2>

 {profile.email_pattern && (
 <div className="mb-3">
 <span className="text-xs font-medium text-muted-foreground">Email pattern:</span>
 <p className="text-sm font-mono mt-0.5">
 {profile.email_pattern}
 {!isPro && profile.email_pattern === "Upgrade to Pro to reveal" && (
 <Link href="/pricing" className="ml-2 text-teal-600 hover:underline font-sans">
 <Lock className="inline h-3 w-3 mr-0.5" />Upgrade
 </Link>
 )}
 </p>
 </div>
 )}

 {profile.found_emails.length > 0 && (
 <div className="mb-3">
 <span className="text-xs font-medium text-muted-foreground">Found emails:</span>
 <div className="mt-1 space-y-1">
 {profile.found_emails.map((email, i) => (
 <div key={i} className="flex items-center gap-2 text-sm">
 <Mail className="h-3.5 w-3.5 text-muted-foreground" />
 <span className="font-mono">{email}</span>
 {!isPro && email.includes("***") && (
 <Lock className="h-3 w-3 text-muted-foreground" />
 )}
 </div>
 ))}
 </div>
 </div>
 )}

 {profile.contact_page_url && (
 <div className="mb-2">
 <a href={profile.contact_page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
 Contact page <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 )}
 {profile.team_page_url && (
 <div>
 <a href={profile.team_page_url} target="_blank" rel="noopener noreferrer" className="text-sm text-teal-600 hover:underline flex items-center gap-1">
 Team page <ExternalLink className="h-3 w-3" />
 </a>
 </div>
 )}

 {socialLinks.length > 0 && (
 <div className="mt-4 border-t border-border pt-3">
 <span className="text-xs font-medium text-muted-foreground">Social links:</span>
 <div className="mt-2 flex flex-wrap gap-2">
 {socialLinks.map((link: any, i: number) => (
 <a
 key={i}
 href={link.url}
 target="_blank"
 rel="noopener noreferrer"
 className="flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1 text-xs font-medium hover:bg-secondary/80"
 >
 {link.platform}
 {link.followers && <span className="text-muted-foreground ml-1">({link.followers.toLocaleString()})</span>}
 </a>
 ))}
 </div>
 </div>
 )}
 </div>

 {/* Scores & signals */}
 <div className="shell-panel rounded-[1.9rem] p-6">
 <h2 className="mb-4 flex items-center gap-2 font-semibold">
 <TrendingUp className="h-5 w-5 text-teal-600" />
 Scores & Signals
 </h2>

 <div className="grid grid-cols-3 gap-4 mb-4">
 <div className="rounded-xl bg-secondary p-3 text-center">
 <Shield className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
 <div className="text-lg font-bold">{profile.security_grade || "-"}</div>
 <div className="text-[0.65rem] text-muted-foreground">Security</div>
 </div>
 <div className="rounded-xl bg-secondary p-3 text-center">
 <TrendingUp className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
 <div className="text-lg font-bold">{profile.seo_score ?? "-"}</div>
 <div className="text-[0.65rem] text-muted-foreground">SEO Score</div>
 </div>
 <div className="rounded-xl bg-secondary p-3 text-center">
 <Globe className="mx-auto h-5 w-5 text-muted-foreground mb-1" />
 <div className="text-lg font-bold">{profile.traffic_tier || "-"}</div>
 <div className="text-[0.65rem] text-muted-foreground">Traffic</div>
 </div>
 </div>

 {profile.tranco_rank && (
 <div className="mb-2 text-sm">
 <span className="text-muted-foreground">Tranco rank:</span>{" "}
 <span className="font-medium">#{profile.tranco_rank.toLocaleString()}</span>
 </div>
 )}
 {profile.estimated_monthly_visits && (
 <div className="mb-2 text-sm">
 <span className="text-muted-foreground">Est. monthly visits:</span>{" "}
 <span className="font-medium">{profile.estimated_monthly_visits}</span>
 </div>
 )}

 <div className="mt-4 border-t border-border pt-3 space-y-2">
 {profile.has_pricing && (
 <div className="flex items-center gap-2 text-sm">
 <CreditCard className="h-3.5 w-3.5 text-green-600" />
 <span>Has pricing page</span>
 </div>
 )}
 {profile.has_careers && (
 <div className="flex items-center gap-2 text-sm">
 <Briefcase className="h-3.5 w-3.5 text-blue-600" />
 <span>Has careers page</span>
 </div>
 )}
 {profile.payment_processors.length > 0 && (
 <div className="flex items-center gap-2 text-sm">
 <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
 <span>Payment: {profile.payment_processors.join(", ")}</span>
 </div>
 )}
 {profile.chat_widgets.length > 0 && (
 <div className="flex items-center gap-2 text-sm">
 <MessageCircle className="h-3.5 w-3.5 text-muted-foreground" />
 <span>Chat: {profile.chat_widgets.join(", ")}</span>
 </div>
 )}
 {profile.ad_pixels.length > 0 && (
 <div className="flex items-center gap-2 text-sm">
 <Megaphone className="h-3.5 w-3.5 text-muted-foreground" />
 <span>Ad pixels: {profile.ad_pixels.join(", ")}</span>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Technology stack */}
 {profile.technologies.length > 0 && (
 <div className="shell-panel rounded-[1.9rem] p-6">
 <h2 className="mb-4 flex items-center gap-2 font-semibold">
 <Tag className="h-5 w-5 text-teal-600" />
 Technology Stack ({profile.technologies.length})
 </h2>
 <div className="flex flex-wrap gap-2">
 {profile.technologies.map((t, i) => (
 <span
 key={i}
 className="inline-flex items-center gap-1 rounded-lg bg-secondary px-2.5 py-1.5 text-xs font-medium"
 >
 {t.technology_name}
 {t.version && <span className="text-muted-foreground">v{t.version}</span>}
 {t.category && (
 <span className="text-[0.6rem] text-muted-foreground/70 ml-1">
 {t.category}
 </span>
 )}
 </span>
 ))}
 </div>
 </div>
 )}
 </div>
 );
}
