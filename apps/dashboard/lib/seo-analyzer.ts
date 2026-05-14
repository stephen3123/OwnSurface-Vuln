import type { ScanResult } from "@/lib/api-client";

export interface SeoCheckItem {
  id: string;
  category: "content" | "technical" | "social" | "performance";
  title: string;
  description: string;
  status: "pass" | "fail" | "warning" | "unknown";
  severity: "critical" | "high" | "medium" | "low";
  recommendation?: string;
}

export interface SeoAnalysis {
  score: number;
  checks: SeoCheckItem[];
  passCount: number;
  failCount: number;
  warningCount: number;
}

function check(
  id: string,
  category: SeoCheckItem["category"],
  title: string,
  description: string,
  status: SeoCheckItem["status"],
  severity: SeoCheckItem["severity"],
  recommendation?: string,
): SeoCheckItem {
  return { id, category, title, description, status, severity, recommendation };
}

export function analyzeSeo(scan: ScanResult): SeoAnalysis {
  const checks: SeoCheckItem[] = [];
  const seo = scan.seo;

  if (!seo) {
    return { score: 0, checks: [], passCount: 0, failCount: 0, warningCount: 0 };
  }

  // Content checks
  if (!seo.title || seo.title.trim().length === 0) {
    checks.push(check("title-present", "content", "Page title", "Page has a title tag", "fail", "critical", "Add a descriptive <title> tag to your page."));
  } else if (seo.title.length < 30) {
    checks.push(check("title-length", "content", "Title length", `Title is ${seo.title.length} characters (recommended 30-60)`, "warning", "medium", "Expand your title to at least 30 characters for better search visibility."));
  } else if (seo.title.length > 60) {
    checks.push(check("title-length", "content", "Title length", `Title is ${seo.title.length} characters (recommended 30-60)`, "warning", "low", "Shorten your title to under 60 characters to prevent truncation in search results."));
  } else {
    checks.push(check("title-length", "content", "Title length", `Title is ${seo.title.length} characters`, "pass", "medium"));
  }

  if (!seo.description || seo.description.trim().length === 0) {
    checks.push(check("desc-present", "content", "Meta description", "Page has a meta description", "fail", "high", "Add a meta description to improve click-through rates from search results."));
  } else if (seo.description.length < 120) {
    checks.push(check("desc-length", "content", "Description length", `Description is ${seo.description.length} characters (recommended 120-160)`, "warning", "medium", "Expand your meta description to at least 120 characters."));
  } else if (seo.description.length > 160) {
    checks.push(check("desc-length", "content", "Description length", `Description is ${seo.description.length} characters (recommended 120-160)`, "warning", "low", "Shorten your meta description to under 160 characters to prevent truncation."));
  } else {
    checks.push(check("desc-length", "content", "Description length", `Description is ${seo.description.length} characters`, "pass", "medium"));
  }

  if (seo.h1_count === 0) {
    checks.push(check("h1-count", "content", "H1 heading", "Page should have exactly one H1 heading", "fail", "high", "Add a single H1 heading that describes the main topic of the page."));
  } else if (seo.h1_count > 1) {
    checks.push(check("h1-count", "content", "H1 heading", `Page has ${seo.h1_count} H1 headings (should be 1)`, "warning", "medium", "Use only one H1 heading per page. Use H2-H6 for subheadings."));
  } else {
    checks.push(check("h1-count", "content", "H1 heading", "Page has exactly one H1 heading", "pass", "high"));
  }

  checks.push(
    seo.has_structured_data
      ? check("structured-data", "content", "Structured data", "Page has structured data (JSON-LD / Schema.org)", "pass", "medium")
      : check("structured-data", "content", "Structured data", "No structured data detected", "fail", "medium", "Add JSON-LD structured data to help search engines understand your content."),
  );

  // Technical checks
  checks.push(
    seo.has_sitemap
      ? check("sitemap", "technical", "Sitemap", "sitemap.xml is present", "pass", "high")
      : check("sitemap", "technical", "Sitemap", "No sitemap.xml found", "fail", "high", "Create a sitemap.xml to help search engines discover all your pages."),
  );

  checks.push(
    seo.has_robots_txt
      ? check("robots", "technical", "Robots.txt", "robots.txt is present", "pass", "high")
      : check("robots", "technical", "Robots.txt", "No robots.txt found", "fail", "high", "Create a robots.txt file to control search engine crawling."),
  );

  checks.push(
    seo.has_canonical
      ? check("canonical", "technical", "Canonical URL", "Canonical URL tag is present", "pass", "medium")
      : check("canonical", "technical", "Canonical URL", "No canonical URL tag found", "fail", "medium", "Add a canonical URL tag to prevent duplicate content issues."),
  );

  const isHttps = scan.url.startsWith("https://");
  checks.push(
    isHttps
      ? check("https", "technical", "HTTPS", "Site uses HTTPS", "pass", "critical")
      : check("https", "technical", "HTTPS", "Site does not use HTTPS", "fail", "critical", "Migrate to HTTPS. It is a ranking signal and essential for user trust."),
  );

  // Social checks — we can't detect OG tags directly from scan data, so mark as unknown
  const hasMeta = scan.seo?.title && scan.seo?.description;
  checks.push(
    check("og-tags", "social", "Open Graph tags", hasMeta ? "Title and description present (OG tags likely)" : "No title/description — OG tags probably missing", hasMeta ? "warning" : "fail", "medium", "Add og:title, og:description, and og:image meta tags for better social sharing."),
  );

  checks.push(
    check("twitter-cards", "social", "Twitter Cards", "Twitter Card metadata cannot be verified from scan", "unknown", "low", "Add twitter:card, twitter:title, and twitter:description meta tags."),
  );

  // Performance checks
  if (scan.js_bundles) {
    const totalKb = Math.round(scan.js_bundles.total_size_bytes / 1024);
    if (totalKb > 500) {
      checks.push(check("js-size", "performance", "JavaScript bundle size", `Total JS size is ${totalKb}KB`, "fail", "high", "Reduce JavaScript bundle size through code splitting, tree shaking, and lazy loading."));
    } else if (totalKb > 200) {
      checks.push(check("js-size", "performance", "JavaScript bundle size", `Total JS size is ${totalKb}KB`, "warning", "medium", "Consider optimizing JavaScript bundles to improve load times."));
    } else {
      checks.push(check("js-size", "performance", "JavaScript bundle size", `Total JS size is ${totalKb}KB`, "pass", "medium"));
    }
  }

  const passCount = checks.filter((c) => c.status === "pass").length;
  const failCount = checks.filter((c) => c.status === "fail").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;

  const total = checks.length;
  const score = total > 0 ? Math.round(((passCount + warningCount * 0.5) / total) * 100) : 0;

  return { score, checks, passCount, failCount, warningCount };
}
