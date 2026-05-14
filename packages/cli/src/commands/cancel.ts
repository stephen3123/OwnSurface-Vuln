import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface CancelOptions {
  type?: string;
  apiKey?: string;
}

export async function cancelCommand(id: string, options: CancelOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const scanType = options.type || "auto";

  try {
    if (scanType === "auto") {
      // Try each type until one works
      const attempts = [
        { name: "offensive scan", fn: () => client.cancelOffensiveScan(id) },
        { name: "attack surface", fn: () => client.cancelAttackSurface(id) },
        { name: "deep scan", fn: () => client.cancelDeepScan(id) },
      ];

      for (const attempt of attempts) {
        try {
          await attempt.fn();
          console.log(chalk.green(`  Cancelled ${attempt.name}: ${id}`));
          return;
        } catch {
          // Try next type
        }
      }
      console.error(chalk.red(`  Could not cancel scan ${id}. Use --type to specify: offensive, attack-surface, deep-scan`));
      process.exit(1);
    } else {
      switch (scanType) {
        case "offensive":
          await client.cancelOffensiveScan(id);
          break;
        case "attack-surface":
          await client.cancelAttackSurface(id);
          break;
        case "deep-scan":
          await client.cancelDeepScan(id);
          break;
        default:
          console.error(chalk.red(`  Unknown type: ${scanType}. Use: offensive, attack-surface, deep-scan`));
          process.exit(1);
      }
      console.log(chalk.green(`  Cancelled ${scanType}: ${id}`));
    }
  } catch (error) {
    console.error(chalk.red(`  Failed to cancel: ${(error as Error).message}`));
    process.exit(1);
  }
}
