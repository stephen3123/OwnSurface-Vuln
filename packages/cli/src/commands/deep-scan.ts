import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { formatFindings } from "../core/formatter.js";
import { handleError } from "../core/errors.js";

interface DeepScanOptions {
  json?: boolean;
  quiet?: boolean;
  apiKey?: string;
}

export async function deepScanCommand(domain: string, options: DeepScanOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = options.quiet ? null : ora(`Starting deep scan for ${domain}...`).start();

  try {
    const startResult = await client.startDeepScan(domain);
    const scanId = startResult.deep_scan?.id;

    if (!scanId) {
      spinner?.fail("Failed to start deep scan");
      process.exit(1);
    }

    if (spinner) spinner.text = `Deep scan ${scanId} running — crawling pages...`;

    const result = await client.pollUntilDone(
      () => client.getDeepScan(scanId),
      (r) => {
        const status = r.deep_scan?.status;
        if (status === "scanning" && spinner) {
          const pages = r.deep_scan?.pages_scanned || 0;
          const found = r.deep_scan?.pages_found || 0;
          spinner.text = `Deep scan: ${pages}/${found} pages scanned...`;
        }
        return status === "complete" || status === "failed" || status === "cancelled";
      },
      600_000
    );

    const scan = result.deep_scan;

    if (scan.status === "failed") {
      spinner?.fail("Deep scan failed");
    } else {
      spinner?.succeed(`Deep scan complete for ${domain}`);
    }

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else if (!options.quiet) {
      console.log("");
      console.log(chalk.bold(`  Pages crawled: ${scan.pages_scanned || 0}`));
      console.log(chalk.bold(`  Pages found: ${scan.pages_found || 0}`));

      if (scan.findings?.length > 0) {
        console.log(formatFindings(scan.findings));
      }
    }
  } catch (error) {
    handleError(error, spinner ?? undefined);
  }
}
