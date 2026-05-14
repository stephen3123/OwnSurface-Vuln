import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface ComplianceOptions {
  json?: boolean;
  apiKey?: string;
}

export async function complianceCommand(domain: string, options: ComplianceOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = ora(`Checking compliance for ${domain}...`).start();

  try {
    const result = await client.getCompliance(domain);
    spinner.succeed(`Compliance check complete for ${domain}`);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const report = result.report || result;
    console.log("");
    console.log(chalk.bold("  Compliance Report"));
    console.log(chalk.dim("  " + "─".repeat(50)));

    // Show each regulation
    const regulations = report.regulations || report.checks || [];
    if (regulations.length > 0) {
      for (const reg of regulations) {
        const status = reg.compliant
          ? chalk.green("PASS")
          : chalk.red("FAIL");
        console.log(`  ${status}  ${chalk.bold(reg.name || reg.regulation)}  ${chalk.dim(reg.description || "")}`);

        if (reg.issues?.length > 0) {
          for (const issue of reg.issues.slice(0, 3)) {
            console.log(`       ${chalk.yellow("!")} ${issue}`);
          }
        }
      }
    }

    // Show overall score
    if (report.score !== undefined) {
      const scoreColor = report.score >= 80 ? chalk.green : report.score >= 50 ? chalk.yellow : chalk.red;
      console.log("");
      console.log(`  Overall Score: ${scoreColor(report.score + "/100")}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail(`Compliance check failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
