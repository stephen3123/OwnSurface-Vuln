import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerSecurityDetailTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_check_headers",
    "Analyze a website's HTTP security headers: Content-Security-Policy, HSTS, X-Frame-Options, CORS, permissions policy. Returns specific fix configs for nginx, Apache, Cloudflare, Vercel, and Netlify.",
    {
      url: z.string().describe("URL to check security headers for"),
    },
    async ({ url }) => {
      try {
        const result = await client.scan(url);
        const filtered = {
          url,
          security_grade: (result as any).security?.grade,
          headers: (result as any).security?.headers,
          security_findings: ((result as any).security_findings || []).filter(
            (f: any) => f.title.toLowerCase().includes("header") || f.title.toLowerCase().includes("csp")
          ),
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(filtered, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_check_dns",
    "Check a domain's DNS security: SPF, DKIM, DMARC (with strength grading A-F), DNSSEC, BIMI, and MTA-STS. Returns specific issues and remediation steps.",
    {
      url: z.string().describe("URL or domain to check DNS security for"),
    },
    async ({ url }) => {
      try {
        const result = await client.scan(url.startsWith("http") ? url : `https://${url}`);
        const filtered = {
          url,
          dns_security: (result as any).vulnerability?.dns_security,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(filtered, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
