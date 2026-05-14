import chalk from "chalk";
import { createInterface } from "node:readline";
import { printBanner } from "../core/banner.js";
import { OwnSurfaceClient } from "../core/api-client.js";
import { saveConfig, readStoredConfig, CONFIG_FILE } from "../core/config.js";

interface LoginOptions {
  apiKey?: string;
}

export async function loginCommand(options: LoginOptions) {
  printBanner();

  // If --api-key flag passed, save directly
  if (options.apiKey) {
    await loginWithApiKey(options.apiKey);
    return;
  }

  // Check if already logged in
  const existing = readStoredConfig();
  if (existing?.apiKey) {
    console.log(chalk.dim("  Already logged in. Use --api-key to switch accounts or run ownsurface logout first."));
    console.log("");
    return;
  }

  // Interactive login
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const ask = (q: string): Promise<string> =>
    new Promise((resolve) => rl.question(q, resolve));

  try {
    console.log(chalk.dim("  Log in with your OwnSurface account."));
    console.log(chalk.dim("  Don't have one? Sign up at https://ownsurface.com"));
    console.log("");

    const email = await ask(chalk.cyan("  Email: "));
    const password = await askPassword(rl, chalk.cyan("  Password: "));
    console.log(""); // newline after hidden password

    if (!email.trim() || !password.trim()) {
      console.error(chalk.red("  Email and password are required."));
      process.exit(1);
    }

    const apiUrl = process.env.OWNSURFACE_API_URL || "https://api.ownsurface.com";
    const client = new OwnSurfaceClient("", apiUrl);

    // Step 1: Login to get JWT
    process.stdout.write(chalk.dim("  Authenticating..."));
    let loginResult: any;
    try {
      loginResult = await client.login(email.trim(), password);
    } catch (error) {
      console.log("");
      const msg = (error as Error).message;
      if (msg.includes("401") || msg.includes("403")) {
        console.error(chalk.red("  Invalid email or password."));
      } else {
        console.error(chalk.red(`  Login failed: ${msg}`));
      }
      process.exit(1);
    }

    const token = loginResult.token || loginResult.jwt || loginResult.access_token;
    if (!token) {
      console.log("");
      console.error(chalk.red("  Login succeeded but no token received."));
      process.exit(1);
    }
    console.log(chalk.green(" done"));

    // Step 2: Create an API key for CLI usage
    process.stdout.write(chalk.dim("  Creating API key..."));
    let apiKeyResult: any;
    try {
      const authedClient = new OwnSurfaceClient("", apiUrl);
      apiKeyResult = await authedClient.createApiKey(token);
    } catch (error) {
      console.log("");
      console.error(chalk.red(`  Failed to create API key: ${(error as Error).message}`));
      console.error(chalk.dim("  You can also set your API key manually: ownsurface login --api-key <key>"));
      process.exit(1);
    }

    const apiKey = apiKeyResult.key || apiKeyResult.api_key || apiKeyResult.raw_key;
    if (!apiKey) {
      console.log("");
      console.error(chalk.red("  API key created but key value not returned."));
      process.exit(1);
    }
    console.log(chalk.green(" done"));

    // Step 3: Save config
    saveConfig({
      apiKey,
      apiUrl,
      email: email.trim(),
    });

    // Step 4: Show user info
    const plan = loginResult.user?.plan || "free";
    const name = loginResult.user?.name || email.trim();

    console.log("");
    console.log(chalk.green("  Logged in as ") + chalk.bold(name) + chalk.dim(` (${plan} plan)`));
    console.log(chalk.dim(`  Config saved to ${CONFIG_FILE}`));
    console.log("");
    console.log(`  Try: ${chalk.bold("ownsurface scan https://example.com")}`);
    console.log("");
  } finally {
    rl.close();
  }
}

/**
 * Login with a pre-existing API key (skips email/password).
 */
async function loginWithApiKey(apiKey: string): Promise<void> {
  const apiUrl = process.env.OWNSURFACE_API_URL || "https://api.ownsurface.com";

  // Validate the key works
  process.stdout.write(chalk.dim("  Validating API key..."));
  const client = new OwnSurfaceClient(apiKey, apiUrl);

  try {
    const me = await client.getMe();
    console.log(chalk.green(" valid"));

    saveConfig({
      apiKey,
      apiUrl,
      email: me.email || me.user?.email,
    });

    const plan = me.plan || me.user?.plan || "free";
    const name = me.name || me.user?.name || me.email || me.user?.email || "unknown";

    console.log("");
    console.log(chalk.green("  Logged in as ") + chalk.bold(name) + chalk.dim(` (${plan} plan)`));
    console.log(chalk.dim(`  Config saved to ${CONFIG_FILE}`));
    console.log("");
  } catch (error) {
    console.log("");
    console.error(chalk.red(`  Invalid API key: ${(error as Error).message}`));
    process.exit(1);
  }
}

/**
 * Ask for password with hidden input (shows dots).
 */
function askPassword(rl: ReturnType<typeof createInterface>, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;

    if (stdin.isTTY) {
      stdin.setRawMode(true);
    }

    let password = "";
    const onData = (char: Buffer) => {
      const c = char.toString("utf-8");

      if (c === "\n" || c === "\r" || c === "\u0004") {
        // Enter or Ctrl+D
        stdin.removeListener("data", onData);
        if (stdin.isTTY) {
          stdin.setRawMode(wasRaw ?? false);
        }
        resolve(password);
      } else if (c === "\u0003") {
        // Ctrl+C
        console.log("");
        process.exit(0);
      } else if (c === "\u007F" || c === "\b") {
        // Backspace
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write("\b \b");
        }
      } else {
        password += c;
        process.stdout.write("*");
      }
    };

    stdin.on("data", onData);
  });
}
