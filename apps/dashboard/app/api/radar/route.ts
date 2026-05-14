import { NextResponse } from "next/server";

export const revalidate = 300;

interface TrendingStory {
  id: string;
  title: string;
  url: string | null;
  domain: string | null;
  source: "hackernews";
  points: number;
  comments: number;
  author: string;
  time: string;
}

interface SecurityAlert {
  id: string;
  cve_id: string;
  description: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  score: number;
  published: string;
  source: "nvd";
}

interface CommunityPost {
  id: string;
  title: string;
  url: string;
  source: "devto" | "reddit";
  author: string;
  reactions: number;
  comments: number;
  tags: string[];
  time: string;
  cover_image?: string;
  description?: string;
  reading_time?: number;
  author_image?: string;
}

interface RadarFeed {
  trending: TrendingStory[];
  security: SecurityAlert[];
  community: CommunityPost[];
  fetched_at: string;
}

// In-memory cache for serverless (survives across warm invocations)
let cachedFeed: RadarFeed | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

async function fetchHackerNews(): Promise<TrendingStory[]> {
  try {
    const topRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json", {
      next: { revalidate: 300 },
    });
    const topIds: number[] = await topRes.json();
    const top20 = topIds.slice(0, 20);

    const stories = await Promise.all(
      top20.map(async (id) => {
        try {
          const res = await fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, {
            next: { revalidate: 300 },
          });
          return res.json();
        } catch {
          return null;
        }
      }),
    );

    return stories
      .filter((s): s is Record<string, any> => s !== null && s.type === "story" && s.title)
      .map((s) => {
        let domain: string | null = null;
        try {
          if (s.url) domain = new URL(s.url).hostname;
        } catch { /* ignore */ }
        return {
          id: String(s.id),
          title: s.title,
          url: s.url || null,
          domain,
          source: "hackernews" as const,
          points: s.score || 0,
          comments: s.descendants || 0,
          author: s.by || "",
          time: new Date((s.time || 0) * 1000).toISOString(),
        };
      });
  } catch {
    return [];
  }
}

async function fetchNVDCves(): Promise<SecurityAlert[]> {
  try {
    // Fetch recent critical/high CVEs from NVD
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const pubStart = weekAgo.toISOString().split(".")[0] + ".000";
    const pubEnd = now.toISOString().split(".")[0] + ".000";

    const res = await fetch(
      `https://services.nvd.nist.gov/rest/json/cves/2.0?pubStartDate=${pubStart}&pubEndDate=${pubEnd}&cvssV3Severity=CRITICAL&resultsPerPage=10`,
      { next: { revalidate: 600 } },
    );

    if (!res.ok) return [];
    const data = await res.json();

    return (data.vulnerabilities || []).slice(0, 10).map((v: any) => {
      const cve = v.cve;
      const metrics = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData;
      const desc = (cve.descriptions || []).find((d: any) => d.lang === "en")?.value || "";

      return {
        id: cve.id,
        cve_id: cve.id,
        description: desc.length > 200 ? desc.slice(0, 200) + "..." : desc,
        severity: (metrics?.baseSeverity || "HIGH") as SecurityAlert["severity"],
        score: metrics?.baseScore || 0,
        published: cve.published || "",
        source: "nvd" as const,
      };
    });
  } catch {
    return [];
  }
}

async function fetchDevTo(): Promise<CommunityPost[]> {
  try {
    const res = await fetch("https://dev.to/api/articles?per_page=15&top=7", {
      next: { revalidate: 300 },
    });
    if (!res.ok) return [];
    const articles: any[] = await res.json();

    return articles.map((a) => ({
      id: String(a.id),
      title: a.title,
      url: a.url,
      source: "devto" as const,
      author: a.user?.username || a.user?.name || "",
      reactions: a.public_reactions_count || 0,
      comments: a.comments_count || 0,
      tags: a.tag_list || [],
      time: a.published_at || a.created_at || "",
      cover_image: a.cover_image || undefined,
      description: a.description || undefined,
      reading_time: a.reading_time_minutes || undefined,
      author_image: a.user?.profile_image_90 || a.user?.profile_image || undefined,
    }));
  } catch {
    return [];
  }
}

async function fetchReddit(): Promise<CommunityPost[]> {
  try {
    const res = await fetch("https://www.reddit.com/r/webdev/hot.json?limit=10", {
      next: { revalidate: 300 },
      headers: { "User-Agent": "OwnSurface/1.0" },
    });
    if (!res.ok) return [];
    const data = await res.json();

    return (data.data?.children || [])
      .filter((c: any) => !c.data.stickied)
      .map((c: any) => {
        const post = c.data;
        const thumb = post.thumbnail;
        const hasThumb = thumb && thumb.startsWith("http");
        return {
          id: post.id,
          title: post.title,
          url: post.url.startsWith("/r/") ? `https://reddit.com${post.url}` : post.url,
          source: "reddit" as const,
          author: post.author || "",
          reactions: post.ups || 0,
          comments: post.num_comments || 0,
          tags: post.link_flair_text ? [post.link_flair_text] : [],
          time: new Date((post.created_utc || 0) * 1000).toISOString(),
          cover_image: hasThumb ? thumb : undefined,
          description: post.selftext ? (post.selftext.length > 150 ? post.selftext.slice(0, 150) + "..." : post.selftext) : undefined,
        };
      });
  } catch {
    return [];
  }
}

async function buildFeed(): Promise<RadarFeed> {
  // Check in-memory cache first
  if (cachedFeed && Date.now() - cachedAt < CACHE_TTL_MS) {
    return cachedFeed;
  }

  // Fetch all sources in parallel
  const [trending, security, devto, reddit] = await Promise.all([
    fetchHackerNews(),
    fetchNVDCves(),
    fetchDevTo(),
    fetchReddit(),
  ]);

  const community = [...devto, ...reddit].sort(
    (a, b) => (b.reactions + b.comments) - (a.reactions + a.comments),
  );

  const feed: RadarFeed = {
    trending,
    security,
    community: community.slice(0, 20),
    fetched_at: new Date().toISOString(),
  };

  // Update in-memory cache
  cachedFeed = feed;
  cachedAt = Date.now();

  return feed;
}

export async function GET() {
  try {
    const feed = await buildFeed();

    return NextResponse.json(feed, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=600",
      },
    });
  } catch {
    // Return whatever we have cached, even if stale
    if (cachedFeed) {
      return NextResponse.json(cachedFeed);
    }
    return NextResponse.json(
      { trending: [], security: [], community: [], fetched_at: new Date().toISOString() },
      { status: 200 },
    );
  }
}
