import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import { basename } from "node:path";
import type { OwnSurfaceClient } from "../api-client.js";

export function registerMobileTools(server: McpServer, client: OwnSurfaceClient) {
  server.tool(
    "ownsurface_mobile_appstore_check",
    "Upload an APK or IPA file and run an App Store compliance check: manifest analysis, permission audit, insecure storage detection, and certificate validation. Free tier.",
    {
      file_path: z.string().describe("Absolute path to the APK or IPA file on disk"),
    },
    async ({ file_path }) => {
      try {
        const fileData = await readFile(file_path);
        const fileName = basename(file_path);
        const result = await client.startMobileScan(fileData, fileName, "appstore_check");
        const scanId = result.scan?.id;
        if (!scanId) {
          return { content: [{ type: "text" as const, text: "Error: failed to start mobile scan — no scan ID returned" }], isError: true };
        }
        const scan = await client.pollMobileScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_mobile_security_audit",
    "Upload an APK or IPA file and run a full mobile security audit: OWASP MASVS checks, binary analysis, API endpoint extraction, hardcoded secrets, SSL pinning, root/jailbreak detection. Pro plan required.",
    {
      file_path: z.string().describe("Absolute path to the APK or IPA file on disk"),
      scope: z.record(z.boolean()).optional().describe("Optional scope overrides (e.g., { binary_analysis: true, network_analysis: false })"),
    },
    async ({ file_path, scope }) => {
      try {
        const fileData = await readFile(file_path);
        const fileName = basename(file_path);
        const result = await client.startMobileScan(fileData, fileName, "security_audit", scope);
        const scanId = result.scan?.id;
        if (!scanId) {
          return { content: [{ type: "text" as const, text: "Error: failed to start mobile scan — no scan ID returned" }], isError: true };
        }
        const scan = await client.pollMobileScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );

  server.tool(
    "ownsurface_mobile_pentest",
    "Upload an APK or IPA file and run offensive mobile penetration testing against a verified domain: dynamic analysis, API fuzzing, intent abuse, deep link hijacking, and runtime manipulation. Pro plan + verified domain required.",
    {
      file_path: z.string().describe("Absolute path to the APK or IPA file on disk"),
      domain: z.string().describe("Verified domain the app communicates with (must be verified first)"),
    },
    async ({ file_path, domain }) => {
      try {
        const fileData = await readFile(file_path);
        const fileName = basename(file_path);
        const result = await client.startMobileScan(fileData, fileName, "offensive_pentest", undefined, domain);
        const scanId = result.scan?.id;
        if (!scanId) {
          return { content: [{ type: "text" as const, text: "Error: failed to start mobile scan — no scan ID returned" }], isError: true };
        }
        const scan = await client.pollMobileScan(scanId);
        return { content: [{ type: "text" as const, text: JSON.stringify(scan, null, 2) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: `Error: ${(error as Error).message}` }], isError: true };
      }
    }
  );
}
