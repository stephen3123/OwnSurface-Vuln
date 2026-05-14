export interface Remediation {
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  estimated_time: string;
  steps: RemediationStep[];
  references: { title: string; url: string }[];
}

export interface RemediationStep {
  order: number;
  title: string;
  description: string;
  code?: string;
  language?: string;
}

interface RemediationEntry {
  match: (source: string, title: string) => boolean;
  build: (techStack?: string[]) => Remediation;
}

const REMEDIATIONS: RemediationEntry[] = [
  {
    match: (source, title) =>
      /content.?security.?policy|csp/i.test(title) || /csp/i.test(source),
    build: (techStack) => ({
      title: "Add Content-Security-Policy Header",
      description:
        "A Content-Security-Policy (CSP) header prevents XSS attacks by restricting which resources can load on your page.",
      difficulty: "medium",
      estimated_time: "30 min",
      steps: [
        ...(matchesStack(techStack, "nginx")
          ? [
              {
                order: 1,
                title: "Nginx configuration",
                description: "Add the CSP header in your Nginx server block.",
                code: `add_header Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';" always;`,
                language: "nginx",
              },
            ]
          : []),
        ...(matchesStack(techStack, "apache")
          ? [
              {
                order: 2,
                title: "Apache configuration",
                description:
                  "Add the CSP header in your .htaccess or Apache config.",
                code: `Header always set Content-Security-Policy "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"`,
                language: "apache",
              },
            ]
          : []),
        {
          order: 3,
          title: "Next.js configuration",
          description: "Add CSP headers in next.config.js.",
          code: `// next.config.js
const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
  }
];

module.exports = {
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};`,
          language: "javascript",
        },
        {
          order: 4,
          title: "Express.js middleware",
          description: "Use the helmet package for Express applications.",
          code: `const helmet = require('helmet');
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    imgSrc: ["'self'", "data:", "https:"],
    fontSrc: ["'self'"],
    connectSrc: ["'self'"],
    frameAncestors: ["'none'"],
  },
}));`,
          language: "javascript",
        },
      ],
      references: [
        {
          title: "MDN: Content-Security-Policy",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy",
        },
        {
          title: "CSP Evaluator",
          url: "https://csp-evaluator.withgoogle.com/",
        },
      ],
    }),
  },
  {
    match: (source, title) => /x-frame-options/i.test(title) || /x-frame/i.test(source),
    build: () => ({
      title: "Add X-Frame-Options Header",
      description:
        "Prevents your site from being embedded in iframes on other domains, mitigating clickjacking attacks.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Nginx",
          description: "Add to your server block.",
          code: `add_header X-Frame-Options "DENY" always;`,
          language: "nginx",
        },
        {
          order: 2,
          title: "Apache",
          description: "Add to .htaccess or server config.",
          code: `Header always set X-Frame-Options "DENY"`,
          language: "apache",
        },
        {
          order: 3,
          title: "HTML meta tag (fallback)",
          description: "If you cannot modify server headers.",
          code: `<meta http-equiv="X-Frame-Options" content="DENY">`,
          language: "html",
        },
      ],
      references: [
        {
          title: "MDN: X-Frame-Options",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Frame-Options",
        },
      ],
    }),
  },
  {
    match: (source, title) =>
      /strict.?transport|hsts/i.test(title) || /hsts/i.test(source),
    build: () => ({
      title: "Enable HTTP Strict Transport Security (HSTS)",
      description:
        "HSTS tells browsers to always use HTTPS, preventing protocol downgrade attacks and cookie hijacking.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Nginx",
          description: "Add to your HTTPS server block.",
          code: `add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;`,
          language: "nginx",
        },
        {
          order: 2,
          title: "Apache",
          description: "Add to your SSL VirtualHost.",
          code: `Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"`,
          language: "apache",
        },
      ],
      references: [
        {
          title: "HSTS Preload List",
          url: "https://hstspreload.org/",
        },
      ],
    }),
  },
  {
    match: (source, title) => /x-content-type-options/i.test(title) || /content.?type.?options/i.test(source),
    build: () => ({
      title: "Add X-Content-Type-Options Header",
      description:
        "Prevents browsers from MIME-sniffing a response away from the declared content-type.",
      difficulty: "easy",
      estimated_time: "2 min",
      steps: [
        {
          order: 1,
          title: "Any web server",
          description: "Add the nosniff header. Works on Nginx, Apache, Express, and all other servers.",
          code: `# Nginx
add_header X-Content-Type-Options "nosniff" always;

# Apache
Header always set X-Content-Type-Options "nosniff"

# Express
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});`,
          language: "nginx",
        },
      ],
      references: [
        {
          title: "MDN: X-Content-Type-Options",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/X-Content-Type-Options",
        },
      ],
    }),
  },
  {
    match: (source, title) => /referrer.?policy/i.test(title) || /referrer/i.test(source),
    build: () => ({
      title: "Add Referrer-Policy Header",
      description:
        "Controls how much referrer information is included with requests, protecting user privacy.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Nginx",
          description: "Add to your server block.",
          code: `add_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
          language: "nginx",
        },
        {
          order: 2,
          title: "Apache",
          description: "Add to .htaccess or server config.",
          code: `Header always set Referrer-Policy "strict-origin-when-cross-origin"`,
          language: "apache",
        },
        {
          order: 3,
          title: "HTML meta tag",
          description: "Set via meta tag if you cannot modify headers.",
          code: `<meta name="referrer" content="strict-origin-when-cross-origin">`,
          language: "html",
        },
      ],
      references: [
        {
          title: "MDN: Referrer-Policy",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Referrer-Policy",
        },
      ],
    }),
  },
  {
    match: (source, title) => /permissions.?policy/i.test(title) || /permissions/i.test(source),
    build: () => ({
      title: "Add Permissions-Policy Header",
      description:
        "Controls which browser features and APIs can be used on your site.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Nginx",
          description: "Add to your server block.",
          code: `add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()" always;`,
          language: "nginx",
        },
        {
          order: 2,
          title: "Apache",
          description: "Add to .htaccess or server config.",
          code: `Header always set Permissions-Policy "camera=(), microphone=(), geolocation=(), interest-cohort=()"`,
          language: "apache",
        },
      ],
      references: [
        {
          title: "MDN: Permissions-Policy",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Permissions-Policy",
        },
      ],
    }),
  },
  {
    match: (source, title) => /sitemap/i.test(title) || /sitemap/i.test(source),
    build: () => ({
      title: "Add sitemap.xml",
      description:
        "A sitemap helps search engines discover and index all pages on your site.",
      difficulty: "medium",
      estimated_time: "15 min",
      steps: [
        {
          order: 1,
          title: "WordPress",
          description: "WordPress 5.5+ generates a sitemap at /wp-sitemap.xml by default. For older versions, install Yoast SEO or a similar plugin.",
          code: `# Verify your sitemap exists:
curl https://yoursite.com/wp-sitemap.xml`,
          language: "bash",
        },
        {
          order: 2,
          title: "Next.js",
          description: "Use the next-sitemap package.",
          code: `// 1. Install
npm install next-sitemap

// 2. Create next-sitemap.config.js
/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://yoursite.com',
  generateRobotsTxt: true,
  changefreq: 'weekly',
  priority: 0.7,
};

// 3. Add to package.json scripts
"postbuild": "next-sitemap"`,
          language: "javascript",
        },
        {
          order: 3,
          title: "Static site template",
          description: "Create a basic sitemap.xml in your public root.",
          code: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://yoursite.com/</loc>
    <lastmod>2024-01-01</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`,
          language: "xml",
        },
      ],
      references: [
        {
          title: "Google: Build and submit a sitemap",
          url: "https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap",
        },
      ],
    }),
  },
  {
    match: (source, title) => /robots\.txt/i.test(title) || /robots/i.test(source),
    build: () => ({
      title: "Add robots.txt",
      description:
        "A robots.txt file tells search engine crawlers which pages to crawl or skip.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Create robots.txt",
          description: "Place this file at the root of your website (e.g., public/robots.txt).",
          code: `User-agent: *
Allow: /

Sitemap: https://yoursite.com/sitemap.xml`,
          language: "text",
        },
      ],
      references: [
        {
          title: "Google: robots.txt introduction",
          url: "https://developers.google.com/search/docs/crawling-indexing/robots/intro",
        },
      ],
    }),
  },
  {
    match: (source, title) => /canonical/i.test(title) || /canonical/i.test(source),
    build: () => ({
      title: "Add Canonical URL",
      description:
        "A canonical URL tells search engines which version of a page is the primary one, preventing duplicate content issues.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "HTML meta tag",
          description: "Add to the <head> of every page.",
          code: `<link rel="canonical" href="https://yoursite.com/page-url" />`,
          language: "html",
        },
        {
          order: 2,
          title: "Next.js App Router",
          description: "Set canonical in your layout or page metadata.",
          code: `// app/layout.tsx or app/page.tsx
export const metadata = {
  alternates: {
    canonical: 'https://yoursite.com',
  },
};`,
          language: "typescript",
        },
      ],
      references: [
        {
          title: "Google: Consolidate duplicate URLs",
          url: "https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls",
        },
      ],
    }),
  },
  {
    match: (source, title) => /structured.?data|json.?ld|schema\.org/i.test(title) || /structured/i.test(source),
    build: () => ({
      title: "Add Structured Data (JSON-LD)",
      description:
        "Structured data helps search engines understand your content and enables rich results in SERPs.",
      difficulty: "medium",
      estimated_time: "15 min",
      steps: [
        {
          order: 1,
          title: "Add JSON-LD to your page",
          description: "Insert a JSON-LD script tag in the <head> of your page.",
          code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Your Site Name",
  "url": "https://yoursite.com",
  "description": "Your site description",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://yoursite.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>`,
          language: "html",
        },
      ],
      references: [
        {
          title: "Google: Structured Data Overview",
          url: "https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data",
        },
        {
          title: "Schema.org",
          url: "https://schema.org/",
        },
      ],
    }),
  },
  {
    match: (source, title) => /cookie.*secure/i.test(title) || /secure.*flag.*cookie/i.test(title),
    build: () => ({
      title: "Set Secure Flag on Cookies",
      description:
        "Cookies without the Secure flag can be transmitted over unencrypted HTTP connections.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Set Secure flag",
          description: "Ensure all cookies include the Secure attribute.",
          code: `// Express.js
res.cookie('session', token, {
  secure: true,
  httpOnly: true,
  sameSite: 'strict',
  maxAge: 3600000,
});

// PHP
setcookie('session', $token, [
  'secure' => true,
  'httponly' => true,
  'samesite' => 'Strict',
]);`,
          language: "javascript",
        },
      ],
      references: [
        {
          title: "OWASP: Secure Cookie Attribute",
          url: "https://owasp.org/www-community/controls/SecureCookieAttribute",
        },
      ],
    }),
  },
  {
    match: (source, title) => /cookie.*httponly|httponly.*cookie/i.test(title),
    build: () => ({
      title: "Set HttpOnly Flag on Cookies",
      description:
        "Cookies without HttpOnly can be accessed by JavaScript, making them vulnerable to XSS theft.",
      difficulty: "easy",
      estimated_time: "5 min",
      steps: [
        {
          order: 1,
          title: "Set HttpOnly flag",
          description: "Ensure sensitive cookies include the HttpOnly attribute.",
          code: `// Express.js
res.cookie('session', token, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
});

// PHP
setcookie('session', $token, [
  'httponly' => true,
  'secure' => true,
  'samesite' => 'Strict',
]);`,
          language: "javascript",
        },
      ],
      references: [
        {
          title: "OWASP: HttpOnly",
          url: "https://owasp.org/www-community/HttpOnly",
        },
      ],
    }),
  },
  {
    match: (source, title) => /spf/i.test(title) || /spf/i.test(source),
    build: () => ({
      title: "Add SPF DNS Record",
      description:
        "SPF (Sender Policy Framework) prevents email spoofing by specifying which mail servers are authorized to send email for your domain.",
      difficulty: "easy",
      estimated_time: "10 min",
      steps: [
        {
          order: 1,
          title: "Add TXT record",
          description: "Add a TXT DNS record for your domain. Adjust to include your email provider.",
          code: `; DNS TXT Record
; Host: @
; Value:
v=spf1 include:_spf.google.com ~all

; For Microsoft 365:
v=spf1 include:spf.protection.outlook.com ~all

; For multiple providers:
v=spf1 include:_spf.google.com include:sendgrid.net ~all`,
          language: "text",
        },
      ],
      references: [
        {
          title: "SPF Record Syntax",
          url: "https://www.spf-record.com/syntax",
        },
      ],
    }),
  },
  {
    match: (source, title) => /dmarc/i.test(title) || /dmarc/i.test(source),
    build: () => ({
      title: "Add DMARC DNS Record",
      description:
        "DMARC builds on SPF and DKIM to prevent email spoofing and provides reporting on email authentication.",
      difficulty: "easy",
      estimated_time: "10 min",
      steps: [
        {
          order: 1,
          title: "Add DMARC TXT record",
          description: "Add a TXT DNS record with the host _dmarc.",
          code: `; DNS TXT Record
; Host: _dmarc
; Value (monitoring mode — start here):
v=DMARC1; p=none; rua=mailto:dmarc-reports@yoursite.com; ruf=mailto:dmarc-reports@yoursite.com; fo=1

; Stricter policy (after monitoring):
v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@yoursite.com; pct=100

; Full reject policy:
v=DMARC1; p=reject; rua=mailto:dmarc-reports@yoursite.com; pct=100`,
          language: "text",
        },
      ],
      references: [
        {
          title: "DMARC.org",
          url: "https://dmarc.org/overview/",
        },
      ],
    }),
  },
  {
    match: (source, title) => /cors/i.test(title) || /cors/i.test(source),
    build: () => ({
      title: "Fix CORS Misconfiguration",
      description:
        "Overly permissive CORS settings can allow unauthorized cross-origin requests, leading to data theft.",
      difficulty: "medium",
      estimated_time: "15 min",
      steps: [
        {
          order: 1,
          title: "Proper CORS setup",
          description: "Restrict allowed origins to your actual frontend domains. Never use wildcard with credentials.",
          code: `// Express.js with cors package
const cors = require('cors');
app.use(cors({
  origin: ['https://yoursite.com', 'https://app.yoursite.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
  maxAge: 86400,
}));

// Nginx
add_header 'Access-Control-Allow-Origin' 'https://yoursite.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;`,
          language: "javascript",
        },
      ],
      references: [
        {
          title: "MDN: CORS",
          url: "https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS",
        },
      ],
    }),
  },
  {
    match: (source, title) => /tracking.*consent|consent.*tracking/i.test(title) || /consent/i.test(source),
    build: () => ({
      title: "Implement Cookie Consent Banner",
      description:
        "Loading tracking scripts before user consent violates GDPR and other privacy regulations.",
      difficulty: "medium",
      estimated_time: "2 hours",
      steps: [
        {
          order: 1,
          title: "Add a consent manager",
          description: "Use a consent management platform or build a simple banner. Block all tracking scripts until consent is granted.",
          code: `// Simple consent check pattern
function hasConsent() {
  return document.cookie.includes('cookie_consent=accepted');
}

function loadAnalytics() {
  if (!hasConsent()) return;
  // Load Google Analytics, Meta Pixel, etc.
  const script = document.createElement('script');
  script.src = 'https://www.googletagmanager.com/gtag/js?id=GA_ID';
  document.head.appendChild(script);
}

// Show banner if no consent decision yet
if (!document.cookie.includes('cookie_consent=')) {
  showConsentBanner();
}`,
          language: "javascript",
        },
      ],
      references: [
        {
          title: "GDPR Cookie Consent Requirements",
          url: "https://gdpr.eu/cookies/",
        },
      ],
    }),
  },
  {
    match: (source, title) => /privacy.?policy/i.test(title) || /privacy.?policy/i.test(source),
    build: () => ({
      title: "Add Privacy Policy",
      description:
        "A privacy policy is legally required in most jurisdictions if you collect any user data.",
      difficulty: "medium",
      estimated_time: "1 hour",
      steps: [
        {
          order: 1,
          title: "Create a privacy policy page",
          description: "Add a /privacy or /privacy-policy page. Use a generator as a starting point, then customize for your specific data practices.",
          code: `<!-- Link in your footer -->
<a href="/privacy-policy">Privacy Policy</a>

<!-- Key sections to include:
  - What data you collect
  - How you use it
  - Third-party services (analytics, payment processors)
  - Cookie usage
  - User rights (access, deletion, opt-out)
  - Contact information
  - Last updated date
-->`,
          language: "html",
        },
      ],
      references: [
        {
          title: "Termly Privacy Policy Generator",
          url: "https://termly.io/products/privacy-policy-generator/",
        },
        {
          title: "GDPR Privacy Policy Requirements",
          url: "https://gdpr.eu/privacy-notice/",
        },
      ],
    }),
  },
];

function matchesStack(techStack: string[] | undefined, keyword: string): boolean {
  if (!techStack || techStack.length === 0) return true;
  return techStack.some((t) => t.toLowerCase().includes(keyword.toLowerCase()));
}

export function getRemediation(
  issueSource: string,
  issueTitle: string,
  techStack?: string[],
): Remediation | null {
  for (const entry of REMEDIATIONS) {
    if (entry.match(issueSource, issueTitle)) {
      return entry.build(techStack);
    }
  }

  for (const entry of REMEDIATIONS) {
    const sourceWords = issueSource.toLowerCase().split(/[\s_\-./]+/);
    const titleWords = issueTitle.toLowerCase().split(/[\s_\-./]+/);
    const allWords = [...sourceWords, ...titleWords];
    if (entry.match(allWords.join(" "), allWords.join(" "))) {
      return entry.build(techStack);
    }
  }

  return null;
}
