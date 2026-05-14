"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  api,
  type AiVisibilityCheck,
  type AiVisibilityResultItem,
  type DomainVerification,
} from "@/lib/api-client";
import { useUserPlan } from "@/lib/dashboard-cache";
import Link from "next/link";
import { EmptyStateCard } from "@/components/dashboard/empty-state-card";
import { MetricCard } from "@/components/dashboard/metric-card";
import { PageIntro } from "@/components/dashboard/page-intro";
import { TabRail } from "@/components/dashboard/tab-rail";
import {
  Brain,
  Loader2,
  Lock,
  Play,
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronUp,
  Globe,
  Zap,
  Eye,
  MessageSquare,
  Target,
  Search,
  ExternalLink,
  ThumbsUp,
  ThumbsDown,
  Minus,
  RefreshCw,
  LinkIcon,
  BarChart3,
  Flame,
  Sparkles,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Tab type ──────────────────────────────────────────────────────────
type Tab = "overview" | "visibility" | "mentions" | "threads";

function normalizeTab(value: string | null): Tab {
  return value === "visibility" || value === "mentions" || value === "threads" ? value : "overview";
}

export default function GeoPage() {
  const { data: userPlan } = useUserPlan();
  const isPro = userPlan?.plan === "pro";
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<Tab>(normalizeTab(searchParams.get("tab")));
  const [domains, setDomains] = useState<DomainVerification[]>([]);
  const [selectedDomain, setSelectedDomain] = useState("");
  const [brandName, setBrandName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDomains().then((res) => {
      const verified = (Array.isArray(res.data) ? res.data : []).filter((d: any) => d.verified);
      setDomains(verified);
      if (verified.length > 0 && !selectedDomain) {
        setSelectedDomain(verified[0].domain);
        setBrandName(verified[0].domain.split(".")[0]);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const nextTab = normalizeTab(searchParams.get("tab"));
    setActiveTab((current) => (current === nextTab ? current : nextTab));
  }, [searchParams]);

  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "overview") params.delete("tab");
    else params.set("tab", tab);
    const query = params.toString();
    router.replace(query ? `/dashboard/geo?${query}` : "/dashboard/geo", { scroll: false });
  }

  if (!isPro) {
    return (
      <div className="dashboard-page mx-auto max-w-5xl space-y-6">
        <PageIntro description="AI search visibility, brand monitoring, and community intelligence." />
        <div className="rounded-xl border border-border/40 bg-card/50 p-8 text-center">
          <Lock className="mx-auto h-10 w-10 text-muted-foreground/40 mb-3" />
          <h2 className="text-lg font-semibold">Pro Feature</h2>
          <p className="mt-2 text-sm text-muted-foreground max-w-lg mx-auto">
            Track how ChatGPT, Claude, Gemini, Perplexity, and DeepSeek mention your brand.
            Monitor mentions on Reddit, Hacker News, and Dev.to.
            Discover high-value thread opportunities and draft authentic replies.
          </p>
          <Link
            href="/pricing"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90"
          >
            <Zap className="h-4 w-4" /> Upgrade to Pro
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "visibility", label: "AI Visibility", icon: <Brain className="h-4 w-4" /> },
    { key: "mentions", label: "Brand Mentions", icon: <MessageSquare className="h-4 w-4" /> },
    { key: "threads", label: "Thread Discovery", icon: <Target className="h-4 w-4" /> },
  ];

  return (
    <div className="dashboard-page mx-auto max-w-5xl space-y-6">
      <PageIntro
        description="AI search visibility, brand monitoring, and community intelligence."
        actions={
          <>
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value);
                setBrandName(e.target.value.split(".")[0]);
              }}
              className="rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
            >
              {domains.map((d) => (
                <option key={d.id || d.domain} value={d.domain}>{d.domain}</option>
              ))}
            </select>
            <input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              className="w-36 rounded-xl border border-border bg-background py-2 px-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="Brand name"
            />
          </>
        }
      />

      <TabRail items={tabs} value={activeTab} onChange={handleTabChange} inactiveClassName="hover:bg-secondary/50" />

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab domain={selectedDomain} brandName={brandName} />
      )}
      {activeTab === "visibility" && (
        <VisibilityTab domains={domains} selectedDomain={selectedDomain} brandName={brandName} onDomainChange={setSelectedDomain} onBrandChange={setBrandName} />
      )}
      {activeTab === "mentions" && (
        <MentionsTab domain={selectedDomain} brandName={brandName} />
      )}
      {activeTab === "threads" && (
        <ThreadsTab domain={selectedDomain} brandName={brandName} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════════════════════════════════════
function OverviewTab({ domain, brandName }: { domain: string; brandName: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  async function loadOverview() {
    setLoading(true);
    const [checksRes, mentionRes, threadsRes] = await Promise.allSettled([
      api.getAiVisibilityChecks(),
      api.getMentionSummary(),
      api.getThreads({ limit: 5 }),
    ]);
    const checks = checksRes.status === "fulfilled" ? checksRes.value.data?.checks || [] : [];
    const mentionSummary = mentionRes.status === "fulfilled" ? mentionRes.value.data?.summary : null;
    const threads = threadsRes.status === "fulfilled" ? threadsRes.value.data?.threads || [] : [];
    const latest = checks.find((c: any) => c.status === "completed");
    setData({ checks, latest, mentionSummary, threads });
    setLoading(false);
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="AI Visibility Score"
          value={data?.latest ? `${data.latest.overall_score}` : "—"}
          sub={data?.latest ? `${data.latest.models_mentioning}/${data.latest.models_checked} models` : "No checks yet"}
        />
        <MetricCard
          label="Share of Voice"
          value="—"
          sub="Run a visibility check"
        />
        <MetricCard
          label="Brand Mentions"
          value={String(data?.mentionSummary?.total ?? 0)}
          sub={`${data?.mentionSummary?.recent_count_7d ?? 0} in last 7 days`}
        />
        <MetricCard
          label="Thread Opportunities"
          value={String(data?.threads?.length ?? 0)}
          sub="High-value threads found"
        />
      </div>

      {/* Sentiment */}
      {data?.mentionSummary?.total > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-6">
          <h3 className="text-sm font-semibold mb-4">Mention Sentiment</h3>
          <div className="flex items-center gap-6">
            <SentimentBar
              positive={data.mentionSummary.by_sentiment?.positive || 0}
              negative={data.mentionSummary.by_sentiment?.negative || 0}
              neutral={data.mentionSummary.by_sentiment?.neutral || 0}
            />
          </div>
          <div className="flex gap-6 text-xs text-muted-foreground mt-3">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Positive: {data.mentionSummary.by_sentiment?.positive || 0}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/40" /> Neutral: {data.mentionSummary.by_sentiment?.neutral || 0}</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Negative: {data.mentionSummary.by_sentiment?.negative || 0}</span>
          </div>
        </div>
      )}

      {/* Recent checks */}
      {data?.checks?.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-6">
          <h3 className="text-sm font-semibold mb-3">Recent AI Visibility Checks</h3>
          <div className="space-y-2">
            {data.checks.slice(0, 5).map((c: any) => (
              <div key={c.id} className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3">
                <div className="flex items-center gap-3">
                  <StatusDot status={c.status} />
                  <span className="text-sm font-medium">{c.brand_name}</span>
                  <span className="text-xs text-muted-foreground">{c.domain}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  {c.status === "completed" && (
                    <span className={cn("font-bold", c.overall_score >= 70 ? "text-emerald-600" : c.overall_score >= 40 ? "text-amber-600" : "text-red-600")}>
                      {c.overall_score}/100
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top threads */}
      {data?.threads?.length > 0 && (
        <div className="rounded-xl border border-border/40 bg-card/50 p-6">
          <h3 className="text-sm font-semibold mb-3">Top Thread Opportunities</h3>
          <div className="space-y-2">
            {data.threads.slice(0, 5).map((t: any) => (
              <a key={t.id} href={t.thread_url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between rounded-lg bg-secondary/30 px-4 py-3 hover:bg-secondary/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", t.platform === "reddit" ? "bg-orange-500/10 text-orange-500" : "bg-amber-500/10 text-amber-500")}>{t.platform}</span>
                  <span className="text-sm truncate">{t.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">{t.score} pts</span>
                  <span className={cn("text-xs font-mono", t.opportunity_score >= 70 ? "text-emerald-600" : t.opportunity_score >= 40 ? "text-amber-600" : "text-muted-foreground")}>
                    <Flame className="h-3 w-3 inline" />{t.opportunity_score}
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// VISIBILITY TAB
// ═══════════════════════════════════════════════════════════════════════
function VisibilityTab({ domains, selectedDomain, brandName, onDomainChange, onBrandChange }: {
  domains: DomainVerification[]; selectedDomain: string; brandName: string;
  onDomainChange: (v: string) => void; onBrandChange: (v: string) => void;
}) {
  const [checks, setChecks] = useState<AiVisibilityCheck[]>([]);
  const [starting, setStarting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedCheck, setExpandedCheck] = useState<string | null>(null);
  const [checkDetails, setCheckDetails] = useState<Record<string, { results: AiVisibilityResultItem[]; citations: any[]; sov: any[] }>>({});

  useEffect(() => { loadChecks(); }, []);

  useEffect(() => {
    const hasPending = checks.some((c) => c.status === "pending" || c.status === "processing");
    if (!hasPending) return;
    const interval = setInterval(async () => {
      const res = await api.getAiVisibilityChecks();
      if (res.data?.checks) setChecks(res.data.checks);
    }, 15000);
    return () => clearInterval(interval);
  }, [checks]);

  async function loadChecks() {
    const res = await api.getAiVisibilityChecks();
    if (res.data?.checks) setChecks(res.data.checks);
    setLoading(false);
  }

  async function handleStart() {
    if (!selectedDomain || !brandName) return;
    setStarting(true);
    const res = await api.startAiVisibilityCheck(selectedDomain, brandName);
    if (res.data) setChecks((prev) => [res.data!, ...prev]);
    setStarting(false);
  }

  async function toggleExpand(checkId: string) {
    if (expandedCheck === checkId) { setExpandedCheck(null); return; }
    setExpandedCheck(checkId);
    if (!checkDetails[checkId]) {
      const res = await api.getAiVisibilityCheck(checkId);
      if (res.data) {
        setCheckDetails((prev) => ({ ...prev, [checkId]: { results: res.data!.results || [], citations: res.data!.citations || [], sov: res.data!.share_of_voice || [] } }));
      }
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      {/* Start check */}
      <div className="rounded-xl border border-border/40 bg-card/50 p-6">
        <h2 className="mb-4 font-semibold">Start a visibility check</h2>
        <div className="flex items-end gap-3 flex-wrap">
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Domain</label>
            <select value={selectedDomain} onChange={(e) => { onDomainChange(e.target.value); onBrandChange(e.target.value.split(".")[0]); }} className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:border-teal-500 focus:outline-none">
              {domains.map((d) => <option key={d.id || d.domain} value={d.domain}>{d.domain}</option>)}
            </select>
          </div>
          <div className="flex-1 min-w-[160px]">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Brand Name</label>
            <input value={brandName} onChange={(e) => onBrandChange(e.target.value)} className="w-full rounded-xl border border-border bg-background py-2.5 px-3 text-sm focus:border-teal-500 focus:outline-none" placeholder="Your brand name" />
          </div>
          <button onClick={handleStart} disabled={!selectedDomain || !brandName || starting} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors">
            {starting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Check Visibility
          </button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">10 checks/month. 7-day cooldown per domain. Results take a few minutes.</p>
      </div>

      {/* Check list */}
      {checks.length === 0 ? (
        <EmptyStateCard icon={Brain} title="No visibility checks yet." body="Start your first check above." />
      ) : (
        <div className="space-y-3">
          {checks.map((check) => (
            <div key={check.id} className="rounded-xl border border-border/40 bg-card/50 overflow-hidden">
              <button onClick={() => toggleExpand(check.id)} className="flex w-full items-center justify-between p-5 text-left hover:bg-secondary/30 transition-colors">
                <div className="flex items-center gap-4">
                  <ScoreCircle score={check.overall_score} status={check.status} />
                  <div>
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{check.domain}</span>
                      <span className="text-sm text-muted-foreground">({check.brand_name})</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <StatusBadge status={check.status} />
                      {check.status === "completed" && <span>{check.models_mentioning}/{check.models_checked} models mention your brand</span>}
                      <span>{new Date(check.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
                {expandedCheck === check.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
              </button>

              {expandedCheck === check.id && (
                <ExpandedCheckDetail check={check} details={checkDetails[check.id]} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ExpandedCheckDetail({ check, details }: { check: AiVisibilityCheck; details?: { results: AiVisibilityResultItem[]; citations: any[]; sov: any[] } }) {
  const results = details?.results || [];
  const citations = details?.citations || [];
  const sov = details?.sov || [];

  if (!details && check.status !== "completed") {
    return (
      <div className="border-t border-border px-5 py-6 text-center text-sm text-muted-foreground">
        {check.status === "pending" ? "Waiting to be processed..." : "Processing..."}
      </div>
    );
  }

  return (
    <div className="border-t border-border px-5 pb-5 space-y-6">
      {/* Results table */}
      {results.length > 0 && (
        <div>
          <h4 className="mt-4 mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Model Results</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="py-2 text-left font-medium text-muted-foreground">Query</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Model</th>
                <th className="py-2 text-center font-medium text-muted-foreground">Mentioned</th>
                <th className="py-2 text-left font-medium text-muted-foreground">Context</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id} className="border-b border-border/50 last:border-b-0">
                  <td className="py-2 pr-3 max-w-[200px] truncate">{r.query}</td>
                  <td className="py-2 pr-3"><ModelBadge model={r.model} /></td>
                  <td className="py-2 text-center">
                    {r.brand_mentioned ? <CheckCircle2 className="mx-auto h-4 w-4 text-emerald-600" /> : <XCircle className="mx-auto h-4 w-4 text-red-400/60" />}
                  </td>
                  <td className="py-2 max-w-[250px] truncate text-muted-foreground text-xs">{r.mention_context || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Citations */}
      {citations.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><LinkIcon className="h-3.5 w-3.5" /> Citation Sources</h4>
          <div className="grid gap-2 sm:grid-cols-2">
            {citations.map((c: any, i: number) => (
              <a key={i} href={c.source_url} target="_blank" rel="noopener noreferrer" className={cn("flex items-start gap-2 rounded-lg border p-3 hover:bg-secondary/30 transition-colors", c.is_gap_source ? "border-red-500/20 bg-red-500/5" : "border-border/40")}>
                <ExternalLink className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <div className="text-xs font-medium truncate">{c.source_title || new URL(c.source_url).hostname}</div>
                  <div className="flex items-center gap-2 mt-1 text-[0.65rem] text-muted-foreground">
                    <span>{c.platform}</span>
                    {c.is_gap_source && <span className="text-red-500 font-medium">gap — {c.competitor_name} cited</span>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Share of Voice */}
      {sov.length > 0 && (
        <div>
          <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"><BarChart3 className="h-3.5 w-3.5" /> Share of Voice</h4>
          {sov.slice(0, 1).map((s: any, i: number) => (
            <div key={i} className="rounded-lg bg-secondary/30 p-4">
              <div className="flex items-center gap-6 mb-3">
                <div>
                  <span className="text-2xl font-bold">{Number(s.share_percentage).toFixed(1)}%</span>
                  <span className="text-xs text-muted-foreground ml-2">your share</span>
                </div>
                <span className="text-sm text-muted-foreground">{s.brand_mentioned_count}/{s.total_queries} queries mention you</span>
              </div>
              {(() => {
                const comps = typeof s.top_competitors === "string" ? JSON.parse(s.top_competitors) : s.top_competitors;
                if (!Array.isArray(comps) || comps.length === 0) return null;
                return (
                  <div className="flex flex-wrap gap-1.5">
                    {comps.slice(0, 8).map((c: any, j: number) => (
                      <span key={j} className="rounded-lg bg-background px-2 py-1 text-xs">{c.name} <span className="text-muted-foreground">{c.share}%</span></span>
                    ))}
                  </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}

      {/* Competitors */}
      {results.length > 0 && (
        <div className="rounded-lg bg-secondary/30 p-3">
          <h4 className="text-xs font-medium text-muted-foreground mb-2">Competitor mentions</h4>
          <div className="flex flex-wrap gap-2">
            {(() => {
              const seen = new Set<string>();
              const deduped: string[] = [];
              for (const c of results.flatMap((r) => r.competitor_mentions || [])) {
                const lower = c.toLowerCase();
                if (!seen.has(lower)) { seen.add(lower); deduped.push(c); }
              }
              return deduped;
            })().map((c) => (
              <span key={c} className="rounded-lg bg-background px-2 py-1 text-xs font-medium">{c}</span>
            ))}
            {results.every((r) => !r.competitor_mentions?.length) && (
              <span className="text-xs text-muted-foreground">No competitor mentions detected</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// MENTIONS TAB
// ═══════════════════════════════════════════════════════════════════════
function MentionsTab({ domain, brandName }: { domain: string; brandName: string }) {
  const [mentions, setMentions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [sourceFilter, setSourceFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");

  useEffect(() => { loadMentions(); }, [sourceFilter, sentimentFilter]);

  async function loadMentions() {
    setLoading(true);
    const [mRes, sRes] = await Promise.allSettled([
      api.getMentions({ source: sourceFilter || undefined, sentiment: sentimentFilter || undefined, limit: 100 }),
      api.getMentionSummary(),
    ]);
    if (mRes.status === "fulfilled") setMentions(mRes.value.data?.mentions || []);
    if (sRes.status === "fulfilled") setSummary(sRes.value.data?.summary || null);
    setLoading(false);
  }

  async function handleScan() {
    if (!domain || !brandName) return;
    setScanning(true);
    await api.scanMentions(domain, brandName);
    setScanning(false);
    setTimeout(loadMentions, 5000);
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleScan} disabled={scanning || !domain} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors">
          {scanning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Scan Mentions
        </button>
        <button onClick={loadMentions} className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
        <div className="flex-1" />
        <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className="rounded-xl border border-border bg-background py-2 px-3 text-sm">
          <option value="">All Sources</option>
          <option value="reddit">Reddit</option>
          <option value="hackernews">Hacker News</option>
          <option value="devto">Dev.to</option>
        </select>
        <select value={sentimentFilter} onChange={(e) => setSentimentFilter(e.target.value)} className="rounded-xl border border-border bg-background py-2 px-3 text-sm">
          <option value="">All Sentiment</option>
          <option value="positive">Positive</option>
          <option value="neutral">Neutral</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {/* Summary stats */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-4">
          <MiniStat label="Total Mentions" value={summary.total} />
          <MiniStat label="Last 7 Days" value={summary.recent_count_7d} />
          <MiniStat label="Positive" value={summary.by_sentiment?.positive || 0} color="emerald" />
          <MiniStat label="Negative" value={summary.by_sentiment?.negative || 0} color="red" />
        </div>
      )}

      {/* List */}
      {loading ? <LoadingSpinner /> : mentions.length === 0 ? (
        <EmptyStateCard icon={MessageSquare} title="No mentions found." body="Click &quot;Scan Mentions&quot; to start monitoring." />
      ) : (
        <div className="space-y-2">
          {mentions.map((m: any) => (
            <div key={m.id} className="rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <SourceBadge source={m.source} />
                {m.subreddit && <span className="text-xs text-muted-foreground">r/{m.subreddit}</span>}
                <SentimentIcon sentiment={m.sentiment} />
              </div>
              <a href={m.source_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                {m.title || "Untitled"} <ExternalLink className="h-3 w-3" />
              </a>
              {m.body_snippet && <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{m.body_snippet}</p>}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>by {m.author}</span>
                <span>{m.score} pts</span>
                <span>{m.comment_count} comments</span>
                <span>{new Date(m.discovered_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// THREADS TAB
// ═══════════════════════════════════════════════════════════════════════
function ThreadsTab({ domain, brandName }: { domain: string; brandName: string }) {
  const [threads, setThreads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [discovering, setDiscovering] = useState(false);
  const [platformFilter, setPlatformFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [draftingId, setDraftingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => { loadThreads(); }, [platformFilter, typeFilter]);

  async function loadThreads() {
    setLoading(true);
    const res = await api.getThreads({ platform: platformFilter || undefined, thread_type: typeFilter || undefined, limit: 50 });
    if (res.data?.threads) setThreads(res.data.threads);
    setLoading(false);
  }

  async function handleDiscover() {
    if (!domain || !brandName) return;
    setDiscovering(true);
    await api.discoverThreads(domain, brandName, undefined, [brandName]);
    setDiscovering(false);
    setTimeout(loadThreads, 5000);
  }

  async function handleDraft(thread: any) {
    setDraftingId(thread.id);
    const res = await api.draftReply(thread.id, thread.title || "", brandName, `${brandName} is a website intelligence platform`);
    if (res.data?.draft) setDrafts((prev) => ({ ...prev, [thread.id]: res.data!.draft }));
    setDraftingId(null);
  }

  async function handleCopy(id: string, text: string) {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function handleStatus(id: string, status: string) {
    await api.updateThreadStatus(id, status);
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, status } : t));
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <button onClick={handleDiscover} disabled={discovering || !domain} className="flex items-center gap-2 rounded-xl bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors">
          {discovering ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          Discover Threads
        </button>
        <button onClick={loadThreads} className="rounded-lg p-2 text-muted-foreground hover:text-foreground"><RefreshCw className="h-4 w-4" /></button>
        <div className="flex-1" />
        <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="rounded-xl border border-border bg-background py-2 px-3 text-sm">
          <option value="">All Platforms</option>
          <option value="reddit">Reddit</option>
          <option value="hackernews">Hacker News</option>
        </select>
        <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="rounded-xl border border-border bg-background py-2 px-3 text-sm">
          <option value="">All Types</option>
          <option value="recommendation">Recommendation</option>
          <option value="comparison">Comparison</option>
          <option value="review">Review</option>
          <option value="problem">Problem</option>
        </select>
      </div>

      {/* List */}
      {loading ? <LoadingSpinner /> : threads.length === 0 ? (
        <EmptyStateCard icon={Target} title="No threads found." body="Click &quot;Discover Threads&quot; to find opportunities." />
      ) : (
        <div className="space-y-3">
          {threads.map((t: any) => (
            <div key={t.id} className="rounded-xl border border-border/40 bg-card/50 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <SourceBadge source={t.platform} />
                    <TypeBadge type={t.thread_type} />
                    {t.subreddit && <span className="text-xs text-muted-foreground">r/{t.subreddit}</span>}
                    <span className={cn("text-xs font-mono", t.opportunity_score >= 70 ? "text-emerald-600" : t.opportunity_score >= 40 ? "text-amber-600" : "text-muted-foreground")}>
                      <Flame className="h-3 w-3 inline" />{t.opportunity_score}
                    </span>
                    {t.status && t.status !== "new" && <span className={cn("text-[0.65rem] rounded-full px-2 py-0.5 font-medium", t.status === "replied" ? "bg-emerald-500/10 text-emerald-600" : t.status === "saved" ? "bg-blue-500/10 text-blue-600" : "bg-muted text-muted-foreground")}>{t.status}</span>}
                  </div>
                  <a href={t.thread_url} target="_blank" rel="noopener noreferrer" className="font-medium hover:text-teal-600 transition-colors inline-flex items-center gap-1">
                    {t.title || "Untitled"} <ExternalLink className="h-3 w-3" />
                  </a>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>{t.score} pts</span>
                    <span>{t.comment_count} comments</span>
                    <span>{t.age_days}d ago</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button onClick={() => handleDraft(t)} disabled={draftingId === t.id} className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-secondary/50 transition-colors disabled:opacity-50">
                    {draftingId === t.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />} Draft Reply
                  </button>
                  {t.status !== "dismissed" && <button onClick={() => handleStatus(t.id, "dismissed")} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>}
                </div>
              </div>

              {drafts[t.id] && (
                <div className="mt-3 p-3 rounded-lg bg-secondary/40 border border-border/50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-teal-600 font-medium flex items-center gap-1"><Sparkles className="h-3 w-3" /> AI Draft</span>
                    <button onClick={() => handleCopy(t.id, drafts[t.id])} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                      {copiedId === t.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                      {copiedId === t.id ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{drafts[t.id]}</p>
                  <p className="text-[0.65rem] text-muted-foreground mt-2">Review and edit before posting. You post this yourself — we never post on your behalf.</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════
// SHARED COMPONENTS
// ═══════════════════════════════════════════════════════════════════════

function LoadingSpinner() {
  return <div className="flex items-center justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-teal-600" /></div>;
}

function MiniStat({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div className="rounded-xl border border-border/40 bg-card/50 p-4">
      <div className={cn("text-xl font-bold", color === "emerald" ? "text-emerald-600" : color === "red" ? "text-red-600" : "")}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function ScoreCircle({ score, status }: { score: number | null; status: string }) {
  const color = status !== "completed" ? "border-border/50 text-muted-foreground" :
    (score ?? 0) >= 70 ? "border-emerald-500 text-emerald-700" :
    (score ?? 0) >= 40 ? "border-amber-500 text-amber-700" :
    "border-red-500 text-red-700";
  return (
    <div className={cn("flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-4", color)}>
      <span className="text-lg font-bold">{status === "completed" ? score : "—"}</span>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg = {
    pending: { icon: Clock, color: "text-amber-400 bg-amber-500/10", label: "Pending" },
    processing: { icon: Loader2, color: "text-blue-400 bg-blue-500/10", label: "Processing" },
    completed: { icon: CheckCircle2, color: "text-emerald-400 bg-emerald-500/10", label: "Completed" },
    failed: { icon: XCircle, color: "text-red-400 bg-red-500/10", label: "Failed" },
  }[status] || { icon: Clock, color: "text-muted-foreground bg-muted", label: status };
  const Icon = cfg.icon;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.color)}><Icon className={cn("h-3 w-3", status === "processing" && "animate-spin")} />{cfg.label}</span>;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "completed" ? "bg-emerald-500" : status === "processing" ? "bg-blue-500 animate-pulse" : status === "pending" ? "bg-amber-500" : "bg-red-500";
  return <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", color)} />;
}

function ModelBadge({ model }: { model: string }) {
  const colors: Record<string, string> = {
    claude: "bg-orange-500/10 text-orange-500",
    chatgpt: "bg-emerald-500/10 text-emerald-500",
    gemini: "bg-blue-500/10 text-blue-500",
    perplexity: "bg-cyan-500/10 text-cyan-500",
    deepseek: "bg-violet-500/10 text-violet-500",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", colors[model] || "bg-muted text-muted-foreground")}>{model}</span>;
}

function SourceBadge({ source }: { source: string }) {
  const colors: Record<string, string> = {
    reddit: "bg-orange-500/10 text-orange-500",
    hackernews: "bg-amber-500/10 text-amber-600",
    devto: "bg-indigo-500/10 text-indigo-500",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", colors[source] || "bg-muted text-muted-foreground")}>{source}</span>;
}

function TypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    recommendation: "bg-blue-500/10 text-blue-500",
    comparison: "bg-violet-500/10 text-violet-500",
    review: "bg-emerald-500/10 text-emerald-500",
    problem: "bg-amber-500/10 text-amber-500",
  };
  return <span className={cn("rounded-full px-2 py-0.5 text-[0.65rem] font-medium", colors[type] || "bg-muted text-muted-foreground")}>{type || "general"}</span>;
}

function SentimentIcon({ sentiment }: { sentiment: string }) {
  if (sentiment === "positive") return <span className="text-xs text-emerald-600 flex items-center gap-0.5"><ThumbsUp className="h-3 w-3" /></span>;
  if (sentiment === "negative") return <span className="text-xs text-red-500 flex items-center gap-0.5"><ThumbsDown className="h-3 w-3" /></span>;
  return <span className="text-xs text-muted-foreground flex items-center gap-0.5"><Minus className="h-3 w-3" /></span>;
}

function SentimentBar({ positive, negative, neutral }: { positive: number; negative: number; neutral: number }) {
  const total = positive + negative + neutral;
  if (total === 0) return null;
  const pPct = (positive / total) * 100;
  const nPct = (neutral / total) * 100;
  return (
    <div className="flex-1 h-2.5 rounded-full overflow-hidden bg-secondary flex">
      {positive > 0 && <div className="bg-emerald-500 h-full" style={{ width: `${pPct}%` }} />}
      {neutral > 0 && <div className="bg-muted-foreground/30 h-full" style={{ width: `${nPct}%` }} />}
      {negative > 0 && <div className="bg-red-500 h-full flex-1" />}
    </div>
  );
}
