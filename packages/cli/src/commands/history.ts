import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface HistoryOptions {
  json?: boolean;
  apiKey?: string;
}

export async function historyCommand(url: string, options: HistoryOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  try {
    const hash = await generateUrlHash(url);
    const result = await client.getHistory(hash);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const scans = (result as any).scans || (result as any).history || [];
      console.log("");
      console.log(chalk.bold(`  Scan History: ${url}`));
      console.log(chalk.dim("  " + "─".repeat(50)));

      if (scans.length === 0) {
        console.log("  No scan history found for this URL.");
      } else {
        for (const scan of scans) {
          const date = new Date(scan.scanned_at || scan.created_at).toLocaleDateString();
          const grade = scan.security?.grade || "?";
          const techs = (scan.tech_stack || []).length;
          console.log(`  ${chalk.dim(date)}  Grade: ${grade}  Tech: ${techs} items`);
        }
      }
      console.log("");
    }
  } catch (error) {
    console.error(chalk.red(`  Failed: ${(error as Error).message}`));
    process.exit(1);
  }
}

async function generateUrlHash(url: string): Promise<string> {
  const normalized = url.toLowerCase().trim();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
