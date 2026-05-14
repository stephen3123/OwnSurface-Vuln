import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

export interface OwnSurfaceConfig {
  apiKey: string;
  apiUrl: string;
}

export interface StoredConfig {
  apiKey?: string;
  apiUrl?: string;
  email?: string;
}

/** Directory for all OwnSurface CLI config: ~/.ownsurface/ */
export const CONFIG_DIR = join(homedir(), ".ownsurface");

/** Main config file: ~/.ownsurface/config.json */
export const CONFIG_FILE = join(CONFIG_DIR, "config.json");

/** Legacy config file: ~/.xrayrc */
const LEGACY_CONFIG_FILE = join(homedir(), ".xrayrc");

const DEFAULT_API_URL = "https://api.ownsurface.com";

/**
 * Load config for authenticated API calls.
 * Priority: CLI flag > env var > config file > legacy ~/.xrayrc
 *
 * If silent=true, returns empty apiKey instead of exiting (used by login/whoami).
 */
export function loadConfig(cliApiKey?: string, silent = false): OwnSurfaceConfig {
  const stored = readStoredConfig();
  const apiKey = cliApiKey || process.env.OWNSURFACE_API_KEY || stored?.apiKey || "";
  const apiUrl = process.env.OWNSURFACE_API_URL || stored?.apiUrl || DEFAULT_API_URL;

  if (!apiKey && !silent) {
    console.error("");
    console.error("  No API key found. Run \x1b[1mownsurface login\x1b[0m to get started.");
    console.error("  Or set OWNSURFACE_API_KEY environment variable.");
    console.error("");
    process.exit(1);
  }

  return { apiKey, apiUrl };
}

/**
 * Read the stored config file. Falls back to legacy ~/.xrayrc.
 */
export function readStoredConfig(): StoredConfig | null {
  // Try new config location first
  if (existsSync(CONFIG_FILE)) {
    try {
      const content = readFileSync(CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  // Fall back to legacy ~/.xrayrc
  if (existsSync(LEGACY_CONFIG_FILE)) {
    try {
      const content = readFileSync(LEGACY_CONFIG_FILE, "utf-8");
      return JSON.parse(content);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Save config to ~/.ownsurface/config.json
 */
export function saveConfig(config: StoredConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + "\n", "utf-8");
}

/**
 * Delete the stored config file (for logout).
 */
export function deleteConfig(): boolean {
  if (existsSync(CONFIG_FILE)) {
    unlinkSync(CONFIG_FILE);
    return true;
  }
  return false;
}

/**
 * Check if user is authenticated (has stored API key).
 */
export function isAuthenticated(): boolean {
  const stored = readStoredConfig();
  return !!(stored?.apiKey || process.env.OWNSURFACE_API_KEY);
}
