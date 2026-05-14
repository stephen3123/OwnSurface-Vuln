import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerReconTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_find_subdomains",
    "Discover all subdomains of a domain using multiple intelligence sources (VirusTotal, Shodan, Censys, certificate transparency). Returns live hosts with HTTP status codes.",
    {
      domain: z.string().describe("Domain to enumerate subdomains for (e.g., example.com)"),
    },
    async ({ domain }) => {
      try {
        const result = await client.startAttackSurface(domain, {
          subdomain_enum: true,
          deep_subdomain_enum: true,
        });
        const audit = await client.pollAttackSurface(result.audit.id);
        return { content: [{ type: "text" as const, text: JSON.stringify(audit, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_check_exposed_files",
    "Check a website for exposed sensitive files: .env, .git, backup files, config files, database dumps, and 70+ other paths that should never be public.",
    {
      url: z.string().describe("URL to check for exposed files (e.g., https://example.com)"),
    },
    async ({ url }) => {
      try {
        const result = await client.scan(url);
        const filtered = {
          url,
          sensitive_files: (result as any).vulnerability?.sensitive_files,
          security_findings: (result as any).security_findings,
        };
        return { content: [{ type: "text" as const, text: JSON.stringify(filtered, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
