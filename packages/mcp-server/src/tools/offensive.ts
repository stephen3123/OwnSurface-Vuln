import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

const VERIFIED_DOMAIN_HINT = "The domain must be verified first — use ownsurface_list_domains to check, or ownsurface_verify_domain to start verification.";

export function registerOffensiveTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_test_sqli",
    `Test a verified domain for SQL injection vulnerabilities. Returns findings with proof-of-concept and remediation. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to test (e.g., myapp.com)"),
      deep: z.boolean().optional().describe("Use sqlmap for deep testing (slower, more thorough)"),
    },
    async ({ domain, deep }) => {
      try {
        const result = await client.startOffensiveScan(domain, {
          sqli_testing: true,
          xss_testing: false,
          csrf_testing: false,
          ssrf_testing: false,
          auth_bypass_testing: false,
        });
        const scan = await client.pollOffensiveScan(result.scan.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_test_xss",
    `Test a verified domain for Cross-Site Scripting (XSS) vulnerabilities using Dalfox. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to test (e.g., myapp.com)"),
      url: z.string().optional().describe("Specific URL with parameters to test (e.g., https://myapp.com/search?q=test)"),
    },
    async ({ domain, url }) => {
      try {
        const result = await client.startOffensiveScan(domain, {
          xss_testing: true,
          sqli_testing: false,
          csrf_testing: false,
          ssrf_testing: false,
          auth_bypass_testing: false,
        });
        const scan = await client.pollOffensiveScan(result.scan.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_test_auth",
    `Test a verified domain for authentication bypass: path manipulation, HTTP verb tampering, header injection, CSRF tokens, JWT. Pro plan required. ${VERIFIED_DOMAIN_HINT}`,
    {
      domain: z.string().describe("Verified domain to test"),
    },
    async ({ domain }) => {
      try {
        const result = await client.startOffensiveScan(domain, {
          auth_bypass_testing: true,
          csrf_testing: true,
          jwt_testing: true,
          sqli_testing: false,
          xss_testing: false,
          ssrf_testing: false,
        });
        const scan = await client.pollOffensiveScan(result.scan.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
