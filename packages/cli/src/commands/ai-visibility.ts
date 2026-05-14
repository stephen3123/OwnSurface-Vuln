import ora from "ora";
import chalk from "chalk";
import { loadConfig } from "../core/config.js";
import { OwnSurfaceClient } from "../core/api-client.js";

interface AiVisibilityOptions {
  brand?: string;
  json?: boolean;
  apiKey?: string;
}

export async function aiVisibilityCommand(domain: string, options: AiVisibilityOptions) {
  const config = loadConfig(options.apiKey);
  const client = new OwnSurfaceClient(config.apiKey, config.apiUrl);

  const spinner = ora(`Checking AI visibility for ${domain}...`).start();

  try {
    const startResult = await client.startAiVisibility(domain, options.brand);
    const checkId = startResult.check?.id || startResult.id;

    if (!checkId) {
      spinner.fail("Failed to start AI visibility check");
      process.exit(1);
    }

    spinner.text = `AI visibility check running...`;

    const result = await client.pollUntilDone(
      () => client.getAiVisibility(checkId),
      (r) => {
        const status = r.check?.status || r.status;
        return status === "complete" || status === "failed";
      },
      120_000
    );

    spinner.succeed(`AI visibility check complete for ${domain}`);

    if (options.json) {
      console.log(JSON.stringify(result, null, 2));
      return;
    }

    const check = result.check || result;
    console.log("");
    console.log(chalk.bold("  AI Visibility Report"));
    console.log(chalk.dim("  " + "─".repeat(50)));

    if (check.mentioned !== undefined) {
      const mentionColor = check.mentioned ? chalk.green : chalk.yellow;
      console.log(`  Mentioned by AI: ${mentionColor(check.mentioned ? "Yes" : "No")}`);
    }
    if (check.sentiment) {
      console.log(`  Sentiment:       ${check.sentiment}`);
    }
    if (check.context) {
      console.log(`  Context:         ${check.context.slice(0, 200)}`);
    }
    if (check.competitors?.length > 0) {
      console.log(`  Competitors:     ${check.competitors.join(", ")}`);
    }

    console.log("");
  } catch (error) {
    spinner.fail(`AI visibility check failed: ${(error as Error).message}`);
    process.exit(1);
  }
}
