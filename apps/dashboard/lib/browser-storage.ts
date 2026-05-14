"use client";

const EXACT_STORAGE_KEYS = new Set([
  "xrayai_token",
  "ownsurface_tracked_competitors",
  "ownsurface_local_audits",
  "compliance-disclaimer-dismissed",
]);

const STORAGE_PREFIXES = [
  "alert_prefs_",
  "baseline_",
  "regression_ack_",
] as const;

function shouldRemoveKey(key: string) {
  return EXACT_STORAGE_KEYS.has(key) || STORAGE_PREFIXES.some((prefix) => key.startsWith(prefix));
}

function clearMatchingKeys(storage: Storage | undefined) {
  if (!storage) return;

  const keys = Object.keys(storage);
  for (const key of keys) {
    if (shouldRemoveKey(key)) {
      storage.removeItem(key);
    }
  }
}

export function clearPersistedAppState() {
  if (typeof window === "undefined") return;

  clearMatchingKeys(window.localStorage);
  clearMatchingKeys(window.sessionStorage);
}

export function clearReadableCookies() {
  if (typeof document === "undefined") return;

  const cookies = document.cookie ? document.cookie.split(";") : [];
  for (const entry of cookies) {
    const [rawName] = entry.split("=");
    const name = rawName?.trim();
    if (!name) continue;

    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
  }
}
