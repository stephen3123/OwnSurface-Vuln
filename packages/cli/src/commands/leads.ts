import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface LeadsOptions {
  tech?: string;
  industry?: string;
  employees?: string;
  location?: string;
  page?: string;
  json?: boolean;
  apiKey?: string;
}

export async function leadsCommand(options: LeadsOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const params: Record<string, string> = {};
  if (options.tech) params.technology = options.tech;
  if (options.industry) params.industry = options.industry;
  if (options.employees) params.employees = options.employees;
  if (options.location) params.location = options.location;
  if (options.page) params.page = options.page;

  if (Object.keys(params).length === 0) {
    console.error(chalk.red("  At least one filter required: --tech, --industry, --employees, or --location"));
    process.exit(1);
  }

  try {
    const result = await client.searchLeads(params);
    const leads = result.leads || result.results || [];
    const total = result.total || leads.length;

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    console.log("");
    console.log(chalk.bold(`  Leads (${total} results)`));
    console.log(chalk.dim("  " + "─".repeat(50)));

    if (leads.length === 0) {
      console.log(chalk.dim("  No leads found for these filters."));
    } else {
      for (const lead of leads) {
        const domain = chalk.white(lead.domain || "");
        const company = lead.company_name || "";
        const tech = (lead.technologies || []).slice(0, 3).join(", ");
        console.log(`  ${domain}  ${company}  ${chalk.dim(tech)}`);
      }

      if (total > leads.length) {
        console.log(chalk.dim(`\n  Showing ${leads.length} of ${total}. Use --page for more.`));
      }
    }
    console.log("");
  } catch (error) {
    console.error(chalk.red(`  Failed: ${(error as Error).message}`));
    process.exit(1);
  }
}
