import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface VerifyOptions {
  apiKey?: string;
}

export async function verifyCommand(domain: string, options: VerifyOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  try {
    const result = await client.startVerification(domain);
    const verification = result.verification || result;

    console.log("");
    console.log(chalk.bold(`  Domain Verification: ${domain}`));
    console.log(chalk.dim("  " + "─".repeat(50)));
    console.log("");

    if (verification.method === "dns") {
      console.log("  Add this DNS TXT record to verify ownership:");
      console.log("");
      console.log(`  ${chalk.cyan("Type:")}  TXT`);
      console.log(`  ${chalk.cyan("Name:")}  ${verification.dns_name || "_ownsurface"}`);
      console.log(`  ${chalk.cyan("Value:")} ${chalk.yellow(verification.dns_value || verification.token)}`);
    } else if (verification.method === "file") {
      console.log("  Place this file on your server to verify ownership:");
      console.log("");
      console.log(`  ${chalk.cyan("URL:")}     https://${domain}/.well-known/ownsurface-verify.txt`);
      console.log(`  ${chalk.cyan("Content:")} ${chalk.yellow(verification.file_content || verification.token)}`);
    }

    console.log("");
    console.log(chalk.dim("  After adding the record, the verification will be checked automatically."));
    console.log(chalk.dim(`  Verification ID: ${verification.id}`));
    console.log("");
  } catch (error) {
    console.error(chalk.red(`  Failed to start verification: ${(error as Error).message}`));
    process.exit(1);
  }
}
