export function GET() {
  const content = `# OwnSurface

> OwnSurface is a website intelligence platform that scans any website in 30 seconds to reveal tech stack, security posture, SEO health, traffic signals, CVE vulnerabilities, and business intelligence. It replaces 6 separate tools: BuiltWith, Wappalyzer, SecurityHeaders, SimilarWeb, Clearbit, and social lookups.

## What OwnSurface Does

- Scans any website URL and returns a comprehensive intelligence report
- Detects technology stack (frameworks, CMS, hosting, CDN, analytics, payment processors)
- Audits security posture (SSL, headers, cookies, CORS, DNS, CVE matching)
- Analyzes SEO health (meta tags, structured data, accessibility, Core Web Vitals)
- Estimates traffic and identifies business signals (pricing pages, hiring, payment processors)
- Discovers social media links and competitive intelligence
- Provides AI-generated summaries of scan results

## Plans and Pricing

- **Free**: 3 scans/day, all 26 scanner modules, 1 verified domain, 1 bulk scan/month (10 URLs), 1 watchlist, 3 reports, 3-day history, 1 API key (10 calls/day), Chrome extension. No credit card required.
- **Pro**: $49/month or $468/year. Unlimited everything — scans, domains, deep scans, audits, monitoring (uptime/SSL/speed), bulk scanning (1,000 URLs/job), lead generation (search by tech stack), contact database with email reveal, AI search visibility tracking, enrichment API (Clearbit alternative), PDF export, webhooks, REST API (10 keys, 10K calls/day), 365-day history.

## Key Features

- 26 parallel scanner modules run in one scan
- Chrome extension for instant scanning while browsing
- Attack surface audit with Nuclei vulnerability templates (Pro)
- Uptime monitoring with 1-60 minute intervals (Pro)
- SSL certificate expiry tracking with email alerts (Pro)
- Core Web Vitals speed monitoring (Pro)
- Domain verification via DNS TXT or HTML meta tag
- Lead generation — search companies by technology stack (Pro)
- Contact database with email pattern detection and full reveal (Pro)
- AI search visibility — check if your domain appears in ChatGPT, Claude, Gemini (Pro)
- Enrichment API — Clearbit alternative, one API call returns full company intelligence (Pro)
- Shareable public reports with unique URLs
- REST API for programmatic access
- Watchlist change tracking with alerts

## Use Cases

- Web developers auditing client or competitor sites
- SEO consultants analyzing website technical health
- Security professionals assessing attack surface
- Sales teams finding leads by technology stack and revealing contact emails
- Marketing teams tracking AI search visibility and brand mentions
- Founders monitoring their own website security and uptime
- Agencies running bulk competitive analysis
- DevOps teams tracking SSL certificates and uptime

## Links

- Website: https://ownsurface.com
- Pricing: https://ownsurface.com/pricing
- Chrome Extension: https://ownsurface.com/chrome-extension
- Developer API: https://ownsurface.com/developers
- Security: https://ownsurface.com/security

## Company

OwnSurface is operated by AeonovX SIA, registered in Riga, Latvia (EU). Registration number: 40203665505. Contact: contact@aeonovx.com
`;

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=86400",
    },
  });
}
