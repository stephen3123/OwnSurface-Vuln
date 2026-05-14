import type { NextConfig } from "next";

const apiOrigin =
  process.env.API_INTERNAL_URL?.trim().replace(/\/+$/, "") ||
  process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, "") ||
  "http://localhost:8080";

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  serverExternalPackages: ["jspdf", "jspdf-autotable"],
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' http://localhost:8080 https://dev.to https://api.ownsurface.com https://*.stripe.com https://*.sentry.io https://cdn.jsdelivr.net; frame-src https://js.stripe.com; frame-ancestors 'none';",
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${apiOrigin}/api/v1/:path*`,
      },
    ];
  },
};

function applyPlugins(config: NextConfig): NextConfig {
  // Sentry is optional — only apply when env vars are set and package is resolvable
  if (process.env.SENTRY_ORG && process.env.SENTRY_PROJECT) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { withSentryConfig } = require("@sentry/nextjs");
      return withSentryConfig(config, {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        silent: !process.env.CI,
        sourcemaps: {
          deleteSourcemapsAfterUpload: process.env.NODE_ENV === "production",
        },
      });
    } catch {
      // Sentry not available — skip
    }
  }
  return config;
}

export default applyPlugins(nextConfig);
