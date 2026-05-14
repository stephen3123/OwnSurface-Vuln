import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

const VERIFIED_DOMAIN_HINT = "The domain must be verified first — use ownsurface_list_domains to check, or ownsurface_verify_domain to start verification.";

export function registerAdvancedTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_attack_surface",
    `Run a full attack surface audit: passive recon, active probing, directory scanning, vulnerability testing (Nuclei), and AI summary. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to audit"),
      scope: z.object({
        vulnerability_testing: z.boolean().optional().describe("Enable Nuclei vulnerability testing"),
        subdomain_enum: z.boolean().optional().describe("Enable subdomain enumeration"),
        directory_bruteforce: z.boolean().optional().describe("Enable directory brute-force"),
      }).optional().describe("Scope configuration"),
      rate_limit: z.enum(["conservative", "moderate", "aggressive"]).optional().describe("Request rate (default: moderate)"),
    },
    async ({ domain, scope, rate_limit }) => {
      try {
        const result = await client.startAttackSurface(domain, scope, rate_limit);
        const audit = await client.pollAttackSurface(result.audit.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(audit, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_deep_scan",
    `Run a deep Playwright-powered crawl with JavaScript rendering and full vulnerability analysis. Much more thorough than a quick scan. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to deep scan"),
    },
    async ({ domain }) => {
      try {
        const result = await client.startDeepScan(domain);
        const scanId = (result as any).deep_scan?.id;
        if (!scanId) throw new Error("Failed to start deep scan — no ID returned");
        const scan = await client.pollDeepScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_monitor_uptime",
    "Create an uptime monitor. Checks every 5 minutes and alerts on downtime. Pro plan required.",
    {
      url: z.string().describe("URL to monitor"),
      name: z.string().optional().describe("Monitor name"),
    },
    async ({ url, name }) => {
      try {
        const result = await client.createUptimeMonitor(url, name);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_generate_report",
    "Generate a PDF security report with executive summary, findings, and remediation roadmap. Pro plan required.",
    {
      domain: z.string().describe("Domain to generate report for"),
    },
    async ({ domain }) => {
      try {
        const result = await client.generateReport(domain);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_offensive_scan",
    `Run comprehensive offensive security tests: SQLi, XSS, CSRF, SSRF, JWT, auth bypass. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to scan"),
      checks: z.array(z.string()).optional().describe("Specific checks: sqli, xss, csrf, ssrf, jwt, auth_bypass (default: all)"),
      rate_limit: z.enum(["conservative", "moderate", "aggressive"]).optional().describe("Request rate (default: moderate)"),
    },
    async ({ domain, checks, rate_limit }) => {
      try {
        const scope: Record<string, boolean> = {};
        if (checks && checks.length > 0) {
          for (const check of checks) {
            scope[`${check}_testing`] = true;
          }
        } else {
          scope.sqli_testing = true;
          scope.xss_testing = true;
          scope.csrf_testing = true;
          scope.ssrf_testing = true;
          scope.auth_bypass_testing = true;
        }

        const result = await client.startOffensiveScan(domain, scope, rate_limit);
        const scan = await client.pollOffensiveScan(result.scan.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
