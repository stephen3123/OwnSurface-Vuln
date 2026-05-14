import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/privacy",
          "/terms",
          "/cookies",
          "/legal",
          "/contact",
          "/security",
          "/developers",
          "/chrome-extension",
          "/report/",
          "/profile/",
          "/site/",
          "/blog",
          "/blog/",
          "/alternatives/",
          "/llms.txt",
        ],
        disallow: [
          "/dashboard",
          "/api",
          "/login",
          "/register",
          "/register/verify",
          "/reset-password",
        ],
      },
      // Allow AI bots to crawl public content — critical for AI referrals
      {
        userAgent: "GPTBot",
        allow: [
          "/",
          "/pricing",
          "/developers",
          "/security",
          "/chrome-extension",
          "/site/",
          "/blog",
          "/blog/",
          "/alternatives/",
          "/llms.txt",
        ],
        disallow: ["/dashboard", "/api", "/login", "/register"],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/"],
        disallow: ["/dashboard", "/api", "/login", "/register"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/"],
        disallow: ["/dashboard", "/api", "/login", "/register"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/"],
        disallow: ["/dashboard", "/api", "/login", "/register"],
      },
      {
        userAgent: "Amazonbot",
        allow: ["/"],
        disallow: ["/dashboard", "/api", "/login", "/register"],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
