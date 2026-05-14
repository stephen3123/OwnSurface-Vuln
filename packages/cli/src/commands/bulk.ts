import ora from "ora";
import chalk from "chalk";
import { readFileSync } from "node:fs";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface BulkOptions {
  json?: boolean;
  apiKey?: string;
}

export async function bulkCommand(file: string, options: BulkOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  // Read URLs from file (one per line or CSV)
  let urls: string[];
  try {
    const content = readFileSync(file, "utf-8");
    urls = content
      .split("\n")
      .map((line) => line.trim().split(",")[0].trim()) // support CSV: take first column
      .filter((url) => url && (url.startsWith("http") || url.includes(".")));
  } catch (error) {
    console.error(chalk.red(`  Failed to read file: ${file}`));
    process.exit(1);
  }

  if (urls.length === 0) {
    console.error(chalk.red("  No valid URLs found in file."));
    process.exit(1);
  }

  console.log(chalk.dim(`  Found ${urls.length} URLs in ${file}`));

  const spinner = ora(`Starting bulk scan (${urls.length} URLs)...`).start();

  try {
    const result = await client.createBulkScan(urls);
    const jobId = result.job?.id || result.id;

    if (!jobId) {
      spinner.fail("Failed to start bulk scan");
      process.exit(1);
    }

    spinner.text = `Bulk scan ${jobId} running...`;

    const finalResult = await client.pollUntilDone(
      () => client.getBulkJob(jobId),
      (r) => {
        const job = r.job || r;
        const completed = job.completed || 0;
        const total = job.total || urls.length;
        spinner.text = `Bulk scan: ${completed}/${total} complete...`;
        return job.status === "complete" || job.status === "failed";
      },
      600_000
    );

    spinner.succeed("Bulk scan complete");

    if (options.json) {
      console.log(JSON.stringify(finalResult, null, 2));
    } else {
      const job = finalResult.job || finalResult;
      console.log("");
      console.log(chalk.bold(`  Total:     ${job.total || urls.length}`));
      console.log(chalk.bold(`  Completed: ${chalk.green(job.completed || 0)}`));
      console.log(chalk.bold(`  Failed:    ${chalk.red(job.failed || 0)}`));
      console.log("");
    }
  } catch (error) {
    spinner.fail(`Bulk scan failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
