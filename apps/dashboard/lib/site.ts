import type { Metadata } from "next";

export const siteConfig = {
  name: "OwnSurface",
  domain: "ownsurface.com",
  siteName: "OwnSurface",
  url: process.env.NEXT_PUBLIC_APP_URL || "https://ownsurface.com",
  title: "OwnSurface | Website Intelligence Platform — Replaces 6 Tools",
  description:
    "Scan any website in 30 seconds to reveal tech stack, security posture, SEO health, traffic signals, CVE vulnerabilities, and business intelligence. Replaces BuiltWith, Wappalyzer, SecurityHeaders, SimilarWeb, Clearbit, and social lookups. Free plan includes 3 scans/day with all 26 modules.",
  locale: "en_US",
  companyName: "AeonovX SIA",
  operatorLabel: "OwnSurface by AeonovX",
  operatorUrl: "https://aeonovx.com",
  registrationNumber: "40203665505",
  location: "Riga, Latvia, EU",
  contactEmail: "contact@aeonovx.com",
  lastUpdated: "March 16, 2026",
  publicRoutes: {
    home: "/",
    pricing: "/pricing",
    privacy: "/privacy",
    terms: "/terms",
    cookies: "/cookies",
    legal: "/legal",
    contact: "/contact",
    security: "/security",
    developers: "/developers",
    chromeExtension: "/chrome-extension",
    blog: "/blog",
  },
  keywords: [
    "website intelligence platform",
    "website scanner",
    "tech stack detection",
    "security audit tool",
    "CVE vulnerability scanner",
    "attack surface audit",
    "SEO analysis tool",
    "traffic analysis",
    "competitive intelligence",
    "domain monitoring",
    "uptime monitoring",
    "SSL certificate monitoring",
    "Core Web Vitals tracking",
    "website security posture",
    "competitor tracking",
    "domain verification",
    "bulk website scanning",
    "GDPR compliance checker",
    "website accessibility audit",
    "BuiltWith alternative",
    "Wappalyzer alternative",
    "SecurityHeaders alternative",
    "SimilarWeb alternative",
    "website recon tool",
    "owned domain monitoring",
    "security headers analysis",
    "DNS security check",
    "cookie security audit",
  ],
} as const;

export const publicFooterSections = [
  {
    title: "Product",
    links: [
      { label: "Platform overview", href: siteConfig.publicRoutes.home },
      { label: "Pricing", href: siteConfig.publicRoutes.pricing },
      { label: "Chrome Extension", href: siteConfig.publicRoutes.chromeExtension },
      { label: "Security", href: siteConfig.publicRoutes.security },
      { label: "Blog", href: siteConfig.publicRoutes.blog },
    ],
  },
  {
    title: "Compare",
    links: [
      { label: "vs BuiltWith", href: "/alternatives/builtwith" },
      { label: "vs Wappalyzer", href: "/alternatives/wappalyzer" },
      { label: "vs SecurityHeaders", href: "/alternatives/securityheaders" },
      { label: "vs SimilarWeb", href: "/alternatives/similarweb" },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "API overview", href: siteConfig.publicRoutes.developers },
      { label: "Enrichment API", href: `${siteConfig.publicRoutes.developers}#enrichment` },
      { label: "MCP Server", href: `${siteConfig.publicRoutes.developers}#mcp` },
      { label: "Code examples", href: `${siteConfig.publicRoutes.developers}#code-examples` },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "Contact", href: siteConfig.publicRoutes.contact },
      { label: "Privacy Policy", href: siteConfig.publicRoutes.privacy },
      { label: "Terms of Service", href: siteConfig.publicRoutes.terms },
      { label: "Cookie Notice", href: siteConfig.publicRoutes.cookies },
      { label: "Legal Notice", href: siteConfig.publicRoutes.legal },
    ],
  },
] as const;

export function buildPageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url: `${siteConfig.url}${path}`,
      siteName: siteConfig.siteName,
    },
    twitter: {
      title,
      description,
    },
  };
}

export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: siteConfig.companyName,
      legalName: siteConfig.companyName,
      url: siteConfig.operatorUrl,
      email: siteConfig.contactEmail,
      identifier: siteConfig.registrationNumber,
      address: {
        "@type": "PostalAddress",
        addressLocality: "Riga",
        addressCountry: "LV",
      },
      logo: `${siteConfig.url}/icon`,
      description:
        "AeonovX SIA is the legal operator of OwnSurface, a website intelligence platform.",
    },
    {
      "@type": "WebSite",
      name: siteConfig.siteName,
      url: siteConfig.url,
      description: siteConfig.description,
      inLanguage: "en-US",
      publisher: {
        "@type": "Organization",
        name: siteConfig.companyName,
      },
    },
    {
      "@type": "SoftwareApplication",
      name: siteConfig.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url: siteConfig.url,
      description: siteConfig.description,
      offers: [
        {
          "@type": "Offer",
          name: "Free",
          price: "0",
          priceCurrency: "USD",
          description:
            "3 scans/day with all 26 modules, 1 verified domain, Chrome extension, API access (10 calls/day), 3-day history",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "29",
          priceCurrency: "USD",
          billingIncrement: "P1M",
          description:
            "Unlimited scans, deep scanning, attack surface audit, monitoring, teams, API access, bulk scanning, PDF export",
        },
      ],
      brand: {
        "@type": "Brand",
        name: siteConfig.name,
      },
      provider: {
        "@type": "Organization",
        name: siteConfig.companyName,
      },
      featureList: [
        "Tech stack detection (26 modules)",
        "Security posture audit with CVE matching",
        "SEO analysis and accessibility audit",
        "Traffic estimation and business signals",
        "Attack surface audit (3-tier + Nuclei)",
        "Uptime, SSL, and speed monitoring",
        "Deep scan crawler (500 pages)",
        "Bulk scanning (1,000 URLs/job)",
        "Watchlist change tracking",
        "Domain verification and ownership",
        "Shareable reports with PDF export",
        "Chrome extension",
        "REST API with webhooks",
        "Profile, badges, and leaderboard",
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How long does an OwnSurface scan take?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A standard scan completes in 15-30 seconds. All 26 modules run in parallel using a headless browser. Deep scans (up to 500 pages) and security probes take longer depending on site size.",
          },
        },
        {
          "@type": "Question",
          name: "What does the OwnSurface Free plan include?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "3 scans per day with all 26 scanner modules — the same intelligence depth as Pro. You also get 1 verified domain, 1 watchlist, 1 collection, 3 saved reports, Chrome extension, API access (10 calls/day), and 3-day scan history. No credit card required.",
          },
        },
        {
          "@type": "Question",
          name: "Is it safe to scan my own website with OwnSurface?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Standard scans are passive — they read publicly available information only. For verified domains, the Security Probe offers active testing with explicit consent. You control the scope and rate.",
          },
        },
        {
          "@type": "Question",
          name: "Can I scan competitor websites?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Standard scans only read public information (the same data any browser visitor sees). You can track competitors with watchlists that detect changes over time.",
          },
        },
        {
          "@type": "Question",
          name: "What monitoring does OwnSurface provide?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Pro includes uptime monitoring (1-60 min intervals), SSL certificate tracking with expiry alerts, and speed monitoring with Core Web Vitals (LCP, CLS, INP, TTFB). All monitors require a verified domain.",
          },
        },
        {
          "@type": "Question",
          name: "What is the attack surface audit?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A three-tier security assessment for verified domains. Tier 1: passive recon (headers, SSL, DNS, cookies, CORS, source leaks). Tier 2: active probing (directories, admin panels, open redirects, cloud storage). Tier 3: Nuclei vulnerability templates.",
          },
        },
        {
          "@type": "Question",
          name: "How does OwnSurface domain verification work?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Add a DNS TXT record or an HTML meta tag to prove ownership. Once verified, you unlock deep scanning (500 pages), three-tier security probes, uptime/SSL/speed monitoring, and compliance checks.",
          },
        },
        {
          "@type": "Question",
          name: "Can I export and share OwnSurface results?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Generate shareable reports (public or private), export to PDF (Pro), organize scans into collections, and distribute via the API. Bulk scanning supports up to 500 URLs per job.",
          },
        },
      ],
    },
  ],
};
