import chalk from "chalk";

/**
 * Parse an API error and return a user-friendly message with suggested fix.
 * Returns null if the error doesn't match a known pattern — caller should
 * fall back to showing the raw message.
 */
export function friendlyError(error: Error): string | null {
  const msg = error.message.toLowerCase();

  // Domain not verified
  if (msg.includes("not verified") || msg.includes("domain_not_verified") || (msg.includes("403") && msg.includes("verif"))) {
    return (
      chalk.red("  Domain not verified.") +
      "\n" +
      chalk.dim("  Run: ") +
      chalk.bold("ownsurface verify <domain>") +
      chalk.dim(" to verify ownership first.")
    );
  }

  // Plan upgrade needed
  if (msg.includes("upgrade") || msg.includes("pro plan") || msg.includes("plan_limit") || (msg.includes("403") && msg.includes("plan"))) {
    return (
      chalk.red("  This feature requires a Pro plan.") +
      "\n" +
      chalk.dim("  Upgrade at: ") +
      chalk.cyan("https://ownsurface.com/billing")
    );
  }

  // Rate limited
  if (msg.includes("429") || msg.includes("rate limit") || msg.includes("too many")) {
    return (
      chalk.red("  Rate limited.") +
      "\n" +
      chalk.dim("  Wait a moment and try again, or use ") +
      chalk.bold("--rate-limit conservative")
    );
  }

  // Concurrent scan limit
  if (msg.includes("concurrent") || msg.includes("already running") || msg.includes("max_concurrent")) {
    return (
      chalk.red("  Too many scans running.") +
      "\n" +
      chalk.dim("  Wait for current scans to finish, or cancel one: ") +
      chalk.bold("ownsurface cancel <id>")
    );
  }

  // Not authenticated
  if (msg.includes("401") || msg.includes("unauthorized") || msg.includes("invalid api key") || msg.includes("authentication")) {
    return (
      chalk.red("  Not authenticated.") +
      "\n" +
      chalk.dim("  Run: ") +
      chalk.bold("ownsurface login")
    );
  }

  // Scan quota exceeded
  if (msg.includes("quota") || msg.includes("limit exceeded") || msg.includes("daily limit")) {
    return (
      chalk.red("  Scan quota exceeded for your plan.") +
      "\n" +
      chalk.dim("  Upgrade for unlimited scans: ") +
      chalk.cyan("https://ownsurface.com/billing")
    );
  }

  // Timeout
  if (msg.includes("timed out") || msg.includes("timeout")) {
    return (
      chalk.red("  Request timed out.") +
      "\n" +
      chalk.dim("  The scan may still be running. Check: ") +
      chalk.bold("ownsurface monitor status")
    );
  }

  // Network error
  if (msg.includes("econnrefused") || msg.includes("enotfound") || msg.includes("fetch failed") || msg.includes("network")) {
    return (
      chalk.red("  Cannot reach the OwnSurface API.") +
      "\n" +
      chalk.dim("  Check your internet connection and try again.") +
      "\n" +
      chalk.dim("  API status: ") +
      chalk.cyan("https://status.ownsurface.com")
    );
  }

  return null;
}

/**
 * Handle a command error: print friendly message if possible, otherwise raw error.
 * Use in catch blocks instead of raw console.error.
 */
export function handleError(error: unknown, spinner?: { fail: (msg: string) => void }): never {
  const err = error as Error;
  const friendly = friendlyError(err);

  if (spinner) {
    spinner.fail("Failed");
  }

  if (friendly) {
    console.error("");
    console.error(friendly);
    console.error("");
  } else {
    console.error("");
    console.error(chalk.red(`  ${err.message}`));
    console.error("");
  }

  process.exit(1);
}
