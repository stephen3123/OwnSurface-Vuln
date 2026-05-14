import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerExtensionTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_extension_scan",
    "Upload a browser extension (.crx or .zip) and scan for security issues: permission abuse, data exfiltration, CSP violations, malicious patterns, Web Store policy compliance. Free tier (3 scans/day).",
    {
      file_path: z.string().describe("Absolute path to the .crx or .zip extension file on disk"),
    },
    async ({ file_path }) => {
      try {
        const fileData = await readFile(file_path);
        const fileName = basename(file_path);
        const result = await client.startExtensionScan(fileData, fileName);
        const scanId = result.scan?.id;
        if (!scanId) {
          return { content: [{ type: "text" as const, text: "Error: failed to start extension scan — no scan ID returned" }], isError: true };
        }
        const scan = await client.pollExtensionScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
