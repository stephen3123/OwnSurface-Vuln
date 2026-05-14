import chalk from "chalk";
import { loadConfig, readStoredConfig, CONFIG_FILE } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

export async function whoamiCommand() {
  const stored = readStoredConfig();
  const config = loadConfig(undefined, true);

  if (!config.apiKey) {
    console.log("");
    console.log(chalk.dim("  Not logged in. Run ") + chalk.bold("ownsurface login") + chalk.dim(" to get started."));
    console.log("");
    process.exit(1);
  }

  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  try {
    const me = await client.getMe();
    const user = me.user || me;

    console.log("");
    console.log(chalk.bold("  Account"));
    console.log(chalk.dim("  " + "─".repeat(40)));
    console.log(`  Email:  ${chalk.white(user.email || stored?.email || "unknown")}`);
    if (user.name) {
      console.log(`  Name:   ${chalk.white(user.name)}`);
    }
    console.log(`  Plan:   ${chalk.cyan(user.plan || "free")}`);
    console.log(`  Key:    ${chalk.dim(maskKey(config.apiKey))}`);
    console.log(`  Config: ${chalk.dim(CONFIG_FILE)}`);
    console.log(`  API:    ${chalk.dim(config.apiUrl)}`);
    console.log("");
  } catch (error) {
    console.log("");
    console.error(chalk.red(`  Failed to fetch account info: ${(error as Error).message}`));
    console.error(chalk.dim("  Your API key may be invalid. Try: ownsurface login"));
    console.log("");
    process.exit(1);
  }
}

function maskKey(key: string): string {
  if (key.length < 12) return "****";
  return key.slice(0, 8) + "..." + key.slice(-4);
}
