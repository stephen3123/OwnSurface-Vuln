import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerApiSpecTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_api_spec_scan",
    "Scan an API using its OpenAPI/Swagger specification: endpoint discovery, authentication testing, injection testing, rate limit analysis, and schema validation. Spec can be raw YAML/JSON content or a URL to fetch. Pro plan + verified domain required.",
    {
      domain: z.string().describe("Verified domain the API belongs to (must be verified first)"),
      spec: z.string().describe("OpenAPI/Swagger spec content (YAML or JSON) or a URL pointing to the spec"),
      scope: z.record(z.boolean()).optional().describe("Optional scope overrides (e.g., { auth_testing: true, injection_testing: false })"),
      rate_limit: z.enum(["conservative", "moderate", "aggressive"]).optional().describe("Rate limit for scanning (default: moderate)"),
    },
    async ({ domain, spec, scope, rate_limit }) => {
      try {
        const result = await client.startApiSpecScan(domain, spec, scope, rate_limit);
        const scanId = result.scan?.id;
        if (!scanId) {
          return { content: [{ type: "text" as const, text: "Error: failed to start API spec scan — no scan ID returned" }], isError: true };
        }
        const scan = await client.pollApiSpecScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
