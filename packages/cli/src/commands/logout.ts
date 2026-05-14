import chalk from "chalk";
import { deleteConfig, isAuthenticated } from "../core/config.js";

export async function logoutCommand() {
  if (!isAuthenticated()) {
    console.log("");
    console.log(chalk.dim("  Not logged in."));
    console.log("");
    return;
  }

  const deleted = deleteConfig();
  console.log("");
  if (deleted) {
    console.log(chalk.green("  Logged out.") + chalk.dim(" Config removed."));
  } else {
    console.log(chalk.dim("  No config file found. If using OWNSURFACE_API_KEY env var, unset it manually."));
  }
  console.log("");
}
