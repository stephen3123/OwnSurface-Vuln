import chalk from "chalk";

const VERSION = "1.0.0";

// ─── Ray the Stingray ───────────────────────────────────────────────────

function rayFrame(
  eyes: string,
  eyeColor: (s: string) => string,
  mouthColor: (s: string) => string,
  suffix = ""
): string[] {
  const dot = chalk.dim("·");
  return [
    chalk.dim("            ·"),
    chalk.cyan("          ╱ ") + eyeColor(eyes[0]) + chalk.cyan(" ") + dot + chalk.cyan(" ") + eyeColor(eyes[1]) + chalk.cyan(" ╲"),
    chalk.cyan("        ╱    ") + mouthColor("▽") + chalk.cyan("    ╲") + (suffix ? "  " + suffix : ""),
    chalk.cyan("  ≈───╱─────────────╲───≈") + (suffix && suffix.includes("►") ? chalk.yellow("►►►") : ""),
    chalk.cyan("       ╲           ╱"),
    chalk.cyan("         ╲───────╱"),
    chalk.cyan("           ╲───╱"),
    chalk.cyan("             │"),
    chalk.cyan("             ˜"),
  ];
}

const RAY_IDLE     = rayFrame("◉◉", chalk.bold.white, chalk.dim);
const RAY_BLINK    = rayFrame("──", chalk.bold.white, chalk.dim);
const RAY_SCANNING = rayFrame("◎◎", chalk.yellow, chalk.dim, chalk.yellow(")))"));
const RAY_FOUND    = rayFrame("◉◉", chalk.red, chalk.red, chalk.red("⚠"));
const RAY_HAPPY    = rayFrame("◡◡", chalk.green, chalk.green, chalk.green("✓"));

const FRAME_HEIGHT = RAY_IDLE.length + 2; // +2 for blank lines around frame

const RAY_MINI = chalk.cyan("≈╱") + chalk.bold.white("◉ ◉") + chalk.cyan("╲≈");

/**
 * Full branded banner with blinking Ray — shown on `ownsurface` with no args.
 * Blinks 3 times then stops.
 */
export async function printBannerAnimated(): Promise<void> {
  const renderFrame = (frame: string[]) => {
    console.log("");
    for (const line of frame) {
      console.log("  " + line);
    }
    console.log("");
  };

  const clearFrame = () => {
    process.stdout.write(`\x1b[${FRAME_HEIGHT}A`);
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  // Initial render
  renderFrame(RAY_IDLE);

  // Blink 3 times with natural random intervals
  for (let i = 0; i < 3; i++) {
    await sleep(1200 + Math.random() * 800);
    clearFrame();
    renderFrame(RAY_BLINK);
    await sleep(150);
    clearFrame();
    renderFrame(RAY_IDLE);
  }
}

/**
 * Static banner (no animation) — used when piped or non-TTY.
 */
export function printBanner(): void {
  console.log("");
  for (const line of RAY_IDLE) {
    console.log("  " + line);
  }
  console.log("");
  console.log("  " + chalk.bold.white("  OwnSurface") + chalk.dim(` v${VERSION}`));
  console.log("  " + chalk.dim("  See through any website."));
  console.log("");
}

/**
 * Compact banner — one-line Ray for scan output headers.
 */
export function printCompactBanner(): void {
  console.log("  " + RAY_MINI + " " + chalk.bold.white("OwnSurface") + chalk.dim(` v${VERSION}`));
}

/**
 * Welcome message for first-time users / no subcommand.
 */
export async function printWelcome(): Promise<void> {
  if (process.stdout.isTTY) {
    await printBannerAnimated();
  } else {
    printBanner();
    return;
  }

  console.log("  " + chalk.bold.white("  OwnSurface") + chalk.dim(` v${VERSION}`));
  console.log("  " + chalk.dim("  See through any website."));
  console.log("");

  const lines = [
    chalk.bold("  Quick start:"),
    "",
    `  ${chalk.cyan("$")} ${chalk.bold("ownsurface login")}                           Log in`,
    `  ${chalk.cyan("$")} ${chalk.bold("ownsurface scan")} ${chalk.dim("stripe.com")}                  Scan a website`,
    `  ${chalk.cyan("$")} ${chalk.bold("ownsurface enrich")} ${chalk.dim("stripe.com")}                Company + tech intel`,
    `  ${chalk.cyan("$")} ${chalk.bold("ownsurface attack-surface")} ${chalk.dim("example.com")}      Full security audit`,
    `  ${chalk.cyan("$")} ${chalk.bold("ownsurface offensive-scan")} ${chalk.dim("example.com")}      Pen-test a domain`,
    "",
    chalk.dim("  Also: deep-scan, bulk, report, monitor, leads, compliance, ai-visibility"),
    chalk.dim("  Tip:  ") + chalk.bold("os") + chalk.dim(" works as a short alias (e.g. ") + chalk.white("os scan stripe.com") + chalk.dim(")"),
    chalk.dim("  Docs: https://ownsurface.com/docs/cli"),
    "",
  ];
  console.log(lines.join("\n"));
}

/**
 * Get Ray ASCII art for a given state (for use by other modules).
 */
export function getRay(state: "idle" | "blink" | "scanning" | "found" | "happy"): string[] {
  switch (state) {
    case "blink": return RAY_BLINK;
    case "scanning": return RAY_SCANNING;
    case "found": return RAY_FOUND;
    case "happy": return RAY_HAPPY;
    default: return RAY_IDLE;
  }
}
