import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface EnrichOptions {
  json?: boolean;
  only?: string;
  apiKey?: string;
}

export async function enrichCommand(domain: string, options: EnrichOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = ora(`Enriching ${domain}...`).start();

  try {
    let result: any;

    if (options.only === "company") {
      result = await client.enrichCompany(domain);
    } else if (options.only === "tech") {
      result = await client.enrichTech(domain);
    } else if (options.only === "security") {
      result = await client.enrichSecurity(domain);
    } else {
      result = await client.enrich(domain);
    }

    spinner.succeed(`Enrichment complete for ${domain}`);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("");

    // Company
    const company = result.company;
    if (company) {
      console.log(chalk.bold("  Company"));
      console.log(chalk.dim("  " + "─".repeat(40)));
      if (company.name) console.log(`  Name:      ${company.name}`);
      if (company.industry) console.log(`  Industry:  ${company.industry}`);
      if (company.location) console.log(`  Location:  ${company.location}`);
      if (company.employees) console.log(`  Employees: ${company.employees}`);
      if (company.description) console.log(`  About:     ${company.description.slice(0, 100)}`);
      console.log("");
    }

    // Tech stack
    const tech = result.tech_stack;
    if (tech?.length > 0) {
      console.log(chalk.bold("  Tech Stack"));
      console.log(chalk.dim("  " + "─".repeat(40)));
      const names = tech.slice(0, 15).map((t: any) => t.name || t).join(", ");
      console.log(`  ${names}`);
      if (tech.length > 15) console.log(chalk.dim(`  ... and ${tech.length - 15} more`));
      console.log("");
    }

    // Security
    const security = result.security;
    if (security) {
      console.log(chalk.bold("  Security"));
      console.log(chalk.dim("  " + "─".repeat(40)));
      const grade = security.grade || "?";
      const gradeColor = grade.startsWith("A") ? chalk.green : grade === "B" ? chalk.yellow : chalk.red;
      console.log(`  Grade: ${gradeColor(grade)} (${security.score}/100)`);
      console.log("");
    }

    // Social links
    const social = result.social_links;
    if (social && Object.keys(social).length > 0) {
      console.log(chalk.bold("  Social"));
      console.log(chalk.dim("  " + "─".repeat(40)));
      for (const [platform, url] of Object.entries(social)) {
        if (url) console.log(`  ${platform}: ${chalk.dim(url as string)}`);
      }
      console.log("");
    }
  } catch (error) {
    spinner.fail(`Enrichment failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
