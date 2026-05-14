import { Metadata } from "next";
import Link from "next/link";
import { buildPageMetadata } from "@/lib/site";
import { PublicPageShell } from "@/components/public/public-page-shell";
import { ArrowRight, Shield, Cpu, Layers, Clock, Crosshair } from "lucide-react";

export const metadata: Metadata = buildPageMetadata({
  title: "Blog — OwnSurface",
  description:
    "Insights on website intelligence, security auditing, tech stack analysis, and competitive intelligence. Learn how to scan, secure, and monitor any website.",
  path: "/blog",
});

const posts = [
  {
    slug: "attack-surface-audit",
    title: "Your Website Is Leaking Data Right Now — Here's How to Find Out",
    description:
      "67% of startups have at least one critical vulnerability they don't know about. Exposed .env files, open admin panels, deprecated SSL — a 3-tier attack surface audit finds them before an attacker does.",
    date: "March 17, 2026",
    readTime: "12 min read",
    icon: Crosshair,
    tag: "Security",
  },
  {
    slug: "security-headers-2026",
    title: "The 5 Security Headers Every Website Needs in 2026",
    description:
      "93% of websites are missing at least one critical security header. Learn which 5 headers protect against XSS, clickjacking, and data leaks — with copy-paste configurations.",
    date: "March 17, 2026",
    readTime: "8 min read",
    icon: Shield,
    tag: "Security",
  },
  {
    slug: "how-we-scan-26-modules",
    title: "How We Scan 26 Modules in 30 Seconds",
    description:
      "A technical deep dive into OwnSurface's parallel scanning architecture — Rust API, Playwright workers, NATS message queues, and a custom browser pool.",
    date: "March 17, 2026",
    readTime: "10 min read",
    icon: Cpu,
    tag: "Engineering",
  },
  {
    slug: "replace-6-tools",
    title: "Why We Built OwnSurface to Replace 6 Tools",
    description:
      "We were spending $700+/month on BuiltWith, Wappalyzer, SimilarWeb, and others. So we built one tool that does everything — starting at $0.",
    date: "March 17, 2026",
    readTime: "7 min read",
    icon: Layers,
    tag: "Product",
  },
];

export default function BlogPage() {
  return (
    <PublicPageShell
      eyebrow="Blog"
      title="Latest Insights"
      description="Practical guides on website security, technology detection, and competitive intelligence — from the team building OwnSurface."
    >
      <div className="space-y-4">
        {posts.map((post) => {
          const Icon = post.icon;
          return (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group block rounded-2xl border border-border bg-black/40 backdrop-blur-md border border-white/10 card-lift p-6 hover:border-teal-500/40 hover:bg-teal-500/3 transition-all"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/8 px-2.5 py-1 text-xs font-semibold text-teal-400">
                      <Icon className="h-3 w-3" />
                      {post.tag}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-white/60">
                      <Clock className="h-3 w-3" />
                      {post.readTime}
                    </span>
                  </div>
                  <h2 className="text-lg font-bold group-hover:text-teal-400 transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-2 text-sm text-white/60 leading-relaxed">
                    {post.description}
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-sm font-medium text-teal-400 group-hover:gap-3 transition-all">
                    Read article
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-xs text-white/60">{post.date}</div>
            </Link>
          );
        })}
      </div>
    </PublicPageShell>
  );
}
