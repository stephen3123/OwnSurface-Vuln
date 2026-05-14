import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface ReportOptions {
  json?: boolean;
  apiKey?: string;
}

export async function reportCommand(url: string, options: ReportOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = ora(`Generating report for ${url}...`).start();

  try {
    const result = await client.createReport(url);

    spinner.succeed("Report generated");

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      const report = result.report || result;
      console.log("");
      console.log(chalk.bold(`  Report: ${report.title || url}`));
      console.log(chalk.dim("  " + "─".repeat(50)));
      if (report.id) console.log(`  ID:   ${report.id}`);
      if (report.slug) console.log(`  URL:  https://ownsurface.com/report/${report.slug}`);
      if (report.public_url) console.log(`  URL:  ${report.public_url}`);
      console.log("");
    }
  } catch (error) {
    spinner.fail(`Report failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
